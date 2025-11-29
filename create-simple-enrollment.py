#!/usr/bin/env python3

import requests
from base64 import b64encode

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def create_enrollment():
    """Create a new enrollment URL"""
    
    print("🔄 Creating New SimpleMDM Enrollment")
    print("=" * 50)
    
    # Create authentication
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    
    # Use form data instead of JSON
    data = {
        'name': 'ScreenTime Journey Fresh Enrollment'
    }
    
    headers = {
        "Authorization": f"Basic {auth_header}"
    }
    
    response = requests.post(
        f"{BASE_URL}/enrollments",
        headers=headers,
        data=data
    )
    
    print(f"Response Status: {response.status_code}")
    print(f"Response: {response.text[:200]}...")
    
    if response.status_code == 201:
        enrollment = response.json()['data']
        url = enrollment['attributes']['url']
        
        print("✅ SUCCESS!")
        print("=" * 50)
        print(f"🔗 NEW ENROLLMENT URL:")
        print(f"{url}")
        print("")
        print("📱 Use this URL on your iPhone!")
        
        return url
    else:
        print(f"❌ Failed: {response.status_code}")
        return None

def main():
    print("🛡️  Create Fresh SimpleMDM Enrollment")
    print("=" * 50)
    
    url = create_enrollment()
    
    if url:
        print("\n📲 iPhone Instructions:")
        print("1. Copy the URL above")
        print("2. Text/email it to your iPhone") 
        print("3. Open in Safari on iPhone")
        print("4. Follow enrollment steps")
        print("5. Protection profile auto-installs!")

if __name__ == "__main__":
    main()


