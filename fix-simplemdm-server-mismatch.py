#!/usr/bin/env python3

import requests
from base64 import b64encode
import json

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def check_account_configuration():
    """Check SimpleMDM account configuration for server URLs"""
    
    print("🔍 Checking SimpleMDM Account Configuration...")
    print("=" * 50)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Get account info
    response = requests.get(f"{BASE_URL}/account", headers=headers)
    
    if response.status_code == 200:
        account = response.json()['data']['attributes']
        print(f"✅ Account: {account['name']}")
        
        # Check push certificate status
        push_response = requests.get(f"{BASE_URL}/push_certificate", headers=headers)
        
        if push_response.status_code == 200:
            push_cert = push_response.json()['data']['attributes']
            print(f"📋 Push Certificate Status:")
            print(f"  Topic: {push_cert.get('topic', 'Not configured')}")
            print(f"  Expires: {push_cert.get('expires_at', 'Unknown')}")
            
            return push_cert.get('topic')
        else:
            print(f"⚠️  Push certificate check failed: {push_response.status_code}")
            return None
    else:
        print(f"❌ Account check failed: {response.status_code}")
        return None

def create_corrected_enrollment():
    """Create a properly configured onetime enrollment"""
    
    print("\n🔧 Creating Corrected Onetime Enrollment...")
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Try to create a onetime enrollment with proper configuration
    enrollment_data = {
        'name': 'iPhone Onetime Enrollment - Fixed',
        'type': 'onetime',  # Specify onetime enrollment
        'url_expires': False
    }
    
    # Try different endpoints for onetime enrollment
    endpoints_to_try = [
        f"{BASE_URL}/enrollments",
        f"{BASE_URL}/onetime_enrollments", 
        f"{BASE_URL}/device_enrollments"
    ]
    
    for endpoint in endpoints_to_try:
        print(f"\nTrying: {endpoint}")
        
        response = requests.post(endpoint, headers=headers, json=enrollment_data)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 201:
            enrollment = response.json()['data']
            url = enrollment['attributes']['url']
            
            print("✅ SUCCESS! Onetime enrollment created")
            print(f"🔗 URL: {url}")
            return url
        else:
            print(f"Response: {response.text[:200]}")
    
    return None

def fix_server_url_mismatch():
    """Provide instructions to fix server URL mismatch"""
    
    print("\n🛠️  FIXING SERVER URL MISMATCH ISSUE")
    print("=" * 50)
    
    print("This error occurs when SimpleMDM server URLs are misconfigured.")
    print("Here's how to fix it:")
    print("")
    
    print("📋 Method 1: Reset SimpleMDM Configuration")
    print("1. 🌐 Go to: https://a.simplemdm.com/settings")
    print("2. 🔧 Click 'Account Settings' or 'Organization Settings'")
    print("3. 📜 Find 'Push Certificate' or 'MDM Configuration'")
    print("4. 🔄 Click 'Regenerate' or 'Reset Configuration'")
    print("5. ⏱️  Wait 5-10 minutes for changes to propagate")
    print("6. 🔄 Try creating onetime enrollment again")
    print("")
    
    print("📋 Method 2: Use Standard Enrollment Instead")
    print("1. 🌐 Go to: https://a.simplemdm.com/enrollments")
    print("2. ➕ Click 'Create Enrollment' (NOT onetime)")
    print("3. 📝 Name: 'iPhone Standard Enrollment'")
    print("4. 💾 Save and copy URL")
    print("5. 📱 Use this URL on iPhone")
    print("")
    
    print("📋 Method 3: Manual Profile Download")
    print("1. 🌐 Go to: https://a.simplemdm.com/configuration_profiles/214139")
    print("2. 📥 Click 'Download Profile'")
    print("3. 📧 Email the .mobileconfig file to yourself")
    print("4. 📱 Open email on iPhone and tap attachment")
    print("5. ⚙️  Install profile directly")

def provide_working_alternatives():
    """Provide alternative enrollment methods that bypass server mismatch"""
    
    print("\n⚡ WORKING ALTERNATIVES (Bypass Server Issues)")
    print("=" * 50)
    
    print("🎯 Option A: Direct Profile Installation")
    print("Since you have the CleanBrowsing profile ready:")
    print("1. 📥 Download profile from SimpleMDM dashboard")
    print("2. 📧 Email to your iPhone") 
    print("3. 📱 Install directly (no enrollment needed)")
    print("")
    
    print("🎯 Option B: Apple Configurator 2 Method")
    print("1. 💻 Install Apple Configurator 2 on Mac")
    print("2. 🔌 Connect iPhone via USB")
    print("3. 📁 Add the CleanBrowsing profile")
    print("4. 📱 Install profile via Apple Configurator")
    print("")
    
    print("🎯 Option C: Manual MDM Setup")
    print("1. ⚙️  Settings > General > VPN & Device Management")
    print("2. ➕ Add Configuration Profile manually")
    print("3. 🔗 Use direct profile download URL")
    print("")
    
    print("🔗 Direct Profile URLs:")
    print("• SimpleMDM: https://a.simplemdm.com/configuration_profiles/214139")
    print("• S3 Backup: https://wati-mobconfigs.s3.eu-north-1.amazonaws.com/ScreenTimeJourney-CleanBrowsing-Complete.mobileconfig")

def main():
    print("🛠️  SimpleMDM Server Mismatch Fix")
    print("=" * 50)
    
    # Check account configuration
    topic = check_account_configuration()
    
    # Try to create corrected enrollment
    enrollment_url = create_corrected_enrollment()
    
    if enrollment_url:
        print(f"\n🎉 SUCCESS! Working enrollment URL:")
        print(f"🔗 {enrollment_url}")
        print("")
        print("📱 iPhone Instructions:")
        print("1. Copy URL above")
        print("2. Text/email to iPhone")
        print("3. Open in Safari")
        print("4. Install enrollment profile")
        print("5. CleanBrowsing protection auto-installs!")
    else:
        # Provide fix instructions
        fix_server_url_mismatch()
        provide_working_alternatives()
        
        print(f"\n💡 RECOMMENDED SOLUTION:")
        print("Use Method 2 (Standard Enrollment) or Method 3 (Manual Profile)")
        print("The server mismatch issue affects onetime enrollments specifically.")

if __name__ == "__main__":
    main()


