#!/usr/bin/env python3
"""
Fix WhatsApp verification table issue

The Lambda is looking for 'stj_auth_codes' but the table is 'stj_auth'
We need to either:
1. Rename the table
2. Update the Lambda environment variable
3. Create the missing table

We'll check what exists and create what's needed.
"""

import boto3
from botocore.exceptions import ClientError

REGION = 'eu-north-1'

print("🔍 FIXING WHATSAPP VERIFICATION TABLE ISSUE")
print("=" * 60)

# Check what tables exist
print("\n📋 Step 1: Checking existing tables...")
dynamodb = boto3.client('dynamodb', region_name=REGION)

try:
    response = dynamodb.list_tables()
    existing_tables = response.get('TableNames', [])
    print(f"✅ Found {len(existing_tables)} tables in {REGION}:")
    for table in existing_tables:
        print(f"   - {table}")
except ClientError as e:
    print(f"❌ Error listing tables: {e}")
    exit(1)

# Check if stj_auth_codes exists
print("\n🔍 Step 2: Checking for stj_auth_codes table...")
if 'stj_auth_codes' in existing_tables:
    print("✅ Table 'stj_auth_codes' exists!")
else:
    print("❌ Table 'stj_auth_codes' does NOT exist!")
    print("   Lambda is looking for this table but it doesn't exist.")
    
    # Check if stj_auth exists
    if 'stj_auth' in existing_tables:
        print("\n💡 Found 'stj_auth' table instead.")
        print("   Options:")
        print("   1. Create 'stj_auth_codes' table (recommended)")
        print("   2. Update Lambda environment variable to use 'stj_auth'")
        
        # Create the missing table
        print("\n🔨 Creating 'stj_auth_codes' table...")
        try:
            dynamodb.create_table(
                TableName='stj_auth_codes',
                KeySchema=[
                    {
                        'AttributeName': 'phone_number',
                        'KeyType': 'HASH'  # Partition key
                    }
                ],
                AttributeDefinitions=[
                    {
                        'AttributeName': 'phone_number',
                        'AttributeType': 'S'  # String
                    }
                ],
                BillingMode='PAY_PER_REQUEST',  # On-demand pricing
                Tags=[
                    {
                        'Key': 'Project',
                        'Value': 'ScreenTimeJourney'
                    },
                    {
                        'Key': 'Purpose',
                        'Value': 'WhatsApp Verification Codes'
                    }
                ]
            )
            
            print("✅ Table 'stj_auth_codes' created successfully!")
            print("   Waiting for table to become active...")
            
            # Wait for table to be active
            waiter = dynamodb.get_waiter('table_exists')
            waiter.wait(TableName='stj_auth_codes')
            
            print("✅ Table is now active and ready to use!")
            
        except ClientError as e:
            print(f"❌ Error creating table: {e}")
            exit(1)
    else:
        print("\n❌ Neither 'stj_auth_codes' nor 'stj_auth' exists!")
        print("   Creating 'stj_auth_codes' table from scratch...")
        
        try:
            dynamodb.create_table(
                TableName='stj_auth_codes',
                KeySchema=[
                    {
                        'AttributeName': 'phone_number',
                        'KeyType': 'HASH'  # Partition key
                    }
                ],
                AttributeDefinitions=[
                    {
                        'AttributeName': 'phone_number',
                        'AttributeType': 'S'  # String
                    }
                ],
                BillingMode='PAY_PER_REQUEST',  # On-demand pricing
                Tags=[
                    {
                        'Key': 'Project',
                        'Value': 'ScreenTimeJourney'
                    },
                    {
                        'Key': 'Purpose',
                        'Value': 'WhatsApp Verification Codes'
                    }
                ]
            )
            
            print("✅ Table 'stj_auth_codes' created successfully!")
            print("   Waiting for table to become active...")
            
            # Wait for table to be active
            waiter = dynamodb.get_waiter('table_exists')
            waiter.wait(TableName='stj_auth_codes')
            
            print("✅ Table is now active and ready to use!")
            
        except ClientError as e:
            print(f"❌ Error creating table: {e}")
            exit(1)

print("\n" + "=" * 60)
print("🎉 DONE!")
print("\n✅ WhatsApp verification should now work!")
print("   Test by running: python3 test-whatsapp-verification.py")







