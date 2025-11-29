#!/usr/bin/env python3

import requests
from base64 import b64encode

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def list_enrollments():
    """List existing enrollments to find a valid one"""
    
    print("📋 Checking existing enrollments...")
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth_header}"
    }
    
    response = requests.get(f"{BASE_URL}/enrollments", headers=headers)
    
    if response.status_code == 200:
        enrollments = response.json()['data']
        
        if enrollments:
            # Use the first enrollment
            enrollment = enrollments[0]
            enrollment_id = enrollment['id']
            
            print(f"✅ Found enrollment ID: {enrollment_id}")
            return enrollment_id
        else:
            print("❌ No enrollments found")
            return None
    else:
        print(f"❌ API Error: {response.status_code}")
        print(f"Response: {response.text}")
        return None

def send_enrollment_invitation(enrollment_id):
    """Send enrollment invitation to get fresh URL"""
    
    print(f"📧 Sending invitation for enrollment {enrollment_id}...")
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth_header}"
    }
    
    # Send invitation (this should generate a fresh URL)
    data = {
        'message': 'ScreenTime Journey iPhone enrollment'
    }
    
    response = requests.post(
        f"{BASE_URL}/enrollments/{enrollment_id}/send_invitation",
        headers=headers,
        data=data
    )
    
    print(f"Response Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code in [200, 204]:
        print("✅ Invitation sent! Check the enrollment URL again.")
        return True
    else:
        return False

def get_enrollment_url(enrollment_id):
    """Get the enrollment URL directly"""
    
    print(f"🔗 Getting URL for enrollment {enrollment_id}...")
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth_header}"
    }
    
    response = requests.get(f"{BASE_URL}/enrollments/{enrollment_id}", headers=headers)
    
    if response.status_code == 200:
        enrollment = response.json()['data']
        url = enrollment['attributes']['url']
        
        print("✅ SUCCESS!")
        print("=" * 60)
        print(f"📱 FRESH ENROLLMENT URL:")
        print(f"{url}")
        print("=" * 60)
        
        return url
    else:
        print(f"❌ Failed to get URL: {response.status_code}")
        return None

def main():
    print("🛡️  Get Fresh SimpleMDM Enrollment URL")
    print("=" * 50)
    
    # Step 1: Find an enrollment
    enrollment_id = list_enrollments()
    
    if not enrollment_id:
        print("❌ No enrollments available")
        return
    
    # Step 2: Get the URL
    url = get_enrollment_url(enrollment_id)
    
    if url:
        print("\n📲 iPhone Instructions:")
        print("1. Copy the URL above")
        print("2. Text/email it to your iPhone")
        print("3. Open in Safari on iPhone")
        print("4. Tap 'Allow' to download profile")
        print("5. Settings > General > VPN & Device Management")
        print("6. Install the SimpleMDM profile")
        print("7. Protection profile will install automatically!")
        print("")
        print("🎯 The DNS protection profile should auto-assign!")

if __name__ == "__main__":
    main()


