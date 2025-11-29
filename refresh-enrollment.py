#!/usr/bin/env python3

import requests
from base64 import b64encode
import json

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def refresh_enrollment():
    """Try multiple methods to get a fresh enrollment URL"""
    
    print("🔄 Refreshing SimpleMDM Enrollment URL...")
    print("=" * 50)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth_header}",
        "Content-Type": "application/json"
    }
    
    # Method 1: Try to create via JSON
    print("📡 Method 1: Creating via JSON API...")
    
    payload = {
        "name": "ScreenTime Journey Fresh Enrollment - " + str(hash("fresh"))[-6:],
        "url_expires": False
    }
    
    response1 = requests.post(f"{BASE_URL}/enrollments", headers=headers, json=payload)
    print(f"Status: {response1.status_code}")
    
    if response1.status_code == 201:
        data = response1.json()
        url = data['data']['attributes']['url']
        print("✅ SUCCESS via JSON!")
        print(f"🔗 Fresh URL: {url}")
        return url
    
    # Method 2: Try form data
    print("\n📡 Method 2: Creating via Form Data...")
    
    form_headers = {
        "Authorization": f"Basic {auth_header}"
    }
    
    form_data = {
        'name': f'ScreenTime Journey Refresh {hash("refresh2")%1000}'
    }
    
    response2 = requests.post(f"{BASE_URL}/enrollments", headers=form_headers, data=form_data)
    print(f"Status: {response2.status_code}")
    print(f"Response: {response2.text[:200]}")
    
    if response2.status_code == 201:
        try:
            data = response2.json()
            url = data['data']['attributes']['url'] 
            print("✅ SUCCESS via Form Data!")
            print(f"🔗 Fresh URL: {url}")
            return url
        except:
            print("❌ Could not parse response")
    
    # Method 3: Check existing and regenerate
    print("\n📡 Method 3: Checking existing enrollments...")
    
    get_response = requests.get(f"{BASE_URL}/enrollments", headers=form_headers)
    print(f"Get enrollments status: {get_response.status_code}")
    
    if get_response.status_code == 200:
        try:
            enrollments = get_response.json()['data']
            if enrollments:
                enrollment_id = enrollments[0]['id']
                url = enrollments[0]['attributes']['url']
                print(f"✅ Found existing enrollment: ID {enrollment_id}")
                print(f"🔗 URL: {url}")
                return url
        except Exception as e:
            print(f"❌ Error parsing enrollments: {e}")
    
    return None

def create_direct_profile_link():
    """Create direct profile download instructions"""
    
    print("\n💡 ALTERNATIVE: Direct Profile Installation")
    print("=" * 50)
    print("Since enrollment URLs are having issues, use direct profile installation:")
    print("")
    print("🔗 Direct Profile URL:")
    print("https://a.simplemdm.com/configuration_profiles/214139/download")
    print("")
    print("📱 Instructions:")
    print("1. Copy the URL above")
    print("2. Send to your iPhone (text/email)")
    print("3. Open URL on iPhone (Safari)")
    print("4. Tap 'Install' when profile downloads")
    print("5. Enter iPhone passcode")
    print("6. Tap 'Install' to confirm")
    print("7. ✅ CleanBrowsing protection active!")

def main():
    print("🛡️  SimpleMDM Enrollment URL Refresh")
    print("=" * 50)
    
    # Try to get fresh enrollment URL
    fresh_url = refresh_enrollment()
    
    if fresh_url:
        print("\n🎉 SUCCESS!")
        print("=" * 50)
        print("📱 FRESH ENROLLMENT URL:")
        print(fresh_url)
        print("")
        print("📲 iPhone Steps:")
        print("1. Copy URL above")
        print("2. Text/email to iPhone")
        print("3. Open in Safari")
        print("4. Install profiles")
        print("5. Protection active!")
        
    else:
        print("\n⚠️  Enrollment creation needs manual step")
        create_direct_profile_link()
        
        print("\n🔧 Manual Enrollment Creation:")
        print("1. 🌐 Visit: https://a.simplemdm.com/enrollments")
        print("2. ➕ Click 'Add Enrollment'")
        print("3. 📋 Copy the new URL")
        print("4. 📱 Use on iPhone")

if __name__ == "__main__":
    main()


