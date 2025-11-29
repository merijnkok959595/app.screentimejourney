#!/usr/bin/env python3

import requests
from base64 import b64encode
import webbrowser

# SimpleMDM API Configuration  
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def check_mdm_readiness():
    """Check if SimpleMDM is ready for proper device management"""
    
    print("🔍 Checking SimpleMDM Readiness for Device Management...")
    print("=" * 60)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Check push certificate
    cert_response = requests.get(f"{BASE_URL}/push_certificate", headers=headers)
    
    if cert_response.status_code == 200:
        cert_data = cert_response.json()['data']['attributes']
        topic = cert_data.get('topic', 'Not configured')
        expires = cert_data.get('expires_at', 'Unknown')
        
        print(f"📋 Push Certificate Status:")
        print(f"  Topic: {topic}")
        print(f"  Expires: {expires}")
        
        if topic and topic != 'Not configured':
            print(f"  Status: ✅ PROPERLY CONFIGURED")
            print(f"  MDM Management: ✅ READY")
            return True
        else:
            print(f"  Status: ❌ NOT CONFIGURED") 
            print(f"  MDM Management: ❌ BROKEN")
            print(f"  Issue: This causes 'server URL mismatch' in enrollments")
            return False
    else:
        print(f"❌ Cannot check certificate: {cert_response.status_code}")
        return False

def test_enrollment_creation():
    """Test if enrollment creation works (indicates MDM is ready)"""
    
    print(f"\n🧪 Testing Enrollment Creation...")
    print("-" * 40)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Try to create a test enrollment
    test_data = {
        'name': 'Test MDM Enrollment - Management Check'
    }
    
    # The API endpoint might not work, but we can check the error
    response = requests.post(f"{BASE_URL}/enrollments", headers=headers, data=test_data)
    
    print(f"Enrollment Creation Test: Status {response.status_code}")
    
    if response.status_code == 201:
        enrollment = response.json()['data']
        print(f"✅ SUCCESS! MDM enrollment works!")
        print(f"🔗 Test enrollment URL: {enrollment['attributes']['url']}")
        return enrollment['attributes']['url']
    else:
        print(f"❌ Enrollment creation failed")
        print(f"Response: {response.text[:150]}")
        return None

def provide_push_certificate_fix():
    """Provide detailed instructions to fix push certificate"""
    
    print(f"\n🛠️  HOW TO ENABLE PROPER MDM MANAGEMENT")
    print("=" * 60)
    
    print(f"🎯 GOAL: Enable SimpleMDM to manage devices remotely")
    print(f"")
    
    print(f"📋 STEP 1: Fix Push Certificate (Required)")
    print(f"1. 🌐 Go to: https://a.simplemdm.com/settings/push_certificate")
    print(f"2. 📥 Download CSR (Certificate Signing Request)")
    print(f"3. 🍎 Go to Apple Developer Portal: https://developer.apple.com/account/")
    print(f"4. 📜 Create new certificate: Services → Apple Push Notification SSL")
    print(f"5. 📁 Upload CSR to Apple, download certificate")
    print(f"6. 📤 Upload certificate back to SimpleMDM")
    print(f"7. ⏱️  Wait 10-15 minutes for propagation")
    print(f"")
    
    print(f"📋 STEP 2: Test MDM Enrollment")
    print(f"1. 🔄 Run this script again to verify certificate")
    print(f"2. 🧪 Create test enrollment in SimpleMDM dashboard")
    print(f"3. 📱 Test enrollment on device")
    print(f"4. ✅ Verify device appears in SimpleMDM dashboard")
    print(f"")
    
    print(f"📋 STEP 3: Assign Protection Profile")
    print(f"1. 📋 Go to your profile: https://a.simplemdm.com/configuration_profiles/214139")
    print(f"2. 🎯 Assign to enrolled device automatically")
    print(f"3. 📱 Profile pushes to device remotely")
    print(f"4. 🛡️  Full MDM management active!")

def explain_mdm_vs_direct():
    """Explain difference between MDM managed vs direct profiles"""
    
    print(f"\n📊 MDM MANAGED vs DIRECT PROFILES")
    print("=" * 60)
    
    print(f"🏢 MDM MANAGED (What You Want):")
    print(f"  ✅ Remote profile updates")
    print(f"  ✅ Device compliance monitoring") 
    print(f"  ✅ Centralized management dashboard")
    print(f"  ✅ Professional customer experience")
    print(f"  ✅ Automatic profile assignment")
    print(f"  ✅ Remote profile removal")
    print(f"  ✅ Device enrollment tracking")
    print(f"")
    
    print(f"📱 DIRECT PROFILES (Current S3 Method):")
    print(f"  ✅ Same protection level")
    print(f"  ✅ Fast customer setup")
    print(f"  ✅ Always works (no MDM issues)")
    print(f"  ❌ No remote management")
    print(f"  ❌ No dashboard visibility")
    print(f"  ❌ Customer can remove anytime")
    print(f"  ❌ Can't update settings remotely")
    print(f"")
    
    print(f"🎯 RECOMMENDATION:")
    print(f"  • Fix SimpleMDM for business customers (enterprise)")
    print(f"  • Keep direct profiles as backup/consumer option")
    print(f"  • Offer both tiers: 'Basic' (direct) vs 'Managed' (MDM)")

def open_required_pages():
    """Open pages needed to fix MDM"""
    
    print(f"\n🌐 Opening Required Pages...")
    
    urls = [
        "https://a.simplemdm.com/settings/push_certificate",
        "https://developer.apple.com/account/",
        "https://a.simplemdm.com/configuration_profiles/214139"
    ]
    
    for url in urls:
        try:
            webbrowser.open(url)
            print(f"📱 Opened: {url}")
        except:
            print(f"⚠️  Manual open needed: {url}")

def main():
    print("🏢 SimpleMDM Device Management Enabler")
    print("=" * 60)
    print("Goal: Enable proper MDM management for customer devices")
    print("")
    
    # Check current MDM readiness
    mdm_ready = check_mdm_readiness()
    
    if mdm_ready:
        print(f"\n🎉 GREAT! SimpleMDM is properly configured!")
        
        # Test enrollment creation
        enrollment_url = test_enrollment_creation()
        
        if enrollment_url:
            print(f"\n✅ RESULT: Full MDM management is working!")
            print(f"🔗 Use this for customer enrollments: {enrollment_url}")
        else:
            print(f"\n⚠️  MDM configured but enrollment API needs work")
            print(f"💡 Use SimpleMDM dashboard to create enrollments manually")
    
    else:
        print(f"\n🔧 MDM management needs setup...")
        provide_push_certificate_fix()
        open_required_pages()
    
    # Explain the difference
    explain_mdm_vs_direct()
    
    print(f"\n🎯 NEXT STEPS:")
    print(f"1. 🔧 Fix push certificate (if needed)")
    print(f"2. 🧪 Test MDM enrollment")  
    print(f"3. 🏗️  Build dual-tier customer system:")
    print(f"   • Basic Protection: Direct profiles (current)")
    print(f"   • Managed Protection: SimpleMDM enrollment")
    print(f"4. 🎉 Offer both options to customers!")

if __name__ == "__main__":
    main()


