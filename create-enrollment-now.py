#!/usr/bin/env python3

import requests
from base64 import b64encode
import json

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def try_create_enrollment():
    """Try to create enrollment with active certificate"""
    
    print("🚀 Attempting SimpleMDM Enrollment Creation...")
    print("=" * 50)
    print("Certificate Status: Active (uploaded today)")
    print("Testing if API enrollment works now...")
    print("")
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    
    # Method 1: Try POST to enrollments endpoint
    print("📡 Method 1: Standard enrollment creation...")
    
    headers = {"Authorization": f"Basic {auth_header}"}
    
    enrollment_data = {
        'name': 'ScreenTime Journey - iPhone Enrollment (API Test)',
        'url_expires': 'false'
    }
    
    response1 = requests.post(f"{BASE_URL}/enrollments", headers=headers, data=enrollment_data)
    
    print(f"Status: {response1.status_code}")
    
    if response1.status_code == 201:
        try:
            enrollment = response1.json()['data']
            url = enrollment['attributes']['url']
            enrollment_id = enrollment['id']
            
            print("✅ SUCCESS! Enrollment created via API!")
            print(f"🔗 Enrollment URL: {url}")
            print(f"📋 Enrollment ID: {enrollment_id}")
            return url
        except Exception as e:
            print(f"❌ Response parsing error: {e}")
            print(f"Raw response: {response1.text}")
    else:
        print(f"❌ Failed: {response1.text[:200]}")
    
    # Method 2: Try different endpoint format
    print(f"\n📡 Method 2: Alternative endpoint...")
    
    try:
        response2 = requests.post(f"{BASE_URL}/enrollment_invitations", headers=headers, data=enrollment_data)
        print(f"Status: {response2.status_code}")
        print(f"Response: {response2.text[:200]}")
    except:
        print("Endpoint not available")
    
    # Method 3: Get existing enrollments
    print(f"\n📡 Method 3: Check existing enrollments...")
    
    get_response = requests.get(f"{BASE_URL}/enrollments", headers=headers)
    
    if get_response.status_code == 200:
        try:
            enrollments = get_response.json()['data']
            
            if enrollments:
                print(f"✅ Found {len(enrollments)} existing enrollment(s)!")
                
                for enrollment in enrollments:
                    enrollment_id = enrollment['id']
                    url = enrollment['attributes']['url']
                    name = enrollment['attributes'].get('name', 'Unnamed')
                    
                    print(f"📋 {name}")
                    print(f"   ID: {enrollment_id}")
                    print(f"   URL: {url}")
                    print("")
                
                # Return the first one
                return enrollments[0]['attributes']['url']
            else:
                print("No existing enrollments found")
        except Exception as e:
            print(f"Error parsing enrollments: {e}")
    else:
        print(f"Failed to get enrollments: {get_response.status_code}")
    
    return None

def test_enrollment_url(url):
    """Test if enrollment URL is accessible"""
    
    if not url:
        return False
    
    print(f"\n🧪 Testing enrollment URL accessibility...")
    
    try:
        response = requests.get(url, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Enrollment URL is accessible!")
            return True
        else:
            print("❌ Enrollment URL returns error")
            return False
    except Exception as e:
        print(f"❌ URL test failed: {e}")
        return False

def provide_instructions(enrollment_url):
    """Provide customer instructions for the enrollment URL"""
    
    if enrollment_url:
        print(f"\n🎉 SUCCESS! Working Enrollment URL:")
        print("=" * 60)
        print(f"{enrollment_url}")
        print("=" * 60)
        print("")
        print("📱 iPhone Instructions for Customers:")
        print("1. Copy the URL above")
        print("2. Text/email to iPhone")
        print("3. Open URL in Safari on iPhone")
        print("4. Tap 'Allow' to download profile")
        print("5. Settings > General > VPN & Device Management")
        print("6. Install SimpleMDM enrollment profile")
        print("7. Protection profile auto-installs!")
        print("")
        print("🛡️ What Customers Get:")
        print("✅ CleanBrowsing DNS protection")
        print("✅ Screen Time restrictions enforced")
        print("✅ Remote management enabled")
        print("✅ Professional MDM experience")
        print("")
        print("📊 Business Benefits:")
        print("✅ Device appears in SimpleMDM dashboard")
        print("✅ Remote profile updates")
        print("✅ Compliance monitoring")
        print("✅ Can't be easily removed by customer")
        
    else:
        print(f"\n⏱️  Enrollment creation not ready yet")
        print("💡 Certificate may still be propagating (10-15 minutes)")
        print("")
        print("🔄 Try again in 10 minutes, or use:")
        print("1. SimpleMDM dashboard manual enrollment creation")
        print("2. Direct S3 profiles as backup")

def main():
    print("🏢 SimpleMDM API Enrollment Creator")
    print("=" * 50)
    print("Testing enrollment creation with active certificate...")
    print("")
    
    # Try to create enrollment
    enrollment_url = try_create_enrollment()
    
    # Test URL if created
    if enrollment_url:
        url_works = test_enrollment_url(enrollment_url)
        if url_works:
            provide_instructions(enrollment_url)
        else:
            print("❌ URL created but not accessible yet")
            print("⏱️  Wait 10 minutes and try URL again")
    else:
        provide_instructions(None)

if __name__ == "__main__":
    main()


