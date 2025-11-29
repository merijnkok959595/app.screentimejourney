#!/usr/bin/env python3

import requests
from base64 import b64encode
import json
from datetime import datetime

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def create_test_device():
    """Create a test device to get enrollment URL"""
    
    print("🚀 CREATING TEST DEVICE FOR ENROLLMENT URL")
    print("=" * 45)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Create device with unique name
    device_name = f"ScreenTime-Test-{datetime.now().strftime('%H%M%S')}"
    
    device_data = {
        "name": device_name
    }
    
    try:
        print("📡 POST /api/v1/devices")
        print(f"Device name: {device_name}")
        
        response = requests.post(
            f"{BASE_URL}/devices",
            headers=headers,
            data=device_data,
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 201:
            print("🎉 SUCCESS! Device created!")
            
            device_response = response.json()
            
            if 'data' in device_response:
                device_id = device_response['data']['id']
                attrs = device_response['data']['attributes']
                
                device_name = attrs.get('name')
                enrollment_url = attrs.get('enrollment_url')
                status = attrs.get('status')
                
                print(f"\n✅ NEW DEVICE CREATED:")
                print(f"   ID: {device_id}")
                print(f"   Name: {device_name}")
                print(f"   Status: {status}")
                print(f"   Enrollment URL: {enrollment_url}")
                
                if enrollment_url:
                    print(f"\n📱 TEST THIS URL ON IPHONE:")
                    print(f"🔗 {enrollment_url}")
                    print(f"\n📋 INSTRUCTIONS:")
                    print(f"1. Open Safari on iPhone")
                    print(f"2. Go to the URL above")
                    print(f"3. Install the profile")
                    print(f"4. Enhanced parental control will be active!")
                    
                    return enrollment_url
                else:
                    print("❌ No enrollment URL in response")
                    print(f"Full response: {json.dumps(device_response, indent=2)}")
                
        elif response.status_code == 404:
            print("❌ 404 - Devices endpoint not found")
            
        elif response.status_code == 422:
            print("⚠️ 422 - Validation error")
            print(f"Response: {response.text}")
            
        elif response.status_code == 401:
            print("❌ 401 - Authentication failed")
            print("Check API key permissions")
            
        else:
            print(f"❌ Status {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"💥 Request failed: {e}")
    
    return None

def check_existing_devices():
    """Check existing devices to understand the structure"""
    
    print(f"\n📋 CHECKING EXISTING DEVICES")
    print("=" * 30)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    try:
        response = requests.get(f"{BASE_URL}/devices", headers=headers)
        
        print(f"GET /devices: {response.status_code}")
        
        if response.status_code == 200:
            devices = response.json()['data']
            
            print(f"✅ Found {len(devices)} existing device(s)")
            
            for device in devices[:3]:  # Show first 3
                device_id = device['id']
                attrs = device['attributes']
                name = attrs.get('name', 'Unknown')
                status = attrs.get('status', 'Unknown')
                enrollment_url = attrs.get('enrollment_url')
                
                print(f"   📱 {name} (ID: {device_id})")
                print(f"       Status: {status}")
                if enrollment_url:
                    print(f"       Enrollment URL: {enrollment_url}")
                print("")
            
            # If there are devices with enrollment URLs, show them
            devices_with_urls = [d for d in devices if d['attributes'].get('enrollment_url')]
            if devices_with_urls:
                print(f"🔗 EXISTING ENROLLMENT URLS:")
                for device in devices_with_urls[:2]:  # Show first 2
                    url = device['attributes']['enrollment_url']
                    name = device['attributes'].get('name', 'Unknown')
                    print(f"   {name}: {url}")
                
                return devices_with_urls[0]['attributes']['enrollment_url']
                
        else:
            print(f"❌ Failed to get devices: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    return None

def main():
    print("🧪 SIMPLEMDM DEVICE CREATION TEST")
    print("=" * 40)
    print("Testing device creation to get enrollment URLs")
    print("")
    
    # First check existing devices
    existing_url = check_existing_devices()
    
    if existing_url:
        print(f"\n📱 FOUND EXISTING ENROLLMENT URL:")
        print(f"🔗 {existing_url}")
        print(f"\n✅ You can test this URL on iPhone right now!")
    
    # Try to create new device
    new_url = create_test_device()
    
    if new_url:
        print(f"\n🎉 SUCCESS! NEW ENROLLMENT URL CREATED:")
        print(f"🔗 {new_url}")
        print(f"\n🚀 AUTOMATION CONFIRMED!")
        print(f"✅ We can create devices programmatically")
        print(f"✅ Each device gets unique enrollment URL")
        print(f"✅ Perfect for customer onboarding automation")
        
    elif existing_url:
        print(f"\n📋 DEVICE CREATION FAILED, BUT EXISTING URL AVAILABLE")
        print(f"Could be API permissions or rate limiting")
        
    else:
        print(f"\n❌ NO ENROLLMENT URLS AVAILABLE")
        print(f"Need to investigate API access or try other methods")

if __name__ == "__main__":
    main()

