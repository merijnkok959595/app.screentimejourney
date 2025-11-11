#!/usr/bin/env python3
"""
Script to remove all devices from all subscribers in DynamoDB
Non-interactive version
"""

import boto3

def clear_all_devices():
    """Remove all devices from all subscribers"""
    dynamodb = boto3.resource('dynamodb', region_name='eu-north-1')
    table = dynamodb.Table('stj_subscribers')
    
    print("🔍 Scanning all subscribers...")
    
    # Scan all items
    response = table.scan()
    items = response.get('Items', [])
    
    # Continue scanning if there are more items
    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        items.extend(response.get('Items', []))
    
    print(f"📊 Found {len(items)} total subscribers")
    
    # Count subscribers with devices
    subscribers_with_devices = [item for item in items if item.get('devices')]
    total_devices = sum(len(item.get('devices', [])) for item in subscribers_with_devices)
    
    print(f"📱 {len(subscribers_with_devices)} subscribers have devices")
    print(f"📱 {total_devices} total devices to remove")
    
    # Actually clear devices
    print("\n🗑️  CLEARING DEVICES...")
    cleared_count = 0
    
    for item in subscribers_with_devices:
        customer_id = item.get('customer_id')
        if not customer_id:
            continue
        
        try:
            table.update_item(
                Key={'customer_id': customer_id},
                UpdateExpression='REMOVE devices',
                # Alternative: SET devices = :empty_list
                # ExpressionAttributeValues={':empty_list': []}
            )
            cleared_count += 1
            email = item.get('email', customer_id)
            device_count = len(item.get('devices', []))
            print(f"  ✅ Cleared {device_count} device(s) for {email} ({customer_id})")
        except Exception as e:
            print(f"  ❌ Error clearing devices for {customer_id}: {e}")
    
    print(f"\n✅ Successfully cleared devices from {cleared_count}/{len(subscribers_with_devices)} subscribers")

if __name__ == "__main__":
    print("=" * 60)
    print("🗑️  CLEARING ALL DEVICES FROM DYNAMODB")
    print("=" * 60)
    print()
    clear_all_devices()

