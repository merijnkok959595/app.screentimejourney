#!/usr/bin/env python3
"""
🔗 GET WORKING PROFILE DOWNLOAD URL FROM LAMBDA API
=======================================================
Calls your existing Lambda API endpoint to generate a fresh
mobileconfig profile with CleanBrowsing DNS.
"""

import requests
import json
import sys

# Your Lambda API base URL
API_BASE_URL = "https://vpn-test.screentimejourney.com"

# OR if you have a different API Gateway URL:
# API_BASE_URL = "https://your-api-gateway-url.amazonaws.com/prod"

def generate_profile_for_mac():
    """Generate a macOS profile with CleanBrowsing DNS"""
    
    print("🔗 CALLING YOUR LAMBDA API ENDPOINT")
    print("=" * 50)
    print(f"📡 POST {API_BASE_URL}/generate_vpn_profile")
    
    payload = {
        "device_type": "macOS",
        "device_name": "Merijn's Mac",
        "customer_id": "test_customer_123",
        "pincode": "1234",  # Use your preferred PIN
        "device_id": "test_mac_device_001"
    }
    
    print(f"\n📦 Request Payload:")
    print(json.dumps(payload, indent=2))
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/generate_vpn_profile",
            json=payload,
            headers={
                "Content-Type": "application/json"
            },
            timeout=30
        )
        
        print(f"\n📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ SUCCESS! Profile generated!")
            print(f"\n📋 Response Data:")
            print(json.dumps(data, indent=2))
            
            # Extract download URL
            if 'download_url' in data:
                download_url = data['download_url']
                print(f"\n🎯 YOUR DOWNLOAD URL:")
                print(f"🔗 {download_url}")
                print(f"\n📱 INSTALLATION STEPS:")
                print(f"1. Click the URL above in Safari")
                print(f"2. Profile will download automatically")
                print(f"3. System Preferences opens → Click 'Install'")
                print(f"4. Enter admin password")
                print(f"5. Click 'Install' again to confirm")
                print(f"\n✅ After installation:")
                print(f"   - Check System Preferences > Profiles")
                print(f"   - Should see: 'ScreenTime Journey - Merijn's Mac'")
                print(f"   - Test: dig pornhub.com")
                print(f"   - Should use CleanBrowsing DNS: 185.228.168.168")
                
                return download_url
            else:
                print(f"\n⚠️ No download_url in response")
                print(f"Full response: {data}")
        else:
            print(f"\n❌ ERROR: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code == 404:
                print(f"\n🔍 ENDPOINT NOT FOUND")
                print(f"Possible reasons:")
                print(f"1. API_BASE_URL is incorrect")
                print(f"2. Lambda deployment hasn't been updated")
                print(f"3. API Gateway route not configured")
                print(f"\n💡 Check your Lambda deployment logs")
        
    except requests.exceptions.ConnectionError as e:
        print(f"\n❌ CONNECTION ERROR")
        print(f"Cannot reach {API_BASE_URL}")
        print(f"\n💡 POSSIBLE FIXES:")
        print(f"1. Check if Lambda is deployed")
        print(f"2. Verify API Gateway URL is correct")
        print(f"3. Check if API Gateway is publicly accessible")
        print(f"\nError: {e}")
    
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🔧 LAMBDA API PROFILE GENERATOR")
    print("=" * 50)
    print(f"This will call your existing Lambda API")
    print(f"to generate a CleanBrowsing DNS profile.\n")
    
    # Check if user wants to provide custom API URL
    if len(sys.argv) > 1:
        API_BASE_URL = sys.argv[1]
        print(f"📡 Using custom API URL: {API_BASE_URL}\n")
    
    generate_profile_for_mac()


