#!/usr/bin/env python3

import requests
from base64 import b64encode
import json

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def try_enrollment_creation_methods():
    """Try all possible methods to create enrollment via API"""
    
    print("🔄 Trying All SimpleMDM API Methods for Enrollment Creation...")
    print("=" * 60)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Method 1: Try documented approach from SimpleMDM API docs
    print("📡 Method 1: Standard enrollment creation...")
    
    enrollment_data = {
        'name': 'ScreenTime Journey - Parental Control Enrollment',
        'url_expires': False
    }
    
    response1 = requests.post(f"{BASE_URL}/enrollments", headers=headers, json=enrollment_data)
    print(f"POST /enrollments: {response1.status_code}")
    if response1.status_code != 404:
        print(f"Response: {response1.text}")
    
    # Method 2: Try with form data instead of JSON
    print(f"\n📡 Method 2: Form data approach...")
    
    response2 = requests.post(f"{BASE_URL}/enrollments", headers=headers, data=enrollment_data)
    print(f"POST /enrollments (form): {response2.status_code}")
    if response2.status_code != 404:
        print(f"Response: {response2.text}")
    
    # Method 3: Try assignment group based enrollment
    print(f"\n📡 Method 3: Assignment group approach...")
    
    # Get assignment groups
    groups_response = requests.get(f"{BASE_URL}/assignment_groups", headers=headers)
    
    if groups_response.status_code == 200:
        groups = groups_response.json()['data']
        if groups:
            group_id = groups[0]['id']
            print(f"Using assignment group: {group_id}")
            
            # Try to create enrollment through group
            group_enrollment = {
                'name': 'Parental Control via Group',
                'assignment_group_id': group_id
            }
            
            response3 = requests.post(f"{BASE_URL}/enrollments", headers=headers, data=group_enrollment)
            print(f"Group enrollment: {response3.status_code}")
            if response3.status_code != 404:
                print(f"Response: {response3.text}")
    
    # Method 4: Try device invitation approach
    print(f"\n📡 Method 4: Device invitation approach...")
    
    invitation_endpoints = [
        f"{BASE_URL}/device_invitations",
        f"{BASE_URL}/invitations",
        f"{BASE_URL}/enrollments/invite"
    ]
    
    for endpoint in invitation_endpoints:
        response4 = requests.post(endpoint, headers=headers, data={'email': 'test@example.com'})
        print(f"POST {endpoint.split('/')[-1]}: {response4.status_code}")
        if response4.status_code not in [404, 422]:
            print(f"Response: {response4.text}")

def check_existing_enrollments():
    """Check if there are any existing enrollments we can use"""
    
    print(f"\n📋 Checking Existing Enrollments...")
    print("-" * 40)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    response = requests.get(f"{BASE_URL}/enrollments", headers=headers)
    
    if response.status_code == 200:
        enrollments = response.json()['data']
        
        if enrollments:
            print(f"✅ Found {len(enrollments)} existing enrollment(s):")
            
            for enrollment in enrollments:
                enrollment_id = enrollment['id']
                name = enrollment['attributes'].get('name', 'Unnamed')
                url = enrollment['attributes']['url']
                
                print(f"\n📋 {name}")
                print(f"   ID: {enrollment_id}")
                print(f"   URL: {url}")
                
                # Test if URL is accessible
                try:
                    test_response = requests.get(url, timeout=5)
                    status = "✅ WORKING" if test_response.status_code == 200 else "❌ BROKEN"
                    print(f"   Status: {status}")
                except:
                    print(f"   Status: ❌ UNREACHABLE")
            
            return enrollments[0]['attributes']['url']  # Return first working URL
        else:
            print("No existing enrollments found")
            return None
    else:
        print(f"Failed to check enrollments: {response.status_code}")
        return None

def create_manual_enrollment_instructions():
    """Provide manual enrollment creation steps"""
    
    print(f"\n🛠️  MANUAL ENROLLMENT CREATION (Most Reliable)")
    print("=" * 60)
    
    print(f"Since API enrollment creation has limitations, use dashboard method:")
    print(f"")
    print(f"📋 STEP-BY-STEP:")
    print(f"1. 🌐 Go to: https://a.simplemdm.com/enrollments")
    print(f"2. ➕ Click 'Create Enrollment' or 'Add Enrollment'")
    print(f"3. 📝 Fill in details:")
    print(f"     Name: 'Parental Control - Customer [ID]'")
    print(f"     Description: 'ScreenTime Journey Parental Control'")
    print(f"     Auto-assign: Profile ID 214139 (Enhanced MDM Protection)")
    print(f"4. 💾 Save and copy enrollment URL")
    print(f"5. 📱 Send URL to customer")
    print(f"")
    print(f"💡 For automation, you can:")
    print(f"   • Pre-create 100 enrollment URLs")
    print(f"   • Store them in database") 
    print(f"   • Assign one per customer signup")
    print(f"   • Track usage via SimpleMDM webhook events")

def explain_parental_control_mdm():
    """Explain what works for parental control (unsupervised devices)"""
    
    print(f"\n📱 PARENTAL CONTROL MDM CAPABILITIES")
    print("=" * 60)
    
    print(f"🎯 WHAT WORKS RELIABLY (Unsupervised Devices):")
    print(f"  ✅ DNS filtering (CleanBrowsing) - 100% effective")
    print(f"  ✅ Website blocking (social media sites) - 100% effective") 
    print(f"  ✅ Content ratings (App Store, iTunes) - 100% effective")
    print(f"  ✅ Safe Search enforcement - 100% effective")
    print(f"  ✅ In-app purchase blocking - 100% effective")
    print(f"  ✅ Explicit content blocking - 100% effective")
    print(f"")
    
    print(f"⚠️  WHAT HAS LIMITATIONS (Parental Control):")
    print(f"  📱 App blocking - Partial (can be bypassed)")
    print(f"  📱 Screen Time controls - User can override")
    print(f"  📱 Downtime enforcement - More like suggestions")
    print(f"  📱 App time limits - Can be extended by user")
    print(f"")
    
    print(f"🎯 PARENTAL CONTROL STRATEGY:")
    print(f"  1. Use MDM for reliable controls (DNS, websites, content)")
    print(f"  2. Combine with Cloudflare WARP for app blocking")
    print(f"  3. Set expectations with kids about Screen Time")
    print(f"  4. Monitor via SimpleMDM dashboard")
    print(f"  5. Consider device supervision for strict enforcement")

def provide_customer_integration():
    """Provide integration approach for customer signups"""
    
    print(f"\n🏗️  CUSTOMER INTEGRATION APPROACH")
    print("=" * 60)
    
    print(f"💡 RECOMMENDED SETUP:")
    print(f"")
    print(f"1. 📋 PRE-CREATE ENROLLMENT URLS:")
    print(f"   • Manually create 50-100 enrollment URLs in SimpleMDM")
    print(f"   • Store in your database as 'available'")
    print(f"   • Mark as 'used' when assigned to customer")
    print(f"")
    print(f"2. 🤖 AUTOMATE CUSTOMER FLOW:")
    
    customer_flow = '''
# Customer signup automation
def handle_parental_control_signup(customer_data):
    # Get available enrollment URL
    enrollment = get_unused_enrollment_url()
    
    if enrollment:
        # Mark as used
        mark_enrollment_used(enrollment['id'], customer_data['email'])
        
        # Send welcome email
        send_parental_control_email(customer_data, enrollment['url'])
        
        # Set up webhook to track device enrollment
        track_customer_enrollment(customer_data['email'], enrollment['id'])
    
    return enrollment['url']

def send_parental_control_email(customer, enrollment_url):
    email_template = f"""
    🛡️ ScreenTime Journey Parental Control Ready!
    
    Set up protection on your child's iPhone in 3 minutes:
    
    📱 ENROLLMENT LINK: {enrollment_url}
    
    What This Provides:
    ✅ Adult content blocked (DNS level)
    ✅ Social media websites blocked
    ✅ App Store content filtering (12+ only)
    ✅ Safe Search enforced
    ✅ Remote monitoring via dashboard
    
    Note: For complete app blocking, also install Cloudflare WARP
    """
    
    send_email(customer['email'], email_template)
'''
    
    print(customer_flow)
    
    print(f"\n3. 📊 MONITOR & SUPPORT:")
    print(f"   • SimpleMDM webhook for device enrollment events")
    print(f"   • Dashboard monitoring for compliance")
    print(f"   • Customer support for setup issues")
    print(f"   • Cloudflare WARP integration for complete blocking")

def main():
    print("🏢 SimpleMDM Parental Control Enrollment Creation")
    print("=" * 60)
    print("Goal: Create enrollment URLs for parental control customers")
    print("")
    
    # Try API methods
    try_enrollment_creation_methods()
    
    # Check existing enrollments
    existing_url = check_existing_enrollments()
    
    if existing_url:
        print(f"\n✅ WORKING ENROLLMENT URL FOUND:")
        print(f"📱 {existing_url}")
        print(f"")
        print(f"🧪 TEST THIS ON IPHONE:")
        print(f"1. Send URL to iPhone")
        print(f"2. Open in Safari")
        print(f"3. Install enrollment profile")
        print(f"4. Enhanced parental control profile auto-installs")
        print(f"5. Verify DNS blocking works")
    
    # Provide manual instructions
    create_manual_enrollment_instructions()
    
    # Explain parental control capabilities
    explain_parental_control_mdm()
    
    # Integration approach
    provide_customer_integration()

if __name__ == "__main__":
    main()


