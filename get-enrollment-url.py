#!/usr/bin/env python3

import requests
from base64 import b64encode

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

# Create authentication header
auth_header = b64encode(f"{API_KEY}:".encode()).decode()
headers = {
    "Authorization": f"Basic {auth_header}"
}

def get_enrollment_info():
    """Get enrollment URLs and create instructions for iPhone"""
    
    print("📱 Getting SimpleMDM Enrollment Information")
    print("=" * 50)
    
    # Get enrollments
    response = requests.get(f"{BASE_URL}/enrollments", headers=headers)
    
    if response.status_code == 200:
        enrollments = response.json()['data']
        
        if enrollments:
            for enrollment in enrollments:
                attrs = enrollment['attributes']
                enrollment_id = enrollment['id']
                
                print(f"📋 Enrollment: {attrs.get('name', 'Default')}")
                print(f"🔗 URL: {attrs.get('url', 'N/A')}")
                print(f"📊 ID: {enrollment_id}")
                print("")
                
                return attrs.get('url')
        else:
            print("❌ No enrollments found. Creating one...")
            return create_enrollment()
    else:
        print(f"❌ Failed to get enrollments: {response.status_code}")
        return None

def create_enrollment():
    """Create a new enrollment for testing"""
    
    payload = {
        'name': 'ScreenTime Journey Test Enrollment'
    }
    
    response = requests.post(
        f"{BASE_URL}/enrollments", 
        headers=headers,
        json=payload
    )
    
    if response.status_code == 201:
        enrollment = response.json()['data']
        url = enrollment['attributes']['url']
        print(f"✅ Created new enrollment: {url}")
        return url
    else:
        print(f"❌ Failed to create enrollment: {response.status_code}")
        return None

def main():
    print("🛡️  SimpleMDM iPhone Enrollment Setup")
    print("=" * 50)
    
    enrollment_url = get_enrollment_info()
    
    if enrollment_url:
        print("🎉 SUCCESS! Here's your enrollment information:")
        print("=" * 50)
        print(f"📱 ENROLLMENT URL: {enrollment_url}")
        print("")
        print("📋 STEP-BY-STEP INSTRUCTIONS:")
        print("=" * 50)
        print("1. 📧 Send this URL to your iPhone via email/text")
        print("2. 📱 Open the URL on your iPhone (in Safari)")
        print("3. 👆 Tap 'Allow' to download the profile")
        print("4. ⚙️  Go to Settings > General > VPN & Device Management")
        print("5. 📄 Tap the SimpleMDM profile")
        print("6. 🔐 Tap 'Install' and enter your iPhone passcode")
        print("7. ✅ Tap 'Install' again to confirm")
        print("")
        print("🎯 After enrollment, the protection profile will")
        print("   automatically be pushed to your device!")
        print("")
        print(f"🔗 Quick Link: {enrollment_url}")
    else:
        print("❌ Could not get enrollment URL")

if __name__ == "__main__":
    main()


