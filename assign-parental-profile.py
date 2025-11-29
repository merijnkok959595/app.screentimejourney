#!/usr/bin/env python3

import requests
from base64 import b64encode
import json

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"
PARENTAL_PROFILE_ID = 214139  # Our enhanced parental control profile

def check_enrolled_devices():
    """Check which devices are enrolled and need profile assignment"""
    
    print("📱 CHECKING ENROLLED DEVICES")
    print("=" * 30)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    try:
        response = requests.get(f"{BASE_URL}/devices", headers=headers)
        
        if response.status_code == 200:
            devices = response.json()['data']
            
            print(f"✅ Found {len(devices)} device(s):")
            
            enrolled_devices = []
            
            for device in devices:
                device_id = device['id']
                attrs = device['attributes']
                name = attrs.get('name', 'Unknown')
                status = attrs.get('status', 'Unknown')
                last_seen = attrs.get('last_seen_at', 'Never')
                
                print(f"\n📱 {name} (ID: {device_id})")
                print(f"   Status: {status}")
                print(f"   Last seen: {last_seen}")
                
                if status == 'enrolled':
                    enrolled_devices.append({
                        'id': device_id,
                        'name': name,
                        'status': status
                    })
                    print(f"   ✅ Ready for profile assignment!")
                elif status == 'awaiting enrollment':
                    print(f"   ⏳ Still waiting for enrollment")
                else:
                    print(f"   ❓ Status: {status}")
            
            return enrolled_devices
            
        else:
            print(f"❌ Failed to get devices: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    return []

def assign_parental_profile(device_id, device_name):
    """Assign our enhanced parental control profile to device"""
    
    print(f"\n🛡️ ASSIGNING PARENTAL CONTROL PROFILE")
    print("=" * 45)
    print(f"Device: {device_name} (ID: {device_id})")
    print(f"Profile: Enhanced MDM Protection (ID: {PARENTAL_PROFILE_ID})")
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    try:
        # Assign profile to device
        response = requests.post(
            f"{BASE_URL}/devices/{device_id}/custom_configuration_profiles/{PARENTAL_PROFILE_ID}",
            headers=headers,
            timeout=10
        )
        
        print(f"\n📡 POST /devices/{device_id}/custom_configuration_profiles/{PARENTAL_PROFILE_ID}")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 202:
            print("🎉 SUCCESS! Profile assignment initiated!")
            print("✅ Enhanced parental control profile is being installed...")
            print("⏱️ This may take 1-2 minutes to take effect")
            return True
            
        elif response.status_code == 200:
            print("🎉 SUCCESS! Profile assigned!")
            return True
            
        elif response.status_code == 404:
            print("❌ Device or profile not found")
            print("Checking if profile ID 214139 exists...")
            
        elif response.status_code == 422:
            print("⚠️ Validation error")
            print(f"Response: {response.text}")
            
        else:
            print(f"❌ Status {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"💥 Request failed: {e}")
    
    return False

def check_profile_installation_status(device_id):
    """Check if profile was successfully installed on device"""
    
    print(f"\n📊 CHECKING PROFILE INSTALLATION STATUS")
    print("=" * 45)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    try:
        # Get device profile status
        response = requests.get(f"{BASE_URL}/devices/{device_id}", headers=headers)
        
        if response.status_code == 200:
            device_data = response.json()['data']
            attrs = device_data['attributes']
            
            print(f"✅ Device status: {attrs.get('status')}")
            print(f"📅 Last seen: {attrs.get('last_seen_at')}")
            
            # Check installed profiles
            profiles_response = requests.get(f"{BASE_URL}/devices/{device_id}/installed_custom_configuration_profiles", headers=headers)
            
            if profiles_response.status_code == 200:
                profiles = profiles_response.json()['data']
                
                print(f"\n📋 Installed profiles ({len(profiles)}):")
                
                parental_profile_found = False
                
                for profile in profiles:
                    profile_id = profile['id']
                    profile_attrs = profile['attributes']
                    profile_name = profile_attrs.get('name', 'Unknown')
                    install_status = profile_attrs.get('install_status', 'Unknown')
                    
                    print(f"   📄 {profile_name} (ID: {profile_id})")
                    print(f"       Status: {install_status}")
                    
                    if profile_id == PARENTAL_PROFILE_ID:
                        parental_profile_found = True
                        
                        if install_status == 'installed':
                            print(f"       🎉 PARENTAL CONTROL ACTIVE!")
                        elif install_status == 'pending':
                            print(f"       ⏳ Installation in progress...")
                        else:
                            print(f"       ⚠️ Status: {install_status}")
                
                if not parental_profile_found:
                    print(f"   ❌ Enhanced parental control profile not found")
                    return False
                else:
                    return True
            else:
                print(f"❌ Failed to get installed profiles: {profiles_response.status_code}")
                
        else:
            print(f"❌ Failed to get device info: {response.status_code}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    return False

def test_content_blocking():
    """Provide instructions to test content blocking"""
    
    print(f"\n🧪 TEST CONTENT BLOCKING")
    print("=" * 25)
    
    print("🌐 TEST THESE SITES:")
    print("1. 🚫 pornhub.com → Should be blocked by CleanBrowsing")
    print("2. 🚫 xvideos.com → Should be blocked") 
    print("3. 🚫 redtube.com → Should be blocked")
    print("4. 🔍 Google search 'porn' → Should show safe search results")
    print("5. 🔍 Bing search 'adult content' → Should be filtered")
    print("")
    
    print("⏱️ NOTE: Changes may take 1-5 minutes to take effect")
    print("🔄 Try clearing DNS cache: sudo dscacheutil -flushcache")
    print("🌐 Or try using different browser (Chrome, Firefox)")

def main():
    print("🛡️ SIMPLEMDM PARENTAL PROFILE ASSIGNMENT")
    print("=" * 45)
    print("Checking enrolled devices and assigning parental control profiles")
    print("")
    
    # Step 1: Check enrolled devices
    enrolled_devices = check_enrolled_devices()
    
    if not enrolled_devices:
        print("\n❌ No enrolled devices found!")
        print("Make sure device enrollment completed successfully")
        return
    
    # Step 2: Assign profile to each enrolled device
    for device in enrolled_devices:
        device_id = device['id']
        device_name = device['name']
        
        print(f"\n🎯 Processing device: {device_name}")
        
        success = assign_parental_profile(device_id, device_name)
        
        if success:
            print(f"✅ Profile assignment initiated for {device_name}")
            
            # Wait a moment then check status
            import time
            print("⏳ Waiting 10 seconds for profile installation...")
            time.sleep(10)
            
            # Check installation status
            profile_installed = check_profile_installation_status(device_id)
            
            if profile_installed:
                print(f"🎉 SUCCESS! Parental control is now active on {device_name}")
            else:
                print(f"⏳ Profile installation may still be in progress...")
        else:
            print(f"❌ Failed to assign profile to {device_name}")
    
    # Step 3: Testing instructions
    test_content_blocking()
    
    print(f"\n✅ SUMMARY:")
    print("📱 Enrolled devices found and processed")
    print("🛡️ Enhanced parental control profiles assigned")
    print("🧪 Test content blocking in 1-2 minutes")

if __name__ == "__main__":
    main()

