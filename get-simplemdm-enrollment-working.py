#!/usr/bin/env python3

import requests
from base64 import b64encode
import webbrowser

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def check_account_status():
    """Check SimpleMDM account and what's available"""
    
    print("🔍 Checking SimpleMDM Account Status...")
    print("=" * 50)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth_header}"
    }
    
    # Check account
    response = requests.get(f"{BASE_URL}/account", headers=headers)
    
    if response.status_code == 200:
        account = response.json()['data']['attributes']
        print(f"✅ Account: {account['name']}")
        
        if 'subscription' in account:
            sub = account['subscription']['licenses']
            print(f"📊 Licenses: {sub['available']}/{sub['total']} available")
        
        return True
    else:
        print(f"❌ Account check failed: {response.status_code}")
        return False

def list_devices():
    """Check what devices are enrolled"""
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth_header}"
    }
    
    response = requests.get(f"{BASE_URL}/devices", headers=headers)
    
    if response.status_code == 200:
        devices = response.json()['data']
        print(f"\n📱 Enrolled Devices: {len(devices)}")
        
        for device in devices:
            attrs = device['attributes']
            print(f"  • {attrs.get('device_name', 'Unknown')} ({attrs.get('model', 'Unknown')})")
            
        return len(devices)
    else:
        print(f"\n❌ Devices check failed: {response.status_code}")
        return 0

def check_profiles():
    """Check what profiles exist"""
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth_header}"
    }
    
    response = requests.get(f"{BASE_URL}/custom_configuration_profiles", headers=headers)
    
    if response.status_code == 200:
        profiles = response.json()['data']
        print(f"\n📋 Configuration Profiles: {len(profiles)}")
        
        for profile in profiles:
            attrs = profile['attributes']
            print(f"  • ID {profile['id']}: {attrs['name']}")
            
        return profiles
    else:
        print(f"\n❌ Profiles check failed: {response.status_code}")
        return []

def open_dashboard():
    """Open SimpleMDM dashboard for manual enrollment creation"""
    
    print(f"\n🌐 Opening SimpleMDM Dashboard...")
    
    dashboard_urls = [
        "https://a.simplemdm.com/enrollments",
        "https://a.simplemdm.com/dashboard", 
        "https://a.simplemdm.com/"
    ]
    
    for url in dashboard_urls:
        print(f"🔗 {url}")
    
    # Try to open in browser
    try:
        webbrowser.open("https://a.simplemdm.com/enrollments")
        print("📱 Browser opened to enrollments page")
    except:
        print("⚠️  Could not auto-open browser")

def provide_manual_steps():
    """Provide step-by-step manual enrollment instructions"""
    
    print("\n📋 MANUAL ENROLLMENT CREATION STEPS:")
    print("=" * 50)
    print("1. 🌐 Go to: https://a.simplemdm.com/")
    print("2. 🔑 Login with your SimpleMDM credentials")
    print("3. 📱 Navigate to: 'Device Management' → 'Enrollments'")
    print("4. ➕ Click 'Create Enrollment' or 'Generate Link'")
    print("5. 📝 Name it: 'iPhone Personal Enrollment'")
    print("6. 📋 Copy the enrollment URL")
    print("7. 📱 Send URL to your iPhone")
    print("8. 📲 Open URL on iPhone in Safari")
    print("9. ⚙️  Install SimpleMDM enrollment profile")
    print("10. 🛡️  Protection profile auto-deploys!")
    print("")
    print("💡 Alternative Path:")
    print("1. 📧 In SimpleMDM dashboard, find 'Invite Device'")
    print("2. 📧 Enter your email address")
    print("3. 📨 Check email for enrollment link")
    print("4. 📱 Open link on iPhone")

def main():
    print("🛡️  SimpleMDM Enrollment Setup Helper")
    print("=" * 50)
    
    # Check account status
    if not check_account_status():
        return
    
    # Check current devices and profiles
    device_count = list_devices()
    profiles = check_profiles()
    
    print(f"\n📊 Account Summary:")
    print(f"  Devices Enrolled: {device_count}")
    print(f"  Profiles Available: {len(profiles)}")
    
    # Provide next steps
    if profiles:
        profile_id = profiles[0]['id'] 
        print(f"\n✅ Your CleanBrowsing profile is ready (ID: {profile_id})")
        print("🎯 You just need to enroll your iPhone!")
    
    # Open dashboard and provide instructions
    open_dashboard()
    provide_manual_steps()
    
    print(f"\n🔑 Your API Key (for reference): {API_KEY[:20]}...{API_KEY[-10:]}")
    print(f"🌐 Dashboard: https://a.simplemdm.com/")
    
    print(f"\n⚡ WHAT HAPPENS AFTER ENROLLMENT:")
    print("1. 📱 iPhone enrolls in SimpleMDM")
    print("2. 🤖 Profile auto-assigns within 2-3 minutes")
    print("3. 🛡️  CleanBrowsing + Screen Time protection activates")
    print("4. ✅ Full MDM management ready!")

if __name__ == "__main__":
    main()


