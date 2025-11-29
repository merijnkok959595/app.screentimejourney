#!/usr/bin/env python3
"""
Remove username from stj_subscribers table in eu-north-1
"""

import boto3
from botocore.exceptions import ClientError

# Initialize DynamoDB in the CORRECT region
dynamodb = boto3.resource('dynamodb', region_name='eu-north-1')
table = dynamodb.Table('stj_subscribers')

CUSTOMER_ID = "9207594189047"

print("🗑️  REMOVING USERNAME FROM SUBSCRIBER RECORD")
print("=" * 60)
print(f"Region: eu-north-1")
print(f"Customer ID: {CUSTOMER_ID}")
print()

# Step 1: Get current record
print("📋 Step 1: Fetching current record...")
try:
    response = table.get_item(Key={'customer_id': CUSTOMER_ID})
    
    if 'Item' not in response:
        print(f"❌ Customer {CUSTOMER_ID} not found!")
        exit(1)
    
    current_item = response['Item']
    print(f"✅ Found customer!")
    print(f"   Email: {current_item.get('email', 'N/A')}")
    print(f"   Username: {current_item.get('username', 'NOT SET')}")
    print(f"   Status: {current_item.get('status', 'N/A')}")
    print()
    
except ClientError as e:
    print(f"❌ Error fetching record: {e}")
    exit(1)

# Step 2: Remove username field
print("🗑️  Step 2: Removing username field...")
try:
    response = table.update_item(
        Key={'customer_id': CUSTOMER_ID},
        UpdateExpression='REMOVE username',
        ReturnValues='ALL_NEW'
    )
    print("✅ Username removed successfully!")
    print()
    
except ClientError as e:
    print(f"❌ Error removing username: {e}")
    print(f"   Note: If username doesn't exist, this is expected.")
    print()

# Step 3: Verify the change
print("✅ Step 3: Verifying changes...")
try:
    response = table.get_item(Key={'customer_id': CUSTOMER_ID})
    updated_item = response['Item']
    
    print("📊 Updated Record:")
    print(f"   Customer ID: {updated_item.get('customer_id')}")
    print(f"   Email: {updated_item.get('email', 'N/A')}")
    print(f"   Username: {updated_item.get('username', '❌ REMOVED (not present)')}")
    print(f"   Status: {updated_item.get('status', 'N/A')}")
    print()
    
    if 'username' not in updated_item:
        print("🎉 SUCCESS! Username field is now removed!")
        print()
        print("🎯 Next steps:")
        print("   1. Refresh your app/website")
        print("   2. The onboarding popup should appear")
        print("   3. User will be prompted to create a username")
    else:
        print("⚠️  Warning: Username field still exists:")
        print(f"   Username: {updated_item['username']}")
        
except ClientError as e:
    print(f"❌ Error verifying: {e}")
    exit(1)

print()
print("=" * 60)
print("✅ DONE!")







