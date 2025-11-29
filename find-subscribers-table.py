#!/usr/bin/env python3
"""
Search all AWS regions for stj_subscribers table
"""

import boto3
from botocore.exceptions import ClientError

print("🔍 SEARCHING ALL AWS REGIONS FOR TABLES")
print("=" * 60)

# All AWS regions
regions = [
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
    'eu-north-1', 'ap-south-1', 'ap-northeast-1', 'ap-northeast-2',
    'ap-southeast-1', 'ap-southeast-2', 'ca-central-1', 'sa-east-1'
]

found_tables = {}

for region in regions:
    try:
        dynamodb = boto3.client('dynamodb', region_name=region)
        response = dynamodb.list_tables()
        
        tables = response.get('TableNames', [])
        if tables:
            # Check for our target tables
            target_tables = ['stj_auth', 'stj_password', 'stj_subscribers', 'stj_system']
            found = [t for t in tables if t in target_tables]
            
            if found:
                found_tables[region] = found
                print(f"\n✅ {region}: {', '.join(found)}")
            
    except ClientError as e:
        pass  # Skip inaccessible regions

print("\n" + "=" * 60)

if found_tables:
    print(f"\n🎯 Found tables in {len(found_tables)} region(s)!")
    
    # Now let's check stj_subscribers
    for region, tables in found_tables.items():
        if 'stj_subscribers' in tables:
            print(f"\n📊 Checking stj_subscribers in {region}...")
            
            dynamodb = boto3.resource('dynamodb', region_name=region)
            table = dynamodb.Table('stj_subscribers')
            
            # Get table info
            dynamodb_client = boto3.client('dynamodb', region_name=region)
            response = dynamodb_client.describe_table(TableName='stj_subscribers')
            
            print(f"   Items: {response['Table']['ItemCount']}")
            print(f"   Key Schema:")
            for key in response['Table']['KeySchema']:
                print(f"      - {key['AttributeName']} ({key['KeyType']})")
            
else:
    print("\n❌ No target tables found in any region!")







