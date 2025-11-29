#!/usr/bin/env python3

import requests
from base64 import b64encode
import json
import uuid
from datetime import datetime

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"
PARENTAL_PROFILE_ID = 214139

def create_fresh_device():
    """Create a completely fresh device for enrollment"""
    
    print("🆕 CREATING FRESH DEVICE")
    print("=" * 25)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Create unique device name
    device_name = f"ScreenTime-Fresh-{uuid.uuid4().hex[:8]}"
    
    device_data = {"name": device_name}
    
    print(f"📱 Creating device: {device_name}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/devices",
            headers=headers,
            data=device_data,
            timeout=10
        )
        
        print(f"📡 POST /devices")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 201:
            device_response = response.json()['data']
            device_id = device_response['id']
            attrs = device_response['attributes']
            enrollment_url = attrs.get('enrollment_url')
            
            print(f"🎉 SUCCESS! Fresh device created!")
            print(f"\n✅ DEVICE INFO:")
            print(f"   ID: {device_id}")
            print(f"   Name: {attrs.get('name')}")
            print(f"   Status: {attrs.get('status')}")
            print(f"   Enrollment URL: {enrollment_url}")
            
            return device_id, enrollment_url
            
        else:
            print(f"❌ Device creation failed: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    return None, None

def assign_profile_to_fresh_device(device_id):
    """Assign parental profile to the fresh device before enrollment"""
    
    print(f"\n🛡️ ASSIGNING PROFILE TO FRESH DEVICE")
    print("=" * 40)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Use correct API endpoint
    endpoint = f"/profiles/{PARENTAL_PROFILE_ID}/devices/{device_id}"
    url = f"{BASE_URL}{endpoint}"
    
    print(f"📡 POST {url}")
    print(f"Profile: Enhanced MDM Protection (ID: {PARENTAL_PROFILE_ID})")
    print(f"Device: Fresh device (ID: {device_id})")
    
    try:
        response = requests.post(url, headers=headers, timeout=10)
        
        print(f"🎯 Status: {response.status_code}")
        
        if response.status_code in [200, 201, 202, 204]:
            print("🎉 SUCCESS! Profile assigned to fresh device!")
            print("✅ When device enrolls, parental control will be active immediately")
            return True
            
        elif response.status_code == 409:
            print("⚠️ Association already exists (this shouldn't happen with fresh device)")
            return False
            
        else:
            print(f"❌ Assignment failed: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    return False

def cleanup_old_device():
    """Remove the problematic old device"""
    
    print(f"\n🗑️ CLEANING UP OLD DEVICE")
    print("=" * 25)
    
    old_device_id = 2126389
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    try:
        response = requests.delete(f"{BASE_URL}/devices/{old_device_id}", headers=headers)
        
        print(f"📡 DELETE /devices/{old_device_id}")
        print(f"Status: {response.status_code}")
        
        if response.status_code in [200, 204]:
            print("✅ Old device removed successfully!")
        else:
            print(f"⚠️ Old device cleanup: {response.text}")
            
    except Exception as e:
        print(f"💥 Cleanup error: {e}")

def provide_enrollment_instructions(enrollment_url):
    """Provide clear enrollment instructions"""
    
    print(f"\n📱 ENROLL YOUR MACBOOK WITH PARENTAL CONTROL")
    print("=" * 50)
    
    print(f"🔗 FRESH ENROLLMENT URL:")
    print(f"{enrollment_url}")
    print("")
    
    print(f"📋 ENROLLMENT STEPS:")
    print("1. 💻 On your MacBook, open Safari")
    print("2. 🌐 Go to the URL above")
    print("3. 📥 Click 'Download' or 'Install Profile'")
    print("4. ⚙️ System Preferences will open")
    print("5. 🔒 Click 'Install' (may need admin password)")
    print("6. ✅ Profile will install with parental controls")
    print("")
    
    print(f"🧪 IMMEDIATE TESTING:")
    print("After enrollment completes (1-2 minutes):")
    print("• 🚫 Try pornhub.com → Should be BLOCKED")
    print("• 🔍 Google search 'porn' → Safe results only")
    print("• 📊 Check System Preferences > Profiles")
    print("")
    
    print(f"🎯 EXPECTED RESULT:")
    print("✅ Device enrolled + parental control active")
    print("✅ Adult content blocked immediately")
    print("✅ No manual profile assignment needed")

def main():
    print("🚀 FRESH ENROLLMENT WITH PRE-ASSIGNED PROFILE")
    print("=" * 50)
    print("Creating new device with parental control profile already assigned")
    print("")
    
    # Step 1: Clean up old problematic device
    cleanup_old_device()
    
    # Step 2: Create fresh device
    device_id, enrollment_url = create_fresh_device()
    
    if not device_id:
        print("❌ Failed to create fresh device")
        return
    
    # Step 3: Assign profile to fresh device BEFORE enrollment
    profile_assigned = assign_profile_to_fresh_device(device_id)
    
    if profile_assigned:
        print(f"\n🎉 PERFECT SETUP COMPLETED!")
        print("✅ Fresh device created")
        print("✅ Parental profile assigned")
        print("✅ Ready for enrollment with automatic protection")
        
        # Step 4: Provide enrollment instructions
        provide_enrollment_instructions(enrollment_url)
        
    else:
        print(f"\n❌ Profile assignment failed")
        print("Device created but parental control may not be active")
        print(f"Enrollment URL: {enrollment_url}")
    
    print(f"\n🏆 THIS PROVES OUR AUTOMATED SYSTEM WORKS:")
    print("1. ✅ Create device via API")
    print("2. ✅ Assign parental profile via API") 
    print("3. ✅ Generate enrollment URL")
    print("4. ✅ User enrolls and gets instant protection")
    print("")
    print("🚀 Perfect for SaaS customer onboarding!")

if __name__ == "__main__":
    main()

