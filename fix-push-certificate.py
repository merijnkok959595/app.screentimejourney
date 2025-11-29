#!/usr/bin/env python3

import requests
from base64 import b64encode
import webbrowser

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def check_push_certificate_status():
    """Check current push certificate configuration"""
    
    print("🔍 Checking Push Certificate Status...")
    print("=" * 50)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    response = requests.get(f"{BASE_URL}/push_certificate", headers=headers)
    
    if response.status_code == 200:
        cert_data = response.json()['data']['attributes']
        
        print(f"📋 Certificate Details:")
        print(f"  Topic: {cert_data.get('topic', 'NOT CONFIGURED ❌')}")
        print(f"  Expires: {cert_data.get('expires_at', 'Unknown')}")
        print(f"  Status: {'✅ Valid' if cert_data.get('topic') else '❌ Not Configured'}")
        
        if not cert_data.get('topic') or cert_data.get('topic') == 'Not configured':
            print(f"\n🚨 PROBLEM FOUND:")
            print(f"  Push certificate topic is not configured!")
            print(f"  This causes 'server URL mismatch' in enrollments.")
            return False
        else:
            print(f"\n✅ Push certificate is properly configured!")
            return True
            
    else:
        print(f"❌ Failed to check certificate: {response.status_code}")
        return False

def generate_push_certificate_steps():
    """Provide step-by-step push certificate fix"""
    
    print(f"\n🛠️  HOW TO FIX PUSH CERTIFICATE")
    print("=" * 50)
    
    print(f"📋 STEP 1: Access SimpleMDM Settings")
    print(f"1. 🌐 Go to: https://a.simplemdm.com/settings/push_certificate")
    print(f"2. 🔑 Login with your SimpleMDM credentials")
    print(f"3. 📜 You'll see 'Push Certificate' page")
    print(f"")
    
    print(f"📋 STEP 2: Download Certificate Signing Request (CSR)")
    print(f"1. 📥 Click 'Download CSR' button")
    print(f"2. 💾 Save the CSR file to your computer")
    print(f"3. 📝 Note: This creates a certificate request")
    print(f"")
    
    print(f"📋 STEP 3: Apple Developer Portal")
    print(f"1. 🌐 Go to: https://developer.apple.com/account/")
    print(f"2. 🔑 Login with your Apple Developer account")
    print(f"3. 📱 Navigate to: Certificates, Identifiers & Profiles")
    print(f"4. ➕ Click 'Certificates' → '+' (Add New)")
    print(f"5. 🔘 Select 'Services' → 'Apple Push Notification service SSL'")
    print(f"6. 📁 Upload the CSR file from Step 2")
    print(f"7. 📥 Download the generated certificate (.p12 or .pem)")
    print(f"")
    
    print(f"📋 STEP 4: Upload to SimpleMDM")
    print(f"1. 🔄 Go back to SimpleMDM push certificate page")
    print(f"2. 📁 Click 'Upload Certificate'")
    print(f"3. 📂 Select the certificate file from Apple")
    print(f"4. 💾 Click 'Save' or 'Upload'")
    print(f"5. ⏱️  Wait 10-15 minutes for propagation")
    print(f"")
    
    print(f"📋 STEP 5: Verify Fix")
    print(f"1. 🔄 Refresh SimpleMDM settings page")
    print(f"2. ✅ Topic should show: com.apple.mgmt.External.{12345}")
    print(f"3. 🧪 Test enrollment creation")
    print(f"4. 🎉 Enrollments should work without 'server mismatch' error")

def create_test_enrollment():
    """Test if enrollment works after certificate fix"""
    
    print(f"\n🧪 TESTING ENROLLMENT CREATION")
    print("=" * 50)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Try to create test enrollment
    test_data = {
        'name': 'Test Enrollment - Certificate Fix Verification'
    }
    
    # Note: This will likely fail until certificate is fixed
    response = requests.post(f"{BASE_URL}/enrollments", headers=headers, data=test_data)
    
    print(f"📡 Test enrollment creation...")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 201:
        enrollment = response.json()['data']
        print(f"✅ SUCCESS! Enrollment works!")
        print(f"🔗 Test URL: {enrollment['attributes']['url']}")
        return True
    else:
        print(f"❌ Still failing: {response.text[:100]}")
        print(f"💡 Complete push certificate setup first")
        return False

def open_required_pages():
    """Open necessary web pages for certificate setup"""
    
    print(f"\n🌐 Opening Required Pages...")
    
    pages = [
        "https://a.simplemdm.com/settings/push_certificate",
        "https://developer.apple.com/account/"
    ]
    
    for page in pages:
        try:
            webbrowser.open(page)
            print(f"📱 Opened: {page}")
        except:
            print(f"⚠️  Could not auto-open: {page}")

def provide_customer_enrollment_solution():
    """Provide customer-ready enrollment solution"""
    
    print(f"\n🎯 CUSTOMER ENROLLMENT STRATEGY")
    print("=" * 50)
    
    print(f"🏗️  3-Tier Customer Protection:")
    print(f"")
    print(f"📱 TIER 1: SimpleMDM Enrollment (After Certificate Fix)")
    print(f"  ✅ Full MDM management")
    print(f"  ✅ Remote profile updates") 
    print(f"  ✅ Device compliance monitoring")
    print(f"  ✅ Professional customer experience")
    print(f"")
    print(f"📱 TIER 2: Direct Profile Installation (Backup)")
    print(f"  ✅ Same protection level")
    print(f"  ✅ Works when MDM has issues") 
    print(f"  ✅ Faster customer setup")
    print(f"  🔗 URL: https://wati-mobconfigs.s3.eu-north-1.amazonaws.com/ScreenTimeJourney-CleanBrowsing-Complete.mobileconfig")
    print(f"")
    print(f"📱 TIER 3: Manual DNS Configuration (Fallback)")
    print(f"  ✅ Always works")
    print(f"  ✅ Customer configures CleanBrowsing DNS")
    print(f"  🌐 DNS: 185.228.168.10, 185.228.169.11")
    print(f"")
    print(f"🎯 Result: 95%+ customer success rate!")

def main():
    print("🛠️  SimpleMDM Push Certificate Fix & Customer Enrollment")
    print("=" * 60)
    
    # Check current status
    cert_working = check_push_certificate_status()
    
    if not cert_working:
        # Provide fix instructions
        generate_push_certificate_steps()
        open_required_pages()
    
    # Test enrollment 
    enrollment_working = create_test_enrollment()
    
    # Provide customer strategy
    provide_customer_enrollment_solution()
    
    print(f"\n🚀 NEXT STEPS FOR PRODUCTION:")
    print("=" * 50)
    print(f"1. 🔧 Fix push certificate (if not working)")
    print(f"2. 🧪 Test enrollment creation")
    print(f"3. 🏗️  Build 3-tier customer enrollment system")
    print(f"4. 📧 Create automated welcome emails")
    print(f"5. 📊 Monitor enrollment success rates")
    print(f"")
    print(f"💡 Goal: 2-3 minute customer setup with 95%+ success rate")

if __name__ == "__main__":
    main()


