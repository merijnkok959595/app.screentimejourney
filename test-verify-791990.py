#!/usr/bin/env python3
"""
Test verifying the current code 791990
"""

import requests
import json

API_URL = "https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws"
TEST_PHONE = "+31627207989"
TEST_CUSTOMER_ID = "9207594189047"
TEST_CODE = "791990"

print("🧪 TESTING CODE VERIFICATION: 791990")
print("=" * 60)
print(f"Phone: {TEST_PHONE}")
print(f"Code: {TEST_CODE}")
print(f"Customer ID: {TEST_CUSTOMER_ID}")
print()

try:
    response = requests.post(
        f"{API_URL}/verify_whatsapp_code",
        headers={'Content-Type': 'application/json'},
        json={
            'phone_number': TEST_PHONE,
            'code': TEST_CODE,
            'customer_id': TEST_CUSTOMER_ID
        },
        timeout=30
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response:")
    print(json.dumps(response.json(), indent=2))
    
    if response.status_code == 200:
        print("\n✅ SUCCESS! Code verified!")
    else:
        print(f"\n❌ FAILED! Error: {response.json().get('error', 'Unknown error')}")
    
except Exception as e:
    print(f"❌ Request failed: {e}")

print("\n" + "=" * 60)







