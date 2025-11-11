#!/usr/bin/env python3
"""
Script to remove all devices from all subscribers in DynamoDB
WARNING: This is a destructive operation!
"""

import boto3
from decimal import Decimal

def clear_all_devices(dry_run=True):
    """
    Remove all devices from all subscribers
    
    Args:
        dry_run: If True, only shows what would be deleted without actually deleting
    """
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
    
    if dry_run:
        print("\n⚠️  DRY RUN MODE - No changes will be made")
        print("\nSubscribers with devices:")
        for item in subscribers_with_devices:
            customer_id = item.get('customer_id', 'unknown')
            email = item.get('email', 'no email')
            device_count = len(item.get('devices', []))
            print(f"  • {email} ({customer_id}): {device_count} device(s)")
        
        print("\n✅ To actually clear devices, run with dry_run=False")
        return
    
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
                UpdateExpression='SET devices = :empty_list',
                ExpressionAttributeValues={
                    ':empty_list': []
                }
            )
            cleared_count += 1
            email = item.get('email', customer_id)
            print(f"  ✅ Cleared devices for {email}")
        except Exception as e:
            print(f"  ❌ Error clearing devices for {customer_id}: {e}")
    
    print(f"\n✅ Successfully cleared devices from {cleared_count}/{len(subscribers_with_devices)} subscribers")

if __name__ == "__main__":
    import sys
    
    print("=" * 60)
    print("🗑️  CLEAR ALL DEVICES FROM DYNAMODB")
    print("=" * 60)
    print()
    
    # First run in dry-run mode to show what will happen
    if len(sys.argv) > 1 and sys.argv[1] == '--confirm':
        print("⚠️  CONFIRM FLAG DETECTED - WILL ACTUALLY DELETE DEVICES")
        response = input("\nType 'DELETE ALL DEVICES' to confirm: ")
        if response == 'DELETE ALL DEVICES':
            clear_all_devices(dry_run=False)
        else:
            print("❌ Confirmation failed. Aborting.")
    else:
        print("Running in DRY RUN mode first...")
        print()
        clear_all_devices(dry_run=True)
        print()
        print("To actually clear devices, run:")
        print("  python clear_all_devices.py --confirm")

