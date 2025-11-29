#!/usr/bin/env python3

import requests
from base64 import b64encode
import json
from datetime import datetime

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"
PARENTAL_PROFILE_ID = 214139

def check_assignment_groups():
    """Check what assignment groups exist that can auto-assign profiles"""
    
    print("📋 CHECKING ASSIGNMENT GROUPS")
    print("=" * 30)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    try:
        response = requests.get(f"{BASE_URL}/assignment_groups", headers=headers)
        
        if response.status_code == 200:
            groups = response.json()['data']
            
            print(f"✅ Found {len(groups)} assignment group(s):")
            
            for group in groups:
                group_id = group['id']
                attrs = group['attributes']
                name = attrs.get('name', f'Group {group_id}')
                
                print(f"\n📂 {name} (ID: {group_id})")
                
                # Check if this group has our parental profile assigned
                # Try to get group details
                try:
                    group_response = requests.get(f"{BASE_URL}/assignment_groups/{group_id}", headers=headers)
                    if group_response.status_code == 200:
                        group_details = group_response.json()['data']['attributes']
                        print(f"   Description: {group_details.get('description', 'None')}")
                    
                except:
                    pass
            
            return groups
            
        else:
            print(f"❌ Failed to get assignment groups: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    return []

def create_device_with_assignment_group(group_id=None):
    """Create device with assignment group that has parental profile"""
    
    print(f"\n🚀 CREATING DEVICE WITH PROFILE AUTO-ASSIGNMENT")
    print("=" * 50)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    device_name = f"ScreenTime-WithProfile-{datetime.now().strftime('%H%M%S')}"
    
    device_data = {
        "name": device_name
    }
    
    # Add assignment group if provided
    if group_id:
        device_data["static_group_ids"] = [group_id]
        print(f"📂 Using assignment group: {group_id}")
    
    try:
        print(f"📡 POST /api/v1/devices")
        print(f"Data: {json.dumps(device_data, indent=2)}")
        
        response = requests.post(
            f"{BASE_URL}/devices",
            headers=headers,
            data=device_data,
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 201:
            print("🎉 SUCCESS! Device created!")
            
            device_response = response.json()['data']
            device_id = device_response['id']
            attrs = device_response['attributes']
            
            enrollment_url = attrs.get('enrollment_url')
            
            print(f"\n✅ NEW DEVICE WITH PROFILE:")
            print(f"   ID: {device_id}")
            print(f"   Name: {attrs.get('name')}")
            print(f"   Status: {attrs.get('status')}")
            print(f"   Enrollment URL: {enrollment_url}")
            
            return device_id, enrollment_url
            
        else:
            print(f"❌ Failed: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    return None, None

def unenroll_current_device():
    """Unenroll the current test device so we can re-enroll"""
    
    print(f"\n🔄 UNENROLLING CURRENT DEVICE")
    print("=" * 30)
    
    current_device_id = 2126389  # The MacBook we enrolled
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    try:
        # Try to delete/unenroll the device
        response = requests.delete(f"{BASE_URL}/devices/{current_device_id}", headers=headers)
        
        print(f"📡 DELETE /devices/{current_device_id}")
        print(f"Status: {response.status_code}")
        
        if response.status_code in [200, 204]:
            print("✅ Device unenrolled successfully!")
            return True
        else:
            print(f"❌ Unenroll failed: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    return False

def create_assignment_group_with_profile():
    """Create a new assignment group with our parental profile"""
    
    print(f"\n📂 CREATING ASSIGNMENT GROUP WITH PARENTAL PROFILE")
    print("=" * 55)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth_header}",
        "Content-Type": "application/json"
    }
    
    group_data = {
        "name": "ScreenTime Parental Control",
        "description": "Auto-assigns parental control profile during enrollment"
    }
    
    try:
        # Create assignment group
        response = requests.post(
            f"{BASE_URL}/assignment_groups",
            headers=headers,
            json=group_data,
            timeout=10
        )
        
        print(f"📡 POST /assignment_groups")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 201:
            group_response = response.json()['data']
            group_id = group_response['id']
            group_name = group_response['attributes']['name']
            
            print(f"✅ Assignment group created!")
            print(f"   ID: {group_id}")
            print(f"   Name: {group_name}")
            
            # Now assign our parental profile to this group
            profile_assignment = assign_profile_to_group(group_id)
            
            if profile_assignment:
                return group_id
            else:
                print("❌ Failed to assign profile to group")
                
        else:
            print(f"❌ Group creation failed: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    return None

def assign_profile_to_group(group_id):
    """Assign parental profile to assignment group"""
    
    print(f"\n🛡️ ASSIGNING PROFILE TO GROUP")
    print("=" * 30)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Try different endpoints for assigning profile to group
    endpoints_to_try = [
        f"/assignment_groups/{group_id}/custom_configuration_profiles/{PARENTAL_PROFILE_ID}",
        f"/custom_configuration_profiles/{PARENTAL_PROFILE_ID}/assignment_groups/{group_id}",
        f"/assignment_groups/{group_id}/profiles/{PARENTAL_PROFILE_ID}"
    ]
    
    for endpoint in endpoints_to_try:
        try:
            response = requests.post(f"{BASE_URL}{endpoint}", headers=headers, timeout=5)
            
            print(f"📡 POST {endpoint}")
            print(f"   Status: {response.status_code}")
            
            if response.status_code in [200, 201, 204]:
                print(f"   ✅ SUCCESS! Profile assigned to group!")
                return True
            elif response.status_code == 404:
                print(f"   ❌ Endpoint not found")
            else:
                print(f"   Response: {response.text[:100]}...")
                
        except Exception as e:
            print(f"   💥 Error: {str(e)[:50]}...")
    
    return False

def provide_manual_re_enrollment_steps():
    """Provide manual steps for re-enrollment with profile"""
    
    print(f"\n🛠️ MANUAL RE-ENROLLMENT WITH PROFILE")
    print("=" * 40)
    
    print("📋 STEPS IN SIMPLEMDM DASHBOARD:")
    print("1. 🌐 Go to: https://a.simplemdm.com")
    print("2. 📱 Go to Devices")
    print("3. 🗑️ Delete 'ScreenTime-Test-145420' (current device)")
    print("4. 📂 Go to Assignment Groups")
    print("5. ➕ Create new group: 'Parental Control Auto-Assign'")
    print("6. 🛡️ Assign 'Enhanced MDM Protection' profile to group")
    print("7. 📱 Create new device:")
    print("   • Name: 'ScreenTime-MacBook-WithProfile'")
    print("   • Assign to: 'Parental Control Auto-Assign' group")
    print("8. 📋 Copy enrollment URL")
    print("9. 💻 Use URL to re-enroll MacBook")
    print("10. ✅ Profile should install automatically!")

def main():
    print("🔄 RE-ENROLLMENT WITH PROFILE AUTO-ASSIGNMENT")
    print("=" * 50)
    print("Goal: Create new enrollment that automatically assigns parental profile")
    print("")
    
    # Step 1: Check existing assignment groups
    groups = check_assignment_groups()
    
    # Step 2: Unenroll current device
    print("\n🎯 STEP 1: Unenroll current device")
    unenrolled = unenroll_current_device()
    
    if unenrolled:
        print("✅ Current device unenrolled - ready for fresh enrollment")
    else:
        print("⚠️ Current device still enrolled - may cause conflicts")
    
    # Step 3: Try to create assignment group with profile
    print("\n🎯 STEP 2: Create assignment group with profile")
    group_id = create_assignment_group_with_profile()
    
    if group_id:
        # Step 4: Create device with assignment group
        print(f"\n🎯 STEP 3: Create device with profile auto-assignment")
        device_id, enrollment_url = create_device_with_assignment_group(group_id)
        
        if enrollment_url:
            print(f"\n🎉 SUCCESS! NEW ENROLLMENT URL WITH PROFILE:")
            print(f"🔗 {enrollment_url}")
            print(f"\n📱 ENROLL YOUR MACBOOK:")
            print(f"1. Open Safari")
            print(f"2. Go to the URL above")
            print(f"3. Install profile")
            print(f"4. Parental control should be active immediately!")
            
        else:
            print(f"\n❌ Device creation failed")
    else:
        print(f"\n❌ Assignment group creation failed")
        provide_manual_re_enrollment_steps()
    
    print(f"\n🎯 EXPECTED RESULT:")
    print("After enrollment, pornhub.com should be blocked immediately!")
    print("No manual profile assignment needed!")

if __name__ == "__main__":
    main()

