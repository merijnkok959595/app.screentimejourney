#!/usr/bin/env python3

import requests
from base64 import b64encode
import json
import time

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"
PARENTAL_PROFILE_ID = 214139
DEVICE_ID = 2126389  # Your enrolled MacBook

def assign_profile_to_device_correct_api():
    """Use the correct SimpleMDM API endpoint to assign profile to device"""
    
    print("🛡️ ASSIGNING PROFILE USING CORRECT API")
    print("=" * 45)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Use the correct endpoint from SimpleMDM docs
    endpoint = f"/profiles/{PARENTAL_PROFILE_ID}/devices/{DEVICE_ID}"
    url = f"{BASE_URL}{endpoint}"
    
    print(f"📡 POST {url}")
    print(f"Profile ID: {PARENTAL_PROFILE_ID} (Enhanced MDM Protection)")
    print(f"Device ID: {DEVICE_ID} (ScreenTime-Test-145420)")
    print("")
    
    try:
        response = requests.post(url, headers=headers, timeout=10)
        
        print(f"🎯 Status: {response.status_code}")
        
        if response.status_code in [200, 201, 202]:
            print("🎉 SUCCESS! Profile assignment initiated!")
            print("✅ Parental control profile is being pushed to device")
            print("⏱️ This will take 1-3 minutes to install")
            return True
            
        elif response.status_code == 204:
            print("🎉 SUCCESS! Profile assigned! (No content response)")
            return True
            
        elif response.status_code == 404:
            print("❌ Profile or device not found")
            print("Let me check what profiles and devices are available...")
            
        elif response.status_code == 422:
            print("⚠️ Validation error")
            print(f"Response: {response.text}")
            
        else:
            print(f"❌ Unexpected status: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"💥 Request failed: {e}")
    
    return False

def check_available_profiles():
    """Check what profiles are available with correct endpoint"""
    
    print(f"\n📋 CHECKING AVAILABLE PROFILES")
    print("=" * 35)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Try both endpoints
    endpoints = ["/profiles", "/custom_configuration_profiles"]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
            
            print(f"📡 GET {endpoint}: {response.status_code}")
            
            if response.status_code == 200:
                profiles = response.json()['data']
                
                print(f"✅ Found {len(profiles)} profile(s):")
                
                for profile in profiles:
                    profile_id = profile['id']
                    attrs = profile['attributes']
                    name = attrs.get('name', f'Profile {profile_id}')
                    
                    print(f"   📄 {name} (ID: {profile_id})")
                    
                    if profile_id == PARENTAL_PROFILE_ID:
                        print(f"       🎯 This is our parental control profile!")
                
                return profiles
                
        except Exception as e:
            print(f"Error with {endpoint}: {e}")
    
    return []

def check_device_status():
    """Check the current device status"""
    
    print(f"\n📱 CHECKING DEVICE STATUS")
    print("=" * 25)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    try:
        response = requests.get(f"{BASE_URL}/devices/{DEVICE_ID}", headers=headers)
        
        if response.status_code == 200:
            device = response.json()['data']
            attrs = device['attributes']
            
            print(f"✅ Device found:")
            print(f"   ID: {device['id']}")
            print(f"   Name: {attrs.get('name')}")
            print(f"   Status: {attrs.get('status')}")
            print(f"   Last seen: {attrs.get('last_seen_at')}")
            print(f"   Supervised: {attrs.get('is_supervised', 'Unknown')}")
            
            return True
            
        else:
            print(f"❌ Device not found: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    return False

def wait_and_check_installation():
    """Wait for profile installation and check status"""
    
    print(f"\n⏱️ WAITING FOR PROFILE INSTALLATION")
    print("=" * 40)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    print("⏳ Waiting 30 seconds for profile installation...")
    time.sleep(30)
    
    try:
        # Check installed profiles on device
        response = requests.get(f"{BASE_URL}/devices/{DEVICE_ID}/installed_profiles", headers=headers)
        
        if response.status_code == 200:
            profiles = response.json()['data']
            
            print(f"📋 Installed profiles ({len(profiles)}):")
            
            parental_found = False
            
            for profile in profiles:
                profile_id = profile['id']
                attrs = profile['attributes']
                name = attrs.get('name', f'Profile {profile_id}')
                status = attrs.get('install_status', 'Unknown')
                
                print(f"   📄 {name} (ID: {profile_id})")
                print(f"       Status: {status}")
                
                if profile_id == PARENTAL_PROFILE_ID:
                    parental_found = True
                    
                    if status == 'installed':
                        print(f"       🎉 PARENTAL CONTROL ACTIVE!")
                        return True
                    elif status == 'pending':
                        print(f"       ⏳ Still installing...")
                    else:
                        print(f"       ⚠️ Status: {status}")
            
            if not parental_found:
                print(f"   ❌ Parental control profile not found in installed profiles")
                
        else:
            print(f"❌ Failed to get installed profiles: {response.status_code}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    return False

def test_content_blocking_instructions():
    """Provide testing instructions"""
    
    print(f"\n🧪 TEST CONTENT BLOCKING NOW!")
    print("=" * 30)
    
    print("🌐 ON YOUR MACBOOK, TEST THESE:")
    print("")
    print("1. 🚫 pornhub.com → Should show 'Access Denied' or blocked page")
    print("2. 🚫 xvideos.com → Should be blocked")
    print("3. 🔍 Google search 'porn' → Should show safe search results only")
    print("4. 🔍 Bing search 'adult content' → Should be filtered")
    print("")
    print("📊 ALSO CHECK:")
    print("• System Preferences > Profiles")
    print("• Should see 'ScreenTime Journey - Enhanced MDM Protection'")
    print("• Profile should show DNS and Web Content Filter settings")
    print("")
    print("🔧 IF NOT WORKING YET:")
    print("• Wait another 2-3 minutes")
    print("• Clear DNS cache: sudo dscacheutil -flushcache")
    print("• Restart Safari/browser")
    print("• Try different browser (Chrome, Firefox)")

def main():
    print("🎯 CORRECT API PROFILE ASSIGNMENT")
    print("=" * 40)
    print("Using the correct SimpleMDM API endpoint to assign parental control profile")
    print("")
    
    # Step 1: Check device exists
    device_ok = check_device_status()
    
    if not device_ok:
        print("❌ Device not found - cannot proceed")
        return
    
    # Step 2: Check profiles exist
    profiles = check_available_profiles()
    
    if not profiles:
        print("❌ No profiles found - cannot proceed")
        return
    
    # Step 3: Assign profile using correct API
    print(f"\n🎯 STEP 3: ASSIGN PROFILE TO DEVICE")
    success = assign_profile_to_device_correct_api()
    
    if success:
        print(f"\n✅ PROFILE ASSIGNMENT SUCCESSFUL!")
        
        # Step 4: Wait and check installation
        installed = wait_and_check_installation()
        
        if installed:
            print(f"\n🎉 PARENTAL CONTROL IS NOW ACTIVE!")
        else:
            print(f"\n⏳ Profile may still be installing...")
        
        # Step 5: Testing instructions
        test_content_blocking_instructions()
        
    else:
        print(f"\n❌ PROFILE ASSIGNMENT FAILED")
        print("Manual assignment via dashboard may be needed")
    
    print(f"\n🏆 EXPECTED RESULT:")
    print("After successful assignment, pornhub.com should be BLOCKED!")
    print("This proves our automated parental control system works! 🚀")

if __name__ == "__main__":
    main()

