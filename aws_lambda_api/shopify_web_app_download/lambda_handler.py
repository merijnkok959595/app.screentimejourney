
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
import uuid
import secrets
import random
import base64
from typing import Dict, Any, Tuple, Optional
from datetime import datetime, timedelta
import dateutil.parser
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

def update_subscriber(customer_id: str, email: str, status: str, event_type: str, data: Dict = None, commitment_data: Dict = None, utm_data: Dict = None, phone: str = None, seal_subscription_id: str = None, country: str = None) -> bool:
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
        
        # Store Seal subscription ID if provided
        if seal_subscription_id:
            update_data['seal_subscription_id'] = str(seal_subscription_id)
            print(f"📊 Updated seal_subscription_id: {seal_subscription_id}")
        
        # Store country code if provided (from Seal billing address)
        if country and country.strip():
            update_data['country'] = country.upper()
            print(f"📍 Updated country: {country.upper()}")
        
        # Set whatsapp_notifications to True by default for new subscriptions
        if 'whatsapp_notifications' not in existing_data:
            update_data['whatsapp_notifications'] = True
            print(f"📱 Set whatsapp_notifications: True (default)")
        
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
    """Save customer profile data (username, gender, whatsapp, commitment) to DynamoDB"""
    try:
        customer_id = payload.get('customer_id')
        username = payload.get('username', '').strip()
        gender = payload.get('gender', '').strip()
        whatsapp = payload.get('whatsapp', '').strip()
        whatsapp_opt_in = payload.get('whatsapp_opt_in', False)
        what_to_change = payload.get('what_to_change', '').strip()
        what_to_gain = payload.get('what_to_gain', '').strip()
        doing_this_for = payload.get('doing_this_for', '').strip()
        
        if not customer_id:
            return json_resp({'error': 'Customer ID is required'}, 400)
        
        if not username or not gender:
            return json_resp({'error': 'Username and gender are required'}, 400)
        
        if not what_to_change or not what_to_gain or not doing_this_for:
            return json_resp({'error': 'Commitment fields (what_to_change, what_to_gain, doing_this_for) are required'}, 400)
        
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
            'what_to_change': what_to_change,
            'what_to_gain': what_to_gain,
            'doing_this_for': doing_this_for,
            'email_enabled': True,  # Enable email notifications by default on account creation
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
        
        print(f"✅ Profile saved for customer {customer_id}: username={username}, gender={gender}, commitment={what_to_change}/{what_to_gain}/{doing_this_for}")
        
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
        
        # Use username-index GSI for efficient lookup
        response = table.query(
            IndexName='username-index',
            KeyConditionExpression='username = :username',
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
        
        # Generate 6-digit code (frontend expects 6 digits)
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
        # Using auth template (approved) with 4-digit codes
        template_name = "auth"
        
        # WATI API format for sending template messages
        # Note: WATI templates can be picky about parameter names
        # Common names: "1", "code", "otp", "verification_code"
        # Get channel number from environment or use WATI business number
        channel_number = os.environ.get('WATI_CHANNEL_NUMBER', '31649232152')
        
        wati_payload = {
            "template_name": template_name,
            "broadcast_name": f"auth_verification_{verification_code}",
            "parameters": [
                {
                    "name": "1",
                    "value": str(verification_code)
                }
            ],
            "channel_number": channel_number
        }
        
        print(f"   📱 Using channel number: {channel_number}")
        
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
                    
                    # Check if WATI returned an error even with 200 status
                    if 'error' in response_json or response_json.get('result') == False:
                        error_msg = response_json.get('error', {}).get('message', 'Unknown WATI error')
                        print(f"❌ WATI API returned error: {error_msg}")
                        return json_resp({
                            'error': f'WhatsApp service error: {error_msg}',
                            'details': response_json
                        }, 500)
                        
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
            
            # Update customer profile with verified WhatsApp data and enable WhatsApp notifications
            subscribers_table.update_item(
                Key={'customer_id': customer_id},
                UpdateExpression='SET whatsapp = :phone, whatsapp_opt_in = :opt_in, whatsapp_verified_at = :timestamp, whatsapp_enabled = :whatsapp_enabled',
                ExpressionAttributeValues={
                    ':phone': phone,
                    ':opt_in': True,
                    ':timestamp': datetime.now().isoformat(),
                    ':whatsapp_enabled': True  # Enable WhatsApp notifications when verified
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
        
        # Build commitment_data object from individual fields or existing object
        # Support both old (commitment_data object) and new (individual fields) formats
        commitment_data = customer_data.get('commitment_data', {})
        
        # If individual fields exist (new format), use them
        what_to_change = customer_data.get('what_to_change', '')
        what_to_gain = customer_data.get('what_to_gain', '')
        doing_this_for = customer_data.get('doing_this_for', '')
        
        if what_to_change or what_to_gain or doing_this_for:
            # Build commitment_data from individual fields
            commitment_data = {
                'q1': what_to_change,
                'q2': what_to_gain,
                'q3': doing_this_for
            }
        
        # Build profile response with relevant fields
        profile = {
            'customer_id': customer_data.get('customer_id', ''),
            'email': customer_data.get('email', ''),
            'first_name': customer_data.get('first_name', ''),
            'last_name': customer_data.get('last_name', ''),
            'username': customer_data.get('username', ''),
            'gender': customer_data.get('gender', ''),
            'whatsapp': customer_data.get('whatsapp', ''),
            'whatsapp_opt_in': customer_data.get('whatsapp_opt_in', False),
            'whatsapp_verified_at': customer_data.get('whatsapp_verified_at', ''),
            'subscription_status': customer_data.get('subscription_status', 'inactive'),
            'created_at': customer_data.get('created_at', ''),
            'subscription_created_at': customer_data.get('subscription_created_at', ''),
            'updated_at': customer_data.get('profile_updated_at', customer_data.get('last_updated', '')),
            # Add any other relevant profile fields
            'commitment_data': commitment_data,
            'utm_data': customer_data.get('utm_data', {}),
            # Add notification settings
            'email_enabled': customer_data.get('email_enabled', True),
            'whatsapp_enabled': customer_data.get('whatsapp_enabled', False),
            # Add Seal subscription ID for cancellation
            'seal_subscription_id': customer_data.get('seal_subscription_id', ''),
            # Add activity logs
            'activity_logs': customer_data.get('activity_logs', [])
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
        
        # Handle commitment_data object if provided
        if 'commitment_data' in payload:
            commitment_data = payload['commitment_data']
            if isinstance(commitment_data, dict):
                payload['what_to_change'] = commitment_data.get('q1', '')
                payload['what_to_gain'] = commitment_data.get('q2', '')
                payload['doing_this_for'] = commitment_data.get('q3', '')
        
        # Get the fields to update (excluding email and customer_id)
        updatable_fields = ['username', 'gender', 'whatsapp', 'what_to_change', 'what_to_gain', 'doing_this_for']
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
                elif field in ['what_to_change', 'what_to_gain', 'doing_this_for']:
                    # Sanitize commitment fields
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
        
        # Build commitment_data object from individual fields or existing object
        commitment_data = existing_data.get('commitment_data', {})
        what_to_change = existing_data.get('what_to_change', '')
        what_to_gain = existing_data.get('what_to_gain', '')
        doing_this_for = existing_data.get('doing_this_for', '')
        
        if what_to_change or what_to_gain or doing_this_for:
            # Build commitment_data from individual fields
            commitment_data = {
                'q1': what_to_change,
                'q2': what_to_gain,
                'q3': doing_this_for
            }
        
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
            'commitment_data': commitment_data,
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
        
        # Use username-index GSI and filter out current customer
        response = table.query(
            IndexName='username-index',
            KeyConditionExpression='username = :username',
            ExpressionAttributeValues={':username': username}
        )
        
        # Filter out current customer from results
        other_users = [item for item in response.get('Items', []) if item.get('customer_id') != customer_id]
        is_available = len(other_users) == 0
        
        print(f"✅ Username '{username}' availability check for update: {'available' if is_available else 'taken'}")
        
        return is_available
        
    except Exception as e:
        print(f"❌ Error checking username availability for update: {e}")
        return False


def update_notification_settings(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Update customer notification preferences in DynamoDB"""
    try:
        customer_id = payload.get('customer_id')
        
        if not customer_id:
            return json_resp({'error': 'Customer ID is required'}, 400)
        
        # Get simplified notification preferences
        email_enabled = payload.get('email_enabled', True)
        whatsapp_enabled = payload.get('whatsapp_enabled', False)
        
        dynamodb = boto3.resource('dynamodb')
        subscribers_table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
        
        # Store simplified notification preferences
        notification_prefs = {
            'email_enabled': email_enabled,
            'whatsapp_enabled': whatsapp_enabled
        }
        
        # Update the customer record with notification preferences
        try:
            subscribers_table.update_item(
                Key={'customer_id': customer_id},
                UpdateExpression='SET email_enabled = :email_enabled, whatsapp_enabled = :whatsapp_enabled, notification_updated_at = :updated_at',
                ExpressionAttributeValues={
                    ':email_enabled': email_enabled,
                    ':whatsapp_enabled': whatsapp_enabled,
                    ':updated_at': datetime.now().isoformat()
                }
            )
            
            print(f"✅ Updated notification preferences for customer {customer_id}: email={email_enabled}, whatsapp={whatsapp_enabled}")
            
            return json_resp({
                'success': True,
                'message': 'Notification settings updated successfully',
                'preferences': notification_prefs
            })
            
        except Exception as e:
            print(f"❌ Error updating notification preferences: {e}")
            return json_resp({'error': 'Failed to update notification settings'}, 500)
        
    except Exception as e:
        print(f"❌ Error in update_notification_settings: {e}")
        return json_resp({'error': 'Failed to update notification settings'}, 500)


def unsubscribe_email_notifications(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Unsubscribe user from email notifications using their email address"""
    try:
        email = payload.get('email')
        notification_type = payload.get('notification_type', 'milestone')
        
        if not email:
            return json_resp({'error': 'Email is required'}, 400)
        
        print(f"🔕 Processing unsubscribe request for email: {email}, type: {notification_type}")
        
        dynamodb = boto3.resource('dynamodb')
        subscribers_table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
        
        # Find subscriber by email (scan operation since email is not primary key)
        try:
            response = subscribers_table.scan(
                FilterExpression='email = :email',
                ExpressionAttributeValues={
                    ':email': email
                }
            )
            
            if not response.get('Items'):
                print(f"⚠️ No subscriber found with email: {email}")
                # Still return success to prevent enumeration
                return json_resp({
                    'success': True,
                    'message': 'Unsubscribed successfully'
                })
            
            subscriber = response['Items'][0]
            customer_id = subscriber.get('customer_id')
            
            print(f"✅ Found subscriber with customer_id: {customer_id}")
            
            # Update email_enabled to False (this is the field the dashboard uses)
            subscribers_table.update_item(
                Key={'customer_id': customer_id},
                UpdateExpression='SET email_enabled = :email_enabled, notification_updated_at = :updated_at',
                ExpressionAttributeValues={
                    ':email_enabled': False,
                    ':updated_at': datetime.now().isoformat()
                }
            )
            
            print(f"✅ Successfully unsubscribed {email} from {notification_type} emails")
            
            return json_resp({
                'success': True,
                'message': 'You have been successfully unsubscribed from milestone email notifications'
            })
            
        except Exception as e:
            print(f"❌ Error updating subscription status: {e}")
            return json_resp({'error': 'Failed to process unsubscribe request'}, 500)
        
    except Exception as e:
        print(f"❌ Error in unsubscribe_email_notifications: {e}")
        return json_resp({'error': 'Failed to process unsubscribe request'}, 500)


def cancel_customer_subscription(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Cancel customer subscription via Seal API"""
    try:
        customer_id = payload.get('customer_id')
        cancel_reason = payload.get('cancel_reason', '')
        feedback = payload.get('feedback', '')
        seal_subscription_id = payload.get('seal_subscription_id')
        
        if not customer_id:
            return json_resp({'error': 'Customer ID is required'}, 400)
        
        dynamodb = boto3.resource('dynamodb')
        subscribers_table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
        
        # First, get customer data to find subscription info
        try:
            customer_response = subscribers_table.get_item(Key={'customer_id': customer_id})
            
            if 'Item' not in customer_response:
                return json_resp({'error': 'Customer not found'}, 404)
            
            customer_data = customer_response['Item']
            
            # Get Seal subscription ID from payload or from DynamoDB
            if not seal_subscription_id:
                seal_subscription_id = customer_data.get('seal_subscription_id')
            
            if not seal_subscription_id:
                return json_resp({'error': 'Seal subscription ID not found. Please contact support.'}, 400)
            
            print(f"📞 Cancelling Seal subscription for customer {customer_id}, seal_subscription_id: {seal_subscription_id}")
            
            # Call Seal API to cancel subscription
            seal_api_token = 'seal_token_r90trlel5ffdmck64dhajug50skudevfk2w9lmfn'
            seal_api_url = 'https://app.sealsubscriptions.com/shopify/merchant/api/subscription'
            
            cancel_payload = {
                'id': int(seal_subscription_id),
                'action': 'cancel'
            }
            
            print(f"📤 Calling Seal API: {seal_api_url} with payload: {cancel_payload}")
            
            seal_response = requests.put(
                seal_api_url,
                headers={
                    'Content-Type': 'application/json',
                    'X-Seal-Token': seal_api_token
                },
                json=cancel_payload,
                timeout=30
            )
            
            print(f"📥 Seal API response status: {seal_response.status_code}")
            print(f"📥 Seal API response body: {seal_response.text}")
            
            if seal_response.status_code >= 200 and seal_response.status_code < 300:
                seal_result = seal_response.json()
                if seal_result.get('success') or seal_result.get('payload'):
                    print(f"✅ Seal subscription cancelled successfully: {seal_result}")
                else:
                    print(f"⚠️ Seal API returned unexpected response: {seal_result}")
            else:
                error_msg = f"Seal API returned status {seal_response.status_code}: {seal_response.text}"
                print(f"❌ {error_msg}")
                return json_resp({'error': error_msg}, seal_response.status_code)
            
            # Update DynamoDB to reflect cancellation
            cancellation_result = schedule_subscription_cancellation(
                customer_id=customer_id,
                customer_data=customer_data,
                cancel_reason=cancel_reason,
                feedback=feedback,
                immediate=True  # Seal cancellation = immediate
            )
            
            if not cancellation_result['success']:
                print(f"⚠️ DynamoDB update failed but Seal cancellation succeeded: {cancellation_result.get('error')}")
            
            # Return success response
            response_data = {
                'success': True,
                'message': 'Subscription cancelled successfully',
                'seal_cancelled': True,
                'status': 'cancelled'
            }
            
            if cancellation_result.get('cancellation_date'):
                response_data['cancellation_date'] = cancellation_result['cancellation_date']
            
            return json_resp(response_data)
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Network error calling Seal API: {e}")
            return json_resp({'error': f'Failed to connect to Seal API: {str(e)}'}, 500)
        except Exception as e:
            print(f"❌ Error cancelling subscription: {e}")
            import traceback
            print(traceback.format_exc())
            return json_resp({'error': 'Failed to cancel subscription'}, 500)
        
    except Exception as e:
        print(f"❌ Error in cancel_customer_subscription: {e}")
        import traceback
        print(traceback.format_exc())
        return json_resp({'error': 'Failed to cancel subscription'}, 500)


def cancel_shopify_subscription_api(shop_domain: str, subscription_id: str, user_id: str) -> Dict[str, Any]:
    """Cancel subscription via Shopify Subscription Contracts API"""
    try:
        # Get Shopify admin access token
        shopify_access_token = get_shopify_admin_token()
        
        if not shopify_access_token or shopify_access_token == "REDACTED_TOKEN":
            print(f"❌ No valid Shopify access token found for shop: {shop_domain}")
            return {'success': False, 'error': 'No access token found'}
        
        if not subscription_id:
            print("❌ No subscription ID provided")
            return {'success': False, 'error': 'No subscription ID provided'}
        
        # Shopify GraphQL mutation to cancel subscription
        graphql_query = """
        mutation subscriptionContractCancel($subscriptionContractId: ID!) {
          subscriptionContractCancel(subscriptionContractId: $subscriptionContractId) {
            subscriptionContract {
              id
              status
              lastPaymentStatus
            }
            userErrors {
              field
              message
            }
          }
        }
        """
        
        # Format subscription ID for GraphQL (add gid prefix if not present)
        if not subscription_id.startswith('gid://shopify/SubscriptionContract/'):
            formatted_subscription_id = f'gid://shopify/SubscriptionContract/{subscription_id}'
        else:
            formatted_subscription_id = subscription_id
        
        variables = {
            'subscriptionContractId': formatted_subscription_id
        }
        
        headers = {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': shopify_access_token
        }
        
        url = f'https://{shop_domain}/admin/api/2023-10/graphql.json'
        
        payload = {
            'query': graphql_query,
            'variables': variables
        }
        
        print(f"📡 Sending Shopify cancellation request for subscription: {subscription_id}")
        print(f"🌐 URL: {url}")
        
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            
            if 'errors' in result:
                print(f"❌ Shopify GraphQL errors: {result['errors']}")
                return {'success': False, 'error': result['errors']}
            
            data = result.get('data', {})
            cancel_result = data.get('subscriptionContractCancel', {})
            
            if cancel_result.get('userErrors'):
                print(f"❌ Shopify user errors: {cancel_result['userErrors']}")
                return {'success': False, 'error': cancel_result['userErrors']}
            
            subscription = cancel_result.get('subscriptionContract', {})
            print(f"✅ Shopify subscription cancelled: {subscription}")
            
            return {
                'success': True,
                'shopify_response': subscription,
                'new_status': subscription.get('status'),
                'payment_status': subscription.get('lastPaymentStatus')
            }
        else:
            print(f"❌ Shopify API error: {response.status_code} - {response.text}")
            return {'success': False, 'error': f'Shopify API error: {response.status_code}'}
            
    except Exception as e:
        print(f"❌ Error cancelling Shopify subscription: {str(e)}")
        return {'success': False, 'error': str(e)}


def calculate_billing_period_end(customer_data: Dict[str, Any]) -> str:
    """Calculate when the current billing period ends for graceful cancellation"""
    try:
        # Simple approach: 30 days from now (most subscriptions are monthly)
        # In production, you could get this from Shopify subscription data
        
        # Check if we have Shopify subscription data with next billing date
        shopify_data = customer_data.get('shopify_data', {})
        if isinstance(shopify_data, dict):
            next_billing = shopify_data.get('next_billing_date')
            if next_billing:
                billing_date = dateutil.parser.parse(next_billing)
                return billing_date.strftime('%Y-%m-%d')
        
        # Simple fallback: 30 days from now (covers most monthly subscriptions)
        end_date = datetime.now() + timedelta(days=30)
        return end_date.strftime('%Y-%m-%d')
        
    except Exception as e:
        print(f"⚠️ Error calculating billing period, using 30-day fallback: {e}")
        return (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')


def release_all_devices_on_cancellation(customer_id: str, customer_data: Dict[str, Any]) -> None:
    """
    Release all devices when subscription is cancelled and log them with actual pincodes
    """
    try:
        dynamodb = boto3.resource('dynamodb')
        subscribers_table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
        
        devices = customer_data.get('devices', [])
        if not devices:
            print(f"📱 No devices to release for customer {customer_id}")
            return
        
        # Get activity logs
        activity_logs = customer_data.get('activity_logs', [])
        
        # Log each device release with actual pincode
        for device in devices:
            device_pincode = device.get('current_audio_pincode') or device.get('pincode') or 'N/A'
            device_mdm_pincode = device.get('current_mdm_pincode') or device.get('mdm_pincode') or None
            
            # Create log entry for device release
            log_description = f"released device with pin {device_pincode}"
            if device_mdm_pincode and device.get('type') == 'macOS':
                log_description += f" (MDM: {device_mdm_pincode})"
            
            new_log = {
                'id': f"log_{int(datetime.now().timestamp() * 1000)}_{len(activity_logs)}",
                'timestamp': datetime.now().isoformat(),
                'type': 'device_released',
                'title': f"Released device: {device.get('name', 'Unknown')}",
                'description': log_description,
                'device_id': device.get('id', ''),
                'device_name': device.get('name', 'Unknown'),
                'unlock_code': device_pincode,
                'mdm_code': device_mdm_pincode if device_mdm_pincode else None
            }
            activity_logs.insert(0, new_log)
            print(f"📝 Logged device release: {device.get('name')} with pin {device_pincode}")
        
        # Keep only last 100 logs
        activity_logs = activity_logs[:100]
        
        # Remove all devices and update activity logs
        subscribers_table.update_item(
            Key={'customer_id': customer_id},
            UpdateExpression='SET devices = :empty_devices, activity_logs = :activity_logs, last_updated = :timestamp',
            ExpressionAttributeValues={
                ':empty_devices': [],
                ':activity_logs': activity_logs,
                ':timestamp': datetime.now().isoformat()
            }
        )
        
        print(f"✅ Released {len(devices)} device(s) for customer {customer_id}")
        
    except Exception as e:
        print(f"❌ Error releasing devices: {e}")
        import traceback
        print(traceback.format_exc())


def schedule_subscription_cancellation(customer_id: str, customer_data: Dict[str, Any], cancel_reason: str = '', feedback: str = '', immediate: bool = False) -> Dict[str, Any]:
    """
    Unified cancellation logic for both dashboard cancellation and webhook cancellation
    
    Args:
        customer_id: Customer ID
        customer_data: Customer data from DynamoDB
        cancel_reason: Reason for cancellation (from user input)
        feedback: User feedback (from user input)
        immediate: If True, cancel immediately (for webhook). If False, schedule for end of billing period (for dashboard)
    """
    try:
        dynamodb = boto3.resource('dynamodb')
        subscribers_table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
        
        if immediate:
            # Immediate cancellation (from webhook) - user loses access now
            # Release all devices and log them with actual pincodes
            release_all_devices_on_cancellation(customer_id, customer_data)
            
            update_expression = 'SET subscription_status = :status, cancelled_at = :cancelled_at'
            expression_values = {
                ':status': 'cancelled',
                ':cancelled_at': datetime.now().isoformat()
            }
            
            # Add cancellation reason if provided
            if cancel_reason:
                update_expression += ', cancellation_reason = :reason'
                expression_values[':reason'] = cancel_reason
            if feedback:
                update_expression += ', cancellation_feedback = :feedback'
                expression_values[':feedback'] = feedback
                
            message = 'Subscription cancelled immediately'
            
        else:
            # Scheduled cancellation (from dashboard) - user keeps access until billing period ends
            cancellation_date = calculate_billing_period_end(customer_data)
            
            update_expression = 'SET subscription_status = :status, cancellation_reason = :reason, cancellation_feedback = :feedback, cancellation_requested_at = :requested_at, cancellation_date = :cancel_date'
            expression_values = {
                ':status': 'cancel_scheduled',
                ':reason': cancel_reason,
                ':feedback': feedback,
                ':requested_at': datetime.now().isoformat(),
                ':cancel_date': cancellation_date
            }
            
            message = f'Subscription will be cancelled at the end of your billing period ({cancellation_date}). You\'ll keep access until then.'
        
        # Update the customer record
        subscribers_table.update_item(
            Key={'customer_id': customer_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values
        )
        
        print(f"✅ {'Immediate' if immediate else 'Scheduled'} cancellation recorded for customer {customer_id}")
        
        return {
            'success': True,
            'message': message,
            'status': 'cancelled' if immediate else 'cancel_scheduled',
            'cancellation_date': None if immediate else cancellation_date
        }
        
    except Exception as e:
        print(f"❌ Error in schedule_subscription_cancellation: {e}")
        return {'success': False, 'error': str(e)}





def get_milestones(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Get milestone data for journey progress from stj_system table"""
    try:
        gender = payload.get('gender', 'male')
        include_all = payload.get('include_all', True)
        
        print(f"🎯 Fetching milestones for gender: {gender}, include_all: {include_all}")
        
        # Initialize DynamoDB
        dynamodb = boto3.resource('dynamodb', region_name='eu-north-1')
        table = dynamodb.Table('stj_system')
        
        # Query milestones from stj_system table
        try:
            # Get the milestone collection record using primary key (config_key)
            response = table.get_item(
                Key={'config_key': 'milestones'}
            )
            
            milestone_collection = response.get('Item')
            print(f"📊 Milestone collection: {'found' if milestone_collection else 'not found'}")
            
            if not milestone_collection:
                raise Exception("No milestone collection found in stj_system")
            milestone_data = milestone_collection.get('data', [])
            
            print(f"📊 Total milestones in collection: {len(milestone_data)}")
            
            # Filter by gender and convert DynamoDB items to proper format
            milestones = []
            for item in milestone_data:
                if str(item.get('gene', '')).lower() == gender.lower():
                    # Convert Decimal to int/float where needed
                    milestone = {
                        'gene': str(item.get('gene', gender)),
                        'level': int(item.get('level', 0)) if item.get('level') is not None else 0,
                        'days_range': str(item.get('days_range', '')),
                        'title': str(item.get('title', '')),
                        'emoji': str(item.get('emoji', '🎯')),
                        'description': str(item.get('description', '')),
                        'milestone_day': int(item.get('milestone_day', 0)) if item.get('milestone_day') is not None else 0,
                        'media_url': str(item.get('media_url', '')) if item.get('media_url') else '',
                        'next_level_title': str(item.get('next_level_title', '')) if item.get('next_level_title') else None,
                        'next_level_emoji': str(item.get('next_level_emoji', '')) if item.get('next_level_emoji') else None,
                        'days_to_next': int(item.get('days_to_next', 0)) if item.get('days_to_next') is not None else None,
                        'level_template': str(item.get('level_template', ''))
                    }
                    milestones.append(milestone)
            
            # Sort milestones by level
            milestones.sort(key=lambda x: x['level'])
            
            print(f"✅ Processed and sorted {len(milestones)} milestones for {gender}")
            print(f"📋 Milestone levels found: {[m['level'] for m in milestones]}")
            print(f"📋 Milestone titles: {[m['title'] for m in milestones]}")
            
            return json_resp({
                'success': True,
                'milestones': milestones,
                'count': len(milestones)
            })
            
        except Exception as db_error:
            print(f"❌ Database error fetching milestones: {db_error}")
            
            # Fallback to static data if database fails
            print("🔄 Falling back to static milestone data")
            fallback_milestones = [
                {
                    "gene": gender,
                    "level": 0,
                    "days_range": "0",
                    "title": "Ground Zero",
                    "emoji": "🪨",
                    "description": "Every journey starts from the ground. You've chosen to rise from where you stand.",
                    "milestone_day": 0,
                    "media_url": f"https://wati-files.s3.eu-north-1.amazonaws.com/Milestones/{gender}_level_0_groundzero.jpg",
                    "next_level_title": "Fighter",
                    "next_level_emoji": "🥊",
                    "days_to_next": 7,
                    "level_template": ""
                }
            ]
            
            return json_resp({
                'success': True,
                'milestones': fallback_milestones,
                'fallback': True
            })
        
    except Exception as e:
        print(f"❌ Error getting milestones: {e}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        return json_resp({'error': 'Failed to get milestones'}, 500)


def get_system_config(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Get system configuration data from stj_system table"""
    try:
        config_key = payload.get('config_key')
        
        if not config_key:
            return json_resp({'error': 'config_key is required'}, 400)
        
        print(f"🔍 Fetching system config for key: {config_key}")
        
        # Initialize DynamoDB
        dynamodb = boto3.resource('dynamodb', region_name='eu-north-1')
        table = dynamodb.Table('stj_system')
        
        # Get configuration using primary key (config_key)
        response = table.get_item(
            Key={'config_key': config_key}
        )
        
        config_record = response.get('Item')
        print(f"📊 Config record for key '{config_key}': {'found' if config_record else 'not found'}")
        
        if not config_record:
            return json_resp({
                'success': False,
                'error': f'Configuration not found for key: {config_key}'
            }, 404)
        
        # Get the configuration data from the record
        config_data = config_record.get('data', {})
        
        print(f"✅ Config retrieved for key: {config_key}")
        
        return json_resp({
            'success': True,
            'data': config_data
        })
        
    except Exception as e:
        print(f"❌ Error getting system config: {e}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        return json_resp({'error': 'Failed to get system configuration'}, 500)


def get_leaderboard(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Get leaderboard data showing top performers from stj_subscribers table"""
    try:
        page = int(payload.get('page', 1))
        page_size = int(payload.get('page_size', 10))
        gender_filter = payload.get('gender_filter')  # 'male', 'female', or None for all
        
        print(f"🏆 Fetching leaderboard: page={page}, page_size={page_size}, gender_filter={gender_filter}")
        
        # Initialize DynamoDB
        dynamodb = boto3.resource('dynamodb', region_name='eu-north-1')
        table = dynamodb.Table('stj_subscribers')
        
        try:
            # Get all active subscribers with devices using subscription-status-username-index GSI
            print("🔍 Querying active subscribers for leaderboard data...")
            
            # Build filter expression for additional filters
            filter_expression = "attribute_exists(devices)"
            expression_values = {':status': 'active'}
            
            # Gender filter if specified
            if gender_filter:
                filter_expression += " AND gender = :gender"
                expression_values[':gender'] = gender_filter
            
            # Query using subscription-status-username-index GSI
            response = table.query(
                IndexName='subscription-status-username-index',
                KeyConditionExpression='subscription_status = :status',
                FilterExpression=filter_expression,
                ExpressionAttributeValues=expression_values
            )
            
            subscribers = response.get('Items', [])
            
            # Continue querying if there are more items
            while 'LastEvaluatedKey' in response:
                response = table.query(
                    IndexName='subscription-status-username-index',
                    KeyConditionExpression='subscription_status = :status',
                    FilterExpression=filter_expression,
                    ExpressionAttributeValues=expression_values,
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )
                subscribers.extend(response.get('Items', []))
            
            print(f"📊 Found {len(subscribers)} active subscribers for leaderboard")
            
            # Get milestone data for level calculation using primary key
            milestone_table = dynamodb.Table('stj_system')
            milestone_response = milestone_table.get_item(
                Key={'config_key': 'milestones'}
            )
            milestone_record = milestone_response.get('Item')
            milestone_data = milestone_record.get('data', []) if milestone_record else []
            
            # Create milestone lookup by gender and level
            milestones_by_gender = {}
            for milestone in milestone_data:
                gender = str(milestone.get('gene', '')).lower()
                if gender not in milestones_by_gender:
                    milestones_by_gender[gender] = {}
                level = int(milestone.get('level', 0))
                milestones_by_gender[gender][level] = milestone
            
            print(f"📊 Loaded milestones for levels: {list(milestones_by_gender.keys())}")
            
            # Process subscribers and calculate progress
            leaderboard_entries = []
            for subscriber in subscribers:
                try:
                    # Get subscriber info
                    customer_id = str(subscriber.get('customer_id', ''))
                    commitment_data = subscriber.get('commitment_data', {})
                    devices = subscriber.get('devices', [])
                    
                    if not devices:
                        continue
                    
                    # Get the latest device for progress calculation
                    latest_device = max(devices, key=lambda d: d.get('added_at', ''))
                    
                    # Calculate days in focus
                    focus_start = latest_device.get('focus_start_date') or latest_device.get('added_at')
                    if focus_start:
                        from datetime import datetime
                        try:
                            if isinstance(focus_start, str):
                                start_date = datetime.fromisoformat(focus_start.replace('Z', '+00:00'))
                            else:
                                start_date = datetime.fromtimestamp(float(focus_start))
                            
                            days_in_focus = max(0, (datetime.now() - start_date).days)
                        except:
                            days_in_focus = 0
                    else:
                        days_in_focus = 0
                    
                    # Get gender for milestone lookup
                    gender = str(subscriber.get('gender', 'male')).lower()
                    gender_milestones = milestones_by_gender.get(gender, {})
                    
                    # Find current level based on days
                    current_level = None
                    for level in sorted(gender_milestones.keys(), reverse=True):
                        milestone = gender_milestones[level]
                        milestone_day = int(milestone.get('milestone_day', 0))
                        if days_in_focus >= milestone_day:
                            current_level = milestone
                            break
                    
                    if not current_level:
                        current_level = gender_milestones.get(0, {
                            'title': 'Beginner',
                            'emoji': '🎯',
                            'level': 0
                        })
                    
                    # Calculate progress percentage
                    current_milestone_day = int(current_level.get('milestone_day', 0))
                    days_to_next = current_level.get('days_to_next')
                    
                    if days_to_next:
                        days_from_current = days_in_focus - current_milestone_day
                        progress_percentage = min(100, int((days_from_current / int(days_to_next)) * 100))
                    else:
                        progress_percentage = 100  # Max level reached
                    
                    # Create leaderboard entry
                    entry = {
                        'customer_id': customer_id,
                        'name': subscriber.get('username', 'Anonymous'),
                        'gender': gender,
                        'country_code': subscriber.get('country', ''),
                        'days_in_focus': days_in_focus,
                        'current_level': {
                            'title': str(current_level.get('title', 'Beginner')),
                            'emoji': str(current_level.get('emoji', '🎯')),
                            'level': int(current_level.get('level', 0))
                        },
                        'progress_percentage': progress_percentage,
                        'devices_count': len(devices),
                        'join_date': subscriber.get('created_at', ''),
                        'score': days_in_focus * 10 + progress_percentage  # Scoring algorithm
                    }
                    
                    leaderboard_entries.append(entry)
                    
                except Exception as entry_error:
                    print(f"⚠️ Error processing subscriber {subscriber.get('customer_id')}: {entry_error}")
                    continue
            
            print(f"📊 Processed {len(leaderboard_entries)} leaderboard entries")
            
            # Sort by score (days in focus + progress percentage)
            leaderboard_entries.sort(key=lambda x: (-x['score'], -x['days_in_focus'], -x['progress_percentage']))
            
            # Apply pagination
            start_index = (page - 1) * page_size
            end_index = start_index + page_size
            paginated_entries = leaderboard_entries[start_index:end_index]
            
            # Add rank to each entry
            for i, entry in enumerate(paginated_entries):
                entry['rank'] = start_index + i + 1
            
            print(f"✅ Returning {len(paginated_entries)} leaderboard entries for page {page}")
            
            return json_resp({
                'success': True,
                'leaderboard': paginated_entries,
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total_entries': len(leaderboard_entries),
                    'has_more': end_index < len(leaderboard_entries)
                }
            })
            
        except Exception as db_error:
            print(f"❌ Database error fetching leaderboard: {db_error}")
            
            # Return mock leaderboard data as fallback
            mock_leaderboard = [
                {
                    'rank': 1,
                    'customer_id': 'demo_1',
                    'name': 'Journey Master',
                    'gender': 'male',
                    'country_code': 'US',
                    'days_in_focus': 365,
                    'current_level': {'title': 'King', 'emoji': '👑', 'level': 10},
                    'progress_percentage': 100,
                    'devices_count': 2,
                    'score': 3750
                },
                {
                    'rank': 2,
                    'customer_id': 'demo_2',
                    'name': 'Digital Warrior',
                    'gender': 'female',
                    'country_code': 'UK',
                    'days_in_focus': 203,
                    'current_level': {'title': 'Queen', 'emoji': '👑', 'level': 10},
                    'progress_percentage': 100,
                    'devices_count': 1,
                    'score': 2130
                }
            ]
            
            return json_resp({
                'success': True,
                'leaderboard': mock_leaderboard,
                'fallback': True
            })
        
    except Exception as e:
        print(f"❌ Error getting leaderboard: {e}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        return json_resp({'error': 'Failed to get leaderboard'}, 500)


def find_and_update_webapp_record(shopify_customer_id: str, customer_email: str, order_data: Dict[str, Any]) -> bool:
    """Find existing webapp record and update it with real Shopify customer ID"""
    try:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
        
        print(f"🔍 Looking for existing webapp record for email: {customer_email}")
        
        # Use email-index GSI for efficient lookup
        response = table.query(
            IndexName='email-index',
            KeyConditionExpression='email = :email',
            ExpressionAttributeValues={':email': customer_email}
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
        
        # Use email-index GSI for efficient lookup
        response = table.query(
            IndexName='email-index',
            KeyConditionExpression='email = :email',
            ExpressionAttributeValues={':email': customer_email}
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
# DEVICE MANAGEMENT
# =============================================================================

def add_device(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Add device to customer's device list in DynamoDB"""
    try:
        print(f"🔍 add_device called with payload keys: {list(payload.keys())}")
        customer_id = payload.get('customer_id')
        device_data = payload.get('device')
        
        print(f"🔍 customer_id: {customer_id}")
        print(f"🔍 device_data keys: {list(device_data.keys()) if device_data else 'None'}")
        
        if not customer_id or not device_data:
            return json_resp({'error': 'customer_id and device data required'}, 400)
        
        # Validate device data structure
        required_fields = ['id', 'name', 'type', 'icon', 'status']
        for field in required_fields:
            if field not in device_data:
                return json_resp({'error': f'Device missing required field: {field}'}, 400)
        
        # Add timestamps and metadata
        device_data['created_at'] = datetime.now().isoformat()
        device_data['last_updated'] = datetime.now().isoformat()
        
        # NEW TRACKING SYSTEM: Set current pincodes (lightweight tracking)
        if 'pincode' in device_data:
            device_data['current_audio_pincode'] = device_data['pincode']
        
        # For macOS devices, also set current_mdm_pincode
        if device_data.get('type') == 'macOS' and 'mdm_pincode' in device_data:
            device_data['current_mdm_pincode'] = device_data['mdm_pincode']
        
        # Lightweight generation tracking (only current generation numbers)
        device_data['pincode_generation'] = {
            'audio': 1,
            'mdm': 1 if device_data.get('type') == 'macOS' else 0
        }
        
        # Log device data size for debugging
        import sys
        device_size = sys.getsizeof(str(device_data))
        print(f"🔍 Device data size: {device_size} bytes")
        if device_size > 50000:
            print(f"⚠️ WARNING: Device data is large ({device_size} bytes)")
        
        # Connect to DynamoDB
        table_name = os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers')
        print(f"🔍 Using table: {table_name}")
        dynamodb = boto3.resource('dynamodb', region_name='eu-north-1')
        table = dynamodb.Table(table_name)
        
        # Get current customer record
        print(f"🔍 Getting customer record for: {customer_id}")
        response = table.get_item(Key={'customer_id': customer_id})
        print(f"🔍 DynamoDB response keys: {list(response.keys())}")
        
        if 'Item' not in response:
            print(f"❌ Customer not found: {customer_id}")
            return json_resp({'error': 'Customer not found'}, 404)
        
        customer = response['Item']
        current_devices = customer.get('devices', [])
        
        # Clean up existing devices to remove large fields
        print(f"🔍 Cleaning up {len(current_devices)} existing devices")
        for device in current_devices:
            # Remove large tracking objects if they exist
            if 'tracking' in device:
                del device['tracking']
            # Simplify pincode_generations to just generation numbers
            if 'pincode_generations' in device:
                old_gen = device['pincode_generations']
                device['pincode_generation'] = {
                    'audio': old_gen.get('audio', {}).get('current_generation', 1),
                    'mdm': old_gen.get('mdm', {}).get('current_generation', 0)
                }
                del device['pincode_generations']
        
        # Check device limit (max 3)
        if len(current_devices) >= 3:
            return json_resp({'error': 'Maximum 3 devices allowed'}, 400)
        
        # Check for duplicate device IDs
        if any(d.get('id') == device_data['id'] for d in current_devices):
            return json_resp({'error': 'Device ID already exists'}, 409)
        
        # Add device to list
        current_devices.append(device_data)
        
        # Check total size before updating
        import sys
        total_size = sys.getsizeof(str(current_devices))
        print(f"🔍 Total devices size: {total_size} bytes")
        if total_size > 350000:  # DynamoDB limit is 400KB, leave some buffer
            print(f"❌ Total devices size ({total_size} bytes) exceeds safe limit")
            return json_resp({'error': f'Device data too large. Total size: {total_size} bytes. Consider removing old devices or reducing metadata.'}, 400)
        
        # Add activity log for device addition
        activity_logs = customer.get('activity_logs', [])
        device_pincode = device_data.get('pincode') or device_data.get('current_audio_pincode')
        masked_pincode = '****' if device_pincode else 'N/A'
        
        new_log = {
            'id': f"log_{int(datetime.now().timestamp() * 1000)}",
            'timestamp': datetime.now().isoformat(),
            'type': 'device_added',
            'title': f"Added device: {device_data['name']}",
            'description': f"add device with pin {masked_pincode}",
            'device_id': device_data['id'],
            'device_name': device_data['name']
        }
        activity_logs.insert(0, new_log)  # Add to beginning
        # Keep only last 100 logs to prevent DynamoDB size issues
        activity_logs = activity_logs[:100]
        
        # Update customer record
        print(f"🔍 Updating customer record with {len(current_devices)} devices")
        table.update_item(
            Key={'customer_id': customer_id},
            UpdateExpression='SET devices = :devices, activity_logs = :activity_logs, last_updated = :timestamp',
            ExpressionAttributeValues={
                ':devices': current_devices,
                ':activity_logs': activity_logs,
                ':timestamp': datetime.now().isoformat()
            }
        )
        
        print(f"✅ Device added successfully: {device_data['name']} for customer {customer_id}")
        
        return json_resp({
            'success': True,
            'device': device_data,
            'total_devices': len(current_devices),
            'message': f"Device '{device_data['name']}' added successfully"
        })
        
    except Exception as e:
        print(f"❌ Error adding device: {e}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        return json_resp({'error': f'Failed to add device: {str(e)}'}, 500)


def get_devices(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Get all devices for a customer from DynamoDB"""
    try:
        customer_id = payload.get('customer_id')
        
        if not customer_id:
            return json_resp({'error': 'customer_id required'}, 400)
        
        # Connect to DynamoDB
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
        
        # Get customer record
        response = table.get_item(Key={'customer_id': customer_id})
        
        if 'Item' not in response:
            return json_resp({'error': 'Customer not found'}, 404)
        
        customer = response['Item']
        devices = customer.get('devices', [])
        
        print(f"✅ Retrieved {len(devices)} devices for customer {customer_id}")
        
        return json_resp({
            'success': True,
            'devices': devices,
            'total_devices': len(devices),
            'max_devices': 3
        })
        
    except Exception as e:
        print(f"❌ Error getting devices: {e}")
        return json_resp({'error': 'Failed to get devices'}, 500)


def unlock_device(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Unlock a specific device and update its status in DynamoDB"""
    try:
        customer_id = payload.get('customer_id')
        device_id = payload.get('device_id')
        unlock_duration = payload.get('unlock_duration', 30)  # Default 30 minutes
        
        if not customer_id or not device_id:
            return json_resp({'error': 'customer_id and device_id required'}, 400)
        
        # Connect to DynamoDB
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
        
        # Get current customer record
        response = table.get_item(Key={'customer_id': customer_id})
        
        if 'Item' not in response:
            return json_resp({'error': 'Customer not found'}, 404)
        
        customer = response['Item']
        devices = customer.get('devices', [])
        
        # Find and update the specific device
        device_found = False
        unlocked_device = None
        for device in devices:
            if device.get('id') == device_id:
                device_found = True
                unlocked_device = device
                # Update device status and unlock info
                device['status'] = 'unlocked'
                device['unlocked_at'] = datetime.now().isoformat()
                device['unlock_expires_at'] = (datetime.now() + timedelta(minutes=unlock_duration)).isoformat()
                device['unlock_duration_minutes'] = unlock_duration
                device['last_updated'] = datetime.now().isoformat()
                break
        
        if not device_found:
            return json_resp({'error': 'Device not found'}, 404)
        
        # Get unlock code (pincode) from device
        unlock_code = unlocked_device.get('current_audio_pincode') or unlocked_device.get('pincode') or 'N/A'
        
        # Add activity log for device unlock
        activity_logs = customer.get('activity_logs', [])
        new_log = {
            'id': f"log_{int(datetime.now().timestamp() * 1000)}",
            'timestamp': datetime.now().isoformat(),
            'type': 'device_unlocked',
            'title': f"Unlocked device: {unlocked_device.get('name', 'Unknown')}",
            'description': f"unlocked device to {unlock_code}",
            'device_id': device_id,
            'device_name': unlocked_device.get('name', 'Unknown'),
            'unlock_code': unlock_code
        }
        activity_logs.insert(0, new_log)  # Add to beginning
        # Keep only last 100 logs to prevent DynamoDB size issues
        activity_logs = activity_logs[:100]
        
        # Update customer record with modified devices and activity logs
        table.update_item(
            Key={'customer_id': customer_id},
            UpdateExpression='SET devices = :devices, activity_logs = :activity_logs, last_updated = :timestamp',
            ExpressionAttributeValues={
                ':devices': devices,
                ':activity_logs': activity_logs,
                ':timestamp': datetime.now().isoformat()
            }
        )
        
        print(f"✅ Device unlocked: {device_id} for customer {customer_id} (duration: {unlock_duration} min)")
        
        return json_resp({
            'success': True,
            'device_id': device_id,
            'status': 'unlocked',
            'unlock_duration_minutes': unlock_duration,
            'unlocked_at': unlocked_device['unlocked_at'],
            'unlock_expires_at': unlocked_device['unlock_expires_at'],
            'message': f"Device unlocked for {unlock_duration} minutes"
        })
        
    except Exception as e:
        print(f"❌ Error unlocking device: {e}")
        return json_resp({'error': 'Failed to unlock device'}, 500)


def update_device(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Update an existing device in customer's device list"""
    try:
        customer_id = payload.get('customer_id')
        device_id = payload.get('device_id')
        updates = payload.get('updates', {})
        
        if not customer_id or not device_id:
            return json_resp({'error': 'customer_id and device_id required'}, 400)
        
        print(f"🔄 Updating device {device_id} with updates: {list(updates.keys())}")
        
        # Connect to DynamoDB
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
        
        # Get current customer record
        response = table.get_item(Key={'customer_id': customer_id})
        
        if 'Item' not in response:
            return json_resp({'error': 'Customer not found'}, 404)
        
        customer = response['Item']
        devices = customer.get('devices', [])
        
        # Find and update the device
        device_found = False
        for device in devices:
            if device.get('id') == device_id:
                device_found = True
                # Update device fields
                for key, value in updates.items():
                    device[key] = value
                
                # Update current_audio_pincode if pincode is provided
                if 'pincode' in updates:
                    device['current_audio_pincode'] = updates['pincode']
                
                # Update current_mdm_pincode if mdm_pincode is provided
                if 'mdm_pincode' in updates:
                    device['current_mdm_pincode'] = updates['mdm_pincode']
                
                # Always update last_updated timestamp
                device['last_updated'] = datetime.now().isoformat()
                break
        
        if not device_found:
            return json_resp({'error': 'Device not found'}, 404)
        
        # Update customer record in DynamoDB
        table.update_item(
            Key={'customer_id': customer_id},
            UpdateExpression='SET devices = :devices, last_updated = :timestamp',
            ExpressionAttributeValues={
                ':devices': devices,
                ':timestamp': datetime.now().isoformat()
            }
        )
        
        print(f"✅ Device updated: {device_id} for customer {customer_id}")
        
        return json_resp({
            'success': True,
            'device_id': device_id,
            'message': 'Device updated successfully'
        })
        
    except Exception as e:
        print(f"❌ Error updating device: {e}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        return json_resp({'error': f'Failed to update device: {str(e)}'}, 500)


def remove_device(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Remove a device from customer's device list"""
    try:
        customer_id = payload.get('customer_id')
        device_id = payload.get('device_id')
        
        if not customer_id or not device_id:
            return json_resp({'error': 'customer_id and device_id required'}, 400)
        
        # Connect to DynamoDB
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
        
        # Get current customer record
        response = table.get_item(Key={'customer_id': customer_id})
        
        if 'Item' not in response:
            return json_resp({'error': 'Customer not found'}, 404)
        
        customer = response['Item']
        devices = customer.get('devices', [])
        
        # Remove the device
        original_count = len(devices)
        devices = [d for d in devices if d.get('id') != device_id]
        
        if len(devices) == original_count:
            return json_resp({'error': 'Device not found'}, 404)
        
        # Update customer record
        table.update_item(
            Key={'customer_id': customer_id},
            UpdateExpression='SET devices = :devices, last_updated = :timestamp',
            ExpressionAttributeValues={
                ':devices': devices,
                ':timestamp': datetime.now().isoformat()
            }
        )
        
        print(f"✅ Device removed: {device_id} for customer {customer_id}")
        
        return json_resp({
            'success': True,
            'device_id': device_id,
            'remaining_devices': len(devices),
            'message': 'Device removed successfully'
        })
        
    except Exception as e:
        print(f"❌ Error removing device: {e}")
        return json_resp({'error': 'Failed to remove device'}, 500)


def validate_surrender(form_data) -> Dict[str, Any]:
    """Validate surrender audio using speech-to-text and ChatGPT analysis"""
    try:
        print("🎙️ Processing surrender validation request")
        
        # Extract form data
        audio_file = form_data.get('audio')
        user_id = form_data.get('user_id', 'anonymous')
        device_id = form_data.get('device_id', 'unknown')
        surrender_text = form_data.get('surrender_text', '')
        
        if not audio_file:
            return json_resp({'error': 'Audio file is required'}, 400)
        
        if not surrender_text:
            return json_resp({'error': 'Surrender text is required'}, 400)
        
        print(f"📝 Processing surrender for user {user_id}, device {device_id}")
        print(f"📜 Expected surrender text: {surrender_text[:100]}...")
        
        # Get OpenAI API key
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            try:
                import boto3
                secrets_client = boto3.client('secretsmanager')
                response = secrets_client.get_secret_value(SecretId='CHATGPT_API_KEY')
                secret_data = json.loads(response['SecretString'])
                api_key = secret_data.get('CHATGPT_API_KEY')
            except Exception:
                api_key = os.environ.get('OPENAI_SECRET_KEY')
        
        if not api_key:
            return json_resp({'error': 'OpenAI API key not configured'}, 500)
        
        # Step 1: Transcribe audio using OpenAI Whisper
        print("🎤 Transcribing audio with Whisper...")
        
        headers = {'Authorization': f'Bearer {api_key}'}
        
        # Prepare audio file for transcription
        files = {
            'file': ('surrender.webm', audio_file, 'audio/webm'),
            'model': (None, 'whisper-1'),
            'response_format': (None, 'json'),
            'language': (None, 'en')
        }
        
        transcription_response = requests.post(
            'https://api.openai.com/v1/audio/transcriptions',
            headers=headers,
            files=files
        )
        
        if not transcription_response.ok:
            error_msg = transcription_response.text
            status_code = transcription_response.status_code
            print(f"❌ Transcription failed (HTTP {status_code}): {error_msg}")
            
            # More specific error handling for transcription
            if status_code == 401:
                return json_resp({'error': 'OpenAI API authentication failed'}, 500)
            elif status_code == 400:
                return json_resp({'error': 'Audio file format not supported or corrupted'}, 500)
            else:
                return json_resp({'error': f'Transcription error: {error_msg[:200]}'}, 500)
        
        transcription_result = transcription_response.json()
        user_transcript = transcription_result.get('text', '').strip()
        
        print(f"📝 Transcript: {user_transcript[:100]}...")
        
        if not user_transcript:
            return json_resp({
                'success': False,
                'has_surrendered': False,
                'feedback': 'No speech detected in the audio. Please record yourself speaking the surrender text clearly.'
            })
        
        # Step 2: Validate surrender using ChatGPT
        print("🤖 Validating surrender with ChatGPT...")
        
        validation_prompt = f"""User audio transcript:
{user_transcript}

Commitment surrender text:
{surrender_text}

🧭 Goal
Evaluate whether the participant has spoken aloud a version of the "commitment surrender text" that matches its emotional meaning and overall intent.

🎯 Context
You receive two inputs:
- user_transcript: what the participant actually said out loud.
- commitment_surrender_text: the official surrender message.

✅ Instructions

First, check that the participant actually spoke the surrender text or something substantially similar.
The user_transcript must not be empty, irrelevant, or a placeholder.
It should include a sincere spoken attempt at surrender — not a random sentence or partial effort.

Then, compare the transcript to the commitment surrender text.
Accept synonyms, paraphrasing, or reordered sentences.
The transcript should match the core meaning and emotional weight of the original.
Do not require exact words — instead, assess semantic similarity and emotional presence.
Accept if the spoken text clearly aligns in meaning and tone with the written commitment.

🧾 Output Format

Please respond in JSON format with the following structure:

✅ If user has surrendered:
{{
  "has_surrendered": true,
  "feedback": "You spoke it with weight. That matters. The surrender was real — and now, a new chapter begins. Choose what comes next with clarity."
}}

❌ If user has not surrendered:
{{
  "has_surrendered": false,
  "feedback": "Your voice message didn't reflect the surrender text. You must read it out loud — not casually, but with presence. Try again and let the words land fully as your own."
}}"""
        
        validation_headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        validation_data = {
            "model": "gpt-4o",
            "messages": [{"role": "user", "content": validation_prompt}],
            "max_tokens": 300,
            "temperature": 0.4,
            "response_format": {"type": "json_object"}
        }
        
        validation_response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers=validation_headers,
            json=validation_data
        )
        
        if not validation_response.ok:
            error_msg = validation_response.text
            status_code = validation_response.status_code
            print(f"❌ ChatGPT validation failed (HTTP {status_code}): {error_msg}")
            
            # Log the request data for debugging
            print(f"🔍 Request model: {validation_data['model']}")
            print(f"🔍 Request prompt length: {len(validation_prompt)} characters")
            print(f"🔍 Request max_tokens: {validation_data['max_tokens']}")
            
            # More specific error handling
            if status_code == 401:
                return json_resp({'error': 'OpenAI API authentication failed'}, 500)
            elif status_code == 429:
                return json_resp({'error': 'OpenAI API rate limit exceeded. Please try again later.'}, 500)
            elif status_code == 400:
                # Try to extract specific error from response
                try:
                    error_data = json.loads(error_msg)
                    specific_error = error_data.get('error', {}).get('message', 'Unknown error')
                    print(f"🔍 OpenAI 400 error details: {specific_error}")
                    return json_resp({'error': f'OpenAI validation error: {specific_error}'}, 500)
                except:
                    return json_resp({'error': 'Invalid request to OpenAI API'}, 500)
            else:
                return json_resp({'error': f'OpenAI API error: {error_msg[:200]}'}, 500)
        
        validation_result = validation_response.json()
        content = validation_result['choices'][0]['message']['content']
        
        try:
            surrender_evaluation = json.loads(content)
        except json.JSONDecodeError:
            print(f"❌ Invalid JSON response from ChatGPT: {content}")
            return json_resp({'error': 'Invalid response from validation service'}, 500)
        
        has_surrendered = surrender_evaluation.get('has_surrendered', False)
        feedback = surrender_evaluation.get('feedback', 'Validation completed')
        
        print(f"✅ Validation complete: surrendered={has_surrendered}")
        
        # Step 3: Generate unlock pincode if surrender is approved
        pincode = None
        if has_surrendered:
            pincode = str(random.randint(1000, 9999))
            print(f"🔑 Generated unlock pincode: {pincode}")
        
        return json_resp({
            'success': True,
            'has_surrendered': has_surrendered,
            'feedback': feedback,
            'pincode': pincode,
            'transcript': user_transcript  # For debugging
        })
        
    except Exception as e:
        print(f"❌ Error in validate_surrender: {e}")
        return json_resp({'error': 'Failed to validate surrender'}, 500)


def store_pincode(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Store pincode in stj_password table with backup URLs"""
    try:
        print(f"🔧 Storing pincode with payload: {payload}")
        
        # Extract required fields
        pincode = payload.get('pincode')
        uuid = payload.get('uuid') 
        device_type = payload.get('device_type')
        device_name = payload.get('device_name')
        customer_id = payload.get('customer_id')
        purpose = payload.get('purpose', 'device_setup')
        audio_url = payload.get('audio_url', '')
        profile_url = payload.get('profile_url', '')
        
        if not all([pincode, uuid, device_type, customer_id]):
            return json_resp({'error': 'Missing required fields: pincode, uuid, device_type, customer_id'}, 400)
        
        # Store in DynamoDB
        dynamodb = boto3.resource('dynamodb', region_name='eu-north-1')
        table = dynamodb.Table('stj_password')
        
        item_data = {
            'uuid': uuid,
            'pincode': pincode,
            'device_type': device_type,
            'device_name': device_name or '',
            'customer_id': str(customer_id),
            'purpose': purpose,
            'created_at': int(time.time()),
            'status': 'active'
        }
        
        # Add S3 URLs if provided
        if audio_url:
            item_data['audio_url'] = audio_url
        if profile_url:
            item_data['profile_url'] = profile_url
        
        table.put_item(Item=item_data)
        
        print(f"✅ Pincode stored successfully: {uuid}")
        return json_resp({'success': True, 'uuid': uuid})
        
    except Exception as e:
        print(f"❌ Error storing pincode: {str(e)}")
        return json_resp({'error': 'Failed to store pincode'}, 500)


def store_pincode_with_tracking(
    customer_id: str,
    device_id: str,
    pincode: str,
    purpose: str,  # 'audio_guide' | 'vpn_profile' | 'vpn_removal'
    device_type: str,
    device_name: str,
    audio_url: str = None,
    profile_url: str = None
) -> Dict[str, Any]:
    """
    Store pincode in stj_password with full tracking and superseding logic.
    Returns: {'success': bool, 'uuid': str, 'generation': int}
    """
    try:
        dynamodb = boto3.resource('dynamodb', region_name='eu-north-1')
        password_table = dynamodb.Table('stj_password')
        
        # 1. Find previous active pincode for this device+purpose to supersede it
        generation_number = 1
        superseded_uuid = None
        
        try:
            # Use customer-device-index GSI for efficient lookup
            response = password_table.query(
                IndexName='customer-device-index',
                KeyConditionExpression='customer_id = :cid AND device_id = :did',
                FilterExpression='purpose = :purpose AND #status = :active',
                ExpressionAttributeNames={
                    '#status': 'status'
                },
                ExpressionAttributeValues={
                    ':cid': str(customer_id),
                    ':did': device_id,
                    ':purpose': purpose,
                    ':active': 'active'
                }
            )
            
            active_records = response.get('Items', [])
            if active_records:
                # Sort by generation_number to find the latest
                active_records.sort(key=lambda x: x.get('generation_number', 0), reverse=True)
                latest_record = active_records[0]
                superseded_uuid = latest_record['uuid']
                generation_number = latest_record.get('generation_number', 1) + 1
                
                print(f"📝 Found active pincode to supersede: {superseded_uuid} (gen {latest_record.get('generation_number', 1)})")
                
        except Exception as e:
            print(f"⚠️ Could not check for existing active pincodes: {e}")
        
        # 2. Generate new UUID for this pincode record
        new_uuid = str(uuid.uuid4())
        
        # 3. Store new pincode record as 'active'
        item_data = {
            'uuid': new_uuid,
            'customer_id': str(customer_id),
            'device_id': device_id,
            'pincode': pincode,
            'purpose': purpose,
            'generation_number': generation_number,
            'status': 'active',
            'device_type': device_type,
            'device_name': device_name or '',
            'created_at': int(time.time())
        }
        
        # Add URLs if provided
        if audio_url:
            item_data['audio_url'] = audio_url
        if profile_url:
            item_data['profile_url'] = profile_url
        
        password_table.put_item(Item=item_data)
        print(f"✅ Stored new pincode: {new_uuid} (gen {generation_number}, purpose: {purpose})")
        
        # 4. Mark previous record as 'superseded' if it exists
        if superseded_uuid:
            try:
                password_table.update_item(
                    Key={'uuid': superseded_uuid},
                    UpdateExpression='SET #status = :superseded, superseded_at = :now, superseded_by = :new_uuid',
                    ExpressionAttributeNames={
                        '#status': 'status'
                    },
                    ExpressionAttributeValues={
                        ':superseded': 'superseded',
                        ':now': int(time.time()),
                        ':new_uuid': new_uuid
                    }
                )
                print(f"✅ Marked old pincode as superseded: {superseded_uuid}")
            except Exception as e:
                print(f"⚠️ Could not mark old pincode as superseded: {e}")
        
        return {
            'success': True,
            'uuid': new_uuid,
            'generation': generation_number,
            'superseded_previous': superseded_uuid is not None
        }
        
    except Exception as e:
        print(f"❌ Error in store_pincode_with_tracking: {e}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        return {
            'success': False,
            'error': str(e)
        }


def get_device_pincode_history(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Get full pincode history for a device from stj_password table"""
    try:
        customer_id = payload.get('customer_id')
        device_id = payload.get('device_id')
        
        if not all([customer_id, device_id]):
            return json_resp({'error': 'Missing required fields: customer_id, device_id'}, 400)
        
        dynamodb = boto3.resource('dynamodb', region_name='eu-north-1')
        password_table = dynamodb.Table('stj_password')
        
        # Use customer-device-index GSI for efficient lookup
        response = password_table.query(
            IndexName='customer-device-index',
            KeyConditionExpression='customer_id = :cid AND device_id = :did',
            ExpressionAttributeValues={
                ':cid': str(customer_id),
                ':did': device_id
            }
        )
        
        records = response.get('Items', [])
        
        # Sort by created_at (most recent first)
        records.sort(key=lambda x: x.get('created_at', 0), reverse=True)
        
        # Group by purpose
        grouped_history = {
            'audio_guide': [],
            'vpn_removal': [],
            'vpn_profile': []
        }
        
        for record in records:
            purpose = record.get('purpose', 'unknown')
            history_item = {
                'uuid': record.get('uuid'),
                'pincode': record.get('pincode'),
                'generation': record.get('generation_number', 1),
                'status': record.get('status', 'unknown'),
                'created_at': record.get('created_at'),
                'superseded_at': record.get('superseded_at'),
                'superseded_by': record.get('superseded_by'),
                'audio_url': record.get('audio_url'),
                'profile_url': record.get('profile_url')
            }
            
            if purpose in grouped_history:
                grouped_history[purpose].append(history_item)
            else:
                if 'other' not in grouped_history:
                    grouped_history['other'] = []
                grouped_history['other'].append(history_item)
        
        print(f"✅ Retrieved {len(records)} pincode records for device {device_id}")
        
        return json_resp({
            'success': True,
            'device_id': device_id,
            'total_records': len(records),
            'history': grouped_history
        })
        
    except Exception as e:
        print(f"❌ Error getting device pincode history: {e}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        return json_resp({'error': 'Failed to get pincode history'}, 500)


def regenerate_audio_guide(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Regenerate audio guide with new pincode for existing device"""
    try:
        print(f"🔄 Regenerating audio guide with payload: {payload}")
        
        customer_id = payload.get('customer_id')
        device_id = payload.get('device_id')
        device_type = payload.get('device_type')
        device_name = payload.get('device_name')
        
        if not all([customer_id, device_id, device_type]):
            return json_resp({'error': 'Missing required fields: customer_id, device_id, device_type'}, 400)
        
        # Generate new 4-digit pincode
        import secrets
        new_pincode = str(secrets.randbelow(9000) + 1000)
        print(f"🆕 Generated new pincode: {new_pincode}")
        
        # Call generate_audio_guide with new pincode
        audio_payload = {
            'pincode': new_pincode,
            'device_type': device_type,
            'device_name': device_name,
            'customer_id': customer_id,
            'device_id': device_id
        }
        
        audio_result = generate_audio_guide(audio_payload)
        audio_response = json.loads(audio_result['body'])
        
        if not audio_response.get('success'):
            return audio_result  # Return error from generate_audio_guide
        
        # Update device's current_audio_pincode in DynamoDB
        try:
            dynamodb = boto3.resource('dynamodb')
            subscribers_table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
            
            # Get customer's devices
            response = subscribers_table.get_item(Key={'customer_id': customer_id})
            if 'Item' not in response:
                return json_resp({'error': 'Customer not found'}, 404)
            
            customer = response['Item']
            devices = customer.get('devices', [])
            
            # Find and update the device
            device_found = False
            for device in devices:
                if device.get('id') == device_id:
                    device_found = True
                    # Update current pincode
                    device['current_audio_pincode'] = new_pincode
                    device['last_updated'] = datetime.now().isoformat()
                    
                    # Update pincode_generations history
                    if 'pincode_generations' not in device:
                        device['pincode_generations'] = {}
                    
                    if 'audio' not in device['pincode_generations']:
                        device['pincode_generations']['audio'] = {
                            'current_generation': 1,
                            'history': []
                        }
                    
                    # Increment generation and add to history
                    current_gen = device['pincode_generations']['audio'].get('current_generation', 0) + 1
                    device['pincode_generations']['audio']['current_generation'] = current_gen
                    device['pincode_generations']['audio']['history'].append({
                        'gen': current_gen,
                        'uuid': audio_response.get('tracking', {}).get('uuid', f"regen_{int(time.time())}"),
                        'created_at': datetime.now().isoformat(),
                        'pincode': new_pincode
                    })
                    
                    print(f"✅ Updated device {device_id} with new audio pincode (gen {current_gen})")
                    break
            
            if not device_found:
                return json_resp({'error': 'Device not found'}, 404)
            
            # Save updated devices back to DynamoDB
            subscribers_table.update_item(
                Key={'customer_id': customer_id},
                UpdateExpression='SET devices = :devices, last_updated = :timestamp',
                ExpressionAttributeValues={
                    ':devices': devices,
                    ':timestamp': datetime.now().isoformat()
                }
            )
            
            print(f"✅ Device updated in DynamoDB with new audio pincode")
            
        except Exception as e:
            print(f"❌ Error updating device with new pincode: {e}")
            # Still return success from audio generation even if device update fails
        
        # Return the audio generation result with regeneration flag
        audio_response['regenerated'] = True
        return json_resp(audio_response)
        
    except Exception as e:
        print(f"❌ Error regenerating audio guide: {e}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        return json_resp({'error': 'Failed to regenerate audio guide'}, 500)


def generate_audio_guide(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Generate audio guide for device setup"""
    try:
        print(f"🔧 Generating audio guide with payload: {payload}")
        
        # Extract required fields
        pincode = payload.get('pincode')
        device_type = payload.get('device_type')
        device_name = payload.get('device_name')
        customer_id = payload.get('customer_id')
        device_id = payload.get('device_id')  # Important for tracking
        
        if not all([pincode, device_type, customer_id]):
            return json_resp({'error': 'Missing required fields: pincode, device_type, customer_id'}, 400)
        
        if not device_id:
            print(f"⚠️ No device_id provided, generating temporary one")
            device_id = f"temp_device_{int(time.time())}"
        
        # Split pincode into individual digits for frontend
        if len(pincode) != 4 or not pincode.isdigit():
            return json_resp({'error': 'Invalid pincode format - must be 4 digits'}, 400)
        
        first, second, third, fourth = pincode[0], pincode[1], pincode[2], pincode[3]
        
        # Generate actual TTS audio using integrated Polly functionality
        try:
            print(f"🔊 Generating TTS audio for pincode: {pincode}")
            
            # Initialize Polly client
            polly_client = boto3.client('polly', region_name='eu-north-1')
            s3_client = boto3.client('s3', region_name='eu-north-1')
            
            # S3 configuration for audio storage
            S3_BUCKET = 'wati-audio-guides'
            
            # Generate SSML content for pincode instructions - matches your n8n workflow exactly
            def generate_pincode_ssml(pincode_digits):
                first, second, third, fourth = pincode_digits
                sleep = 2
                
                # Helper function to generate instruction script (matching your n8n code)
                def generate_instruction_script(digits):
                    d1, d2, d3, d4 = digits
                    return f"""Press 1 <break time="{sleep}s"/>
Press 9 <break time="{sleep}s"/>
Press backspace <break time="{sleep}s"/>
Press backspace <break time="{sleep}s"/>
Press {d1} <break time="{sleep}s"/>
Press 4 <break time="{sleep}s"/>
Press 6 <break time="{sleep}s"/>
Press backspace <break time="{sleep}s"/>
Press backspace <break time="{sleep}s"/>
Press {d2} <break time="{sleep}s"/>
Press 7 <break time="{sleep}s"/>
Press backspace <break time="{sleep}s"/>
Press 7 <break time="{sleep}s"/>
Press backspace <break time="{sleep}s"/>
Press 3 <break time="{sleep}s"/>
Press backspace <break time="{sleep}s"/>
Press 6 <break time="{sleep}s"/>
Press backspace <break time="{sleep}s"/>
Press {d3} <break time="{sleep}s"/>
Press {d4} <break time="{sleep}s"/>"""

                # Generate instruction script (matching your n8n workflow)
                instruction_script = generate_instruction_script([first, second, third, fourth])

                # Warning tags (matching your n8n workflow)
                warning_tags = """DO NOT LOG OUT FROM ICLOUD
<break time="2s"/>
I REPEAT, DON'T LOG OUT FROM ICLOUD
<break time="2s"/>
See the instruction video for how to move around logging in with iCloud."""

                # Break tags (matching your n8n workflow)
                break_tags = """Now we are gonna do it again
<break time="2s"/>"""

                # Full SSML speech text (matching your n8n workflow exactly)
                speech_text = f"""<speak>
Get ready to insert your screen time pincode
<break time="2s"/>
Click settings <break time="2s"/>
Click screen time <break time="2s"/>
Click Lock Screen Time settings <break time="2s"/>
Are you ready? Here we go <break time="2s"/>
{instruction_script}
{break_tags}
{instruction_script}
{warning_tags}
</speak>"""

                return speech_text
            
            # Generate SSML content
            pincode_digits = list(pincode)
            ssml_content = generate_pincode_ssml(pincode_digits)
            
            print(f"🔊 Generated SSML for pincode {pincode} using n8n workflow algorithm")
            print(f"🔊 SSML content preview: {ssml_content[:200]}...")  # First 200 chars for debugging
            print(f"🔊 Pincode digits: {first}, {second}, {third}, {fourth}")
            
            print(f"🔊 Generating audio using Polly with SSML (n8n workflow format)...")
            
            # Generate audio using Polly with your n8n SSML
            polly_response = polly_client.synthesize_speech(
                Text=ssml_content,
                OutputFormat='mp3',
                VoiceId='Matthew',  # Deep male US English voice
                TextType='ssml',  # Use SSML for detailed instructions
                SampleRate='22050'
            )
            
            print(f"✅ Polly synthesis successful, AudioStream available: {polly_response.get('AudioStream') is not None}")
            
            # Get audio stream
            audio_stream = polly_response['AudioStream'].read()
            
            # Generate S3 filename
            audio_uuid = str(uuid.uuid4())
            filename = f"audio-guide-{customer_id}-{audio_uuid}.mp3"
            s3_key = f"pincode-guides/{filename}"
            
            print(f"📤 Uploading audio to S3: {s3_key}")
            print(f"📤 Audio stream size: {len(audio_stream)} bytes")
            
            # Upload to S3
            try:
                # Try without ACL first (modern S3 buckets often block ACLs)
                try:
                    s3_response = s3_client.put_object(
                        Bucket=S3_BUCKET,
                        Key=s3_key,
                        Body=audio_stream,
                        ContentType='audio/mpeg'
                        # ACL removed - use bucket policy for public access instead
                    )
                    print(f"✅ S3 upload successful (without ACL): {s3_response}")
                except Exception as acl_error:
                    # If ACL error, try with ACL anyway (for older buckets)
                    if 'AccessControlListNotSupported' in str(acl_error) or 'InvalidArgument' in str(acl_error):
                        print(f"⚠️ ACL not supported, trying without ACL...")
                        s3_response = s3_client.put_object(
                            Bucket=S3_BUCKET,
                            Key=s3_key,
                            Body=audio_stream,
                            ContentType='audio/mpeg'
                        )
                        print(f"✅ S3 upload successful (retry without ACL): {s3_response}")
                    else:
                        raise acl_error
                
                # Generate public URL (bucket policy should allow public read)
                audio_url = f"https://{S3_BUCKET}.s3.eu-north-1.amazonaws.com/{s3_key}"
                execution_id = f"audio_{customer_id}_{int(time.time())}"
                
                print(f"✅ TTS audio generated successfully: {audio_url}")
                
            except Exception as s3_error:
                import traceback
                error_trace = traceback.format_exc()
                print(f"❌ S3 upload failed: {str(s3_error)}")
                print(f"❌ Full error traceback: {error_trace}")
                # DO NOT use base64 fallback - it's too large for DynamoDB (can be 2-5MB!)
                # Instead, fail gracefully and return error
                audio_url = None
                execution_id = f"audio_s3_failed_{customer_id}_{int(time.time())}"
                print(f"❌ S3 upload failed, audio_url set to None to prevent DynamoDB size issues")
            
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"❌ Error generating TTS audio: {str(e)}")
            print(f"❌ Full error traceback: {error_details}")
            audio_url = None
            execution_id = f"error_audio_{customer_id}_{int(time.time())}"
        
        # Store pincode and audio URL using new tracking system
        tracking_result = None
        if audio_url:
            tracking_result = store_pincode_with_tracking(
                customer_id=customer_id,
                device_id=device_id,
                pincode=pincode,
                purpose='audio_guide',
                device_type=device_type,
                device_name=device_name or '',
                audio_url=audio_url
            )
            if tracking_result.get('success'):
                print(f"✅ Audio pincode stored with tracking: {tracking_result.get('uuid')} (gen {tracking_result.get('generation')})")
            else:
                print(f"❌ Failed to store audio pincode with tracking: {tracking_result.get('error')}")
        
        # Return response format that matches frontend expectations
        response_data = {
            'success': True,
            'pincode': pincode,
            'digits': {
                'first': first,
                'second': second,
                'third': third,
                'fourth': fourth
            },
            'tts_result': {
                'public_url': audio_url  # Real audio URL from TTS Lambda or None if failed
            },
            'execution_id': execution_id,
            'device_type': device_type,
            'device_name': device_name,
            'instructions': f"Generated pincode: {pincode}. Click Settings, then Screen Time, then Lock Screen Time settings. Follow the audio instructions to enter: {first}, {second}, {third}, {fourth}.",
            'audio_url': audio_url  # Include audio_url in response for device storage
        }
        
        # Add tracking information if available
        if tracking_result and tracking_result.get('success'):
            response_data['tracking'] = {
                'uuid': tracking_result.get('uuid'),
                'generation': tracking_result.get('generation'),
                'superseded_previous': tracking_result.get('superseded_previous', False)
            }
        
        print(f"✅ Audio guide generated successfully for customer: {customer_id}")
        return json_resp(response_data)
        
    except Exception as e:
        print(f"❌ Error generating audio guide: {str(e)}")
        return json_resp({'error': 'Failed to generate audio guide'}, 500)


def generate_vpn_profile(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Generate VPN configuration profile with pincode storage"""
    try:
        device_type = payload.get('device_type')
        device_name = payload.get('device_name', 'Device')
        customer_id = payload.get('customer_id')
        shared_pincode = payload.get('pincode')  # Use shared pincode from frontend
        device_id = payload.get('device_id')  # Important for tracking
        
        if not device_type:
            return json_resp({'error': 'Device type is required'}, 400)
        
        if not customer_id:
            return json_resp({'error': 'Customer ID is required'}, 400)
        
        if not device_id:
            print(f"⚠️ No device_id provided for VPN profile, generating temporary one")
            device_id = f"temp_device_{int(time.time())}"
        
        # Generate UUID for VPN profile
        profile_uuid = str(uuid.uuid4())
        
        # For macOS devices, use shared pincode for profile removal
        # For iOS devices, no pincode needed (clean browsing only)
        has_pincode = device_type.lower() in ['macos', 'mac']
        pincode = None
        
        if has_pincode:
            if shared_pincode:
                pincode = shared_pincode  # Use the shared pincode from frontend
                print(f"🔧 Using shared pincode for macOS VPN profile: {pincode}")
            else:
                # Fallback: generate pincode if none provided (shouldn't happen with shared pincode flow)
                pincode = str(secrets.randbelow(9000) + 1000)  # 4-digit pincode: 1000-9999
                print(f"⚠️ Generated fallback pincode for macOS (no shared pincode): {pincode}")
        else:
            print(f"🔧 iOS device - no pincode needed for clean browsing VPN profile")
        
        # Store pincode using new tracking system (only for macOS devices with pincode)
        vpn_tracking_result = None
        if has_pincode and pincode:
            vpn_tracking_result = store_pincode_with_tracking(
                customer_id=customer_id,
                device_id=device_id,
                pincode=pincode,
                purpose='vpn_removal',
                device_type=device_type,
                device_name=device_name or ''
            )
            if vpn_tracking_result.get('success'):
                print(f"✅ VPN removal pincode stored with tracking: {vpn_tracking_result.get('uuid')} (gen {vpn_tracking_result.get('generation')})")
            else:
                print(f"❌ Failed to store VPN pincode with tracking: {vpn_tracking_result.get('error')}")
        
        # Generate profile content based on device type
        if device_type.lower() in ['ios', 'iphone', 'ipad']:
            # iOS Configuration Profile (no pincode needed)
            profile_content = generate_ios_vpn_profile(profile_uuid, device_name)
            filename = f"ScreenTimeJourney-{device_name.replace(' ', '_')}-{profile_uuid[:8]}.mobileconfig"
            
        elif device_type.lower() in ['macos', 'mac', 'macbook']:
            # macOS Configuration Profile (with pincode for removal)
            profile_content = generate_macos_vpn_profile(profile_uuid, device_name, pincode)
            filename = f"ScreenTimeJourney-{device_name.replace(' ', '_')}-{profile_uuid[:8]}.mobileconfig"
            
        else:
            return json_resp({'error': f'Unsupported device type: {device_type}'}, 400)
        
        # Upload profile to S3 for backup and generate download URL
        s3_profile_url = None
        try:
            s3_client = boto3.client('s3', region_name='eu-north-1')
            S3_BUCKET = 'wati-vpn-profiles'  # Dedicated bucket for VPN profiles
            s3_key = f"profiles/{customer_id}/{profile_uuid}/{filename}"
            
            # Upload profile to S3
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=s3_key,
                Body=profile_content.encode('utf-8'),
                ContentType='application/x-apple-aspen-config'
            )
            
            # Generate pre-signed URL valid for 24 hours
            s3_profile_url = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': S3_BUCKET, 'Key': s3_key},
                ExpiresIn=86400  # 24 hours
            )
            
            print(f"✅ VPN profile uploaded to S3: {s3_key}")
            
        except Exception as e:
            print(f"⚠️ Failed to upload profile to S3: {e}")
            # Continue with data URL fallback
        
        # Create a data URL for direct download as fallback
        try:
            encoded_content = base64.b64encode(profile_content.encode('utf-8')).decode('utf-8')
            data_url = f"data:application/x-apple-aspen-config;base64,{encoded_content}"
            
            print(f"✅ VPN profile data URL generated successfully for {device_type} device")
            
        except Exception as e:
            print(f"❌ Failed to generate VPN profile data URL: {e}")
            return json_resp({'error': 'Failed to generate VPN profile'}, 500)
        
        # Store profile metadata with tracking (separate from removal pincode)
        profile_tracking_result = store_pincode_with_tracking(
            customer_id=customer_id,
            device_id=device_id,
            pincode=pincode if has_pincode else 'N/A',
            purpose='vpn_profile',
            device_type=device_type,
            device_name=device_name or '',
            profile_url=s3_profile_url if s3_profile_url else None
        )
        if profile_tracking_result.get('success'):
            print(f"✅ VPN profile metadata stored with tracking: {profile_tracking_result.get('uuid')} (gen {profile_tracking_result.get('generation')})")
        else:
            print(f"❌ Failed to store VPN profile metadata with tracking: {profile_tracking_result.get('error')}")
        
        result = {
            'device_type': device_type,
            'profile_uuid': profile_uuid,
            'filename': filename,
            'download_url': data_url,  # Keep data URL for immediate download in browser
            # DO NOT include profile_content - it's too large for DynamoDB storage!
            # 'profile_content': profile_content,  # REMOVED to prevent size issues
            'has_pincode': has_pincode
        }
        
        if has_pincode:
            result['pincode'] = pincode
        
        # Only store S3 URL in device (not data URL or profile content)
        if s3_profile_url:
            result['s3_url'] = s3_profile_url  # Use s3_url (matches frontend expectation)
            result['profile_url'] = s3_profile_url  # Also add profile_url for backward compatibility
        
        # Add tracking information
        result['tracking'] = {}
        if vpn_tracking_result and vpn_tracking_result.get('success'):
            result['tracking']['vpn_removal'] = {
                'uuid': vpn_tracking_result.get('uuid'),
                'generation': vpn_tracking_result.get('generation'),
                'superseded_previous': vpn_tracking_result.get('superseded_previous', False)
            }
        if profile_tracking_result and profile_tracking_result.get('success'):
            result['tracking']['vpn_profile'] = {
                'uuid': profile_tracking_result.get('uuid'),
                'generation': profile_tracking_result.get('generation'),
                'superseded_previous': profile_tracking_result.get('superseded_previous', False)
            }
        
        print(f"✅ Generated VPN profile for {device_type} device: {device_name}")
        
        return json_resp({
            'success': True,
            'result': result
        })
        
    except Exception as e:
        print(f"❌ Error generating VPN profile: {e}")
        return json_resp({'error': f'Failed to generate VPN profile: {str(e)}'}, 500)


def generate_ios_vpn_profile(uuid_val, device_name):
    """Generate iOS VPN configuration profile"""
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>DNSSettings</key>
            <dict>
                <key>DNSProtocol</key>
                <string>HTTPS</string>
                <key>ServerURL</key>
                <string>https://family.cloudflare-dns.com/dns-query</string>
            </dict>
            <key>PayloadDisplayName</key>
            <string>ScreenTime Journey DNS</string>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.dns.{uuid_val}</string>
            <key>PayloadType</key>
            <string>com.apple.dnsSettings.managed</string>
            <key>PayloadUUID</key>
            <string>{uuid_val}</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
        </dict>
    </array>
    <key>PayloadDisplayName</key>
    <string>ScreenTime Journey - {device_name}</string>
    <key>PayloadIdentifier</key>
    <string>com.screentimejourney.profile.{uuid_val}</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>{uuid_val}</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>"""


def generate_macos_vpn_profile(uuid_val, device_name, pincode):
    """Generate macOS VPN configuration profile with removal pincode"""
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>DNSSettings</key>
            <dict>
                <key>DNSProtocol</key>
                <string>HTTPS</string>
                <key>ServerURL</key>
                <string>https://family.cloudflare-dns.com/dns-query</string>
            </dict>
            <key>PayloadDisplayName</key>
            <string>ScreenTime Journey DNS</string>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.dns.{uuid_val}</string>
            <key>PayloadType</key>
            <string>com.apple.dnsSettings.managed</string>
            <key>PayloadUUID</key>
            <string>{uuid_val}</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
        </dict>
    </array>
    <key>PayloadDisplayName</key>
    <string>ScreenTime Journey - {device_name}</string>
    <key>PayloadIdentifier</key>
    <string>com.screentimejourney.profile.{uuid_val}</string>
    <key>PayloadRemovalDisallowed</key>
    <true/>
    <key>RemovalPassword</key>
    <string>{pincode}</string>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>{uuid_val}</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
    <key>PayloadDescription</key>
    <string>This profile requires a PIN to remove. Contact support if needed.</string>
</dict>
</plist>"""


def handle_subscription_created(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle subscription created webhook"""
    customer = payload.get('customer', {})
    customer_id = str(customer.get('id', ''))
    customer_email = customer.get('email', '')
    
    print(f"🎉 Subscription created for: {customer_email}, customer_id: {customer_id}")
    
    # NOTE: Commitment data is now collected during onboarding flow, not from order/subscription
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
    
    print(f"📊 Extracted from subscription webhook - utm_data: {bool(utm_data)}, phone: {bool(phone)}")
    
    # Simply update/create record with customer ID from payload
    # NOTE: commitment_data is no longer passed here - it's collected during onboarding
    success = update_subscriber(
        customer_id=customer_id,
        email=customer_email, 
        status='active',
        event_type='subscription_created',
        data=payload,
        commitment_data=None,  # No longer extracting from webhook
        utm_data=utm_data,
        phone=phone
    )
    
    if success:
        return json_resp({"success": True, "customer_id": customer_id})
    else:
        return json_resp({"error": "Failed to update subscriber"}, 500)


def handle_subscription_cancelled(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle subscription cancelled webhook (immediate cancellation)"""
    customer = payload.get('customer', {})
    customer_id = str(customer.get('id', ''))
    customer_email = customer.get('email', '')
    
    print(f"❌ Subscription cancelled webhook for: {customer_email}")
    
    try:
        # Get customer data first
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
        
        customer_response = table.get_item(Key={'customer_id': customer_id})
        
        if 'Item' not in customer_response:
            print(f"⚠️ Customer {customer_id} not found, creating basic record")
            # Create basic customer record if not found
            customer_data = {
                'customer_id': customer_id,
                'email': customer_email,
                'subscription_status': 'active',  # Will be changed to cancelled below
                'created_at': datetime.now().isoformat()
            }
        else:
            customer_data = customer_response['Item']
        
        # Use unified cancellation logic (immediate cancellation for webhook)
        cancellation_result = schedule_subscription_cancellation(
            customer_id=customer_id,
            customer_data=customer_data,
            cancel_reason='Cancelled via Shopify webhook',
            feedback='',
            immediate=True  # Webhook cancellation = immediate
        )
        
        if cancellation_result['success']:
            # Also update with webhook data for reference
            table.update_item(
                Key={'customer_id': customer_id},
                UpdateExpression='SET email = :email, webhook_data = :webhook_data, last_updated = :updated',
                ExpressionAttributeValues={
                    ':email': customer_email,
                    ':webhook_data': payload,
                    ':updated': datetime.now().isoformat()
                }
            )
            
            print(f"✅ Webhook cancellation processed for customer {customer_id}")
            return json_resp({"success": True, "customer_id": customer_id, "message": "Subscription cancelled immediately"})
        else:
            return json_resp({"error": "Failed to process cancellation"}, 500)
            
    except Exception as e:
        print(f"❌ Error in webhook cancellation: {e}")
        return json_resp({"error": "Failed to process webhook"}, 500)

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
    
    # NOTE: Commitment data is now collected during onboarding flow, not from order/subscription
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
    
    print(f"📊 Extracted from webhook - utm_data: {bool(utm_data)}, phone: {bool(phone)}")
    
    # Simply update/create record with customer ID from payload
    # NOTE: commitment_data is no longer passed here - it's collected during onboarding
    success = update_subscriber(
        customer_id=customer_id,
        email=customer_email,
        status='active',
        event_type='order_created', 
        data=payload,
        commitment_data=None,  # No longer extracting from webhook
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
        # Support both old (q1, q2, q3) and new field names
        what_to_change = payload.get('what_to_change', payload.get('q1', '')).strip()
        what_to_gain = payload.get('what_to_gain', payload.get('q2', '')).strip()
        doing_this_for = payload.get('doing_this_for', payload.get('q3', '')).strip()
        
        # Quick check for completely empty responses
        if not all([what_to_change, what_to_gain, doing_this_for]):
            return json_resp({
                "success": True,
                "is_valid": False,
                "feedback": "Please answer all three questions to show your commitment to this journey."
            })
            
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
        You are evaluating whether someone is making a SERIOUS commitment to changing their screen time habits.
        
        Question 1: Why do you want to change your screentime habits?
        Answer: "{what_to_change}"
        
        Question 2: How will this change your life?
        Answer: "{what_to_gain}"
        
        Question 3: Who in your life will be affected by these changes?
        Answer: "{doing_this_for}"
        
        Your job: Determine if this person is genuinely committed to changing their screen time habits.
        
        REJECT (is_valid: false) if:
        - Answers are joke responses, sarcasm, or clearly not serious
        - Answers are just "yes", "no", "idk", "nothing", or single words
        - Answers contain the question text itself (copy-pasted questions)
        - Answers are completely vague with no personal context (e.g., "stuff", "things", "everything")
        - Answers show no understanding of what screen time change means
        - Person seems uninterested or dismissive
        
        ACCEPT (is_valid: true) if:
        - Answers show genuine personal motivation to reduce screen time
        - Answers reflect real understanding of the impact on their life
        - Person demonstrates they want to make a positive change
        - Answers are thoughtful and sincere (even if brief)
        
        Respond with JSON (no markdown):
        {{
          "is_valid": boolean,
          "feedback": string (if rejected: explain what's missing and how to get approved. If accepted: encouraging message about their commitment)
        }}
        
        Focus on INTENT and SINCERITY, not length or perfect grammar.
        """
        
        data = {
            "model": os.environ.get('OPENAI_MODEL', 'gpt-4o-mini'),
            "messages": [
                {"role": "system", "content": "You evaluate commitment based on sincerity and intent, not word count. Accept genuine responses even if brief. Reject jokes, sarcasm, and clearly insincere answers."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 250,
            "temperature": 0.3,
            "response_format": {"type": "json_object"}
        }
        
        response = requests.post('https://api.openai.com/v1/chat/completions', 
                               headers=headers, json=data)
        response.raise_for_status()
        
        result = json.loads(response.json()['choices'][0]['message']['content'])
        
        print(f"✅ Commitment evaluation: {result}")
        
        return json_resp({
            "success": True,
            "is_valid": result.get('is_valid', False),
            "feedback": result.get('feedback', 'Thank you for your commitment.')
        })
            
    except Exception as e:
        print(f"❌ OpenAI evaluation error: {e}")
        # If OpenAI fails, allow user to proceed (don't block onboarding)
        return json_resp({
            "success": True,
            "is_valid": True,
            "feedback": "Thank you for your commitment. Let's continue your journey."
        })


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
        
        print(f"🛒 Creating checkout for: country={country_code}")
        print(f"📊 UTM: source={utm_source}, campaign={utm_campaign}, clickid={utm_clickid}")
        
        # Validate required fields
        if not all([q1, q2, q3]):
            return json_resp({"ok": False, "error": "Missing required commitment data"}, 400)
        
        # Prepare commitment form data
        commitment_form_data = {
            'q1': q1, 'q2': q2, 'q3': q3,
            'surrender_text': surrender_text
        }
        
        # Use the enhanced GraphQL cart creation
        print(f"🛒 Creating GraphQL checkout for variant: {variant_gid}")
        ok, checkout_url, err = shopify_cart_create_enhanced(
            variant_gid=variant_gid,
            selling_plan_id=selling_plan_id,
            whatsapp=phone,
            commitment_form_data=commitment_form_data,
            gender=gender if gender else 'unknown',  # Pass gender if available, otherwise default
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
        seal_subscription_id = customer_data.get('seal_subscription_id')
        
        # Check if customer has access (active or cancel_scheduled with valid access_until date)
        # Also check if they have a Seal subscription ID (indicates active subscription even if status not set)
        has_access = False
        access_reason = 'subscription_inactive'
        
        # If they have a Seal subscription ID, they likely have an active subscription
        # (Seal webhooks should set status to 'active', but if status is missing, check subscription ID)
        if seal_subscription_id and subscription_status != 'cancelled' and subscription_status != 'cancel_scheduled':
            # Has Seal subscription and not explicitly cancelled - treat as active
            has_access = True
            print(f"✅ Customer {customer_id} has Seal subscription ID {seal_subscription_id}, granting access")
            # Auto-fix status if it's not 'active' (but not if it's cancelled)
            if subscription_status != 'active':
                print(f"⚠️ Auto-fixing subscription_status from '{subscription_status}' to 'active' for customer {customer_id}")
                try:
                    table.update_item(
                        Key={'customer_id': customer_id},
                        UpdateExpression='SET subscription_status = :status',
                        ExpressionAttributeValues={':status': 'active'}
                    )
                    subscription_status = 'active'
                except Exception as e:
                    print(f"⚠️ Failed to auto-fix status: {e}")
        elif subscription_status == 'active':
            has_access = True
            print(f"✅ Customer {customer_id} has active subscription")
        elif subscription_status == 'cancel_scheduled':
            # Check if still within access period (simple date comparison)
            cancellation_date = customer_data.get('cancellation_date')
            if cancellation_date:
                try:
                    cancel_date = dateutil.parser.parse(cancellation_date).date()
                    today = datetime.now().date()
                    
                    if today <= cancel_date:
                        has_access = True
                        print(f"✅ Customer {customer_id} has access until cancellation date {cancellation_date}")
                    else:
                        # Automatically mark as cancelled if past cancellation date
                        has_access = False
                        access_reason = 'subscription_expired'
                        print(f"❌ Customer {customer_id} past cancellation date {cancellation_date}, should be marked cancelled")
                        
                        # Auto-update status to cancelled and release devices (event-driven cleanup)
                        try:
                            dynamodb = boto3.resource('dynamodb')
                            table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
                            
                            # Release all devices before updating status
                            release_all_devices_on_cancellation(customer_id, customer_data)
                            
                            table.update_item(
                                Key={'customer_id': customer_id},
                                UpdateExpression='SET subscription_status = :status, cancelled_at = :cancelled_at',
                                ExpressionAttributeValues={
                                    ':status': 'cancelled',
                                    ':cancelled_at': datetime.now().isoformat()
                                }
                            )
                            print(f"✅ Auto-updated {customer_id} to cancelled status and released devices")
                        except Exception as update_error:
                            print(f"⚠️ Failed to auto-update cancelled status: {update_error}")
                            
                except Exception as e:
                    print(f"⚠️ Error parsing cancellation_date: {e}")
                    access_reason = 'invalid_cancellation_date'
            else:
                print(f"❌ Customer {customer_id} has cancel_scheduled but no cancellation_date")
                access_reason = 'missing_cancellation_date'
        else:
            print(f"❌ Customer {customer_id} has inactive subscription: {subscription_status}")
        
        if has_access:
            # Check if profile is complete (username and gender required)
            username = customer_data.get('username', '')
            gender = customer_data.get('gender', '')
            
            profile_complete = bool(username and gender)
            print(f"👤 Profile completeness check - username: {bool(username)}, gender: {bool(gender)}")
            
            return {
                'has_access': True,
                'customer_data': customer_data,
                'subscription_status': subscription_status,
                'profile_complete': profile_complete,
                'cancellation_date': customer_data.get('cancellation_date') if subscription_status == 'cancel_scheduled' else None
            }
        else:
            return {'has_access': False, 'reason': access_reason, 'status': subscription_status}
            
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
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
        <style>
            :root {{
                --brand-primary: #2E0456;
                --brand-primary-dark: #1a0230;
                --brand-text: #0F172A;
                --brand-background: #FFFFFF;
                --brand-separator: #E5E5E5;
                --page-bg: #FFFFFF;
                --spacing-lg: 2rem;
                --spacing-md: 1.5rem;
                --radius-lg: 1rem;
                --shadow-brand: 0 4px 14px rgba(46, 4, 86, 0.15);
                --font-heading: 'DM Serif Display', serif;
                --font-body: 'Inter', sans-serif;
            }}
            
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}
            
            body {{
                font-family: var(--font-body);
                background: var(--page-bg);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                color: #0F172A;
            }}
            
            .container {{
                max-width: 500px;
                width: 100%;
                background: var(--brand-background);
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow-brand);
                padding: var(--spacing-lg);
                text-align: center;
                border: 1px solid var(--brand-separator);
            }}
            
            .logo {{
                margin-bottom: var(--spacing-md);
                display: block;
                text-align: center;
            }}
            
            h1 {{
                font-family: var(--font-heading);
                color: #0F172A;
                font-size: 1.75rem;
                font-weight: 400;
                margin-bottom: var(--spacing-md);
                line-height: 1.3;
            }}
            
            .message {{
                color: #0F172A;
                font-size: 1rem;
                line-height: 1.5;
                margin-bottom: var(--spacing-lg);
            }}
            
            .features {{
                text-align: left;
                margin: var(--spacing-md) 0;
                padding: var(--spacing-md);
                background: #fafafa;
                border-radius: 8px;
                border: 1px solid var(--brand-separator);
            }}
            
            .features h3 {{
                font-size: 1.1rem;
                margin-bottom: 1rem;
                color: var(--brand-text);
                text-align: center;
            }}
            
            .features ul {{
                list-style: none;
                margin: 0;
                padding: 0;
            }}
            
            .features li {{
                padding: 0.5rem 0;
                position: relative;
                padding-left: 1.5rem;
            }}
            
            .features li:before {{
                content: "✓";
                position: absolute;
                left: 0;
                color: var(--brand-primary);
                font-weight: bold;
            }}
            
            .btn {{
                background: var(--brand-primary);
                color: white;
                padding: 14px 28px;
                font-size: 1rem;
                font-weight: 500;
                text-decoration: none;
                border-radius: 8px;
                display: inline-block;
                transition: all 0.2s ease;
                margin-bottom: 1rem;
                border: 2px solid var(--brand-primary);
            }}
            
            .btn:hover {{
                background: var(--brand-primary-dark);
                border-color: var(--brand-primary-dark);
                transform: translateY(-1px);
                box-shadow: var(--shadow-brand);
            }}
            
            .secondary-link {{
                color: #999;
                text-decoration: none;
                font-size: 0.9rem;
                display: block;
                margin-top: 1rem;
            }}
            
            .secondary-link:hover {{
                color: #666;
            }}
            
            @media (max-width: 640px) {{
                .container {{
                    padding: 1.5rem;
                    margin: 1rem;
                }}
                
                h1 {{
                    font-size: 1.5rem;
                }}
                
                .logo img {{
                    max-width: 150px;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <img src="https://cdn.shopify.com/s/files/1/0866/6749/3623/files/stj_lgoo_full_primary.png?v=1758378469" alt="Screen Time Journey Logo" style="max-width: 200px; height: auto;">
            </div>
            <h1>{config['title']}</h1>
            <p class="message">{config['message']}</p>
            
            <a href="https://www.screentimejourney.com/products/screentimejourney" class="btn">Start now</a>
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
        
        # Check if this is a dashboard redirect request via query parameter
        if query_params.get('action') == 'redirect-to-dashboard':
            print(f"🔄 Dashboard redirect requested via app proxy with action parameter")
            return {
                'statusCode': 302,
                'headers': {
                    'Location': 'https://app.screentimejourney.com',
                    'Content-Type': 'text/html'
                },
                'body': '''
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Redirecting to Dashboard...</title>
                    <meta http-equiv="refresh" content="0;url=https://app.screentimejourney.com">
                </head>
                <body>
                    <p>Redirecting to your Screen Time Journey dashboard...</p>
                    <script>window.location.href = 'https://app.screentimejourney.com';</script>
                </body>
                </html>
                '''
            }
        
        # Log incoming request (redact signature for security)
        qs_redacted = {k: v for k, v in query_params.items() if k != 'signature'}
        print(f"📥 App Proxy request QS: {qs_redacted}")
        print(f"📥 Full query params keys: {list(query_params.keys())}")
        
        # 1. Verify signature for security (if present)
        signature_present = 'signature' in query_params
        if signature_present:
            signature_valid = verify_app_proxy_signature(query_params)
            if not signature_valid:
                print("⚠️ WARNING: App Proxy signature verification failed - allowing request for now (should be fixed)")
                # Temporarily allow requests even with invalid signature for debugging
                # TODO: Re-enable strict signature verification once Shopify app proxy is configured correctly
        else:
            # Signature missing - log warning but allow for now (may need to configure app proxy in Shopify)
            print("⚠️ WARNING: No signature parameter in App Proxy request - allowing request but this should be fixed in Shopify app proxy configuration")
        
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
        
        # 3. Check customer entitlement (but always allow access - frontend will handle payment wall)
        entitlement_check = check_customer_entitlement(customer_id)
        if not entitlement_check['has_access']:
            reason = entitlement_check.get('reason', 'unknown')
            print(f"⚠️ Customer {customer_id} has no access (reason: {reason}), but allowing access - frontend will show payment wall")
            # Only block if customer not found (they need to subscribe first)
            if reason == 'customer_not_found':
                print(f"🚫 BRANCH: CUSTOMER_NOT_FOUND - Redirecting to subscription page")
                return render_account_wall_page('customer_not_found', shop_domain)
            
            # For subscription_inactive or cancelled, still allow access but get customer data
            # The frontend will show the payment wall modal
            if 'customer_data' not in entitlement_check:
                # Need to get customer data manually
                try:
                    dynamodb = boto3.resource('dynamodb')
                    table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
                    response = table.get_item(Key={'customer_id': customer_id})
                    if 'Item' in response:
                        customer_data = response['Item']
                        username = customer_data.get('username', '')
                        gender = customer_data.get('gender', '')
                        profile_complete = bool(username and gender)
                    else:
                        # Fallback - shouldn't happen but handle it
                        customer_data = {}
                        profile_complete = False
                except Exception as e:
                    print(f"⚠️ Error getting customer data: {e}")
                    customer_data = {}
                    profile_complete = False
            else:
                customer_data = entitlement_check['customer_data']
                profile_complete = entitlement_check.get('profile_complete', False)
        else:
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
# SEAL WEBHOOK HANDLING
# =============================================================================

def verify_seal_webhook_signature(headers: Dict[str, Any], body: str, api_secret: str) -> bool:
    """
    Verify Seal webhook HMAC signature
    HMAC is computed with JSON-encoded payload and API secret
    Seal sends HMAC as base64, so we need to compare base64 to base64
    """
    try:
        # Get HMAC from header
        hmac_header = headers.get('X-Seal-Hmac-Sha256') or headers.get('x-seal-hmac-sha256')
        if not hmac_header:
            print("❌ No X-Seal-Hmac-Sha256 header found")
            return False
        
        # Calculate expected HMAC as base64 (Seal sends base64)
        # Use the raw JSON body (body is already a string)
        expected_hmac_bytes = hmac.new(
            api_secret.encode('utf-8'),
            body.encode('utf-8') if isinstance(body, str) else body,
            hashlib.sha256
        ).digest()
        
        # Encode as base64 to match Seal's format
        expected_hmac_base64 = base64.b64encode(expected_hmac_bytes).decode('utf-8')
        
        # Compare signatures (constant time comparison)
        is_valid = hmac.compare_digest(hmac_header, expected_hmac_base64)
        
        if is_valid:
            print("✅ Seal webhook HMAC signature verified")
        else:
            print(f"❌ Invalid Seal webhook signature. Expected (base64): {expected_hmac_base64}, Got: {hmac_header}")
        
        return is_valid
        
    except Exception as e:
        print(f"❌ Error verifying Seal webhook signature: {e}")
        import traceback
        print(traceback.format_exc())
        return False


def handle_seal_subscription_created(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle Seal subscription/created webhook"""
    try:
        print(f"🎉 Seal subscription created: {json.dumps(payload, default=str)}")
        
        # Extract customer info from Seal payload
        # Seal payload structure: customer_id and email are at root level
        customer_id = str(payload.get('customer_id', payload.get('customer', {}).get('id', '')))
        customer_email = payload.get('email') or payload.get('customer_email') or payload.get('customer', {}).get('email', '')
        
        if not customer_id or not customer_email:
            print(f"⚠️ Missing customer_id or email in Seal webhook: {payload}")
            return json_resp({"error": "Missing customer information"}, 400)
        
        print(f"📧 Processing Seal subscription for: {customer_email}, customer_id: {customer_id}")
        
        # Extract subscription ID from Seal payload (this is the 'id' field, not 'internal_id')
        seal_subscription_id = payload.get('id')
        if seal_subscription_id:
            print(f"📝 Seal subscription ID: {seal_subscription_id}")
        
        # Extract billing country code from Seal payload
        country_code = payload.get('b_country_code', '')
        country_name = payload.get('b_country', '')
        if country_code:
            print(f"🌍 Billing country: {country_code} ({country_name})")
        else:
            print(f"⚠️ No billing country code found in Seal webhook")
        
        # Extract UTM data if available
        utm_data = {}
        # Seal may have different structure - adjust as needed
        
        # Store subscription creation date from Seal payload if available
        subscription_created_at = payload.get('created_at') or payload.get('created') or datetime.now().isoformat()
        
        # Update subscriber record
        success = update_subscriber(
            customer_id=customer_id,
            email=customer_email,
            status='active',
            event_type='subscription_created',
            data=payload,
            commitment_data=None,
            utm_data=utm_data,
            phone=None,
            seal_subscription_id=seal_subscription_id,
            country=country_code
        )
        
        # Also store subscription_created_at separately for billing calculations
        if success:
            try:
                dynamodb = boto3.resource('dynamodb')
                table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
                table.update_item(
                    Key={'customer_id': customer_id},
                    UpdateExpression='SET subscription_created_at = :created_at',
                    ExpressionAttributeValues={':created_at': subscription_created_at}
                )
                print(f"📅 Stored subscription_created_at: {subscription_created_at}")
            except Exception as e:
                print(f"⚠️ Failed to store subscription_created_at: {e}")
        
        if success:
            return json_resp({"success": True, "message": "Subscription processed"})
        else:
            return json_resp({"error": "Failed to update subscriber"}, 500)
            
    except Exception as e:
        print(f"❌ Error handling Seal subscription created: {e}")
        import traceback
        print(traceback.format_exc())
        return json_resp({"error": "Internal server error"}, 500)


def handle_seal_subscription_cancelled(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle Seal subscription/cancelled webhook"""
    try:
        print(f"🚫 Seal subscription cancelled webhook received: {json.dumps(payload, default=str)}")
        
        customer_id = str(payload.get('customer_id', payload.get('customer', {}).get('id', '')))
        customer_email = payload.get('email') or payload.get('customer_email') or payload.get('customer', {}).get('email', '')
        
        if not customer_id:
            return json_resp({"error": "Missing customer_id"}, 400)
        
        # CHECK ACTUAL STATUS IN PAYLOAD - don't trust the webhook topic alone!
        # Seal sometimes sends "subscription/cancelled" topic even when status is "ACTIVE"
        actual_status = payload.get('status', '').upper()
        
        if actual_status == 'CANCELLED':
            print(f"✅ Confirmed cancellation - status in payload is CANCELLED")
            # Use existing cancellation handler
            return handle_subscription_cancelled({
                'customer': {'id': customer_id, 'email': customer_email},
                'subscription': payload
            })
        else:
            print(f"⚠️ Webhook topic is 'subscription/cancelled' but payload status is '{actual_status}' - treating as update instead")
            # Treat as subscription update (reuse created handler which handles status updates)
            return handle_seal_subscription_created(payload)
        
    except Exception as e:
        print(f"❌ Error handling Seal subscription cancelled: {e}")
        return json_resp({"error": "Internal server error"}, 500)


def handle_seal_billing_attempt(payload: Dict[str, Any], topic: str) -> Dict[str, Any]:
    """Handle Seal billing_attempt webhooks"""
    try:
        print(f"💳 Seal billing attempt ({topic}): {json.dumps(payload, default=str)}")
        
        customer_id = str(payload.get('customer_id', payload.get('customer', {}).get('id', '')))
        customer_email = payload.get('email') or payload.get('customer_email') or payload.get('customer', {}).get('email', '')
        
        if not customer_id:
            return json_resp({"error": "Missing customer_id"}, 400)
        
        # Map to existing billing handler
        status = 'active' if 'succeeded' in topic else 'past_due'
        return handle_subscription_billing({
            'customer': {'id': customer_id},
            'subscription': payload
        }, topic)
        
    except Exception as e:
        print(f"❌ Error handling Seal billing attempt: {e}")
        return json_resp({"error": "Internal server error"}, 500)


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
            
        # Handle redirect to dashboard (from checkout extension) - MUST be before app proxy check
        if method == "GET" and "/redirect-to-dashboard" in path:
            print(f"🔄 Dashboard redirect requested for path: {path}")
            return {
                'statusCode': 302,
                'headers': {
                    'Location': 'https://app.screentimejourney.com',
                    'Content-Type': 'text/html'
                },
                'body': '''
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Redirecting to Dashboard...</title>
                    <meta http-equiv="refresh" content="0;url=https://app.screentimejourney.com">
                </head>
                <body>
                    <p>Redirecting to your Screen Time Journey dashboard...</p>
                    <script>window.location.href = 'https://app.screentimejourney.com';</script>
                </body>
                </html>
                '''
            }
            
        # App Proxy requests (from Shopify storefront) - More specific routing
        # Shopify will forward requests to the root of your proxy URL
        if method == "GET" and (path == "/" or path == "" or (path.startswith("/apps") and "redirect-to-dashboard" not in path) or "proxy" in path):
            return handle_app_proxy(event)
            
        # JWT verification endpoint for app.screentimejourney.com
        if path.endswith("/verify-jwt") or path.endswith("/verify_jwt"):
            return handle_jwt_verification(event)
            
        # Get raw body for Seal webhook HMAC verification (before parsing)
        raw_body_str = ""
        if method == "POST":
            # Get raw body from event
            if isinstance(event.get("body"), str):
                raw_body_str = event.get("body", "")
            elif event.get("body"):
                raw_body_str = json.dumps(event.get("body"), sort_keys=True)
        
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
            elif path.endswith("/evaluate-and-start") or path.endswith("/evaluate_commitment"):
                print(f"📞 Evaluate_commitment called with body: {body}")
                response = evaluate_commitment(body)
                print(f"📤 Evaluate_commitment response: {response}")
                return response
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
            elif path.endswith("/get_leaderboard"):
                print(f"📞 Get_leaderboard called with body: {body}")
                response = get_leaderboard(body)
                print(f"📤 Get_leaderboard response: {response}")
                return response
            elif path.endswith("/get_system_config"):
                print(f"📞 Get_system_config called with body: {body}")
                response = get_system_config(body)
                print(f"📤 Get_system_config response: {response}")
                return response
            elif path.endswith("/update_notifications"):
                print(f"📞 Update_notifications called with body: {body}")
                response = update_notification_settings(body)
            
            elif path.endswith("/unsubscribe_email"):
                print(f"📞 Unsubscribe_email called with body: {body}")
                response = unsubscribe_email_notifications(body)
                print(f"📤 Update_notifications response: {response}")
                return response
            elif path.endswith("/cancel_subscription"):
                print(f"📞 Cancel_subscription called with body: {body}")
                response = cancel_customer_subscription(body)
                print(f"📤 Cancel_subscription response: {response}")
                return response
            elif path.endswith("/generate_vpn_profile"):
                print(f"📞 Generate_vpn_profile called with body: {body}")
                response = generate_vpn_profile(body)
                print(f"📤 Generate_vpn_profile response: {response}")
                return response
            elif path.endswith("/store_pincode"):
                print(f"📞 Store_pincode called with body: {body}")
                response = store_pincode(body)
                print(f"📤 Store_pincode response: {response}")
                return response
            elif path.endswith("/generate_audio_guide"):
                print(f"📞 Generate_audio_guide called with body: {body}")
                response = generate_audio_guide(body)
                print(f"📤 Generate_audio_guide response: {response}")
                return response
            elif path.endswith("/add_device"):
                print(f"📞 Add_device called with body: {body}")
                response = add_device(body)
                print(f"📤 Add_device response: {response}")
                return response
            elif path.endswith("/update_device"):
                print(f"📞 Update_device called with body: {body}")
                response = update_device(body)
                print(f"📤 Update_device response: {response}")
                return response
            elif path.endswith("/get_devices"):
                print(f"📞 Get_devices called with body: {body}")
                response = get_devices(body)
                print(f"📤 Get_devices response: {response}")
                return response
            elif path.endswith("/regenerate_audio_guide"):
                print(f"📞 Regenerate_audio_guide called with body: {body}")
                response = regenerate_audio_guide(body)
                print(f"📤 Regenerate_audio_guide response: {response}")
                return response
            elif path.endswith("/get_device_pincode_history"):
                print(f"📞 Get_device_pincode_history called with body: {body}")
                response = get_device_pincode_history(body)
                print(f"📤 Get_device_pincode_history response: {response}")
                return response
            elif path.endswith("/unlock_device"):
                print(f"📞 Unlock_device called with body: {body}")
                response = unlock_device(body)
                print(f"📤 Unlock_device response: {response}")
                return response
            elif path.endswith("/validate_surrender"):
                print(f"📞 Validate_surrender called")
                # Get headers from event
                headers = event.get("headers", {})
                # Parse multipart form data for audio upload
                if 'multipart/form-data' in headers.get('content-type', ''):
                    import base64
                    
                    form_data = {}
                    
                    try:
                        # Get the body content
                        if event.get('isBase64Encoded', False):
                            body_content = base64.b64decode(event['body'])
                        else:
                            body_content = event['body'].encode('utf-8') if isinstance(event['body'], str) else event['body']
                        
                        # Extract boundary from content-type header
                        content_type = headers.get('content-type', '')
                        print(f"📋 Content-Type: {content_type}")
                        
                        # Parse multipart data manually
                        boundary_start = content_type.find('boundary=')
                        if boundary_start != -1:
                            boundary = content_type[boundary_start + 9:].strip()
                            if boundary.startswith('"') and boundary.endswith('"'):
                                boundary = boundary[1:-1]
                            
                            print(f"🔍 Found boundary: {boundary}")
                            
                            # Split by boundary
                            parts = body_content.split(f'--{boundary}'.encode())
                            
                            for part in parts:
                                if not part.strip() or part.strip() == b'--':
                                    continue
                                
                                # Split headers from content
                                if b'\r\n\r\n' in part:
                                    headers_part, content_part = part.split(b'\r\n\r\n', 1)
                                    headers_str = headers_part.decode('utf-8', errors='ignore')
                                    
                                    # Extract field name
                                    if 'name="' in headers_str:
                                        name_start = headers_str.find('name="') + 6
                                        name_end = headers_str.find('"', name_start)
                                        field_name = headers_str[name_start:name_end]
                                        
                                        # Clean content (remove trailing boundary markers)
                                        content = content_part.rstrip(b'\r\n--')
                                        
                                        if field_name == 'audio':
                                            form_data['audio'] = content
                                        else:
                                            form_data[field_name] = content.decode('utf-8', errors='ignore').strip()
                                        
                                        print(f"📝 Parsed field '{field_name}': {len(content) if field_name == 'audio' else content.decode('utf-8', errors='ignore')[:100]}")
                        
                        print(f"🎯 Final form_data keys: {list(form_data.keys())}")
                        response = validate_surrender(form_data)
                        
                    except Exception as parse_error:
                        print(f"❌ Multipart parsing error: {parse_error}")
                        response = json_resp({'error': f'Failed to parse multipart data: {parse_error}'}, 400)
                    
                else:
                    response = json_resp({'error': 'Multipart form data required'}, 400)
                
                print(f"📤 Validate_surrender response: {response}")
                return response
            elif path.endswith("/remove_device"):
                print(f"📞 Remove_device called with body: {body}")
                response = remove_device(body)
                print(f"📤 Remove_device response: {response}")
                return response

            
            # Check if this is a Seal webhook
            is_seal_webhook = path.endswith("/seal-webhook")
            
            if is_seal_webhook:
                # Verify Seal webhook HMAC signature
                headers = event.get("headers", {})
                seal_api_secret = os.environ.get('SEAL_API_SECRET', 'seal_secret_0vipxfi9vwzjkbg0xpommzoyng9t5wvb65iay4wr')
                
                # Use raw body string for HMAC verification
                if not verify_seal_webhook_signature(headers, raw_body_str, seal_api_secret):
                    print(f"❌ Invalid Seal webhook signature")
                    return json_resp({"error": "Invalid webhook signature"}, 401)
                
                # Parse body if it's a string
                if isinstance(body, str):
                    try:
                        body = json.loads(body)
                    except:
                        body = {}
                
                # Get webhook topic from header or body
                topic = headers.get('X-Seal-Topic') or headers.get('x-seal-topic') or body.get('topic', '')
                
                print(f"🎯 Seal webhook topic: {topic}")
                
                # Route to appropriate handler
                if topic == "subscription/created":
                    return handle_seal_subscription_created(body)
                elif topic == "subscription/cancelled":
                    return handle_seal_subscription_cancelled(body)
                elif topic == "subscription/updated":
                    # Handle subscription updates (e.g., status changes)
                    return handle_seal_subscription_created(body)  # Reuse created handler
                elif topic == "billing_attempt/succeeded":
                    return handle_seal_billing_attempt(body, topic)
                elif topic == "billing_attempt/failed":
                    return handle_seal_billing_attempt(body, topic)
                else:
                    print(f"⚠️ Unknown Seal webhook topic: {topic}")
                    return json_resp({"success": True, "message": f"Unknown topic: {topic}"})
            
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
