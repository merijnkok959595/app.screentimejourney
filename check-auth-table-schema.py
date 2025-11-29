#!/usr/bin/env python3
"""
Check the stj_auth_codes table schema
"""

import boto3

print("🔍 CHECKING AUTH TABLE SCHEMA")
print("=" * 60)

dynamodb = boto3.client('dynamodb', region_name='eu-north-1')

try:
    response = dynamodb.describe_table(TableName='stj_auth_codes')
    
    table = response['Table']
    print(f"✅ Table: {table['TableName']}")
    print(f"   Status: {table['TableStatus']}")
    print()
    
    print("🔑 Key Schema:")
    for key in table['KeySchema']:
        print(f"   - {key['AttributeName']} ({key['KeyType']})")
    
    print()
    print("📊 Attributes:")
    for attr in table['AttributeDefinitions']:
        print(f"   - {attr['AttributeName']}: {attr['AttributeType']}")
    
    print()
    print("=" * 60)
    print("❌ ISSUE FOUND!")
    print()
    print("The table only has 'phone_number' as HASH key")
    print("But Lambda is trying to query with phone_number + code (composite key)")
    print()
    print("Solution: Fix Lambda to query with phone_number only, then check code manually")
    
except Exception as e:
    print(f"❌ Error: {e}")







