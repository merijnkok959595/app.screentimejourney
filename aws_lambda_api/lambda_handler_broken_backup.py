
"""
Clean Lambda Handler for Screen Time Journey Shopify App
Handles: Webhooks + Commitment Widget + App Proxy
"""

import os
import json
import time
import boto3
import requests
import hmac
import hashlib
import urllib.parse
from typing import Dict, Any, Tuple, Optional, List
from datetime import datetime, timedelta
from decimal import Decimal

# Try to import JWT, fall back gracefully if not available
try:
    import jwt
    JWT_AVAILABLE = True
except ImportError:
    JWT_AVAILABLE = False
    print("⚠️ JWT library not available - some features will be disabled")

# Initialize AWS clients
secretsmanager = boto3.client('secretsmanager')

# Global cache for tokens to avoid repeated API calls
_SHOPIFY_TOKEN_CACHE = None

# Table names
AUTH_TABLE_NAME = os.environ.get('AUTH_TABLE', 'stj_auth_codes')


# =============================================================================
# SHOPIFY API CREDENTIALS
# =============================================================================

SHOP_DOMAIN = os.environ.get('SHOP_DOMAIN', 'xpvznx-9w.myshopify.com')

def get_shopify_storefront_token() -> str:
    """Securely fetch and cache the Shopify Storefront Access Token from Secrets Manager."""
    global _SHOPIFY_TOKEN_CACHE
    if _SHOPIFY_TOKEN_CACHE:
        return _SHOPIFY_TOKEN_CACHE[0]

    try:
        resp = secretsmanager.get_secret_value(SecretId="Shopify-Storefront-Private-Token")
        token = None

        if "SecretString" in resp and resp["SecretString"]:
            try:
                # Try parsing as JSON first
                secret_data = json.loads(resp["SecretString"])
                token = secret_data.get("Shopify-Storefront-Private-Token")
            except json.JSONDecodeError:
                # Fallback: treat as plain string
                token = resp["SecretString"]

        if token:
            _SHOPIFY_TOKEN_CACHE = (token, time.time())
            print("✅ Successfully retrieved Shopify Storefront token from Secrets Manager")
            return token
        else:
            print("❌ Empty Shopify Storefront token in Secrets Manager")
            return ""

    except Exception as e:
        print(f"❌ Error retrieving Shopify Storefront token: {e}")
        return ""

def get_shopify_admin_token() -> str:
    """Get Shopify Admin API access token from environment"""
    return os.environ.get("SHOPIFY_ACCESS_TOKEN", "")

# =============================================================================
# UTILITIES
# =============================================================================

def json_resp(body: Dict[str, Any], status: int = 200):
    """Standard JSON response with CORS headers"""
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
        },
        "body": json.dumps(body, default=str)
    }


def parse_body(event) -> Dict[str, Any]:
    """Parse request body"""
    try:
        body = event.get("body", "{}")
        if isinstance(body, str):
            return json.loads(body)
        return body or {}
    except (json.JSONDecodeError, TypeError):
        return {}


def convert_floats_to_decimal(obj):
    """Convert floats in nested dict/list to Decimal for DynamoDB compatibility"""
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: convert_floats_to_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_floats_to_decimal(item) for item in obj]
    else:
        return obj


# Native Shopify HMAC verification removed - Flow webhooks only use Bearer token auth


# =============================================================================
# DATABASE OPERATIONS
# =============================================================================

def update_subscriber(customer_id: str, email: str, status: str, event_type: str, data: Dict = None, commitment_data: Dict = None, utm_data: Dict = None, phone: str = None) -> bool:
    """Update subscriber record in DynamoDB"""
    try:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
        
        if not customer_id:
            print(f"⚠️ No customer_id provided")
            return False

        # Try to get existing record first to preserve data
        try:
            existing_item = table.get_item(Key={'customer_id': customer_id})
            existing_data = existing_item.get('Item', {})
            print(f"📋 Found existing record for {customer_id}, merging data")
        except Exception:
            existing_data = {}
            print(f"📝 Creating new record for {customer_id}")

        # Start with ALL existing data to preserve everything
        update_data = existing_data.copy() if existing_data else {}
        
        # Only update specific fields, preserving everything else
        update_data.update({
            'customer_id': customer_id,
            'email': email,
            'subscription_status': status,
            'event_type': event_type,
            'last_updated': datetime.now().isoformat(),
            'status': status,
            # Only set created_at if it doesn't exist
            'created_at': existing_data.get('created_at', datetime.now().isoformat())
        })
        
        # Update commitment_data if provided
        if commitment_data:
            update_data['commitment_data'] = commitment_data
            print(f"📊 Updated commitment_data from webhook")
        
        # Update utm_data if provided
        if utm_data:
            update_data['utm_data'] = utm_data
            print(f"📊 Updated utm_data from webhook")
        
        # Update phone if provided (and not empty to avoid DynamoDB index issues)
        if phone and phone.strip():
            update_data['phone'] = phone
            print(f"📊 Updated phone from webhook")
        
        # Merge shopify_data instead of overwriting it
        existing_shopify_data = existing_data.get('shopify_data', {})
        new_shopify_data = convert_floats_to_decimal(data or {})
        
        # If existing record has shopify_data, merge both
        if existing_shopify_data:
            # Keep existing data and add new webhook data with event-specific key
            merged_shopify_data = existing_shopify_data.copy()
            merged_shopify_data[f'{event_type}_data'] = new_shopify_data
            update_data['shopify_data'] = merged_shopify_data
        else:
            # No existing shopify_data, just use new data
            update_data['shopify_data'] = new_shopify_data
            
        print(f"📊 Preserving fields: utm_data={bool(existing_data.get('utm_data'))}, commitment_data={bool(existing_data.get('commitment_data'))}, phone={bool(existing_data.get('phone'))}")
        
        table.put_item(Item=update_data)
        print(f"✅ Updated subscriber: {customer_id} - {status} - {event_type}")
        return True
        
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False


def save_customer_profile(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Save customer profile data (username, gender, whatsapp) to DynamoDB"""
    try:
        customer_id = payload.get('customer_id')
        username = payload.get('username', '').strip()
        gender = payload.get('gender', '').strip()
        whatsapp = payload.get('whatsapp', '').strip()
        whatsapp_opt_in = payload.get('whatsapp_opt_in', False)
        
        if not customer_id:
            return json_resp({'error': 'Customer ID is required'}, 400)
        
        if not username or not gender:
            return json_resp({'error': 'Username and gender are required'}, 400)
        
        # Validate gender
        if gender.lower() not in ['male', 'female']:
            return json_resp({'error': 'Gender must be "male" or "female"'}, 400)
        
        # CRITICAL: Final username uniqueness check to prevent race conditions
        username_check = check_username_availability({'username': username})
        if username_check['statusCode'] != 200:
            return username_check
        
        username_data = json.loads(username_check['body'])
        if not username_data.get('available', False):
            return json_resp({'error': 'Username is no longer available'}, 409)
        
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
        
        # Get existing record
        response = table.get_item(Key={'customer_id': customer_id})
        
        if 'Item' not in response:
            return json_resp({'error': 'Customer not found'}, 404)
        
        # Update the record with profile data
        update_data = response['Item']
        update_data.update({
            'username': username,
            'gender': gender.lower(),
            'profile_updated_at': datetime.now().isoformat()
        })
        
        # Check if WhatsApp data already exists (from verification)
        existing_profile = None
        try:
            existing_response = table.get_item(Key={'customer_id': customer_id})
            existing_profile = existing_response.get('Item', {})
        except:
            pass
        
        # Only update WhatsApp data if explicitly provided or if none exists
        existing_whatsapp = existing_profile.get('whatsapp') if existing_profile else None
        
        if whatsapp:
            # New WhatsApp data provided (from skip flow)
            update_data['whatsapp'] = whatsapp
            update_data['whatsapp_opt_in'] = whatsapp_opt_in
            print(f"✅ WhatsApp data stored: {whatsapp}, opt_in: {whatsapp_opt_in}")
        elif 'whatsapp_opt_in' in payload and not existing_whatsapp:
            # Only set opt_in if no existing WhatsApp (skip flow)
            update_data['whatsapp'] = ''
            update_data['whatsapp_opt_in'] = whatsapp_opt_in
            print(f"✅ WhatsApp opt-out stored: opt_in: {whatsapp_opt_in}")
        # If WhatsApp already exists (from verification), don't overwrite it
        
        table.put_item(Item=update_data)
        
        print(f"✅ Profile saved for customer {customer_id}: username={username}, gender={gender}")
        
        return json_resp({
            'success': True,
            'message': 'Profile saved successfully',
            'customer_id': customer_id
        })
        
    except Exception as e:
        print(f"❌ Error saving profile: {e}")
        return json_resp({'error': 'Failed to save profile'}, 500)


def check_username_availability(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Check if username is available (not taken by another customer)"""
    try:
        username = payload.get('username', '').strip().lower()
        
        if not username:
            return json_resp({'error': 'Username is required'}, 400)
        
        if len(username) < 2:
            return json_resp({'error': 'Username must be at least 2 characters'}, 400)
        
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
        
        # Scan for existing username (in a real app, you'd want a GSI for this)
        response = table.scan(
            FilterExpression='username = :username',
            ExpressionAttributeValues={':username': username}
        )
        
        is_available = len(response.get('Items', [])) == 0
        
        print(f"✅ Username '{username}' availability check: {'available' if is_available else 'taken'}")
        
        return json_resp({
            'available': is_available,
            'username': username,
            'message': 'Username is available' if is_available else 'Username is already taken'
        })
        
    except Exception as e:
        print(f"❌ Error checking username availability: {e}")
        return json_resp({'error': 'Failed to check username availability'}, 500)


def send_whatsapp_verification_code(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Send WhatsApp verification code via WATI API"""
    try:
        # Accept both 'phone' and 'phone_number' for compatibility
        phone = payload.get('phone_number', payload.get('phone', '')).strip()
        customer_id = payload.get('customer_id')
        
        if not phone:
            return json_resp({'error': 'Phone number is required'}, 400)
        
        if not customer_id:
            return json_resp({'error': 'Customer ID is required'}, 400)
        
        # Validate phone number format (should include country code)
        if not phone.startswith('+') or len(phone) < 8:
            return json_resp({'error': 'Phone number must include country code (e.g., +31627207989)'}, 400)
        
        # Generate 6-digit code as requested
        import random
        verification_code = str(random.randint(100000, 999999))
        
        # Store verification code in DynamoDB with 10-minute expiry
        dynamodb = boto3.resource('dynamodb')
        auth_table = dynamodb.Table(AUTH_TABLE_NAME)
        
        expires_at = int((datetime.now() + timedelta(minutes=10)).timestamp())
        
        auth_table.put_item(
            Item={
                'phone_number': phone,
                'code': verification_code,
                'customer_id': customer_id,
                'created_at': datetime.now().isoformat(),
                'expires_at': expires_at,
                'attempts': 0,
                'verified': False
            }
        )
        
        # Get WATI API token from environment variable or use provided token
        wati_token = os.environ.get('WATI_API_TOKEN') or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhZmVlMzE4MS01ZTYyLTQyMGYtODhkNS05ZmE0NzUyZDlkNDgiLCJ1bmlxdWVfbmFtZSI6Im1lcmlqbkByaXNvdHRpbmkuY29tIiwibmFtZWlkIjoibWVyaWpuQHJpc290dGluaS5jb20iLCJlbWFpbCI6Im1lcmlqbkByaXNvdHRpbmkuY29tIiwiYXV0aF90aW1lIjoiMDgvMDcvMjAyNSAxNDowNjoxNiIsInRlbmFudF9pZCI6IjQ0MzM2OCIsImRiX25hbWUiOiJtdC1wcm9kLVRlbmFudHMiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBRE1JTklTVFJBVE9SIiwiZXhwIjoyNTM0MDIzMDA4MDAsImlzcyI6IkNsYXJlX0FJIiwiYXVkIjoiQ2xhcmVfQUkifQ.Ov7fIkNU0f1aGfFq3Lvbfrq3EImt9F7zLY35CdRmEtI"
        print(f"✅ Using WATI token: {wati_token[:10]}...{wati_token[-10:]}")
        
        # Prepare WATI API call exactly as specified
        tenant_id = "443368"
        # Format phone number for WATI: remove the + sign only
        # Example: +31627207989 becomes 31627207989
        whatsapp_number = phone.lstrip('+')
        
        wati_url = f"https://live-mt-server.wati.io/{tenant_id}/api/v1/sendTemplateMessage"
        
        print(f"🔧 WATI API Configuration:")
        print(f"   📞 Phone: {phone} → {whatsapp_number}")
        print(f"   🏢 Tenant ID: {tenant_id}")
        print(f"   🌐 URL: {wati_url}")
        print(f"   🔑 Token available: {bool(wati_token)}")
        if wati_token:
            print(f"   🔑 Token preview: {wati_token[:10]}...{wati_token[-10:]}")
        
        # Use the correct template name confirmed by user
        template_name = "auth"
        
        # Use WATI parameter format exactly as specified
        wati_payload = {
            "template_name": "auth",
            "broadcast_name": verification_code,
            "parameters": [
                {
                    "name": "1",
                    "value": verification_code
                }
            ]
        }
        
        wati_params = {
            'whatsappNumber': whatsapp_number
        }
        
        wati_headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {wati_token}' if wati_token else ''
        }
        
        print(f"📋 WATI Request Details:")
        print(f"   📨 Payload: {json.dumps(wati_payload, indent=2)}")
        print(f"   🔗 Params: {wati_params}")
        print(f"   📝 Headers: {dict(wati_headers)} (token masked)")
        print(f"   🔢 Verification code: {verification_code} (4 digits)")
        
        if wati_token:
            try:
                print(f"📱 Sending WhatsApp verification code via WATI API to {phone}")
                print(f"🚀 Making POST request to WATI...")
                
                response = requests.post(
                    wati_url,
                    json=wati_payload,
                    headers=wati_headers,
                    params=wati_params,
                    timeout=30
                )
                
                print(f"📞 WATI API Response Status: {response.status_code}")
                print(f"📞 WATI API Response Headers: {dict(response.headers)}")
                print(f"📞 WATI API Response Text: {response.text}")
                
                # Try to parse response as JSON for better logging
                try:
                    response_json = response.json()
                    print(f"📞 WATI API Response JSON: {json.dumps(response_json, indent=2)}")
                except:
                    print(f"📞 WATI API Response (not JSON): {response.text}")
                
                if response.status_code == 200:
                    print(f"✅ SUCCESS: WhatsApp verification code {verification_code} sent to {phone}")
                    return json_resp({
                        'success': True,
                        'message': f'Verification code sent to {phone}',
                        'phone': phone,
                        'expires_in': 600  # 10 minutes
                    })
                else:
                    print(f"❌ WATI API ERROR: Status {response.status_code}")
                    print(f"❌ Error details: {response.text}")
                    
                    # Return more detailed error for debugging
                    return json_resp({
                        'error': f'Failed to send WhatsApp message. WATI API returned {response.status_code}',
                        'details': response.text,
                        'debug_info': {
                            'template_name': template_name,
                            'phone_formatted': whatsapp_number,
                            'tenant_id': tenant_id,
                            'code_length': len(verification_code),
                            'original_phone': phone
                        }
                    }, 500)
            except Exception as e:
                print(f"❌ WATI API request failed with exception: {e}")
                import traceback
                print(f"❌ Exception traceback: {traceback.format_exc()}")
                return json_resp({
                    'error': f'Failed to send WhatsApp message: {str(e)}',
                    'exception_type': type(e).__name__
                }, 500)
        else:
            print("❌ No WATI token available - cannot send WhatsApp message")
            return json_resp({
                'error': 'WhatsApp service is not configured. Please contact support.',
                'debug': 'WATI token not found in AWS Secrets Manager'
            }, 500)
        
    except Exception as e:
        print(f"❌ Error sending WhatsApp verification code: {e}")
        return json_resp({'error': 'Failed to send verification code'}, 500)


def verify_whatsapp_verification_code(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Verify WhatsApp verification code"""
    try:
        # Accept both 'phone' and 'phone_number' for compatibility
        phone = payload.get('phone_number', payload.get('phone', '')).strip()
        code = payload.get('code', '').strip()
        
        if not phone or not code:
            return json_resp({'error': 'Phone number and code are required'}, 400)
        
        if len(code) != 6 or not code.isdigit():
            return json_resp({'error': 'Invalid verification code format'}, 400)
        
        customer_id = payload.get('customer_id')
        
        if not customer_id:
            return json_resp({'error': 'Customer ID is required'}, 400)
        
        # Get stored verification code from DynamoDB
        dynamodb = boto3.resource('dynamodb')
        auth_table = dynamodb.Table(AUTH_TABLE_NAME)
        
        try:
            # Query using composite key (phone_number + code)
            response = auth_table.get_item(
                Key={
                    'phone_number': phone,
                    'code': code
                }
            )
        except Exception as e:
            print(f"❌ Error querying auth table: {e}")
            return json_resp({'error': 'Invalid verification code'}, 400)
        
        if 'Item' not in response:
            print(f"❌ No auth record found for phone: {phone}, code: {code}")
            return json_resp({'error': 'Invalid verification code'}, 400)
        
        auth_item = response['Item']
        print(f"✅ Found auth record: {auth_item}")
        
        # No need to check code again since we used it in the key
        
        # Check if code has expired
        if datetime.now().timestamp() > auth_item['expires_at']:
            return json_resp({'error': 'Verification code has expired'}, 400)
        
        # Check if already verified
        if auth_item.get('verified', False):
            return json_resp({'error': 'This code has already been used'}, 400)
        
        # Check for too many attempts
        if auth_item.get('attempts', 0) >= 3:
            return json_resp({'error': 'Too many verification attempts'}, 400)
        
        # For temporary customer IDs, allow verification and update to real customer ID
        stored_customer_id = auth_item.get('customer_id')
        if stored_customer_id != customer_id:
            # Allow if stored customer ID is temporary (starts with 'temp_')
            if not stored_customer_id.startswith('temp_'):
                return json_resp({'error': 'Invalid verification code'}, 400)
            
            # Update the stored customer ID to the real one
            print(f"🔄 Updating customer ID from {stored_customer_id} to {customer_id}")
        
        # Mark code as verified and update customer ID if needed
        update_expression = 'SET verified = :verified, verified_at = :timestamp'
        expression_values = {
            ':verified': True,
            ':timestamp': datetime.now().isoformat()
        }
        
        # If we're updating customer ID, add it to the update
        if stored_customer_id != customer_id:
            update_expression += ', customer_id = :customer_id'
            expression_values[':customer_id'] = customer_id
        
        auth_table.update_item(
            Key={
                'phone_number': phone,
                'code': code
            },
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values
        )
        
        print(f"✅ WhatsApp code {code} verified successfully for {phone}")
        
        # CRITICAL: Also save WhatsApp info to customer profile
        try:
            subscribers_table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
            
            # Update customer profile with verified WhatsApp data
            subscribers_table.update_item(
                Key={'customer_id': customer_id},
                UpdateExpression='SET whatsapp = :phone, whatsapp_opt_in = :opt_in, whatsapp_verified_at = :timestamp',
                ExpressionAttributeValues={
                    ':phone': phone,
                    ':opt_in': True,
                    ':timestamp': datetime.now().isoformat()
                }
            )
            print(f"✅ WhatsApp data saved to profile: {phone}, opt_in: True")
            
        except Exception as profile_error:
            print(f"⚠️ Failed to update profile with WhatsApp data: {profile_error}")
            # Don't fail the verification if profile update fails
        
        return json_resp({
            'success': True,
            'message': 'Phone number verified successfully',
            'phone': phone
        })
        
    except Exception as e:
        print(f"❌ Error verifying WhatsApp code: {e}")
        return json_resp({'error': 'Failed to verify code'}, 500)


def get_customer_profile(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Get complete customer profile data from DynamoDB"""
    try:
        customer_id = payload.get('customer_id')
        
        if not customer_id:
            return json_resp({'error': 'Customer ID is required'}, 400)
        
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
        
        # Get customer record
        response = table.get_item(Key={'customer_id': customer_id})
        
        if 'Item' not in response:
            return json_resp({'error': 'Customer not found'}, 404)
        
        customer_data = response['Item']
        
        # Build profile response with relevant fields
        profile = {
            'customer_id': customer_data.get('customer_id', ''),
            'email': customer_data.get('email', ''),
            'username': customer_data.get('username', ''),
            'gender': customer_data.get('gender', ''),
            'whatsapp': customer_data.get('whatsapp', ''),
            'whatsapp_opt_in': customer_data.get('whatsapp_opt_in', False),
            'whatsapp_verified_at': customer_data.get('whatsapp_verified_at', ''),
            'subscription_status': customer_data.get('subscription_status', 'inactive'),
            'created_at': customer_data.get('created_at', ''),
            'updated_at': customer_data.get('profile_updated_at', customer_data.get('last_updated', '')),
            # Add any other relevant profile fields
            'commitment_data': customer_data.get('commitment_data', {}),
            'utm_data': customer_data.get('utm_data', {})
        }
        
        print(f"✅ Profile retrieved for customer {customer_id}")
        
        return json_resp({
            'success': True,
            'profile': profile
        })
        
    except Exception as e:
        print(f"❌ Error getting customer profile: {e}")
        return json_resp({'error': 'Failed to get profile'}, 500)


def update_customer_profile(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Update customer profile data in DynamoDB"""
    try:
        customer_id = payload.get('customer_id')
        
        if not customer_id:
            return json_resp({'error': 'Customer ID is required'}, 400)
        
        # Get the fields to update (excluding email and customer_id)
        updatable_fields = ['username', 'gender', 'whatsapp']
        update_data = {}
        
        for field in updatable_fields:
            if field in payload:
                value = payload[field]
                if field == 'username':
                    # Validate and sanitize username
                    value = str(value).strip().lower()
                    if len(value) < 3 or not value.replace('_', '').replace('-', '').isalnum():
                        return json_resp({'error': 'Invalid username format'}, 400)
                    # Check username availability (excluding current user)
                    username_check = check_username_availability_for_update(value, customer_id)
                    if not username_check:
                        return json_resp({'error': 'Username is already taken'}, 409)
                elif field == 'gender':
                    # Validate gender
                    value = str(value).strip().lower()
                    if value not in ['male', 'female']:
                        return json_resp({'error': 'Gender must be "male" or "female"'}, 400)
                elif field == 'whatsapp':
                    # Sanitize WhatsApp (optional field)
                    value = str(value).strip() if value else ''
                
                update_data[field] = value
        
        if not update_data:
            return json_resp({'error': 'No valid fields to update'}, 400)
        
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
        
        # Get existing record
        response = table.get_item(Key={'customer_id': customer_id})
        
        if 'Item' not in response:
            return json_resp({'error': 'Customer not found'}, 404)
        
        # Update the record
        existing_data = response['Item']
        existing_data.update(update_data)
        existing_data['profile_updated_at'] = datetime.now().isoformat()
        
        table.put_item(Item=existing_data)
        
        # Build updated profile response
        profile = {
            'customer_id': existing_data.get('customer_id', ''),
            'email': existing_data.get('email', ''),
            'username': existing_data.get('username', ''),
            'gender': existing_data.get('gender', ''),
            'whatsapp': existing_data.get('whatsapp', ''),
            'subscription_status': existing_data.get('subscription_status', 'inactive'),
            'created_at': existing_data.get('created_at', ''),
            'updated_at': existing_data.get('profile_updated_at', ''),
            'commitment_data': existing_data.get('commitment_data', {}),
            'utm_data': existing_data.get('utm_data', {})
        }
        
        print(f"✅ Profile updated for customer {customer_id}: {list(update_data.keys())}")
        
        return json_resp({
            'success': True,
            'profile': profile,
            'message': 'Profile updated successfully'
        })
        
    except Exception as e:
        print(f"❌ Error updating customer profile: {e}")
        return json_resp({'error': 'Failed to update profile'}, 500)


def check_username_availability_for_update(username: str, customer_id: str) -> bool:
    """Check if username is available for update (excluding current customer)"""
    try:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
        
        # Scan for existing username (excluding current customer)
        response = table.scan(
            FilterExpression='username = :username AND customer_id <> :customer_id',
            ExpressionAttributeValues={
                ':username': username,
                ':customer_id': customer_id
            }
        )
        
        is_available = len(response.get('Items', [])) == 0
        
        print(f"✅ Username '{username}' availability check for update: {'available' if is_available else 'taken'}")
        
        return is_available
        
    except Exception as e:
        print(f"❌ Error checking username availability for update: {e}")
        return False


def get_milestones(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Get milestone data for journey progress"""
    try:
        gender = payload.get('gender', 'male')
        include_all = payload.get('include_all', False)
        
        # Try to get from DynamoDB
        try:
            dynamodb = boto3.resource('dynamodb')
            table = dynamodb.Table(os.environ.get('MILESTONES_TABLE', 'stj_system'))
            
            # Query milestones for the specified gender
            response = table.scan(
                FilterExpression="gene = :gender",
                ExpressionAttributeValues={':gender': gender}
            )
            
            milestones = response.get('Items', [])
            
            # Sort by level
            milestones.sort(key=lambda x: x.get('level', 0))
            
            print(f"✅ Returning {len(milestones)} milestones from DynamoDB for gender: {gender}")
            
            return json_resp({
                'success': True,
                'milestones': milestones
            })
            
        except Exception as db_error:
            print(f"⚠️ DynamoDB error, using fallback data: {db_error}")
            
            # Fallback to static data if DB fails
            milestones = [
                {
                    "gene": "male",
                    "level": 0,
                    "days_range": "0",
                    "title": "Ground Zero",
                    "emoji": "🪨",
                    "description": "Every journey starts from the ground. You've chosen to rise from where you stand.",
                    "milestone_day": 0,
                    "media_url": "https://wati-files.s3.eu-north-1.amazonaws.com/male_level_0_groundzero.jpg",
                    "next_level_title": "Fighter",
                    "next_level_emoji": "🥊",
                    "days_to_next": 7,
                    "level_template": "",
                    "color_code": "2e2e2e",
                    "next_color_code": "5b1b1b"
                },
                {
                    "gene": "male",
                    "level": 1,
                    "days_range": "7–14",
                    "title": "Fighter",
                    "emoji": "🥊",
                    "description": "You've stepped into the fight. Each day you stay the course, your strength builds silently.",
                    "milestone_day": 14,
                    "media_url": "https://wati-files.s3.eu-north-1.amazonaws.com/male_level_1_fighter.jpg",
                    "next_level_title": "King",
                    "next_level_emoji": "👑",
                    "days_to_next": 351,
                    "level_template": "m1",
                    "color_code": "5b1b1b",
                    "next_color_code": "ffd700"
                }
            ]
            
            filtered_milestones = [m for m in milestones if m['gene'] == gender]
            
            return json_resp({
                'success': True,
                'milestones': filtered_milestones
            })
        
    except Exception as e:
        print(f"❌ Error getting milestones: {e}")
        return json_resp({'error': 'Failed to get milestones'}, 500)


def generate_milestone_video(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Generate personalized milestone video reel using Remotion Lambda
    
    Expected payload:
    {
        "firstname": "Merijn",
        "level": 3,
        "days": 30,
        "rank": 8.5,
        "next_level": 4,
        "gender": "male",
        "color_code": "6b705c",
        "next_color_code": "3b1f4a",
        "customer_id": "123456789"  # Optional, for S3 naming
    }
    """
    try:
        print(f"🎬 Video generation request: {payload}")
        
        # Extract user data
        customer_id = payload.get('customer_id', 'guest')
        firstname = payload.get('firstname', 'Champion')
        level = payload.get('level', 0)
        days = payload.get('days', 0)
        rank = payload.get('rank', 0)
        next_level = payload.get('next_level', 1)
        gender = payload.get('gender', 'male')
        color_code = payload.get('color_code', '2e2e2e')
        next_color_code = payload.get('next_color_code', '5b1b1b')
        
        # Validate required fields
        if not firstname:
            return json_resp({'error': 'firstname is required'}, 400)
        
        print(f"✅ Validated video request for {firstname} (Level {level}, {days} days)")
        
        # Fetch milestone data to get titles and emojis
        dynamodb = boto3.resource('dynamodb')
        milestones_table = dynamodb.Table(os.environ.get('MILESTONES_TABLE', 'stj_system'))
        milestones_response = milestones_table.scan()
        all_milestones = milestones_response.get('Items', [])
        
        # Get current and next milestone details
        current_milestone = get_milestone_for_days(all_milestones, days, gender)
        next_milestone = get_next_milestone(all_milestones, days, gender)
        
        if not current_milestone:
            current_title = 'Ground Zero'
            current_emoji = '🪨'
        else:
            current_title = current_milestone.get('title', 'Ground Zero')
            current_emoji = current_milestone.get('emoji', '🪨')
        
        if not next_milestone:
            next_title = current_title
            next_emoji = current_emoji
        else:
            next_title = next_milestone.get('title', 'Fighter')
            next_emoji = next_milestone.get('emoji', '🥊')
        
        # Remotion Lambda configuration (update after deployment)
        REMOTION_FUNCTION_ARN = os.environ.get(
            'REMOTION_LAMBDA_FUNCTION',
            'remotion-render-xxxxx'  # TODO: Update after deploying Remotion Lambda
        )
        REMOTION_SITE_URL = os.environ.get(
            'REMOTION_SITE_URL',
            'https://remotion-render-xxxxx.s3.amazonaws.com'  # TODO: Update after deploying
        )
        REMOTION_REGION = os.environ.get('REMOTION_REGION', 'eu-north-1')
        
        # Prepare Remotion render request
        remotion_payload = {
            "composition": "MilestoneReel",
            "serveUrl": REMOTION_SITE_URL,
            "inputProps": {
                "firstname": firstname,
                "currentTitle": current_title,
                "currentEmoji": current_emoji,
                "days": days,
                "rank": rank,
                "nextTitle": next_title,
                "nextEmoji": next_emoji,
                "colorCode": color_code,
                "nextColorCode": next_color_code,
                "gender": gender
            },
            "codec": "h264",
            "outName": f"milestone_{customer_id}_{int(time.time())}.mp4"
        }
        
        # Call Node.js bridge Lambda which uses Remotion SDK properly
        bridge_payload = {
            'firstname': firstname,
            'currentTitle': current_title,
            'currentEmoji': current_emoji,
            'days': days,
            'rank': rank,
            'nextTitle': next_title,
            'nextEmoji': next_emoji,
            'colorCode': color_code,
            'nextColorCode': next_color_code,
            'gender': gender,
            'customer_id': customer_id
        }
        
        print(f"🎬 Calling Node.js bridge Lambda with: {json.dumps(bridge_payload, indent=2)}")
        
        # Invoke bridge Lambda
        lambda_client = boto3.client('lambda', region_name=REMOTION_REGION)
        response = lambda_client.invoke(
            FunctionName='remotion-bridge',
            InvocationType='RequestResponse',
            Payload=json.dumps(bridge_payload)
        )
        
        # Parse bridge response
        result = json.loads(response['Payload'].read())
        print(f"📦 Bridge Lambda response: {result}")
        
        # Handle both direct response and API Gateway format
        if 'body' in result:
            body = json.loads(result['body']) if isinstance(result['body'], str) else result['body']
        else:
            body = result
        
        if 'errorMessage' in result or 'errorType' in result:
            error_msg = result.get('errorMessage', 'Unknown error')
            raise Exception(f"Bridge Lambda error: {error_msg}")
        
        if not body.get('success'):
            error_msg = body.get('error', 'Unknown error')
            raise Exception(f"Video generation failed: {error_msg}")
        
        video_url = body.get('video_url')
        
        if not video_url:
            raise Exception("No video URL returned from Remotion")
        
        print(f"✅ Video generated successfully: {video_url}")
        
        return json_resp({
            'success': True,
            'video_url': video_url,
            'message': 'Video generated successfully',
            'user_data': {
                'firstname': firstname,
                'level': level,
                'days': days,
                'rank': rank,
                'next_level': next_level,
                'gender': gender,
                'color_code': color_code,
                'next_color_code': next_color_code
            }
        })
        
    except Exception as e:
        print(f"❌ Error generating video: {e}")
        return json_resp({'error': f'Failed to generate video: {str(e)}'}, 500)


def get_device_registration_date(devices: List[Dict]) -> Optional[datetime]:
    """Get the FIRST device registration date (earliest device)"""
    if not devices:
        return None
    
    earliest_date = None
    
    for device in devices:
        # Handle DynamoDB Map structure
        device_data = device.get('M', device) if 'M' in device else device
        
        # Try multiple date fields
        date_str = (
            device_data.get('addedDate', {}).get('S') if isinstance(device_data.get('addedDate'), dict)
            else device_data.get('addedDate',
            device_data.get('created_at', {}).get('S') if isinstance(device_data.get('created_at'), dict)
            else device_data.get('created_at',
            device_data.get('added_at', {}).get('S') if isinstance(device_data.get('added_at'), dict)
            else device_data.get('added_at')))
        )
        
        if not date_str:
            continue
        
        try:
            if isinstance(date_str, str):
                device_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            else:
                device_date = datetime.fromtimestamp(float(date_str))
            
            if earliest_date is None or device_date < earliest_date:
                earliest_date = device_date
        except:
            continue
    
    return earliest_date


def get_milestone_for_days(milestones: List[Dict], days: int, gender: str) -> Optional[Dict]:
    """Find the milestone that corresponds to the given number of days"""
    gender_milestones = [m for m in milestones if m.get('gene', m.get('gender', '')).lower() == gender.lower()]
    sorted_milestones = sorted(gender_milestones, key=lambda m: int(m.get('milestone_day', m.get('days_required', 0))))
    
    current = None
    for milestone in sorted_milestones:
        required_days = int(milestone.get('milestone_day', milestone.get('days_required', 0)))
        if days >= required_days:
            current = milestone
        else:
            break
    
    return current


def get_next_milestone(milestones: List[Dict], days: int, gender: str) -> Optional[Dict]:
    """Find the next milestone after the current days"""
    gender_milestones = [m for m in milestones if m.get('gene', m.get('gender', '')).lower() == gender.lower()]
    sorted_milestones = sorted(gender_milestones, key=lambda m: int(m.get('milestone_day', m.get('days_required', 0))))
    
    for milestone in sorted_milestones:
        required_days = int(milestone.get('milestone_day', milestone.get('days_required', 0)))
        if required_days > days:
            return milestone
    
    return None


def calculate_percentile_simple(all_subscribers: List[Dict], days_in_focus: int) -> float:
    """Calculate user's percentile ranking based on days in focus"""
    all_days = []
    
    for sub in all_subscribers:
        devices = sub.get('devices', [])
        reg_date = get_device_registration_date(devices)
        
        if reg_date:
            from datetime import datetime
            days = (datetime.now(reg_date.tzinfo) - reg_date).days
            all_days.append(days)
        else:
            all_days.append(0)
    
    if not all_days:
        return 50.0
    
    # Calculate percentile
    better_count = sum(1 for d in all_days if d < days_in_focus)
    percentile = (better_count / len(all_days)) * 100
    
    return round(percentile, 1)


def get_social_share_data(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Get user data for social share page by customer_id
    
    Expected payload:
    {
        "customer_id": "7893456123456"
    }
    
    Returns all data needed for social share widget
    """
    try:
        customer_id = payload.get('customer_id')
        
        if not customer_id:
            return json_resp({'error': 'customer_id is required'}, 400)
        
        print(f"🔍 Fetching social share data for customer: {customer_id}")
        
        # Get user from database
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
        
        response = table.get_item(Key={'customer_id': customer_id})
        
        if 'Item' not in response:
            return json_resp({'error': 'Customer not found'}, 404)
        
        user = response['Item']
        
        print(f"👤 User found: {user.get('email', 'no-email')}")
        print(f"   Username: {user.get('username', 'none')}")
        print(f"   Gender: {user.get('gender', 'none')}")
        
        # Extract user data
        gender = user.get('gender', user.get('commitment_data', {}).get('gender', 'male'))
        
        # Get firstname from various sources in the database
        firstname = (
            user.get('first_name') or 
            user.get('firstname') or
            user.get('shopify_data', {}).get('customer', {}).get('first_name') or
            user.get('webhook_data', {}).get('customer', {}).get('first_name') or
            user.get('shopify_data', {}).get('subscription_created_data', {}).get('first_name')
        )
        
        # If still no firstname, fall back to username
        if not firstname:
            username = user.get('username', 'Champion')
            firstname = username.capitalize()
        
        print(f"📝 Processed data - firstname: {firstname}, gender: {gender}")
        
        # Get devices and calculate days in focus (same as leaderboard)
        devices = user.get('devices', [])
        device_reg_date = get_device_registration_date(devices)
        
        if device_reg_date:
            from datetime import datetime
            days = max(0, (datetime.now(device_reg_date.tzinfo) - device_reg_date).days)
        else:
            days = 0
        
        print(f"📅 Days in focus: {days}")
        
        # Get milestone data
        milestones_table = dynamodb.Table(os.environ.get('MILESTONES_TABLE', 'stj_system'))
        print(f"📊 Querying milestones table for gender: {gender}")
        
        milestones_response = milestones_table.scan()
        all_milestones = milestones_response.get('Items', [])
        
        print(f"📊 Found {len(all_milestones)} total milestones")
        
        # Use the same helper functions as leaderboard
        current_milestone = get_milestone_for_days(all_milestones, days, gender)
        next_milestone = get_next_milestone(all_milestones, days, gender)
        
        # Fallback to defaults if no milestones found
        if not current_milestone:
            print(f"⚠️ No milestone found for day {days}, using defaults")
            return json_resp({
                'success': True,
                'firstname': firstname,
                'level': 0,
                'days': days,
                'rank': 100,
                'next_level': 1,
                'gender': gender,
                'color_code': '2e2e2e',
                'next_color_code': '5b1b1b',
                'current_title': 'Ground Zero',
                'current_emoji': '🪨',
                'next_title': 'Fighter',
                'next_emoji': '🥊',
                'days_to_next': 7 - days if days < 7 else 0,
                'media_url': 'https://wati-files.s3.eu-north-1.amazonaws.com/Milestones/male_level_0_groundzero.jpg',
                'description': 'Every journey starts from the ground. You\'ve chosen to rise from where you stand.'
            })
        
        # Calculate real percentile using all subscribers (same as leaderboard)
        subscribers_response = table.scan()
        all_subscribers = subscribers_response.get('Items', [])
        percentile = calculate_percentile_simple(all_subscribers, days)
        
        # Prepare response data (same structure as leaderboard)
        current_level = current_milestone.get('title', 'Ground Zero')
        current_emoji = current_milestone.get('emoji', '🪨')
        current_level_num = current_milestone.get('level', 0)
        
        if next_milestone:
            next_level = next_milestone.get('title', 'Fighter')
            next_emoji = next_milestone.get('emoji', '🥊')
            next_level_num = next_milestone.get('level', 1)
            next_milestone_days = int(next_milestone.get('milestone_day', 7))
            days_to_next = max(0, next_milestone_days - days)
            next_color_code = next_milestone.get('color_code', '5b1b1b')
        else:
            # User is at max level
            next_level = current_level
            next_emoji = current_emoji
            next_level_num = current_level_num
            days_to_next = 0
            next_color_code = current_milestone.get('color_code', '2e2e2e')
        
        response_data = {
            'success': True,
            'firstname': firstname,
            'level': current_level_num,
            'days': days,
            'rank': percentile,
            'next_level': next_level_num,
            'gender': gender,
            'color_code': current_milestone.get('color_code', '2e2e2e'),
            'next_color_code': next_color_code,
            'current_title': current_level,
            'current_emoji': current_emoji,
            'next_title': next_level,
            'next_emoji': next_emoji,
            'days_to_next': days_to_next,
            'media_url': current_milestone.get('media_url', ''),
            'description': current_milestone.get('description', '')
        }
        
        print(f"✅ Social share data fetched for {firstname}: Level {response_data['level']}, {days} days")
        
        return json_resp(response_data)
        
    except Exception as e:
        print(f"❌ Error fetching social share data: {e}")
        import traceback
        traceback.print_exc()
        return json_resp({'error': f'Failed to fetch social share data: {str(e)}'}, 500)


def find_and_update_webapp_record(shopify_customer_id: str, customer_email: str, order_data: Dict[str, Any]) -> bool:
    """Find existing webapp record and update it with real Shopify customer ID"""
    try:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
        
        print(f"🔍 Looking for existing webapp record for email: {customer_email}")
        
        # Scan for records with matching email (we can't use query without a GSI on email)
        response = table.scan(
            FilterExpression="email = :email",
            ExpressionAttributeValues={':email': customer_email},
            Limit=50  # Reasonable limit to avoid long scans
        )
        
        webapp_records = [item for item in response.get('Items', []) 
                         if str(item.get('customer_id', '')).startswith('webapp_')]
        
        if not webapp_records:
            print(f"ℹ️ No webapp records found for email: {customer_email}")
            return False
        
        # Find the most recent webapp record
        webapp_record = max(webapp_records, key=lambda x: x.get('created_at', ''))
        old_customer_id = webapp_record.get('customer_id')
        
        print(f"✅ Found webapp record: {old_customer_id}")
        
        # Merge the data from both records
        merged_data = {
            'customer_id': shopify_customer_id,  # Update to real Shopify customer ID
            'email': customer_email,
            'subscription_status': 'active',
            'event_type': 'order_created',
            'last_updated': datetime.now().isoformat(),
            'shopify_data': convert_floats_to_decimal(order_data),
            # Preserve existing data from webapp record
            'commitment_data': webapp_record.get('commitment_data', {}),
            'utm_data': webapp_record.get('utm_data', {}),
            'country_code': webapp_record.get('country_code', ''),
            'variant_gid': webapp_record.get('variant_gid', ''),
            'selling_plan_id': webapp_record.get('selling_plan_id', ''),
            'checkout_url': webapp_record.get('checkout_url', ''),
            'status': 'order_completed',  # Update status
            'created_at': webapp_record.get('created_at', datetime.now().isoformat())
        }
        
        # Only add phone if it exists and is not empty (DynamoDB index constraint)
        phone = webapp_record.get('phone', '')
        if phone and phone.strip():
            merged_data['phone'] = phone.strip()
        
        # Update the record with new customer ID
        table.put_item(Item=merged_data)
        print(f"✅ Updated webapp record {old_customer_id} -> {shopify_customer_id}")
        
        # Optionally delete the old webapp record to avoid duplicates
        try:
            table.delete_item(Key={'customer_id': old_customer_id})
            print(f"🗑️ Deleted old webapp record: {old_customer_id}")
        except Exception as delete_error:
            print(f"⚠️ Failed to delete old webapp record: {delete_error}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error finding/updating webapp record: {e}")
        return False


def find_and_update_webapp_record_for_subscription(shopify_customer_id: str, customer_email: str, subscription_data: Dict[str, Any]) -> bool:
    """Find existing webapp record and update it with real Shopify customer ID for subscription"""
    try:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
        
        print(f"🔍 Looking for existing webapp record for subscription: {customer_email}")
        
        # Scan for records with matching email
        response = table.scan(
            FilterExpression="email = :email",
            ExpressionAttributeValues={':email': customer_email},
            Limit=50  # Reasonable limit to avoid long scans
        )
        
        webapp_records = [item for item in response.get('Items', []) 
                         if str(item.get('customer_id', '')).startswith('webapp_')]
        
        if not webapp_records:
            print(f"ℹ️ No webapp records found for subscription email: {customer_email}")
            return False
        
        # Find the most recent webapp record
        webapp_record = max(webapp_records, key=lambda x: x.get('created_at', ''))
        old_customer_id = webapp_record.get('customer_id')
        
        print(f"✅ Found webapp record for subscription: {old_customer_id}")
        
        # Merge the data from both records
        merged_data = {
            'customer_id': shopify_customer_id,  # Update to real Shopify customer ID
            'email': customer_email,
            'subscription_status': 'active',
            'event_type': 'subscription_created',
            'last_updated': datetime.now().isoformat(),
            'shopify_data': convert_floats_to_decimal(subscription_data),
            # Preserve existing data from webapp record
            'commitment_data': webapp_record.get('commitment_data', {}),
            'utm_data': webapp_record.get('utm_data', {}),
            'country_code': webapp_record.get('country_code', ''),
            'variant_gid': webapp_record.get('variant_gid', ''),
            'selling_plan_id': webapp_record.get('selling_plan_id', ''),
            'checkout_url': webapp_record.get('checkout_url', ''),
            'status': 'subscription_active',  # Update status
            'created_at': webapp_record.get('created_at', datetime.now().isoformat())
        }
        
        # Only add phone if it exists and is not empty (DynamoDB index constraint)
        phone = webapp_record.get('phone', '')
        if phone and phone.strip():
            merged_data['phone'] = phone.strip()
        
        # Update the record with new customer ID
        table.put_item(Item=merged_data)
        print(f"✅ Updated webapp record for subscription {old_customer_id} -> {shopify_customer_id}")
        
        # Delete the old webapp record to avoid duplicates
        try:
            table.delete_item(Key={'customer_id': old_customer_id})
            print(f"🗑️ Deleted old webapp record: {old_customer_id}")
        except Exception as delete_error:
            print(f"⚠️ Failed to delete old webapp record: {delete_error}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error finding/updating webapp record for subscription: {e}")
        return False


# =============================================================================
# WEBHOOK HANDLERS
# =============================================================================

def handle_subscription_created(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle subscription created webhook"""
    customer = payload.get('customer', {})
    customer_id = str(customer.get('id', ''))
    customer_email = customer.get('email', '')
    
    print(f"🎉 Subscription created for: {customer_email}, customer_id: {customer_id}")
    
    # Extract commitment and UTM data from the subscription payload
    commitment_data = payload.get('commitment_data', {})
    
    # Extract UTM data from subscription line items properties
    utm_data = {}
    subscription = payload.get('subscription', {})
    line_items = subscription.get('line_items', [])
    if line_items:
        properties = line_items[0].get('properties', [])
        utm_source = next((p['value'] for p in properties if p['name'] == '_utm_source'), 'unknown')
        utm_campaign = next((p['value'] for p in properties if p['name'] == '_utm_campaign'), 'unknown')
        utm_clickid = next((p['value'] for p in properties if p['name'] == '_utm_clickid'), 'none')
        
        utm_data = {
            'utm_source': utm_source,
            'utm_campaign': utm_campaign,
            'utm_clickid': utm_clickid
        }
    
    # Extract phone from subscription line items properties
    phone = ''
    if line_items:
        properties = line_items[0].get('properties', [])
        phone = next((p['value'] for p in properties if p['name'] == 'WhatsApp'), '')
    
    print(f"📊 Extracted from subscription webhook - commitment_data: {bool(commitment_data)}, utm_data: {bool(utm_data)}, phone: {bool(phone)}")
    
    # Simply update/create record with customer ID from payload
    success = update_subscriber(
        customer_id=customer_id,
        email=customer_email, 
        status='active',
        event_type='subscription_created',
        data=payload,
        commitment_data=commitment_data,
        utm_data=utm_data,
        phone=phone
    )
    
    if success:
        return json_resp({"success": True, "customer_id": customer_id})
    else:
        return json_resp({"error": "Failed to update subscriber"}, 500)


def handle_subscription_cancelled(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle subscription cancelled webhook"""
    customer = payload.get('customer', {})
    customer_id = str(customer.get('id', ''))
    customer_email = customer.get('email', '')
    
    print(f"❌ Subscription cancelled for: {customer_email}")
    
    success = update_subscriber(
        customer_id=customer_id,
        email=customer_email,
        status='cancelled', 
        event_type='subscription_cancelled',
        data=payload
    )
    
    if success:
        return json_resp({"success": True, "customer_id": customer_id})
    else:
        return json_resp({"error": "Failed to update subscriber"}, 500)

def handle_subscription_billing(payload: Dict[str, Any], topic: str) -> Dict[str, Any]:
    """Handle subscription billing webhooks (success/failure)"""
    customer = payload.get('customer', {})
    customer_id = str(customer.get('id', ''))
    customer_email = customer.get('email', '')
    
    status = 'billing_success' if 'success' in topic else 'billing_failure'
    print(f"💳 Subscription billing {status} for: {customer_email}")
    
    success = update_subscriber(
        customer_id=customer_id,
        email=customer_email,
        status=status, 
        event_type=topic.replace('/', '_'),
        data=payload
    )
    
    if success:
        return json_resp({"success": True, "customer_id": customer_id})
    else:
        return json_resp({"error": "Failed to update subscriber"}, 500)


def handle_order_created(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle order created webhook from Shopify Flow"""
    customer = payload.get('customer', {})
    if not customer:
        return json_resp({"success": True, "message": "No customer in order"})
        
    customer_id = str(customer.get('id', ''))
    customer_email = customer.get('email', '')
    
    print(f"🛒 Order created for: {customer_email}, customer_id: {customer_id}")
    
    # Extract commitment and UTM data from the order payload
    commitment_data = payload.get('commitment_data', {})
    
    # Extract UTM data from line items properties
    utm_data = {}
    order = payload.get('order', {})
    line_items = order.get('line_items', [])
    if line_items:
        properties = line_items[0].get('properties', [])
        utm_source = next((p['value'] for p in properties if p['name'] == '_utm_source'), 'unknown')
        utm_campaign = next((p['value'] for p in properties if p['name'] == '_utm_campaign'), 'unknown')
        utm_clickid = next((p['value'] for p in properties if p['name'] == '_utm_clickid'), 'none')
        
        utm_data = {
            'utm_source': utm_source,
            'utm_campaign': utm_campaign,
            'utm_clickid': utm_clickid
        }
    
    # Extract phone from line items properties
    phone = ''
    if line_items:
        properties = line_items[0].get('properties', [])
        phone = next((p['value'] for p in properties if p['name'] == 'WhatsApp'), '')
    
    print(f"📊 Extracted from webhook - commitment_data: {bool(commitment_data)}, utm_data: {bool(utm_data)}, phone: {bool(phone)}")
    
    # Simply update/create record with customer ID from payload
    success = update_subscriber(
        customer_id=customer_id,
        email=customer_email,
        status='active',
        event_type='order_created', 
        data=payload,
        commitment_data=commitment_data,
        utm_data=utm_data,
        phone=phone
    )
    
    if success:
        return json_resp({"success": True, "customer_id": customer_id})
    else:
        return json_resp({"error": "Failed to update subscriber"}, 500)


# =============================================================================
# COMMITMENT WIDGET
# =============================================================================

def evaluate_only(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Evaluate commitment form using OpenAI - frontend version"""
    try:
        
        q1 = str(payload.get('q1', '')).strip()
        q2 = str(payload.get('q2', '')).strip()
        q3 = str(payload.get('q3', '')).strip()
        
        if not all([q1, q2, q3]):
            return json_resp({"ok": False, "error": "q1, q2, q3 are required"}, 400)
            
        # Get OpenAI API key from environment or AWS Secrets Manager
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            # Try to get from AWS Secrets Manager if configured
            secret_name = os.environ.get('OPENAI_SECRET_NAME', 'CHATGPT_API_KEY')
            try:
                import boto3
                secrets_client = boto3.client('secretsmanager')
                response = secrets_client.get_secret_value(SecretId=secret_name)
                secret_data = json.loads(response['SecretString'])
                api_key = secret_data.get('CHATGPT_API_KEY')
            except Exception as secret_error:
                print(f"Failed to get OpenAI key from secrets: {secret_error}")
                # Fallback to environment variable
                api_key = os.environ.get('OPENAI_SECRET_KEY')
        
        if not api_key:
            return json_resp({"ok": False, "error": "OpenAI API key not configured"}, 500)
            
        # Make direct HTTP request to OpenAI API
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        prompt = f"""
        Evaluate this person's commitment to digital wellness and determine if they are passionate about change:
        
        What they want to quit: {q1}
        Why they want to change: {q2}
        Who they're doing it for: {q3}
        
        Respond with a JSON object containing:
        - "is_passionate": boolean (true if they show strong commitment)
        - "feedback": string (encouraging feedback message)
        - "surrender_text": string (personalized surrender statement they should repeat)
        """
        
        data = {
            "model": os.environ.get('OPENAI_MODEL', 'gpt-4o-mini'),
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 300,
            "temperature": 0.7
        }
        
        response = requests.post('https://api.openai.com/v1/chat/completions', 
                               headers=headers, json=data)
        response.raise_for_status()
        
        result = json.loads(response.json()['choices'][0]['message']['content'])
        return json_resp({
            "ok": True,
            "is_passionate": bool(result.get("is_passionate", False)),
            "feedback": result.get("feedback", ""),
            "surrender_text": result.get("surrender_text", "")
        })
            
    except Exception as e:
        print(f"❌ OpenAI evaluation error: {e}")
        # Return a fallback response that matches the expected format
        # This ensures the widget doesn't break even if OpenAI is unavailable
        fallback_response = {
            "ok": True,
            "is_passionate": True,  # Default to allowing progression
            "feedback": "Thank you for your commitment! We're evaluating your responses and you can continue with your digital wellness journey.",
            "surrender_text": f"I surrender my {q1} habits and commit to positive change for {q3}."
        }
        print(f"🔄 Using fallback response due to OpenAI error: {e}")
        return json_resp(fallback_response)

def evaluate_commitment(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Evaluate commitment form using OpenAI"""
    try:
        
        q1 = payload.get('q1', '')
        q2 = payload.get('q2', '')
        q3 = payload.get('q3', '')
        
        if not all([q1, q2, q3]):
            return json_resp({"error": "Missing required fields"}, 400)
            
        # Get OpenAI API key from environment or AWS Secrets Manager
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            # Try to get from AWS Secrets Manager if configured
            secret_name = os.environ.get('OPENAI_SECRET_NAME', 'CHATGPT_API_KEY')
            try:
                import boto3
                secrets_client = boto3.client('secretsmanager')
                response = secrets_client.get_secret_value(SecretId=secret_name)
                secret_data = json.loads(response['SecretString'])
                api_key = secret_data.get('CHATGPT_API_KEY')
            except Exception as secret_error:
                print(f"Failed to get OpenAI key from secrets: {secret_error}")
                # Fallback to environment variable
                api_key = os.environ.get('OPENAI_SECRET_KEY')
        
        if not api_key:
            return json_resp({"error": "OpenAI API key not configured"}, 500)
            
        # Make direct HTTP request to OpenAI API
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        prompt = f"""
        Evaluate this person's commitment to digital wellness:
        
        What they want to quit: {q1}
        Why they want to change: {q2}
        Who they're doing it for: {q3}
        
        Respond with a JSON object containing:
        - "commitment_score": number 1-10
        - "personalized_message": encouraging message
        - "recommended_plan": "basic" or "premium"
        """
        
        data = {
            "model": os.environ.get('OPENAI_MODEL', 'gpt-4o-mini'),
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 200,
            "temperature": 0.7
        }
        
        response = requests.post('https://api.openai.com/v1/chat/completions', 
                               headers=headers, json=data)
        response.raise_for_status()
        
        result = json.loads(response.json()['choices'][0]['message']['content'])
        return json_resp({
            "success": True,
            "evaluation": result,
            "next_step": "collect_contact"
        })
            
    except Exception as e:
        print(f"❌ OpenAI evaluation error: {e}")
        return json_resp({"error": "Evaluation failed"}, 500)


def create_checkout(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Create Shopify checkout"""
    try:
        phone = payload.get('phone', '')
        commitment_data = payload.get('commitment_form', {})
        
        if not phone or not commitment_data:
            return json_resp({"error": "Missing phone or commitment data"}, 400)
            
        # Simple checkout URL - customize as needed
        variant_id = "49692077785335"  # Your product variant ID
        checkout_url = f"https://xpvznx-9w.myshopify.com/cart/{variant_id}:1"
        
        return json_resp({
            "success": True,
            "checkout_url": checkout_url,
            "message": "Checkout created successfully"
        })
        
    except Exception as e:
        print(f"❌ Error creating checkout: {e}")
        return json_resp({"error": "Failed to create checkout"}, 500)

def create_webapp_checkout(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Create Shopify checkout for webapp flow"""
    try:
        # Extract data from frontend payload
        q1 = payload.get('q1', '')
        q2 = payload.get('q2', '')
        q3 = payload.get('q3', '')
        gender = payload.get('gender', '')
        phone = payload.get('phone', '')
        country_code = payload.get('country_code', 'US')
        surrender_text = payload.get('surrender_text', '')
        variant_gid = payload.get('variantGID', '')
        selling_plan_id = payload.get('sellingPlanId', '')
        
        # UTM parameters
        utm_source = payload.get('utm_source', 'direct')
        utm_campaign = payload.get('utm_campaign', 'organic')
        utm_clickid = payload.get('utm_clickid', 'none')
        
        print(f"🛒 Creating checkout for: gender={gender}, country={country_code}")
        print(f"📊 UTM: source={utm_source}, campaign={utm_campaign}, clickid={utm_clickid}")
        
        # Validate required fields
        if not all([q1, q2, q3, gender]):
            return json_resp({"ok": False, "error": "Missing required commitment data"}, 400)
        
        # Prepare commitment form data
        commitment_form_data = {
            'q1': q1, 'q2': q2, 'q3': q3,
            'surrender_text': surrender_text
        }
        
        # Use the enhanced GraphQL cart creation
        print(f"🛒 Creating GraphQL checkout for: {gender}, variant: {variant_gid}")
        ok, checkout_url, err = shopify_cart_create_enhanced(
            variant_gid=variant_gid,
            selling_plan_id=selling_plan_id,
            whatsapp=phone,
            commitment_form_data=commitment_form_data,
            gender=gender,
            utm_data={
                'utm_source': utm_source,
                'utm_campaign': utm_campaign, 
                'utm_clickid': utm_clickid
            }
        )
        
        if not ok:
            print(f"❌ GraphQL checkout creation failed: {err}")
            return json_resp({"ok": False, "error": err or "checkout_failed"}, 500)
        
        # Optionally store commitment data in DynamoDB for tracking
        try:
            import boto3
            dynamodb = boto3.resource('dynamodb')
            table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
            
            # Store commitment data
            commitment_record = {
                'customer_id': f"webapp_{int(time.time())}",  # Temporary ID until real customer created
                'commitment_data': commitment_form_data,
                'utm_data': {
                    'utm_source': utm_source,
                    'utm_campaign': utm_campaign, 
                    'utm_clickid': utm_clickid
                },
                'country_code': country_code,
                'variant_gid': variant_gid,
                'selling_plan_id': selling_plan_id,
                'status': 'checkout_created',
                'created_at': datetime.now().isoformat(),
                'checkout_url': checkout_url
            }
            
            # Only add phone if it's not empty (DynamoDB index constraint)
            if phone and phone.strip():
                commitment_record['phone'] = phone.strip()
            
            table.put_item(Item=commitment_record)
            print(f"💾 Stored GraphQL checkout data for webapp")
            
        except Exception as db_error:
            print(f"⚠️ Failed to store commitment data: {db_error}")
            # Don't fail the checkout if DB storage fails
        
        return json_resp({
            "ok": True,
            "checkoutUrl": checkout_url,
            "message": "Checkout created successfully"
        })
        
    except Exception as e:
        print(f"❌ Error creating webapp checkout: {e}")
        return json_resp({"ok": False, "error": "Failed to create checkout"}, 500)

def shopify_cart_create_enhanced(variant_gid: str, selling_plan_id: str, whatsapp: str, commitment_form_data: dict, gender: str, utm_data: dict = None) -> Tuple[bool, str, str]:
    """Create Shopify cart with enhanced commitment form data and invisible UTM attributes using GraphQL"""
    storefront_token = get_shopify_storefront_token()
    if not (SHOP_DOMAIN and storefront_token):
        return False, None, "shopify_credentials_missing"

    # Convert commitment form data to JSON string
    commitment_form_json = json.dumps(commitment_form_data)
    
    # Build base attributes (visible and hidden)
    base_attributes = [
        {"key": "WhatsApp", "value": whatsapp.replace("+", "")},  # Visible
        {"key": "gender", "value": gender.capitalize()},  # Visible
        {"key": "_commitment_form", "value": commitment_form_json},  # Hidden
        {"key": "_source", "value": "web"},  # Hidden
    ]
    
    # Add UTM parameters as invisible checkout attributes (prefixed with _)
    if utm_data:
        for utm_key, utm_value in utm_data.items():
            if utm_value and utm_value != "NONE":
                # Store as invisible attribute with _ prefix
                base_attributes.append({"key": f"_{utm_key}", "value": str(utm_value)})
        
        # Also store complete UTM data as JSON for backup
        utm_json = json.dumps(utm_data)
        base_attributes.append({"key": "_utm_data_json", "value": utm_json})

    # Add custom thank you URL for subscriptions BEFORE creating mutation
    if selling_plan_id:
        # Add custom redirect URL as attribute for subscription orders
        base_attributes.append({"key": "_thank_you_redirect", "value": f"https://{SHOP_DOMAIN}/account/extensions/commitment-widget"})

    # Create mutation based on whether selling plan is provided
    if selling_plan_id:
        # With selling plan (subscription)
        mutation = {
            "query": "mutation CreateCart($variantId: ID!, $planId: ID!, $qty: Int!, $attributes: [AttributeInput!]!) { cartCreate(input: { attributes: $attributes, lines: [{ merchandiseId: $variantId, sellingPlanId: $planId, quantity: $qty, attributes: $attributes }] }) { cart { id checkoutUrl lines(first: 10) { edges { node { id quantity merchandise { ... on ProductVariant { id title product { title } } } sellingPlanAllocation { sellingPlan { id name } } } } } cost { totalAmount { amount currencyCode } subtotalAmount { amount currencyCode } } } userErrors { field message } } }",
            "variables": {
                "variantId": variant_gid,
                "planId": selling_plan_id,
                "qty": 1,
                "attributes": base_attributes
            }
        }
    else:
        # Without selling plan (one-time purchase)
        mutation = {
            "query": "mutation CreateCart($variantId: ID!, $qty: Int!, $attributes: [AttributeInput!]!) { cartCreate(input: { attributes: $attributes, lines: [{ merchandiseId: $variantId, quantity: $qty, attributes: $attributes }] }) { cart { id checkoutUrl lines(first: 10) { edges { node { id quantity merchandise { ... on ProductVariant { id title product { title } } } } } } cost { totalAmount { amount currencyCode } subtotalAmount { amount currencyCode } } } userErrors { field message } } }",
            "variables": {
                "variantId": variant_gid,
                "qty": 1,
                "attributes": base_attributes
            }
        }

    try:
        print(f"🛒 Creating GraphQL cart with variant: {variant_gid}, selling plan: {selling_plan_id}")
        response = requests.post(
            f"https://{SHOP_DOMAIN}/api/2025-07/graphql.json",
            json=mutation,
            headers={
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": storefront_token,
            },
            timeout=12
        )
        print(f"📞 Shopify GraphQL response status: {response.status_code}")
        data = response.json()
        print(f"📊 Shopify GraphQL response data: {data}")
    except Exception as e:
        print(f"❌ Shopify GraphQL request error: {e}")
        import traceback
        traceback.print_exc()
        return False, None, f"shopify_request_failed: {str(e)}"

    # Check for user errors first
    user_errors = data.get("data", {}).get("cartCreate", {}).get("userErrors", [])
    if user_errors:
        error_msgs = ", ".join(m.get("message", "") for m in user_errors)
        print(f"❌ Shopify GraphQL user errors: {error_msgs}")
        return False, None, error_msgs
    
    # Get cart data safely
    cart_data = data.get("data", {}).get("cartCreate", {}).get("cart")
    if not cart_data:
        print(f"❌ No cart data returned from Shopify GraphQL")
        return False, None, "no_cart_data_returned"
    
    checkout_url = cart_data.get("checkoutUrl")
    if checkout_url:
        print(f"✅ GraphQL checkout URL obtained: {checkout_url}")
        return True, checkout_url, None

    print(f"❌ No checkout URL in GraphQL cart data")
    return False, None, "no_checkout_url"


# =============================================================================
# APP PROXY
# =============================================================================

def verify_app_proxy_signature(query_params: Dict[str, Any]) -> bool:
    """
    Verify Shopify App Proxy signature (not HMAC)
    App Proxy uses 'signature' parameter with concatenated sorted key=value pairs (no & between them)
    https://shopify.dev/docs/apps/app-extensions/app-proxy#verify-proxy-requests
    """
    try:
        app_proxy_secret = os.environ.get('SHOPIFY_API_SECRET', '')
        if not app_proxy_secret:
            print("❌ No SHOPIFY_API_SECRET found for app proxy verification")
            return False
            
        # Extract signature
        signature = query_params.get('signature')
        if not signature:
            print("❌ No signature found in App Proxy request")
            return False

        # Remove signature from params for verification
        params_copy = query_params.copy()
        del params_copy['signature']
        
        # Sort parameters and concatenate key=value pairs (NO & between them)
        sorted_params = sorted(params_copy.items())
        message = ''.join([f"{k}={v}" for k, v in sorted_params])
        
        # Calculate expected signature using HMAC-SHA256, hex digest
        expected_signature = hmac.new(
            app_proxy_secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Compare signatures (constant time comparison)
        is_valid = hmac.compare_digest(signature, expected_signature)
        
        if is_valid:
            print("✅ App Proxy HMAC signature verified")
        else:
            print(f"❌ Invalid App Proxy signature. Expected: {expected_signature}, Got: {signature}")
            print(f"Message used for signature: {message}")
        
        return is_valid
        
    except Exception as e:
        print(f"❌ Error verifying App Proxy signature: {e}")
        return False

def check_customer_entitlement(customer_id: str) -> Dict[str, Any]:
    """
    Check if customer has active entitlement in DynamoDB
    """
    try:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
        
        # Query stj_subscribers table
        response = table.get_item(Key={'customer_id': customer_id})
        
        if 'Item' not in response:
            print(f"❌ Customer {customer_id} not found in subscribers table")
            return {'has_access': False, 'reason': 'customer_not_found'}
        
        customer_data = response['Item']
        subscription_status = customer_data.get('subscription_status', 'inactive')
        
        if subscription_status == 'active':
            print(f"✅ Customer {customer_id} has active entitlement")
            
            # Check if profile is complete (username and gender required)
            username = customer_data.get('username', '')
            gender = customer_data.get('gender', '')
            
            profile_complete = bool(username and gender)
            print(f"👤 Profile completeness check - username: {bool(username)}, gender: {bool(gender)}")
            
            return {
                'has_access': True,
                'customer_data': customer_data,
                'subscription_status': subscription_status,
                'profile_complete': profile_complete
            }
        else:
            print(f"❌ Customer {customer_id} has inactive subscription: {subscription_status}")
            return {'has_access': False, 'reason': 'subscription_inactive', 'status': subscription_status}
            
    except Exception as e:
        print(f"❌ Error checking customer entitlement: {e}")
        return {'has_access': False, 'reason': 'database_error'}

def render_account_wall_page(reason: str, shop_domain: str) -> Dict[str, Any]:
    """
    Render the account wall page for customers without active subscriptions
    """
    # Map reasons to user-friendly messages and actions
    reason_config = {
        'customer_not_found': {
            'icon': '🔒',
            'title': 'Subscription Required',
            'message': 'You need an active subscription to access the Screen Time Journey dashboard.',
            'button_text': 'Get Subscription',
            'button_url': f'https://{shop_domain}/products/screen-time-journey'
        },
        'subscription_inactive': {
            'icon': '⏸️',
            'title': 'Subscription Inactive',
            'message': 'Your Screen Time Journey subscription is currently inactive. Please renew to continue your journey.',
            'button_text': 'Renew Subscription',
            'button_url': f'https://{shop_domain}/products/screen-time-journey'
        },
        'database_error': {
            'icon': '⚠️',
            'title': 'Unable to Verify Access',
            'message': 'We\'re having trouble verifying your subscription status. Please try again in a moment.',
            'button_text': 'Try Again',
            'button_url': f'https://{shop_domain}/apps/screen-time-journey'
        }
    }
    
    config = reason_config.get(reason, reason_config['customer_not_found'])
    
    html = f'''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Screen Time Journey - {config['title']}</title>
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}
            
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }}
            
            .container {{
                max-width: 480px;
                width: 100%;
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                padding: 40px;
                text-align: center;
            }}
            
            .icon {{
                font-size: 72px;
                margin-bottom: 24px;
                display: block;
            }}
            
            h1 {{
                color: #1a1a1a;
                font-size: 28px;
                font-weight: 600;
                margin-bottom: 16px;
                line-height: 1.3;
            }}
            
            .message {{
                color: #666;
                font-size: 16px;
                line-height: 1.5;
                margin-bottom: 32px;
            }}
            
            .btn {{
                background: #007cba;
                color: white;
                padding: 14px 28px;
                font-size: 16px;
                font-weight: 500;
                text-decoration: none;
                border-radius: 8px;
                display: inline-block;
                transition: all 0.2s ease;
                margin-bottom: 16px;
            }}
            
            .btn:hover {{
                background: #005a8b;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 124, 186, 0.3);
            }}
            
            .secondary-link {{
                color: #999;
                text-decoration: none;
                font-size: 14px;
                display: block;
                margin-top: 16px;
            }}
            
            .secondary-link:hover {{
                color: #666;
            }}
            
            .feature-list {{
                text-align: left;
                margin: 24px 0;
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
            }}
            
            .feature-list h3 {{
                color: #333;
                font-size: 16px;
                margin-bottom: 12px;
                text-align: center;
            }}
            
            .feature-list ul {{
                list-style: none;
                color: #666;
            }}
            
            .feature-list li {{
                padding: 4px 0;
                position: relative;
                padding-left: 20px;
            }}
            
            .feature-list li:before {{
                content: "✓";
                color: #007cba;
                font-weight: bold;
                position: absolute;
                left: 0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="icon">{config['icon']}</div>
            <h1>{config['title']}</h1>
            <p class="message">{config['message']}</p>
            
            <div class="feature-list">
                <h3>What You'll Get:</h3>
                <ul>
                    <li>Daily screen time tracking</li>
                    <li>Personal progress dashboard</li>
                    <li>AI-powered commitment validation</li>
                    <li>WhatsApp accountability reminders</li>
                    <li>Journey milestones and achievements</li>
                </ul>
            </div>
            
            <a href="{config['button_url']}" class="btn">{config['button_text']}</a>
            <a href="https://{shop_domain}" class="secondary-link">← Back to Store</a>
        </div>
    </body>
    </html>
    '''
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store'
        },
        'body': html
    }

def create_jwt_token(customer_data: Dict[str, Any], shop_domain: str) -> str:
    """
    Create JWT token for customer session on app.screentimejourney.com
    """
    if not JWT_AVAILABLE:
        print("⚠️ JWT library not available - returning simple token")
        # Return a simple base64 encoded token as fallback
        import base64
        simple_token = base64.b64encode(f"customer_{customer_data['customer_id']}".encode()).decode()
        return simple_token
        
    try:
        jwt_secret = os.environ.get('JWT_SECRET', 'your-super-secret-jwt-key-change-this')
        
        # Token payload
        payload = {
            'customer_id': customer_data['customer_id'],
            'email': customer_data.get('email', ''),
            'subscription_status': customer_data.get('subscription_status', 'active'),
            'shop': shop_domain,
            'iat': int(time.time()),
            'exp': int(time.time()) + (24 * 60 * 60),  # 24 hours
            'iss': 'screen-time-journey-app',
            'aud': 'app.screentimejourney.com'
        }
        
        # Create JWT token
        token = jwt.encode(payload, jwt_secret, algorithm='HS256')
        print(f"✅ Created JWT token for customer {customer_data['customer_id']}")
        
        return token
        
    except Exception as e:
        print(f"❌ Error creating JWT token: {e}")
        return None

def handle_app_proxy(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle App Proxy requests from Shopify storefront"""
    try:
        query_params = event.get('queryStringParameters', {}) or {}
        
        # Log incoming request (redact signature for security)
        qs_redacted = {k: v for k, v in query_params.items() if k != 'signature'}
        print(f"📥 App Proxy request QS: {qs_redacted}")
        
        # 1. Verify signature for security
        if not verify_app_proxy_signature(query_params):
            print("🔒 BRANCH: INVALID_SIGNATURE")
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'text/plain'},
                'body': 'Invalid signature'
            }
        
        # 2. Extract customer information
        customer_id = query_params.get('logged_in_customer_id')
        shop_domain = query_params.get('shop', '')
        
        if not customer_id:
            # Redirect to Shopify login
            login_url = f"https://{shop_domain}/account/login?return_url=/apps/screen-time-journey"
            print(f"🔑 BRANCH: LOGIN_REDIRECT")
            print(f"📤 Location: {login_url}")
            
            return {
                'statusCode': 302,
                'headers': {
                    'Location': login_url,
                    'Cache-Control': 'no-store'
                },
                'body': 'Redirecting to login...'
            }
        
        # 3. Check customer entitlement (ACCOUNT WALL)
        entitlement_check = check_customer_entitlement(customer_id)
        if not entitlement_check['has_access']:
            print(f"🚫 BRANCH: NO_ACCESS - Reason: {entitlement_check.get('reason', 'unknown')}")
            return render_account_wall_page(entitlement_check.get('reason', 'unknown'), shop_domain)
        
        print(f"✅ Customer {customer_id} has active entitlement - proceeding to dashboard")
        
        # Get customer data and profile status
        customer_data = entitlement_check['customer_data']
        profile_complete = entitlement_check.get('profile_complete', False)
        
        # 4. Create one-time, short-lived token
        app_base_url = os.environ.get('APP_BASE_URL', 'https://d1603y70syq9xl.amplifyapp.com')
        token_ttl = int(os.environ.get('TOKEN_TTL_SECONDS', '120'))  # 2 minutes
        
        # Create enhanced token: shop|cid|iat|ttl|profile_complete|sig
        iat = int(time.time())
        profile_flag = "1" if profile_complete else "0"
        payload = f"{shop_domain}|{customer_id}|{iat}|{token_ttl}|{profile_flag}"
        
        # Sign with SHOPIFY_API_SECRET
        secret = os.environ.get('SHOPIFY_API_SECRET', '')
        signature = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
        token = f"{payload}|{signature}"
        
        # Encode for URL safety
        import base64
        safe_token = base64.urlsafe_b64encode(token.encode()).decode()
        
        # 5. Redirect to main dashboard (now in index.html)
        dashboard_url = f"{app_base_url}/?shop={urllib.parse.quote(shop_domain)}&cid={urllib.parse.quote(customer_id)}&token={urllib.parse.quote(safe_token)}"
        
        print(f"🚀 BRANCH: DASHBOARD_REDIRECT")
        print(f"📤 Location: {dashboard_url}")
        
        return {
            'statusCode': 302,
            'headers': {
                'Location': dashboard_url,
                'Cache-Control': 'no-store'
            },
            'body': 'Redirecting to dashboard...'
        }
        
    except Exception as e:
        print(f"❌ App Proxy error: {e}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'text/html'},
            'body': '<h1>Error</h1><p>Something went wrong</p>'
        }

def handle_jwt_verification(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle JWT verification for app.screentimejourney.com
    This endpoint will be called from your frontend to verify tokens
    """
    try:
        query_params = event.get('queryStringParameters', {}) or {}
        body = parse_body(event)
        
        # Token can come from query params or POST body
        token = query_params.get('token') or body.get('token')
        
        if not token:
            return json_resp({'error': 'No token provided'}, 400)
        
        jwt_secret = os.environ.get('JWT_SECRET', 'your-super-secret-jwt-key-change-this')
        
        # Verify JWT token
        if not JWT_AVAILABLE:
            print("⚠️ JWT library not available - using simple verification")
            # Simple base64 verification for fallback
            import base64
            try:
                decoded = base64.b64decode(token).decode()
                if decoded.startswith('customer_'):
                    customer_id = decoded.replace('customer_', '')
                    entitlement_check = check_customer_entitlement(customer_id)
                    if entitlement_check['has_access']:
                        return json_resp({
                            'valid': True,
                            'customer_id': customer_id,
                            'email': '',
                            'subscription_status': 'active',
                            'shop': ''
                        })
            except Exception:
                pass
            return json_resp({'error': 'Invalid token'}, 401)
        
        try:
            payload = jwt.decode(
                token, 
                jwt_secret, 
                algorithms=['HS256'],
                audience='app.screentimejourney.com',
                issuer='screen-time-journey-app'
            )
            
            print(f"✅ Valid JWT token for customer {payload.get('customer_id')}")
            
            # Re-verify customer entitlement for extra security
            entitlement_check = check_customer_entitlement(payload['customer_id'])
            if not entitlement_check['has_access']:
                return json_resp({'error': 'Access revoked'}, 403)
            
            return json_resp({
                'valid': True,
                'customer_id': payload['customer_id'],
                'email': payload['email'],
                'subscription_status': payload['subscription_status'],
                'shop': payload['shop']
            })
            
        except Exception as e:
            if JWT_AVAILABLE:
                if 'ExpiredSignatureError' in str(type(e)):
                    print("❌ JWT token has expired")
                    return json_resp({'error': 'Token expired'}, 401)
                else:
                    print(f"❌ Invalid JWT token: {e}")
                    return json_resp({'error': 'Invalid token'}, 401)
            else:
                print(f"❌ Token verification error: {e}")
                return json_resp({'error': 'Invalid token'}, 401)
            
    except Exception as e:
        print(f"❌ Error verifying JWT: {e}")
        return json_resp({'error': 'Internal server error'}, 500)


# =============================================================================
# SQS EVENT HANDLER (from EventBridge)
# =============================================================================

def handle_sqs_events(event, context):
    """Handle SQS events from EventBridge containing Shopify webhooks"""
    try:
        results = []
        
        for record in event.get("Records", []):
            # Extract the EventBridge event from SQS message
            message_body = json.loads(record["body"])
            print(f"📦 Processing SQS record: {json.dumps(message_body, default=str)}")
            
            # Extract Shopify webhook data from EventBridge event
            detail = message_body.get("detail", {})
            topic = detail.get("topic", "")
            payload = detail.get("payload", {})
            
            print(f"🎯 EventBridge webhook topic: {topic}")
            
            # Route to appropriate handler based on topic
            if topic == "subscription_contracts/create":
                result = handle_subscription_created(payload)
                results.append(result)
            elif topic == "subscription_contracts/cancel":
                result = handle_subscription_cancelled(payload)
                results.append(result)
            elif topic == "orders/create":
                result = handle_order_created(payload)
                results.append(result)
            elif topic in ["subscription_billing_attempts/success", "subscription_billing_attempts/failure"]:
                result = handle_subscription_billing(payload, topic)
                results.append(result)
            else:
                print(f"⚠️ Unknown EventBridge webhook topic: {topic}")
                results.append({"statusCode": 200, "body": json.dumps({"message": f"Unknown topic: {topic}"})})
        
        # Return success for all processed records
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": f"Processed {len(results)} SQS records successfully",
                "results": results
            })
        }
        
    except Exception as e:
        print(f"❌ SQS event processing error: {e}")
        import traceback
        traceback.print_exc()
        # For SQS, we should raise the exception to trigger retry/DLQ
        raise e


# =============================================================================
# MAIN HANDLER
# =============================================================================

def handler(event, context):
    """Main Lambda handler"""
    try:
        print(f"🚀 Lambda started: {json.dumps(event, default=str)}")
        
        # Check if this is an SQS event (from EventBridge)
        if "Records" in event:
            return handle_sqs_events(event, context)
        
        method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method", "GET")
        path = event.get("path") or event.get("requestContext", {}).get("http", {}).get("path", "/")
        
        print(f"📍 {method} {path}")
        
        # Handle OPTIONS for CORS
        if method == "OPTIONS":
            return json_resp({"ok": True})
            
        # App Proxy requests (from Shopify storefront)
        # Shopify will forward requests to the root of your proxy URL
        if method == "GET" and (path == "/" or path == "" or "apps" in path or "proxy" in path):
            return handle_app_proxy(event)
            
        # JWT verification endpoint for app.screentimejourney.com
        if path.endswith("/verify-jwt") or path.endswith("/verify_jwt"):
            return handle_jwt_verification(event)
            
        # Parse body for POST requests
        body = parse_body(event) if method == "POST" else {}
        
        # POST request endpoints
        if method == "POST":
            # Handle Frontend API endpoints FIRST (no signature verification needed)
            if path.endswith("/evaluate_only"):
                print(f"📞 Evaluate_only called with body: {body}")
                response = evaluate_only(body)
                print(f"📤 Evaluate_only response: {response}")
                return response
            elif path.endswith("/evaluate-and-start"):
                return evaluate_commitment(body)
            elif path.endswith("/create-checkout"):
                return create_checkout(body)
            elif path.endswith("/create_webapp_checkout"):
                print(f"📞 Create_webapp_checkout called with body: {body}")
                response = create_webapp_checkout(body)
                print(f"📤 Create_webapp_checkout response: {response}")
                return response
            elif path.endswith("/save_profile"):
                print(f"📞 Save_profile called with body: {body}")
                response = save_customer_profile(body)
                print(f"📤 Save_profile response: {response}")
                return response
            elif path.endswith("/check_username"):
                print(f"📞 Check_username called with body: {body}")
                response = check_username_availability(body)
                print(f"📤 Check_username response: {response}")
                return response
            elif path.endswith("/send_whatsapp_code"):
                print(f"📞 Send_whatsapp_code called with body: {body}")
                response = send_whatsapp_verification_code(body)
                print(f"📤 Send_whatsapp_code response: {response}")
                return response
            elif path.endswith("/verify_whatsapp_code"):
                print(f"📞 Verify_whatsapp_code called with body: {body}")
                response = verify_whatsapp_verification_code(body)
                print(f"📤 Verify_whatsapp_code response: {response}")
                return response
            elif path.endswith("/get_profile"):
                print(f"📞 Get_profile called with body: {body}")
                response = get_customer_profile(body)
                print(f"📤 Get_profile response: {response}")
                return response
            elif path.endswith("/update_profile"):
                print(f"📞 Update_profile called with body: {body}")
                response = update_customer_profile(body)
                print(f"📤 Update_profile response: {response}")
                return response
            elif path.endswith("/get_milestones"):
                print(f"📞 Get_milestones called with body: {body}")
                response = get_milestones(body)
                print(f"📤 Get_milestones response: {response}")
                return response
            elif path.endswith("/generate_milestone_video"):
                print(f"📞 Generate_milestone_video called with body: {body}")
                response = generate_milestone_video(body)
                print(f"📤 Generate_milestone_video response: {response}")
                return response
            elif path.endswith("/get_social_share_data"):
                print(f"📞 Get_social_share_data called with body: {body}")
                response = get_social_share_data(body)
                print(f"📤 Get_social_share_data response: {response}")
                return response
            elif path.endswith("/get_system_config"):
                return get_system_config(body)
            elif path.endswith("/calculate_percentile"):
                return calculate_percentile(body)
            elif path.endswith("/store_pincode"):
                return store_pincode(body)
            elif path.endswith("/generate_audio_guide"):
                return generate_audio_guide(body)
            elif path.endswith("/validate_surrender"):
                return validate_surrender(body)
            elif path.endswith("/send_unlock_email"):
                return send_unlock_email(body)
            elif path.endswith("/cancel_subscription"):
                return cancel_subscription(body)
            elif path.endswith("/update_notifications"):
                return update_notifications(body)
            elif path.endswith("/get_devices"):
                return get_devices(body)
            elif path.endswith("/update_device"):
                return update_device(body)
            elif path.endswith("/add_device"):
                return add_device(body)
            elif path.endswith("/unlock_device"):
                return unlock_device(body)
            elif path.endswith("/remove_device"):
                return remove_device(body)
            elif path.endswith("/regenerate_audio_guide"):
                return regenerate_audio_guide(body)
            elif path.endswith("/evaluate_commitment"):
                return evaluate_commitment(body)
            
            # Check if this is a Shopify Flow webhook (different signature handling)
            is_shopify_flow = (
                path.endswith("/subscription-created") or 
                path.endswith("/subscription-cancelled") or 
                path.endswith("/subscription-canceled") or 
                path.endswith("/orders-created")
            )
            
            # ONLY Shopify Flow webhooks are supported (Bearer token authentication)
            if is_shopify_flow:
                # Check for Bearer token authorization
                headers = event.get("headers", {})
                auth_header = headers.get("authorization") or headers.get("Authorization", "")
                api_secret = os.environ.get('SHOPIFY_API_SECRET', '')
                
                # Handle both "Bearer" and "earer" cases (sometimes B gets truncated)
                valid_tokens = [
                    f"Bearer {api_secret}",
                    f"earer {api_secret}"  # Handle truncated case
                ]
                
                if not auth_header or auth_header not in valid_tokens:
                    print(f"❌ Invalid Flow webhook authorization: '{auth_header}' (expected: Bearer {api_secret})")
                    return json_resp({"error": "Invalid authorization"}, 401)
                else:
                    print(f"✅ Valid Flow webhook authorization")
                    
                # Handle Shopify Flow webhook endpoints
                if path.endswith("/subscription-created"):
                    return handle_subscription_created(body)
                elif path.endswith("/subscription-cancelled") or path.endswith("/subscription-canceled"):
                    return handle_subscription_cancelled(body)
                elif path.endswith("/orders-created"):
                    return handle_order_created(body)
            else:
                # Reject ALL native Shopify webhooks - only Flow webhooks allowed
                print(f"❌ Native Shopify webhooks not supported. Path: {path}")
                return json_resp({"error": "Only Shopify Flow webhooks are supported"}, 400)
                
        # Default health check
        return json_resp({
            "message": "Screen Time Journey API", 
            "status": "healthy",
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Lambda handler error: {e}")
        return json_resp({"error": "Internal server error"}, 500)
