#!/usr/bin/env python3

import requests
from base64 import b64encode, b64decode
import json
import os
from datetime import datetime

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def test_enrollment_creation():
    """Test creating enrollments programmatically via API"""
    
    print("🔥 TESTING ENROLLMENT CREATION VIA API")
    print("=" * 40)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth_header}",
        "Content-Type": "application/json"
    }
    
    # Test creating a new enrollment
    enrollment_data = {
        "name": f"ScreenTimeJourney-Test-{datetime.now().strftime('%H%M%S')}"
    }
    
    try:
        print("📡 POST /api/v1/enrollments")
        print(f"Data: {json.dumps(enrollment_data, indent=2)}")
        
        response = requests.post(
            f"{BASE_URL}/enrollments",
            headers=headers,
            json=enrollment_data,
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 201:
            print("🎉 SUCCESS! Enrollment created via API!")
            
            enrollment_response = response.json()
            print(f"Response: {json.dumps(enrollment_response, indent=2)}")
            
            if 'data' in enrollment_response:
                enrollment_id = enrollment_response['data']['id']
                enrollment_name = enrollment_response['data']['attributes']['name']
                enrollment_url = enrollment_response['data']['attributes'].get('url')
                
                print(f"\n✅ NEW ENROLLMENT CREATED:")
                print(f"   ID: {enrollment_id}")
                print(f"   Name: {enrollment_name}")
                print(f"   URL: {enrollment_url}")
                
                return enrollment_id, enrollment_url
                
        elif response.status_code == 404:
            print("❌ 404 - Enrollment creation endpoint not found")
            
        elif response.status_code == 422:
            print("⚠️ 422 - Validation error")
            print(f"Response: {response.text}")
            
        else:
            print(f"❌ Unexpected status: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"💥 Request failed: {e}")
    
    return None, None

def test_invitation_with_qr_code(enrollment_id, test_email="test@screentimejourney.com"):
    """Test creating invitation and getting QR code"""
    
    print(f"\n📱 TESTING INVITATION + QR CODE GENERATION")
    print("=" * 45)
    print(f"Enrollment ID: {enrollment_id}")
    print(f"Email: {test_email}")
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Create invitation WITHOUT contact (to get QR code)
    try:
        print("\n📡 POST /api/v1/enrollments/{id}/invitations")
        print("Testing WITHOUT contact parameter to get QR code...")
        
        response = requests.post(
            f"{BASE_URL}/enrollments/{enrollment_id}/invitations",
            headers=headers,
            data={},  # Empty data to see what we get
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("🎉 SUCCESS! Invitation created!")
            
            try:
                invitation_response = response.json()
                print(f"Response: {json.dumps(invitation_response, indent=2)}")
                
                # Extract invitation details
                if 'data' in invitation_response:
                    invitation_data = invitation_response['data']['attributes']
                    
                    invitation_id = invitation_response['data']['id']
                    invitation_url = invitation_data.get('url')
                    qr_code = invitation_data.get('qr')
                    
                    print(f"\n✅ INVITATION DETAILS:")
                    print(f"   ID: {invitation_id}")
                    print(f"   URL: {invitation_url}")
                    print(f"   QR Code: {'YES' if qr_code else 'NO'}")
                    
                    if qr_code:
                        print(f"   QR Code length: {len(qr_code)} characters")
                        print(f"   QR Code prefix: {qr_code[:50]}...")
                        
                        # Save QR code to file for testing
                        save_qr_code(qr_code, f"invitation_{invitation_id}")
                    
                    return invitation_id, invitation_url, qr_code
                    
            except json.JSONDecodeError:
                print(f"Raw response: {response.text}")
                
        elif response.status_code == 422:
            print("⚠️ 422 - Validation error")
            print(f"Response: {response.text}")
            
            # Try with contact parameter
            print(f"\n📧 Trying WITH contact parameter...")
            
            response2 = requests.post(
                f"{BASE_URL}/enrollments/{enrollment_id}/invitations",
                headers=headers,
                data={"contact": test_email},
                timeout=10
            )
            
            print(f"Status: {response2.status_code}")
            
            if response2.status_code == 200:
                print("✅ Success with contact parameter!")
                try:
                    invitation_response = response2.json()
                    print(f"Response: {json.dumps(invitation_response, indent=2)}")
                except:
                    print(f"Raw response: {response2.text}")
            else:
                print(f"Response: {response2.text}")
                
        else:
            print(f"❌ Unexpected status: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"💥 Request failed: {e}")
    
    return None, None, None

def save_qr_code(qr_base64, filename):
    """Save QR code from base64 to PNG file"""
    
    try:
        # Remove data:image/png;base64, prefix if present
        if qr_base64.startswith('data:image/png;base64,'):
            qr_base64 = qr_base64.replace('data:image/png;base64,', '')
        
        # Decode base64 to binary
        qr_binary = b64decode(qr_base64)
        
        # Save to file
        qr_filename = f"{filename}_qr.png"
        with open(qr_filename, 'wb') as f:
            f.write(qr_binary)
        
        print(f"   💾 QR code saved: {qr_filename}")
        print(f"   🔍 File size: {len(qr_binary)} bytes")
        
        return qr_filename
        
    except Exception as e:
        print(f"   ❌ Failed to save QR code: {e}")
        return None

def demonstrate_full_automation_workflow():
    """Demonstrate the complete automation workflow"""
    
    print(f"\n🚀 FULL AUTOMATION WORKFLOW DEMONSTRATION")
    print("=" * 50)
    
    print("🎯 STEP 1: Create enrollment programmatically")
    enrollment_id, enrollment_url = test_enrollment_creation()
    
    if enrollment_id:
        print(f"\n🎯 STEP 2: Create invitation + get QR code")
        invitation_id, invitation_url, qr_code = test_invitation_with_qr_code(enrollment_id)
        
        if invitation_id:
            print(f"\n🎉 COMPLETE SUCCESS!")
            print(f"✅ Created enrollment: {enrollment_id}")
            print(f"✅ Created invitation: {invitation_id}")
            print(f"✅ Got enrollment URL: {invitation_url}")
            print(f"✅ Got QR code: {'YES' if qr_code else 'NO'}")
            
            return {
                "enrollment_id": enrollment_id,
                "invitation_id": invitation_id, 
                "url": invitation_url,
                "qr_code": qr_code
            }
    
    return None

def analyze_automation_implications():
    """Analyze the implications of full automation"""
    
    print(f"\n🎯 AUTOMATION IMPLICATIONS")
    print("=" * 30)
    
    print("🔥 WHAT THIS MEANS:")
    print("✅ ZERO manual work needed!")
    print("✅ Create enrollments on-demand via API")
    print("✅ Generate QR codes instantly")
    print("✅ Show QR codes in our own app")
    print("✅ Send URLs via WhatsApp/email")
    print("✅ 100% automated customer onboarding")
    print("")
    
    print("📱 CUSTOMER EXPERIENCE:")
    customer_flow = '''
1. Customer signs up on screentimejourney.com
   ↓
2. Backend creates enrollment via API
   ↓
3. Backend creates invitation → gets URL + QR code
   ↓
4. Customer sees QR code in our app
   ↓
5. Customer scans QR with iPhone Camera
   ↓
6. Profile installs → Device enrolled
   ↓
7. Webhook → Auto-assign parental control profile
   ↓
8. Customer gets dashboard access
'''
    print(customer_flow)
    
    print("🏆 COMPETITIVE ADVANTAGES:")
    print("• ✅ Smoother than Qustodio (no separate apps)")
    print("• ✅ More professional than manual emails")
    print("• ✅ QR codes work better than URLs for mobile")
    print("• ✅ Instant enrollment (no waiting)")
    print("• ✅ Perfect for in-person demos")
    print("• ✅ Scales to unlimited customers")

def create_production_implementation():
    """Create production implementation plan"""
    
    print(f"\n📋 PRODUCTION IMPLEMENTATION PLAN")
    print("=" * 40)
    
    print("🎯 WEEK 1: API INTEGRATION")
    print("• 🔧 Build enrollment creation API wrapper")
    print("• 📱 Build invitation + QR code generation")
    print("• 🧪 Test complete flow end-to-end")
    print("• 💾 Database schema for tracking")
    print("")
    
    print("🎯 WEEK 2: USER INTERFACE")
    print("• 📱 QR code display in web app")
    print("• 📋 Customer onboarding flow")
    print("• 🔔 Webhook handlers for enrollment events")
    print("• 📊 Parent dashboard for device management")
    print("")
    
    print("🎯 WEEK 3: BUSINESS LOGIC")
    print("• 💳 Payment processing integration")
    print("• 🎛️ Automatic profile assignment")
    print("• 📧 Email sequences and notifications")
    print("• 📈 Analytics and conversion tracking")
    print("")
    
    implementation_code = '''
# Complete implementation example
class ScreenTimeEnrollment:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://a.simplemdm.com/api/v1"
    
    def create_customer_enrollment(self, customer_email, customer_name):
        # Step 1: Create enrollment
        enrollment = self.create_enrollment(f"ScreenTime-{customer_name}")
        
        # Step 2: Create invitation 
        invitation = self.create_invitation(enrollment['id'])
        
        # Step 3: Store in database
        self.store_enrollment_data(customer_email, enrollment, invitation)
        
        # Step 4: Return QR code and URL for customer
        return {
            "enrollment_url": invitation['url'],
            "qr_code": invitation['qr_code'],
            "enrollment_id": enrollment['id']
        }
    
    def create_enrollment(self, name):
        response = requests.post(f"{self.base_url}/enrollments", 
                               json={"name": name}, 
                               headers=self.headers)
        return response.json()['data']
    
    def create_invitation(self, enrollment_id):
        response = requests.post(f"{self.base_url}/enrollments/{enrollment_id}/invitations",
                               headers=self.headers)
        return response.json()['data']['attributes']
'''
    
    print("💻 IMPLEMENTATION CODE:")
    print(implementation_code)

def main():
    print("🔥 SIMPLEMDM FULL AUTOMATION TEST")
    print("=" * 40)
    print("Testing complete automation: enrollment creation + QR codes!")
    print("")
    
    # Test complete workflow
    result = demonstrate_full_automation_workflow()
    
    if result:
        print(f"\n🎉 BREAKTHROUGH CONFIRMED!")
        print("✅ We can create enrollments via API")
        print("✅ We can generate QR codes on-demand") 
        print("✅ Complete automation is possible")
        print("✅ This is better than any competitor!")
        
        analyze_automation_implications()
        create_production_implementation()
        
    else:
        print(f"\n📋 AUTOMATION NOT FULLY WORKING")
        print("Some endpoints might not be available")
        print("Will need to use hybrid approach with manual enrollment creation")

if __name__ == "__main__":
    main()

