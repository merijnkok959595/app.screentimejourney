#!/usr/bin/env python3

import requests
from base64 import b64encode
import json

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"
CUSTOM_PROFILE_ID = 214139
DEVICE_ID = 2126394  # Fresh device

def check_custom_profile_content():
    """Check what's actually in our custom configuration profile"""
    
    print("🔍 CHECKING CUSTOM PROFILE CONTENT")
    print("=" * 40)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    try:
        # Use correct endpoint for custom configuration profiles
        response = requests.get(f"{BASE_URL}/custom_configuration_profiles/{CUSTOM_PROFILE_ID}", headers=headers)
        
        print(f"📡 GET /custom_configuration_profiles/{CUSTOM_PROFILE_ID}")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            profile_data = response.json()['data']
            attrs = profile_data['attributes']
            
            print(f"✅ Profile found:")
            print(f"   ID: {profile_data['id']}")
            print(f"   Name: {attrs.get('name')}")
            print(f"   Payloads: {len(attrs.get('payloads', []))}")
            
            payloads = attrs.get('payloads', [])
            
            if payloads:
                print(f"\n📦 PAYLOADS IN PROFILE:")
                for i, payload in enumerate(payloads):
                    payload_type = payload.get('PayloadType', 'Unknown')
                    payload_id = payload.get('PayloadIdentifier', 'Unknown')
                    print(f"   {i+1}. {payload_type}")
                    print(f"      ID: {payload_id}")
                    
                    # Show DNS settings if present
                    if payload_type == 'com.apple.dnsSettings.managed':
                        dns_settings = payload.get('DNSSettings', {})
                        servers = dns_settings.get('ServerAddresses', [])
                        print(f"      DNS Servers: {servers}")
                    
                    # Show web filter settings if present  
                    if payload_type == 'com.apple.webcontent-filter':
                        filter_type = payload.get('FilterType', 'Unknown')
                        auto_filter = payload.get('AutoFilterEnabled', False)
                        print(f"      Filter Type: {filter_type}")
                        print(f"      Auto Filter: {auto_filter}")
                
                return True
            else:
                print(f"\n❌ PROFILE IS EMPTY!")
                print("This is why content blocking isn't working - no payloads!")
                return False
                
        else:
            print(f"❌ Failed: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    return False

def assign_custom_profile_correct_endpoint():
    """Use the correct endpoint to assign custom configuration profile"""
    
    print(f"\n🛡️ ASSIGNING CUSTOM PROFILE - CORRECT ENDPOINT")
    print("=" * 55)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Correct endpoint from API docs for custom configuration profiles
    endpoint = f"/custom_configuration_profiles/{CUSTOM_PROFILE_ID}/devices/{DEVICE_ID}"
    url = f"{BASE_URL}{endpoint}"
    
    print(f"📡 POST {url}")
    print(f"Custom Profile ID: {CUSTOM_PROFILE_ID}")
    print(f"Device ID: {DEVICE_ID}")
    
    try:
        response = requests.post(url, headers=headers, timeout=10)
        
        print(f"🎯 Status: {response.status_code}")
        
        if response.status_code in [200, 201, 202, 204]:
            print("🎉 SUCCESS! Custom profile assigned!")
            return True
        else:
            print(f"❌ Failed: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    return False

def update_custom_profile_with_content():
    """Update the custom profile with actual parental control content"""
    
    print(f"\n🔧 UPDATING CUSTOM PROFILE WITH CONTENT")
    print("=" * 45)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth_header}",
        "Content-Type": "application/json"
    }
    
    # Create proper mobileconfig content with parental controls
    mobileconfig_content = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <!-- CleanBrowsing Adult Filter DNS -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.dnsSettings.managed</string>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.dns.cleanbrowsing</string>
            <key>PayloadUUID</key>
            <string>12345678-1234-1234-1234-123456789012</string>
            <key>PayloadDisplayName</key>
            <string>CleanBrowsing Adult Filter DNS</string>
            <key>PayloadDescription</key>
            <string>Blocks adult content via DNS filtering</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>DNSSettings</key>
            <dict>
                <key>DNSProtocol</key>
                <string>HTTPS</string>
                <key>ServerAddresses</key>
                <array>
                    <string>185.228.168.168</string>
                    <string>185.228.169.168</string>
                </array>
            </dict>
        </dict>
        
        <!-- Built-in Web Content Filter -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.webcontent-filter</string>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.webfilter.builtin</string>
            <key>PayloadUUID</key>
            <string>12345678-1234-1234-1234-123456789013</string>
            <key>PayloadDisplayName</key>
            <string>Built-in Web Content Filter</string>
            <key>PayloadDescription</key>
            <string>Blocks adult websites and social media</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>FilterType</key>
            <string>BuiltIn</string>
            <key>AutoFilterEnabled</key>
            <true/>
            <key>RestrictWeb</key>
            <true/>
        </dict>
        
        <!-- Content & Privacy Restrictions -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.applicationaccess</string>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.restrictions.content</string>
            <key>PayloadUUID</key>
            <string>12345678-1234-1234-1234-123456789014</string>
            <key>PayloadDisplayName</key>
            <string>Content &amp; Privacy Restrictions</string>
            <key>PayloadDescription</key>
            <string>Screen Time content restrictions</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>allowExplicitContent</key>
            <false/>
            <key>ratingRegion</key>
            <string>us</string>
            <key>ratingApps</key>
            <integer>600</integer>
        </dict>
    </array>
    
    <key>PayloadDisplayName</key>
    <string>ScreenTime Journey - Enhanced MDM Protection</string>
    <key>PayloadDescription</key>
    <string>Comprehensive parental control with CleanBrowsing DNS, web content filtering, and Screen Time restrictions</string>
    <key>PayloadIdentifier</key>
    <string>com.screentimejourney.mdm.enhanced</string>
    <key>PayloadRemovalDisallowed</key>
    <true/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>12345678-1234-1234-1234-123456789011</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>"""

    # Update profile with actual mobileconfig content
    try:
        # Try form data approach for file upload
        files = {'mobileconfig': ('parental-control.mobileconfig', mobileconfig_content, 'application/x-apple-aspen-config')}
        
        response = requests.patch(
            f"{BASE_URL}/custom_configuration_profiles/{CUSTOM_PROFILE_ID}",
            headers={"Authorization": f"Basic {auth_header}"},  # Remove Content-Type for multipart
            files=files,
            timeout=15
        )
        
        print(f"📡 PATCH /custom_configuration_profiles/{CUSTOM_PROFILE_ID}")
        print(f"Status: {response.status_code}")
        
        if response.status_code in [200, 202]:
            print("🎉 SUCCESS! Profile updated with parental control content!")
            return True
        else:
            print(f"❌ Update failed: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    return False

def check_device_status_and_profiles():
    """Check current device status and installed profiles"""
    
    print(f"\n📱 CHECKING DEVICE STATUS & INSTALLED PROFILES") 
    print("=" * 50)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Check device status
    try:
        response = requests.get(f"{BASE_URL}/devices/{DEVICE_ID}", headers=headers)
        
        if response.status_code == 200:
            device = response.json()['data']
            attrs = device['attributes']
            
            print(f"📱 Device Status:")
            print(f"   Name: {attrs.get('name')}")
            print(f"   Status: {attrs.get('status')}")
            print(f"   Last seen: {attrs.get('last_seen_at')}")
            print(f"   Supervised: {attrs.get('is_supervised')}")
        
        # Check installed profiles  
        profiles_response = requests.get(f"{BASE_URL}/devices/{DEVICE_ID}/installed_custom_configuration_profiles", headers=headers)
        
        if profiles_response.status_code == 200:
            profiles = profiles_response.json()['data']
            
            print(f"\n📋 Installed Custom Profiles ({len(profiles)}):")
            
            for profile in profiles:
                profile_id = profile['id'] 
                attrs = profile['attributes']
                name = attrs.get('name', f'Profile {profile_id}')
                status = attrs.get('install_status', 'Unknown')
                
                print(f"   📄 {name} (ID: {profile_id})")
                print(f"       Status: {status}")
                
                if profile_id == CUSTOM_PROFILE_ID:
                    print(f"       🎯 This is our parental control profile!")
                    
                    if status == 'installed':
                        print(f"       ✅ INSTALLED - should be working!")
                    elif status == 'pending':
                        print(f"       ⏳ Still installing...")
                    else:
                        print(f"       ❌ Problem: {status}")
        
    except Exception as e:
        print(f"💥 Error: {e}")

def main():
    print("🔧 FIXING CUSTOM PROFILE ASSIGNMENT & CONTENT")
    print("=" * 50)
    print("Using correct SimpleMDM API endpoints for custom configuration profiles")
    print("")
    
    # Step 1: Check what's in our profile 
    has_content = check_custom_profile_content()
    
    # Step 2: If empty, update with content
    if not has_content:
        print(f"\n🎯 STEP 2: Update empty profile with parental control content")
        updated = update_custom_profile_with_content()
        
        if not updated:
            print("❌ Profile update failed - cannot proceed")
            return
    
    # Step 3: Assign using correct custom profile endpoint
    print(f"\n🎯 STEP 3: Assign custom profile using correct endpoint")
    assigned = assign_custom_profile_correct_endpoint()
    
    # Step 4: Check device status
    check_device_status_and_profiles()
    
    if assigned:
        print(f"\n🎉 CUSTOM PROFILE ASSIGNMENT COMPLETED!")
        print(f"⏱️ Wait 2-3 minutes for profile installation")
        print(f"🧪 Then test pornhub.com → Should be BLOCKED!")
        print(f"📊 Check System Preferences > Profiles for installed profile")
    else:
        print(f"\n❌ Custom profile assignment failed")
        print("Manual assignment via SimpleMDM dashboard may be needed")

if __name__ == "__main__":
    main()

