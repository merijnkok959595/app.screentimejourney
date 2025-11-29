#!/usr/bin/env python3

import requests
from base64 import b64encode, b64decode
import json
import os
from datetime import datetime

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def test_deployment_creation():
    """Test creating deployments via API (correct SimpleMDM terminology)"""
    
    print("🚀 TESTING DEPLOYMENT CREATION (CORRECT ENDPOINT!)")
    print("=" * 55)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth_header}",
        "Content-Type": "application/json"
    }
    
    # Create deployment with correct endpoint
    deployment_data = {
        "name": f"ScreenTimeDeployment-{datetime.now().strftime('%H%M%S')}"
    }
    
    try:
        print("📡 POST /api/v1/deployments")
        print(f"Data: {json.dumps(deployment_data, indent=2)}")
        
        response = requests.post(
            f"{BASE_URL}/deployments",
            headers=headers,
            json=deployment_data,
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 201:
            print("🎉 SUCCESS! Deployment created!")
            
            deployment_response = response.json()
            print(f"Response: {json.dumps(deployment_response, indent=2)}")
            
            if 'data' in deployment_response:
                deployment_id = deployment_response['data']['id']
                deployment_name = deployment_response['data']['attributes']['name']
                
                print(f"\n✅ NEW DEPLOYMENT CREATED:")
                print(f"   ID: {deployment_id}")
                print(f"   Name: {deployment_name}")
                
                return deployment_id
                
        elif response.status_code == 404:
            print("❌ 404 - Deployments endpoint not found either")
            
        elif response.status_code == 422:
            print("⚠️ 422 - Validation error (but endpoint exists!)")
            print(f"Response: {response.text}")
            
        else:
            print(f"❌ Status {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"💥 Request failed: {e}")
    
    return None

def test_deployment_invitation_with_qr(deployment_id):
    """Test creating invitation with QR code via deployments endpoint"""
    
    print(f"\n📱 TESTING DEPLOYMENT INVITATION + QR CODE")
    print("=" * 45)
    print(f"Deployment ID: {deployment_id}")
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Create invitation via deployments endpoint
    try:
        print(f"📡 POST /api/v1/deployments/{deployment_id}/invitations")
        
        response = requests.post(
            f"{BASE_URL}/deployments/{deployment_id}/invitations",
            headers=headers,
            data={},  # Empty to get QR code
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200 or response.status_code == 201:
            print("🎉 SUCCESS! Invitation created!")
            
            try:
                invitation_response = response.json()
                print(f"Response: {json.dumps(invitation_response, indent=2)}")
                
                # Extract invitation details
                invitation_id = None
                invitation_url = None
                qr_code = None
                
                if 'data' in invitation_response:
                    invitation_id = invitation_response['data']['id']
                    attrs = invitation_response['data']['attributes']
                    invitation_url = attrs.get('url')
                    qr_code = attrs.get('qr_code') or attrs.get('qr')
                
                print(f"\n✅ INVITATION DETAILS:")
                print(f"   ID: {invitation_id}")
                print(f"   URL: {invitation_url}")
                print(f"   QR Code: {'YES' if qr_code else 'NO'}")
                
                if qr_code:
                    print(f"   QR Code length: {len(qr_code)} characters")
                    print(f"   QR Code preview: {qr_code[:50]}...")
                    
                    # Save QR code to file
                    qr_filename = save_qr_code(qr_code, f"deployment_{deployment_id}")
                    
                    return {
                        "invitation_id": invitation_id,
                        "url": invitation_url,
                        "qr_code": qr_code,
                        "qr_file": qr_filename
                    }
                else:
                    print("   🔍 Checking response for QR data...")
                    response_str = json.dumps(invitation_response)
                    if 'base64' in response_str.lower():
                        print("   Found base64 data in response!")
                    
                return {
                    "invitation_id": invitation_id,
                    "url": invitation_url,
                    "qr_code": None
                }
                    
            except json.JSONDecodeError:
                print(f"Raw response: {response.text}")
                
        elif response.status_code == 404:
            print("❌ 404 - Deployment invitations endpoint not found")
            
        elif response.status_code == 422:
            print("⚠️ 422 - Validation error")
            print(f"Response: {response.text}")
            
        else:
            print(f"❌ Status {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"💥 Request failed: {e}")
    
    return None

def save_qr_code(qr_base64, filename):
    """Save QR code from base64 to PNG file"""
    
    try:
        # Remove data URL prefix if present
        if qr_base64.startswith('data:image/png;base64,'):
            qr_base64 = qr_base64.replace('data:image/png;base64,', '')
        
        # Decode base64
        qr_binary = b64decode(qr_base64)
        
        # Save to file
        qr_filename = f"{filename}_qr.png"
        with open(qr_filename, 'wb') as f:
            f.write(qr_binary)
        
        file_size = os.path.getsize(qr_filename)
        print(f"   💾 Saved QR code: {qr_filename} ({file_size} bytes)")
        
        return qr_filename
        
    except Exception as e:
        print(f"   ❌ QR save failed: {e}")
        return None

def test_existing_deployments():
    """Test if there are existing deployments we can use"""
    
    print(f"\n📋 CHECKING EXISTING DEPLOYMENTS")
    print("=" * 35)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    try:
        response = requests.get(f"{BASE_URL}/deployments", headers=headers)
        
        print(f"GET /deployments: {response.status_code}")
        
        if response.status_code == 200:
            deployments = response.json()['data']
            
            if deployments:
                print(f"✅ Found {len(deployments)} existing deployment(s):")
                
                for deployment in deployments:
                    deployment_id = deployment['id']
                    name = deployment['attributes'].get('name', f'Deployment {deployment_id}')
                    
                    print(f"   📋 ID: {deployment_id}")
                    print(f"       Name: {name}")
                
                # Test invitation with first deployment
                first_deployment_id = deployments[0]['id']
                print(f"\n🧪 Testing invitation with deployment {first_deployment_id}...")
                
                return test_deployment_invitation_with_qr(first_deployment_id)
            else:
                print("❌ No existing deployments found")
                
        else:
            print(f"❌ Failed to get deployments: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    return None

def demonstrate_complete_flow():
    """Demonstrate complete deployment → invitation → QR code flow"""
    
    print(f"\n🚀 COMPLETE DEPLOYMENT FLOW TEST")
    print("=" * 40)
    
    # Step 1: Try to create new deployment
    print("🎯 STEP 1: Create deployment")
    deployment_id = test_deployment_creation()
    
    if deployment_id:
        # Step 2: Create invitation with QR code
        print(f"\n🎯 STEP 2: Create invitation + QR code")
        result = test_deployment_invitation_with_qr(deployment_id)
        
        if result:
            print(f"\n🎉 COMPLETE SUCCESS!")
            print(f"✅ Created deployment: {deployment_id}")
            print(f"✅ Created invitation: {result['invitation_id']}")
            print(f"✅ Got URL: {result['url']}")
            print(f"✅ Got QR code: {'YES' if result['qr_code'] else 'NO'}")
            
            if result['qr_code']:
                print(f"✅ Saved QR image: {result['qr_file']}")
            
            return result
    else:
        # Fallback: Test with existing deployments
        print(f"\n🔄 FALLBACK: Testing with existing deployments")
        return test_existing_deployments()
    
    return None

def analyze_deployment_success():
    """Analyze what deployment success means for our business"""
    
    print(f"\n🎯 DEPLOYMENT SUCCESS ANALYSIS")
    print("=" * 35)
    
    print("🔥 IF DEPLOYMENTS API WORKS:")
    print("✅ 100% automated customer onboarding!")
    print("✅ Create deployments programmatically")
    print("✅ Generate QR codes on-demand")
    print("✅ Show QR codes in our app")
    print("✅ No manual SimpleMDM dashboard work")
    print("✅ Scales to unlimited customers")
    print("")
    
    print("📱 PERFECT CUSTOMER EXPERIENCE:")
    customer_flow = '''
1. Customer signs up → Payment processed
   ↓
2. Backend creates SimpleMDM deployment
   ↓
3. Backend creates invitation → gets QR code
   ↓
4. Customer sees QR code in our app immediately
   ↓
5. Customer scans with iPhone Camera
   ↓
6. Profile installs → Device enrolled
   ↓
7. Webhook → Auto-assign parental control profile
   ↓
8. Customer gets dashboard access
   ↓
9. Family digital wellness activated!
'''
    print(customer_flow)
    
    print("🏆 COMPETITIVE ADVANTAGES:")
    print("• 🚀 Faster than any competitor (instant QR codes)")
    print("• 💼 More professional than app-based solutions")
    print("• 📱 Better UX than email/SMS links")
    print("• 🔧 Zero manual work after development")
    print("• 🏢 Enterprise-grade backend infrastructure")

def main():
    print("🔥 SIMPLEMDM DEPLOYMENTS API TEST")
    print("=" * 40)
    print("Testing CORRECT SimpleMDM terminology: DEPLOYMENTS not enrollments!")
    print("")
    
    # Test complete flow
    result = demonstrate_complete_flow()
    
    if result:
        print(f"\n🎉 BREAKTHROUGH CONFIRMED!")
        print("✅ SimpleMDM deployments API works!")
        if result.get('qr_code'):
            print("✅ QR codes generated automatically!")
            print("✅ 100% automation possible!")
        else:
            print("✅ URLs generated (can create QR codes ourselves)")
            print("✅ 99% automation possible!")
        
        analyze_deployment_success()
        
    else:
        print(f"\n📋 DEPLOYMENTS API ISSUES")
        print("Need to investigate further or use hybrid approach")

if __name__ == "__main__":
    main()

