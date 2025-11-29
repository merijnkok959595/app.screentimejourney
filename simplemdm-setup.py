#!/usr/bin/env python3
"""
SimpleMDM Profile Upload Script
Uploads the content filter MDM profile to SimpleMDM
"""

import json
import requests
import sys

# Your SimpleMDM API Key
SIMPLEMDM_API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
SIMPLEMDM_API_BASE = "https://a.simplemdm.com/api/v1"

def upload_profile():
    """Upload the MDM profile to SimpleMDM"""
    
    print("📱 SimpleMDM Profile Upload Tool")
    print("=" * 50)
    
    # Read the profile file
    profile_path = "iPhone-ContentFilter-Profile.mobileconfig"
    try:
        with open(profile_path, 'r') as f:
            profile_content = f.read()
    except FileNotFoundError:
        print(f"❌ Error: Could not find {profile_path}")
        print("Make sure the profile file exists in the current directory")
        return False
    
    # Prepare the API request
    headers = {
        "Authorization": f"Basic {SIMPLEMDM_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "name": "Content Filter & Social Media Block",
        "mobileconfig": profile_content,
        "user_scope": False,
        "attribute_support": True
    }
    
    print("\n📤 Uploading profile to SimpleMDM...")
    
    try:
        response = requests.post(
            f"{SIMPLEMDM_API_BASE}/custom_configuration_profiles",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 201:
            profile_data = response.json()
            print("\n✅ Profile uploaded successfully!")
            print(f"Profile ID: {profile_data.get('data', {}).get('id', 'N/A')}")
            print(f"Profile Name: {profile_data.get('data', {}).get('attributes', {}).get('name', 'N/A')}")
            print("\n📋 Next Steps:")
            print("1. Log in to SimpleMDM dashboard")
            print("2. Go to 'Custom Profiles'")
            print("3. Assign the profile to your device or device group")
            print("4. The profile will auto-install on enrolled devices")
            return True
            
        elif response.status_code == 401:
            print("\n❌ Authentication failed!")
            print("Your API key may be invalid or expired.")
            print("Check your SimpleMDM account settings.")
            return False
            
        else:
            print(f"\n❌ Upload failed with status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Network error: {e}")
        return False

def list_devices():
    """List all devices enrolled in SimpleMDM"""
    
    print("\n\n📱 Enrolled Devices")
    print("=" * 50)
    
    headers = {
        "Authorization": f"Basic {SIMPLEMDM_API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{SIMPLEMDM_API_BASE}/devices",
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            devices_data = response.json()
            devices = devices_data.get('data', [])
            
            if not devices:
                print("\n⚠️  No devices enrolled yet")
                print("\n📋 To enroll a device:")
                print("1. Go to SimpleMDM dashboard")
                print("2. Click 'Devices' → 'Add Device'")
                print("3. Send enrollment link to your iPhone")
                return
            
            print(f"\nFound {len(devices)} device(s):\n")
            for device in devices:
                attrs = device.get('attributes', {})
                print(f"📱 {attrs.get('name', 'Unknown Device')}")
                print(f"   Model: {attrs.get('model_name', 'N/A')}")
                print(f"   OS: {attrs.get('os_version', 'N/A')}")
                print(f"   Status: {attrs.get('status', 'N/A')}")
                print(f"   Last Seen: {attrs.get('last_seen_at', 'N/A')}")
                print()
        else:
            print(f"❌ Failed to list devices: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")

def get_enrollment_link():
    """Get enrollment link for new device"""
    
    print("\n\n🔗 Device Enrollment")
    print("=" * 50)
    
    headers = {
        "Authorization": f"Basic {SIMPLEMDM_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Create an enrollment
    payload = {
        "name": "iPhone Enrollment"
    }
    
    try:
        response = requests.post(
            f"{SIMPLEMDM_API_BASE}/enrollments",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 201:
            enrollment_data = response.json()
            url = enrollment_data.get('data', {}).get('attributes', {}).get('url', '')
            print(f"\n✅ Enrollment URL created:")
            print(f"\n{url}")
            print("\n📋 Instructions:")
            print("1. Open this URL on your iPhone")
            print("2. Follow the enrollment instructions")
            print("3. Install the MDM profile when prompted")
        else:
            print(f"❌ Failed to create enrollment: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")

def main():
    """Main function"""
    
    print("\n" + "=" * 50)
    print("SimpleMDM Setup Script")
    print("=" * 50)
    print("\nWhat would you like to do?")
    print("1. Upload Content Filter Profile")
    print("2. List Enrolled Devices")
    print("3. Get Device Enrollment Link")
    print("4. Do All (Upload + List + Enrollment)")
    print("5. Exit")
    
    choice = input("\nEnter your choice (1-5): ").strip()
    
    if choice == "1":
        upload_profile()
    elif choice == "2":
        list_devices()
    elif choice == "3":
        get_enrollment_link()
    elif choice == "4":
        if upload_profile():
            list_devices()
            get_enrollment_link()
    elif choice == "5":
        print("\n👋 Goodbye!")
        sys.exit(0)
    else:
        print("\n❌ Invalid choice")
        return
    
    print("\n" + "=" * 50)
    print("✅ Done!")
    print("=" * 50)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Cancelled by user")
        sys.exit(0)



