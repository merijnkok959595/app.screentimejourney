#!/usr/bin/env python3

import requests
from base64 import b64encode
import json

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

# Create authentication header
auth_header = b64encode(f"{API_KEY}:".encode()).decode()
headers = {
    "Authorization": f"Basic {auth_header}",
    "Content-Type": "application/json"
}

def create_fresh_enrollment():
    """Create a brand new enrollment URL"""
    
    print("🔄 Creating Fresh SimpleMDM Enrollment")
    print("=" * 50)
    
    # Create new enrollment
    payload = {
        "name": "ScreenTime Journey - Personal iPhone Enrollment",
        "url_expires": False  # Never expires
    }
    
    response = requests.post(
        f"{BASE_URL}/enrollments",
        headers=headers,
        json=payload
    )
    
    if response.status_code == 201:
        enrollment = response.json()['data']
        enrollment_id = enrollment['id']
        enrollment_url = enrollment['attributes']['url']
        enrollment_name = enrollment['attributes']['name']
        
        print("✅ SUCCESS! Fresh enrollment created")
        print("=" * 50)
        print(f"📋 Name: {enrollment_name}")
        print(f"🆔 ID: {enrollment_id}")
        print(f"🔗 URL: {enrollment_url}")
        print(f"⏰ Expires: Never")
        
        return enrollment_url
        
    else:
        print(f"❌ ERROR: Failed to create enrollment")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        return None

def list_current_enrollments():
    """List all current enrollments to see what we have"""
    
    print("\n📋 Current Enrollments:")
    print("-" * 30)
    
    response = requests.get(f"{BASE_URL}/enrollments", headers=headers)
    
    if response.status_code == 200:
        enrollments = response.json()['data']
        
        for enrollment in enrollments:
            attrs = enrollment['attributes']
            name = attrs.get('name', 'Default')
            url = attrs.get('url', 'No URL')
            print(f"• {name} (ID: {enrollment['id']})")
            print(f"  URL: {url[:50]}...")
            print()
            
    else:
        print("❌ Could not list enrollments")

def main():
    print("🛡️  SimpleMDM Fresh Enrollment Creator")
    print("=" * 50)
    
    # Show current enrollments first
    list_current_enrollments()
    
    # Create fresh enrollment
    fresh_url = create_fresh_enrollment()
    
    if fresh_url:
        print("\n🎉 READY TO USE!")
        print("=" * 50)
        print("📱 FRESH ENROLLMENT URL:")
        print(f"{fresh_url}")
        print("")
        print("📲 iPhone Instructions:")
        print("1. Copy the URL above")
        print("2. Send it to your iPhone (text/email)")
        print("3. Open URL in Safari on iPhone")
        print("4. Tap 'Allow' to download profile")
        print("5. Settings > General > VPN & Device Management")
        print("6. Install SimpleMDM enrollment profile")
        print("7. Protection profile will auto-install after!")
        print("")
        print("🔄 This enrollment never expires!")
        
    else:
        print("❌ Failed to create fresh enrollment")

if __name__ == "__main__":
    main()
