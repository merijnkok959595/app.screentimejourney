#!/usr/bin/env python3
"""
Test WhatsApp verification code validation
"""

import requests
import json
import boto3

API_URL = "https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws"
TEST_PHONE = "+31627207989"
TEST_CUSTOMER_ID = "9207594189047"

print("🧪 TESTING WHATSAPP VERIFICATION CODE VALIDATION")
print("=" * 60)

# Step 1: Check what codes are stored in DynamoDB
print("\n📋 Step 1: Checking stored verification codes in DynamoDB...")
try:
    dynamodb = boto3.resource('dynamodb', region_name='eu-north-1')
    table = dynamodb.Table('stj_auth_codes')
    
    response = table.scan()
    codes = response.get('Items', [])
    
    if codes:
        print(f"✅ Found {len(codes)} verification code(s):")
        for code in codes:
            print(f"\n   📱 Phone: {code.get('phone_number')}")
            print(f"   🔢 Code: {code.get('code')}")
            print(f"   👤 Customer: {code.get('customer_id')}")
            print(f"   🕒 Created: {code.get('created_at')}")
            print(f"   ⏰ Expires: {code.get('expires_at')}")
            print(f"   ✅ Verified: {code.get('verified', False)}")
    else:
        print("❌ No verification codes found in database")
        
except Exception as e:
    print(f"❌ Error checking DynamoDB: {e}")

# Step 2: Test verification API
print("\n\n📞 Step 2: Testing verification API...")
TEST_CODE = input("\nEnter the verification code you received (or press Enter to skip): ").strip()

if TEST_CODE:
    print(f"\n🔍 Verifying code: {TEST_CODE}")
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
else:
    print("⏭️  Skipped verification test")

print("\n" + "=" * 60)

