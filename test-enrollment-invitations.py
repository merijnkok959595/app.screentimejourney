#!/usr/bin/env python3

import requests
from base64 import b64encode
import json

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def get_existing_enrollments():
    """Get existing enrollments to test invitations API"""
    
    print("🔍 GETTING EXISTING ENROLLMENTS")
    print("=" * 35)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    try:
        response = requests.get(f"{BASE_URL}/enrollments", headers=headers)
        
        if response.status_code == 200:
            enrollments = response.json()['data']
            
            if enrollments:
                print(f"✅ Found {len(enrollments)} existing enrollment(s):")
                
                for enrollment in enrollments:
                    enrollment_id = enrollment['id']
                    name = enrollment['attributes'].get('name', f'Enrollment {enrollment_id}')
                    url = enrollment['attributes']['url']
                    
                    print(f"   📋 ID: {enrollment_id}")
                    print(f"       Name: {name}")
                    print(f"       URL: {url}")
                    print("")
                
                return enrollments
            else:
                print("❌ No existing enrollments found")
                print("💡 Need to create enrollment in SimpleMDM dashboard first")
                return []
        else:
            print(f"❌ Failed to get enrollments: {response.status_code}")
            print(f"Response: {response.text}")
            return []
            
    except Exception as e:
        print(f"💥 Error getting enrollments: {e}")
        return []

def test_enrollment_invitations(enrollment_id, test_email="test@screentimejourney.com"):
    """Test sending enrollment invitation via API"""
    
    print(f"📧 TESTING ENROLLMENT INVITATIONS API")
    print("=" * 40)
    print(f"Enrollment ID: {enrollment_id}")
    print(f"Test email: {test_email}")
    print("")
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Test the invitations endpoint
    invitation_data = {
        "contact": test_email
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/enrollments/{enrollment_id}/invitations",
            headers=headers,
            data=invitation_data,  # Using form data as shown in docs
            timeout=10
        )
        
        print(f"📡 POST /enrollments/{enrollment_id}/invitations")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("🎉 SUCCESS! Enrollment invitation sent!")
            print(f"Response: {response.text}")
            
            print(f"\n✅ WHAT HAPPENED:")
            print(f"• SimpleMDM sent enrollment link to {test_email}")
            print(f"• Email contains unique enrollment URL")
            print(f"• URL is single-use for this specific person")
            print(f"• This is REAL-TIME enrollment distribution!")
            
            return True
            
        elif response.status_code == 404:
            print("❌ 404 - Endpoint not found")
            print("Maybe invitations API doesn't exist or different path?")
            
        elif response.status_code == 422:
            print("⚠️ 422 - Validation error")
            print(f"Response: {response.text}")
            print("This means endpoint exists but data format is wrong!")
            
        else:
            print(f"❌ Unexpected status: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"💥 Request failed: {e}")
    
    return False

def test_phone_number_invitations(enrollment_id, test_phone="+31612345678"):
    """Test sending enrollment invitation to phone number"""
    
    print(f"\n📱 TESTING PHONE NUMBER INVITATIONS")
    print("=" * 35)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    invitation_data = {
        "contact": test_phone
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/enrollments/{enrollment_id}/invitations",
            headers=headers,
            data=invitation_data,
            timeout=10
        )
        
        print(f"📡 POST /enrollments/{enrollment_id}/invitations")
        print(f"Phone: {test_phone}")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("🎉 SUCCESS! SMS invitation sent!")
            print(f"Response: {response.text}")
            return True
        else:
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"💥 Phone invitation failed: {e}")
    
    return False

def analyze_invitations_workflow():
    """Analyze the invitations-based workflow"""
    
    print(f"\n🚀 INVITATIONS-BASED ENROLLMENT WORKFLOW")
    print("=" * 45)
    
    print("🎯 HOW IT WORKS:")
    workflow = '''
1. 🎛️ Pre-create enrollment in SimpleMDM dashboard
   → Get enrollment ID (e.g., 12345)

2. 👤 Customer signs up on screentimejourney.com
   → Provides email/phone number

3. 📧 Backend calls SimpleMDM API:
   POST /v1/enrollments/12345/invitations
   {"contact": "customer@email.com"}

4. 📱 SimpleMDM sends email/SMS to customer
   → Contains unique enrollment link for this person

5. 📲 Customer clicks link and installs profile
   → Device becomes enrolled and managed

6. 🔔 SimpleMDM webhook: device enrolled
   → Auto-assign parental control profile
'''
    print(workflow)
    
    print("✅ ADVANTAGES OF THIS APPROACH:")
    print("• ✅ Real-time invitation sending")
    print("• ✅ Each invitation is unique per person")
    print("• ✅ No manual URL distribution needed")
    print("• ✅ Professional email/SMS delivery")
    print("• ✅ Automatic tracking per invitation")
    print("• ✅ Works with existing enrollment setup")
    print("")
    
    print("🔧 IMPLEMENTATION REQUIREMENTS:")
    print("• 📋 Pre-create 10-20 enrollments in dashboard")
    print("• 💾 Store enrollment IDs in database")
    print("• 🔄 Round-robin assignment of enrollments")
    print("• 📧 API integration for invitation sending")
    print("• 📊 Webhook handling for enrollment events")

def create_implementation_plan():
    """Create implementation plan for invitations-based system"""
    
    print(f"\n📋 INVITATIONS-BASED IMPLEMENTATION PLAN")
    print("=" * 45)
    
    print("🎯 PHASE 1: SETUP (Week 1)")
    print("• 🎛️ Create 20 enrollments in SimpleMDM dashboard")
    print("• 📋 Note down all enrollment IDs")
    print("• 💾 Store enrollment IDs in database")
    print("• 🧪 Test invitations API with each enrollment")
    print("")
    
    print("🎯 PHASE 2: AUTOMATION (Week 2)")
    print("• 🤖 Build customer signup flow")
    print("• 📧 Integrate invitations API calls")
    print("• 🔄 Implement round-robin enrollment assignment")
    print("• 📡 Set up webhook handlers for device enrollment")
    print("")
    
    print("🎯 PHASE 3: BUSINESS LOGIC (Week 3)")
    print("• 💳 Integrate payment processing")
    print("• 🎛️ Auto-assign parental control profiles")
    print("• 📊 Build parent dashboard")
    print("• 📧 Email sequences for onboarding")
    print("")
    
    code_example = '''
# Implementation example
def assign_enrollment_invitation(customer_email):
    # Get next available enrollment ID
    enrollment_id = get_next_enrollment_id()
    
    # Send invitation via SimpleMDM API
    response = requests.post(
        f"https://a.simplemdm.com/api/v1/enrollments/{enrollment_id}/invitations",
        headers={"Authorization": f"Basic {api_key}"},
        data={"contact": customer_email}
    )
    
    if response.status_code == 200:
        # Mark enrollment as assigned to this customer
        mark_enrollment_assigned(enrollment_id, customer_email)
        return True
    
    return False
'''
    print("💻 CODE EXAMPLE:")
    print(code_example)

def main():
    print("📧 SIMPLEMDM ENROLLMENT INVITATIONS API TEST")
    print("=" * 50)
    print("Testing the newly discovered invitations API endpoint!")
    print("")
    
    # Get existing enrollments
    enrollments = get_existing_enrollments()
    
    if enrollments:
        # Test with first enrollment
        first_enrollment = enrollments[0]
        enrollment_id = first_enrollment['id']
        
        # Test email invitation
        email_success = test_enrollment_invitations(enrollment_id)
        
        # Test phone invitation  
        phone_success = test_phone_number_invitations(enrollment_id)
        
        if email_success or phone_success:
            print(f"\n🎉 BREAKTHROUGH!")
            print("✅ SimpleMDM invitations API works!")
            print("✅ We can send real-time enrollment invitations!")
            print("✅ This is better than pre-created URL pools!")
            
            analyze_invitations_workflow()
            create_implementation_plan()
        else:
            print(f"\n📋 INVITATIONS API NOT WORKING")
            print("Falling back to our hybrid pre-created system")
    else:
        print(f"\n📋 NO EXISTING ENROLLMENTS")
        print("Need to create enrollments in SimpleMDM dashboard first")
        print("Then we can test the invitations API")
        
        analyze_invitations_workflow()
        create_implementation_plan()

if __name__ == "__main__":
    main()

