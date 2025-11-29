#!/usr/bin/env python3

import requests
from base64 import b64encode
import json

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def check_available_profiles():
    """Check what custom configuration profiles are available"""
    
    print("📋 CHECKING AVAILABLE PROFILES")
    print("=" * 35)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    try:
        response = requests.get(f"{BASE_URL}/custom_configuration_profiles", headers=headers)
        
        if response.status_code == 200:
            profiles = response.json()['data']
            
            print(f"✅ Found {len(profiles)} profile(s):")
            
            parental_profiles = []
            
            for profile in profiles:
                profile_id = profile['id']
                attrs = profile['attributes']
                name = attrs.get('name', 'Unknown')
                payload_count = len(attrs.get('payloads', []))
                
                print(f"\n📄 {name}")
                print(f"   ID: {profile_id}")
                print(f"   Payloads: {payload_count}")
                
                # Look for parental control related profiles
                if any(keyword in name.lower() for keyword in ['parental', 'screentime', 'enhanced', 'protection']):
                    parental_profiles.append({
                        'id': profile_id,
                        'name': name,
                        'payloads': payload_count
                    })
                    print(f"   🎯 PARENTAL CONTROL PROFILE!")
            
            return parental_profiles
            
        else:
            print(f"❌ Failed to get profiles: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    return []

def assign_profile_to_device(device_id, profile_id, profile_name):
    """Assign specific profile to device"""
    
    print(f"\n🛡️ ASSIGNING PROFILE TO DEVICE")
    print("=" * 35)
    print(f"Device ID: {device_id}")
    print(f"Profile: {profile_name} (ID: {profile_id})")
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    try:
        # Try the assignment
        response = requests.post(
            f"{BASE_URL}/devices/{device_id}/custom_configuration_profiles/{profile_id}",
            headers=headers,
            timeout=10
        )
        
        print(f"📡 Status: {response.status_code}")
        
        if response.status_code in [200, 202]:
            print("🎉 SUCCESS! Profile assigned!")
            return True
        else:
            print(f"❌ Failed: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    return False

def check_enrolled_device():
    """Get the enrolled device ID"""
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    try:
        response = requests.get(f"{BASE_URL}/devices", headers=headers)
        
        if response.status_code == 200:
            devices = response.json()['data']
            
            # Find enrolled devices
            for device in devices:
                if device['attributes'].get('status') == 'enrolled':
                    return device['id'], device['attributes'].get('name')
                    
    except Exception as e:
        print(f"Error: {e}")
    
    return None, None

def main():
    print("🔍 PROFILE ASSIGNMENT TROUBLESHOOTING")
    print("=" * 40)
    
    # Step 1: Check available profiles
    profiles = check_available_profiles()
    
    if not profiles:
        print("\n❌ No parental control profiles found!")
        print("We need to create or update the parental control profile first")
        return
    
    # Step 2: Get enrolled device
    device_id, device_name = check_enrolled_device()
    
    if not device_id:
        print("\n❌ No enrolled device found!")
        return
    
    print(f"\n✅ ENROLLED DEVICE FOUND:")
    print(f"   Name: {device_name}")
    print(f"   ID: {device_id}")
    
    # Step 3: Try to assign each parental profile
    for profile in profiles:
        print(f"\n🧪 TRYING PROFILE: {profile['name']}")
        
        success = assign_profile_to_device(device_id, profile['id'], profile['name'])
        
        if success:
            print(f"🎉 SUCCESS! {profile['name']} assigned to {device_name}")
            print(f"\n🧪 NOW TEST CONTENT BLOCKING:")
            print(f"1. Wait 1-2 minutes for profile to install")
            print(f"2. Try visiting pornhub.com → Should be blocked")
            print(f"3. Search 'porn' on Google → Should show safe results")
            print(f"4. Check if CleanBrowsing DNS is active")
            break
        else:
            print(f"❌ Failed to assign {profile['name']}")
    
    print(f"\n💡 IF STILL NO BLOCKING:")
    print(f"• Profile might still be installing (wait 5 minutes)")
    print(f"• Try clearing DNS cache: sudo dscacheutil -flushcache")
    print(f"• Restart browser or try different browser")
    print(f"• Check System Preferences > Profiles for installed profile")

if __name__ == "__main__":
    main()

