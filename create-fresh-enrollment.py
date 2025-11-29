#!/usr/bin/env python3

import requests
from base64 import b64encode
import json

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def delete_old_enrollment(enrollment_id):
    """Delete old enrollment first"""
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth_header}"
    }
    
    response = requests.delete(f"{BASE_URL}/enrollments/{enrollment_id}", headers=headers)
    print(f"🗑️  Deleted old enrollment {enrollment_id}: {response.status_code}")

def create_fresh_enrollment():
    """Create a completely fresh enrollment"""
    
    print("🔄 Creating Brand New Enrollment...")
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    
    # Try using form data
    headers = {
        "Authorization": f"Basic {auth_header}"
    }
    
    # Create enrollment invitation instead
    data = {
        'message': 'ScreenTime Journey iPhone Protection - Fresh Enrollment'
    }
    
    # Get existing enrollment ID first
    response = requests.get(f"{BASE_URL}/enrollments", headers=headers)
    
    if response.status_code == 200:
        enrollments = response.json()['data']
        if enrollments:
            enrollment_id = enrollments[0]['id']
            
            # Delete old one
            delete_old_enrollment(enrollment_id)
    
    # Create new enrollment via account endpoint
    account_response = requests.get(f"{BASE_URL}/account", headers=headers)
    
    if account_response.status_code == 200:
        print("✅ Account access confirmed")
        
        # Try to create enrollment invitation  
        invite_response = requests.post(
            f"{BASE_URL}/enrollments",
            headers=headers,
            data={'name': 'Fresh ScreenTime Journey Enrollment'}
        )
        
        print(f"Enrollment creation status: {invite_response.status_code}")
        print(f"Response: {invite_response.text}")
        
        if invite_response.status_code == 201:
            new_enrollment = invite_response.json()['data']
            new_url = new_enrollment['attributes']['url']
            
            print("✅ SUCCESS! Fresh enrollment created")
            print("=" * 60)
            print(f"📱 NEW ENROLLMENT URL:")
            print(f"{new_url}")
            print("=" * 60)
            
            return new_url
    
    # If creation fails, get the existing one
    print("⚠️  Using existing enrollment instead...")
    response = requests.get(f"{BASE_URL}/enrollments", headers=headers)
    
    if response.status_code == 200:
        enrollments = response.json()['data']
        if enrollments:
            url = enrollments[0]['attributes']['url']
            print("✅ Retrieved existing enrollment URL")
            print("=" * 60)
            print(f"📱 ENROLLMENT URL:")
            print(f"{url}")
            print("=" * 60)
            return url
    
    return None

def main():
    print("🛡️  Create Fresh SimpleMDM Enrollment")
    print("=" * 50)
    
    url = create_fresh_enrollment()
    
    if url:
        print("\n📲 iPhone Instructions:")
        print("1. Copy the URL above")
        print("2. Text/email it to your iPhone")
        print("3. Open in Safari on iPhone") 
        print("4. Tap 'Allow' to download profile")
        print("5. Settings > General > VPN & Device Management")
        print("6. Install SimpleMDM enrollment")
        print("7. CleanBrowsing protection auto-installs!")
        print("")
        print("🎯 Enhanced protection with:")
        print("  ✅ CleanBrowsing DNS (adult content blocking)")
        print("  ✅ Screen Time enforcement")
        print("  ✅ Safe Search forced")
        print("  ✅ Social media websites blocked")

if __name__ == "__main__":
    main()


