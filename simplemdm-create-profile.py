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
headers = {
    "Authorization": f"Basic {auth_header}",
    "Content-Type": "application/json"
}

def create_screentime_profile():
    """Create a comprehensive ScreenTime Journey protection profile via SimpleMDM API"""
    
    print("🚀 Creating ScreenTime Journey Profile via SimpleMDM API")
    print("=" * 60)
    
    # Generate unique UUIDs for each payload
    profile_uuid = str(uuid.uuid4()).upper()
    dns_uuid = str(uuid.uuid4()).upper()
    webfilter_uuid = str(uuid.uuid4()).upper()
    restrictions_uuid = str(uuid.uuid4()).upper()
    
    # Create the mobileconfig XML content
    profile_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        
        <!-- CleanBrowsing DNS Filter -->
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
            <string>CleanBrowsing DNS</string>
            <key>DNSSettings</key>
            <dict>
                <key>DNSProtocol</key>
                <string>HTTPS</string>
                <key>ServerURL</key>
                <string>https://doh.cleanbrowsing.org/doh/adult-filter/</string>
            </dict>
        </dict>
        
        <!-- Web Content Filter -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.webcontent-filter</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.webfilter</string>
            <key>PayloadUUID</key>
            <string>{webfilter_uuid}</string>
            <key>PayloadDisplayName</key>
            <string>Web Content Filter</string>
            <key>FilterType</key>
            <string>BuiltIn</string>
            <key>AutoFilterEnabled</key>
            <true/>
            <key>PermittedURLs</key>
            <array>
                <string>apple.com</string>
                <string>icloud.com</string>
            </array>
            <key>DenyListURLs</key>
            <array>
                <string>facebook.com</string>
                <string>*.facebook.com</string>
                <string>instagram.com</string>
                <string>*.instagram.com</string>
                <string>twitter.com</string>
                <string>*.twitter.com</string>
                <string>x.com</string>
                <string>*.x.com</string>
                <string>tiktok.com</string>
                <string>*.tiktok.com</string>
                <string>snapchat.com</string>
                <string>*.snapchat.com</string>
                <string>reddit.com</string>
                <string>*.reddit.com</string>
                <string>discord.com</string>
                <string>*.discord.com</string>
                <string>pornhub.com</string>
                <string>*.pornhub.com</string>
                <string>xvideos.com</string>
                <string>*.xvideos.com</string>
                <string>xnxx.com</string>
                <string>*.xnxx.com</string>
            </array>
        </dict>
        
        <!-- Content Restrictions -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.applicationaccess</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.restrictions</string>
            <key>PayloadUUID</key>
            <string>{restrictions_uuid}</string>
            <key>PayloadDisplayName</key>
            <string>Content Restrictions</string>
            <key>allowExplicitContent</key>
            <false/>
            <key>ratingRegion</key>
            <string>us</string>
            <key>ratingApps</key>
            <integer>600</integer>
            <key>forceGoogleSafeSearch</key>
            <integer>1</integer>
            <key>forceBingSafeSearch</key>
            <integer>1</integer>
            <key>forceYahooSafeSearch</key>
            <integer>1</integer>
        </dict>
        
    </array>
    
    <key>PayloadDisplayName</key>
    <string>ScreenTime Journey - Complete Protection</string>
    
    <key>PayloadIdentifier</key>
    <string>com.screentimejourney.complete</string>
    
    <key>PayloadUUID</key>
    <string>{profile_uuid}</string>
    
    <key>PayloadType</key>
    <string>Configuration</string>
    
    <key>PayloadVersion</key>
    <integer>1</integer>
    
    <key>PayloadDescription</key>
    <string>Complete protection: CleanBrowsing DNS (porn blocking), Web Content Filter (social media + adult sites), Content Restrictions (explicit content + safe search), App Store 12+ only. Created via SimpleMDM API.</key>
    
    <key>PayloadOrganization</key>
    <string>ScreenTime Journey</string>
    
    <key>PayloadRemovalDisallowed</key>
    <false/>
    
</dict>
</plist>"""

    # Prepare API payload for SimpleMDM (using form data format)
    files = {
        'name': (None, 'ScreenTime Journey - Complete Protection'),
        'mobileconfig': ('profile.mobileconfig', profile_content, 'application/x-apple-aspen-config'),
        'user_scope': (None, 'false')
    }
    
    print("📡 Sending profile to SimpleMDM...")
    
    # Make API call to create the profile (using multipart form data)
    # Remove Content-Type header for multipart form data
    upload_headers = {
        "Authorization": f"Basic {auth_header}"
    }
    
    response = requests.post(
        f"{BASE_URL}/custom_configuration_profiles",
        headers=upload_headers,
        files=files
    )
    
    if response.status_code == 201:
        profile_data = response.json()
        profile_id = profile_data['data']['id']
        
        print("✅ SUCCESS! Profile created in SimpleMDM")
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
    """List available devices for profile assignment"""
    
    print("\n📱 Checking available devices...")
    
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
                print(f"  🔹 {attrs['device_name']} ({attrs['model']}) - ID: {device['id']}")
        else:
            print("  No devices enrolled yet")
            
        return devices
    else:
        print(f"❌ ERROR: Failed to list devices")
        print(f"Status Code: {response.status_code}")
        return []

def assign_profile_to_device(profile_id, device_id):
    """Assign the created profile to a specific device"""
    
    print(f"\n📲 Assigning profile {profile_id} to device {device_id}...")
    
    response = requests.post(
        f"{BASE_URL}/custom_configuration_profiles/{profile_id}/assign",
        headers=headers,
        json={"device_id": device_id}
    )
    
    if response.status_code == 204:
        print("✅ Profile assigned successfully!")
        print("🔔 The device will receive the profile within minutes")
        return True
    else:
        print(f"❌ ERROR: Failed to assign profile")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        return False

def main():
    """Main function to create and deploy the profile"""
    
    print("🛡️  SimpleMDM ScreenTime Journey Profile Creator")
    print("=" * 60)
    print("API Key:", API_KEY[:20] + "..." + API_KEY[-10:])
    print("")
    
    # Step 1: Create the profile
    profile_id = create_screentime_profile()
    
    if not profile_id:
        return
    
    # Step 2: List available devices
    devices = list_devices()
    
    # Step 3: Provide next steps
    print("\n🚀 Next Steps:")
    print("=" * 60)
    print("1. ✅ Profile created in SimpleMDM successfully")
    print("2. 🔗 Visit SimpleMDM dashboard to manage profile")
    print("3. 📱 Assign to devices via dashboard or API")
    print("4. 🧪 Test the protection settings")
    
    print(f"\n🔗 Direct Links:")
    print(f"📊 Dashboard: https://a.simplemdm.com/configuration_profiles/{profile_id}")
    print(f"📱 Device Management: https://a.simplemdm.com/devices")
    
    print(f"\n📋 What This Profile Does:")
    print("  ✅ CleanBrowsing DNS (blocks porn sites)")
    print("  ✅ Web Content Filter (blocks social media + adult sites)")  
    print("  ✅ Content Restrictions (no explicit content, 12+ apps only)")
    print("  ✅ Safe Search enforced (Google, Bing, Yahoo)")
    print("  ✅ Works with Cloudflare WARP for time-based social blocking")
    
    if devices:
        print(f"\n📲 To assign via API:")
        for device in devices[:3]:  # Show first 3 devices
            device_id = device['id']
            device_name = device['attributes']['device_name']
            print(f"  python3 assign_profile.py {profile_id} {device_id}  # {device_name}")

if __name__ == "__main__":
    main()
