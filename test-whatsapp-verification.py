#!/usr/bin/env python3
"""
Test WhatsApp verification code sending
"""

import requests
import json

API_URL = "https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws"
TEST_PHONE = "+31627207989"  # Your phone number
TEST_CUSTOMER_ID = "9207594189047"

print("🧪 TESTING WHATSAPP VERIFICATION")
print("=" * 60)
print(f"API URL: {API_URL}")
print(f"Phone: {TEST_PHONE}")
print(f"Customer ID: {TEST_CUSTOMER_ID}")
print()

# Test sending verification code
print("📱 Step 1: Sending verification code...")
try:
    response = requests.post(
        f"{API_URL}/send_whatsapp_code",
        headers={'Content-Type': 'application/json'},
        json={
            'phone_number': TEST_PHONE,
            'customer_id': TEST_CUSTOMER_ID
        },
        timeout=30
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response:")
    print(json.dumps(response.json(), indent=2))
    
    if response.status_code == 200:
        print("\n✅ SUCCESS! Verification code sent!")
    else:
        print(f"\n❌ FAILED! Error: {response.json().get('error', 'Unknown error')}")
        if 'details' in response.json():
            print(f"Details: {response.json()['details']}")
        if 'debug_info' in response.json():
            print(f"Debug Info: {json.dumps(response.json()['debug_info'], indent=2)}")
    
except requests.exceptions.Timeout:
    print("❌ Request timed out after 30 seconds")
except requests.exceptions.RequestException as e:
    print(f"❌ Request failed: {e}")
except Exception as e:
    print(f"❌ Unexpected error: {e}")

print("\n" + "=" * 60)







