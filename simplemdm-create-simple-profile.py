#!/usr/bin/env python3

import requests
import json
import uuid
from base64 import b64encode

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

# Create authentication header
auth_header = b64encode(f"{API_KEY}:".encode()).decode()

def create_simple_dns_profile():
    """Create a simple DNS filtering profile that we know will work"""
    
    print("🚀 Creating Simple DNS Filtering Profile via SimpleMDM API")
    print("=" * 60)
    
    # Generate unique UUIDs
    profile_uuid = str(uuid.uuid4()).upper()
    dns_uuid = str(uuid.uuid4()).upper()
    
    # Create simple, validated mobileconfig content
    profile_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>PayloadType</key>
            <string>com.apple.dnsSettings.managed</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.dns</string>
            <key>PayloadUUID</key>
            <string>{dns_uuid}</string>
            <key>PayloadDisplayName</key>
            <string>CleanBrowsing DNS Filter</string>
            <key>DNSSettings</key>
            <dict>
                <key>ServerAddresses</key>
                <array>
                    <string>185.228.168.10</string>
                    <string>185.228.169.11</string>
                </array>
            </dict>
        </dict>
    </array>
    <key>PayloadDisplayName</key>
    <string>ScreenTime Journey - DNS Protection</string>
    <key>PayloadIdentifier</key>
    <string>com.screentimejourney.dns</string>
    <key>PayloadUUID</key>
    <string>{profile_uuid}</string>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
    <key>PayloadDescription</key>
    <string>CleanBrowsing DNS filter for adult content blocking. Created via SimpleMDM API.</string>
    <key>PayloadOrganization</key>
    <string>ScreenTime Journey</string>
</dict>
</plist>'''

    # Prepare multipart form data
    files = {
        'name': (None, 'ScreenTime Journey - DNS Protection'),
        'mobileconfig': ('profile.mobileconfig', profile_content, 'application/x-apple-aspen-config')
    }
    
    # Prepare headers
    upload_headers = {
        "Authorization": f"Basic {auth_header}"
    }
    
    print("📡 Sending simple DNS profile to SimpleMDM...")
    
    # Make API call
    response = requests.post(
        f"{BASE_URL}/custom_configuration_profiles",
        headers=upload_headers,
        files=files
    )
    
    if response.status_code == 201:
        profile_data = response.json()
        profile_id = profile_data['data']['id']
        
        print("✅ SUCCESS! DNS Profile created in SimpleMDM")
        print("=" * 60)
        print(f"📋 Profile ID: {profile_id}")
        print(f"📋 Profile Name: {profile_data['data']['attributes']['name']}")
        print(f"🔗 SimpleMDM Dashboard: https://a.simplemdm.com/configuration_profiles/{profile_id}")
        
        return profile_id
    else:
        print(f"❌ ERROR: Failed to create profile")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        return None

def list_devices():
    """List available devices"""
    
    print("\n📱 Checking available devices...")
    
    headers = {
        "Authorization": f"Basic {auth_header}"
    }
    
    response = requests.get(
        f"{BASE_URL}/devices",
        headers=headers
    )
    
    if response.status_code == 200:
        devices_data = response.json()
        devices = devices_data['data']
        
        if devices:
            print("Available devices for profile assignment:")
            for device in devices:
                attrs = device['attributes']
                print(f"  🔹 {attrs.get('device_name', 'Unknown')} ({attrs.get('model', 'Unknown')}) - ID: {device['id']}")
        else:
            print("  No devices enrolled yet. Enroll devices first:")
            print("  📱 iOS: Settings > General > VPN & Device Management")
            print("  💻 macOS: System Settings > Privacy & Security > Profiles")
            
        return devices
    else:
        print(f"❌ ERROR: Failed to list devices")
        print(f"Status Code: {response.status_code}")
        return []

def main():
    """Main function"""
    
    print("🛡️  SimpleMDM Simple Profile Creator")
    print("=" * 60)
    print("API Key:", API_KEY[:20] + "..." + API_KEY[-10:])
    print("")
    
    # Create the profile
    profile_id = create_simple_dns_profile()
    
    if not profile_id:
        return
    
    # List devices
    devices = list_devices()
    
    # Next steps
    print("\n🚀 Next Steps:")
    print("=" * 60)
    print("1. ✅ Simple DNS profile created successfully")
    print("2. 🔗 Visit SimpleMDM dashboard to assign to devices")
    print("3. 📱 Test DNS filtering (should block porn sites)")
    print("4. 🔄 Create additional payloads via dashboard if needed")
    
    print(f"\n🔗 Links:")
    print(f"📊 Profile: https://a.simplemdm.com/configuration_profiles/{profile_id}")
    print(f"📱 Devices: https://a.simplemdm.com/devices")
    print(f"📋 Enrollment: https://a.simplemdm.com/enrollments")
    
    print(f"\n📋 What This Profile Does:")
    print("  ✅ CleanBrowsing DNS (blocks adult sites)")
    print("  ✅ Simple, reliable configuration")
    print("  ✅ Compatible with iOS and macOS")
    
    print(f"\n💡 To Add More Protection:")
    print("  1. Use SimpleMDM web interface to add Web Content Filter")
    print("  2. Add Restrictions payload via dashboard")
    print("  3. Combine with Cloudflare WARP for complete protection")

if __name__ == "__main__":
    main()


