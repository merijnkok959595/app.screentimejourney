#!/usr/bin/env python3

import requests
from base64 import b64encode
import json

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def try_different_assignment_endpoints(device_id, profile_id):
    """Try different API endpoints for profile assignment"""
    
    print("🔧 TRYING DIFFERENT ASSIGNMENT ENDPOINTS")
    print("=" * 45)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Different possible endpoints to try
    endpoints = [
        f"/devices/{device_id}/custom_configuration_profiles/{profile_id}",
        f"/custom_configuration_profiles/{profile_id}/devices/{device_id}", 
        f"/custom_configuration_profiles/{profile_id}/assign",
        f"/devices/{device_id}/profiles/{profile_id}",
        f"/devices/{device_id}/assign",
    ]
    
    for endpoint in endpoints:
        try:
            print(f"\n📡 Trying: POST {endpoint}")
            
            # Try POST request
            response = requests.post(f"{BASE_URL}{endpoint}", headers=headers, timeout=5)
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code in [200, 201, 202]:
                print(f"   🎉 SUCCESS! Profile assignment worked!")
                return True
            elif response.status_code == 404:
                print(f"   ❌ Endpoint not found")
            else:
                print(f"   Response: {response.text[:100]}...")
                
        except Exception as e:
            print(f"   💥 Error: {str(e)[:50]}...")
    
    return False

def check_profile_contents(profile_id):
    """Check what's actually in the profile"""
    
    print(f"\n📋 CHECKING PROFILE CONTENTS")
    print("=" * 30)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    try:
        response = requests.get(f"{BASE_URL}/custom_configuration_profiles/{profile_id}", headers=headers)
        
        if response.status_code == 200:
            profile_data = response.json()
            
            print(f"✅ Profile data retrieved:")
            print(f"ID: {profile_data['data']['id']}")
            
            attrs = profile_data['data']['attributes']
            print(f"Name: {attrs.get('name')}")
            print(f"Payloads: {len(attrs.get('payloads', []))}")
            
            payloads = attrs.get('payloads', [])
            
            if payloads:
                print(f"\n📦 PAYLOADS:")
                for i, payload in enumerate(payloads):
                    payload_type = payload.get('PayloadType', 'Unknown')
                    payload_id = payload.get('PayloadIdentifier', 'Unknown')
                    print(f"   {i+1}. {payload_type} ({payload_id})")
            else:
                print(f"\n❌ PROFILE IS EMPTY! No payloads found.")
                print(f"This explains why content filtering isn't working.")
                return False
            
            return True
            
        else:
            print(f"❌ Failed to get profile: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    return False

def update_profile_with_parental_controls(profile_id):
    """Update the empty profile with parental control settings"""
    
    print(f"\n🛡️ UPDATING PROFILE WITH PARENTAL CONTROLS")
    print("=" * 50)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth_header}",
        "Content-Type": "application/json"
    }
    
    # Create comprehensive parental control profile
    parental_config = {
        "name": "ScreenTime Journey - Enhanced MDM Protection",
        "payloads": [
            {
                "PayloadType": "com.apple.dnsSettings.managed",
                "PayloadIdentifier": "com.screentimejourney.dns.cleanbrowsing",
                "PayloadUUID": "12345678-1234-1234-1234-123456789012",
                "PayloadDisplayName": "CleanBrowsing Adult Filter DNS",
                "PayloadDescription": "Blocks adult content via DNS filtering",
                "PayloadVersion": 1,
                "DNSSettings": {
                    "DNSProtocol": "HTTPS",
                    "ServerAddresses": ["185.228.168.168", "185.228.169.168"]
                }
            },
            {
                "PayloadType": "com.apple.webcontent-filter",
                "PayloadIdentifier": "com.screentimejourney.webfilter.builtin",
                "PayloadUUID": "12345678-1234-1234-1234-123456789013", 
                "PayloadDisplayName": "Built-in Web Content Filter",
                "PayloadDescription": "Blocks adult websites and social media",
                "PayloadVersion": 1,
                "FilterType": "BuiltIn",
                "AutoFilterEnabled": True,
                "RestrictWeb": True,
                "WhitelistedBookmarks": []
            },
            {
                "PayloadType": "com.apple.applicationaccess",
                "PayloadIdentifier": "com.screentimejourney.restrictions.content",
                "PayloadUUID": "12345678-1234-1234-1234-123456789014",
                "PayloadDisplayName": "Content & Privacy Restrictions", 
                "PayloadDescription": "Screen Time content restrictions",
                "PayloadVersion": 1,
                "allowExplicitContent": False,
                "ratingRegion": "us",
                "ratingApps": 600
            }
        ]
    }
    
    try:
        response = requests.patch(
            f"{BASE_URL}/custom_configuration_profiles/{profile_id}",
            headers=headers,
            json=parental_config,
            timeout=10
        )
        
        print(f"📡 PATCH /custom_configuration_profiles/{profile_id}")
        print(f"Status: {response.status_code}")
        
        if response.status_code in [200, 202]:
            print("🎉 SUCCESS! Profile updated with parental controls!")
            return True
        else:
            print(f"❌ Update failed: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    return False

def assign_via_simplemdm_api(device_id, profile_id):
    """Try the correct SimpleMDM API for assignment"""
    
    print(f"\n🔄 TRYING CORRECT ASSIGNMENT API")
    print("=" * 35)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Try the assignment group approach
    try:
        # First, add device to assignment group that has the profile
        response = requests.post(
            f"{BASE_URL}/custom_configuration_profiles/{profile_id}/assignment_groups",
            headers=headers,
            json={"device_ids": [device_id]},
            timeout=10
        )
        
        print(f"📡 Assignment group method: {response.status_code}")
        
        if response.status_code in [200, 201, 202]:
            print("🎉 SUCCESS via assignment groups!")
            return True
        else:
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"Assignment group error: {e}")
    
    # Try direct device assignment
    try:
        response = requests.post(
            f"{BASE_URL}/devices/{device_id}/push_apps_and_profiles",
            headers=headers,
            timeout=10
        )
        
        print(f"📡 Push profiles method: {response.status_code}")
        
        if response.status_code in [200, 202]:
            print("🎉 SUCCESS! Profiles pushed to device!")
            return True
        else:
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"Push profiles error: {e}")
    
    return False

def main():
    print("🛠️ PROFILE ASSIGNMENT FIX")
    print("=" * 30)
    
    profile_id = 214139
    device_id = 2126389
    
    # Step 1: Check what's in the profile
    profile_ok = check_profile_contents(profile_id)
    
    if not profile_ok:
        # Step 2: Update profile with parental controls
        print("\n🔧 Profile is empty, updating with parental controls...")
        updated = update_profile_with_parental_controls(profile_id)
        
        if updated:
            print("✅ Profile updated successfully!")
        else:
            print("❌ Profile update failed")
    
    # Step 3: Try different assignment methods
    success = try_different_assignment_endpoints(device_id, profile_id)
    
    if not success:
        success = assign_via_simplemdm_api(device_id, profile_id)
    
    if success:
        print(f"\n🎉 PROFILE ASSIGNMENT SUCCESSFUL!")
        print(f"⏱️ Wait 2-3 minutes for changes to take effect")
        print(f"🧪 Then test pornhub.com - should be blocked!")
    else:
        print(f"\n📋 MANUAL ASSIGNMENT NEEDED")
        print(f"Go to SimpleMDM dashboard:")
        print(f"1. Devices → Find ScreenTime-Test-145420")
        print(f"2. Assign profile: Enhanced MDM Protection")
        print(f"3. Wait for installation")

if __name__ == "__main__":
    main()

