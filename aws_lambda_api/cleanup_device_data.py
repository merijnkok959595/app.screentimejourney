import boto3
import json
import argparse
from datetime import datetime
from decimal import Decimal

# Helper to convert DynamoDB Decimal to regular types
def decimal_default(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError

def cleanup_device_data(dry_run: bool = True):
    """
    Clean up oversized device data in stj_subscribers table.
    Removes large fields and keeps only essential device information.
    """
    dynamodb = boto3.resource('dynamodb', region_name='eu-north-1')
    subscribers_table = dynamodb.Table('stj_subscribers')

    print("=" * 70)
    print("🧹 DEVICE DATA CLEANUP - DynamoDB Size Optimization")
    print("=" * 70)
    
    if dry_run:
        print("\n⚠️  DRY RUN MODE - No changes will be made\n")
    else:
        print("\n🚨 LIVE MODE - Changes will be saved to DynamoDB\n")
        confirmation = input("Type 'CLEANUP' to confirm: ")
        if confirmation != 'CLEANUP':
            print("❌ Confirmation failed. Aborting.")
            return

    print("🔍 Scanning all subscribers...\n")
    response = subscribers_table.scan()
    subscribers = response.get('Items', [])
    
    total_size_before = 0
    total_size_after = 0
    subscribers_updated = 0
    
    for subscriber in subscribers:
        customer_id = subscriber['customer_id']
        email = subscriber.get('email', 'unknown')
        devices = subscriber.get('devices', [])
        
        if not devices:
            continue
            
        # Calculate size before cleanup
        size_before = len(json.dumps(devices, default=decimal_default))
        total_size_before += size_before
        
        print(f"👤 Customer: {email} ({customer_id})")
        print(f"   📱 Devices: {len(devices)}")
        print(f"   📊 Size before: {size_before:,} bytes")
        
        cleaned_devices = []
        for device in devices:
            # Keep only essential fields
            cleaned_device = {
                'id': device.get('id'),
                'name': device.get('name'),
                'type': device.get('type'),
                'icon': device.get('icon', '📱'),
                'status': device.get('status', 'locked'),
                'addedDate': device.get('addedDate', device.get('added_at', datetime.now().isoformat())),
                'created_at': device.get('created_at', datetime.now().isoformat()),
                'last_updated': device.get('last_updated', datetime.now().isoformat()),
            }
            
            # Keep current pincodes if they exist (lightweight)
            if 'current_audio_pincode' in device:
                cleaned_device['current_audio_pincode'] = device['current_audio_pincode']
            if 'current_mdm_pincode' in device:
                cleaned_device['current_mdm_pincode'] = device['current_mdm_pincode']
            
            # Keep lightweight generation tracking
            if 'pincode_generation' in device:
                cleaned_device['pincode_generation'] = device['pincode_generation']
            elif 'pincode_generations' in device:
                # Convert old format to new lightweight format
                old_gen = device['pincode_generations']
                cleaned_device['pincode_generation'] = {
                    'audio': old_gen.get('audio', {}).get('current_generation', 1),
                    'mdm': old_gen.get('mdm', {}).get('current_generation', 0)
                }
            
            # Keep pincode (but not full tracking objects)
            if 'pincode' in device:
                cleaned_device['pincode'] = device['pincode']
            if 'mdm_pincode' in device:
                cleaned_device['mdm_pincode'] = device['mdm_pincode']
            
            # Keep URLs (not full response objects)
            if 'audio_url' in device and isinstance(device['audio_url'], str):
                cleaned_device['audio_url'] = device['audio_url']
            if 'profile_url' in device and isinstance(device['profile_url'], str):
                cleaned_device['profile_url'] = device['profile_url']
            
            # Keep setup completion timestamp
            if 'setup_completed_at' in device:
                cleaned_device['setup_completed_at'] = device['setup_completed_at']
            
            cleaned_devices.append(cleaned_device)
        
        # Calculate size after cleanup
        size_after = len(json.dumps(cleaned_devices, default=decimal_default))
        total_size_after += size_after
        reduction = size_before - size_after
        reduction_pct = (reduction / size_before * 100) if size_before > 0 else 0
        
        print(f"   📊 Size after: {size_after:,} bytes")
        print(f"   ✂️  Reduced by: {reduction:,} bytes ({reduction_pct:.1f}%)")
        
        if size_after > 350000:  # Still over safe limit
            print(f"   ⚠️  WARNING: Still over 350KB limit after cleanup!")
        else:
            print(f"   ✅ Within safe DynamoDB limits")
        
        # Update in DynamoDB
        if not dry_run:
            try:
                subscribers_table.update_item(
                    Key={'customer_id': customer_id},
                    UpdateExpression='SET devices = :devices, last_updated = :timestamp',
                    ExpressionAttributeValues={
                        ':devices': cleaned_devices,
                        ':timestamp': datetime.now().isoformat()
                    }
                )
                subscribers_updated += 1
                print(f"   💾 Updated in DynamoDB")
            except Exception as e:
                print(f"   ❌ Failed to update: {e}")
        
        print()
    
    # Summary
    print("=" * 70)
    print("📊 CLEANUP SUMMARY")
    print("=" * 70)
    print(f"Total subscribers processed: {len(subscribers)}")
    print(f"Subscribers with devices: {sum(1 for s in subscribers if s.get('devices'))}")
    print(f"Total size before: {total_size_before:,} bytes ({total_size_before/1024/1024:.2f} MB)")
    print(f"Total size after: {total_size_after:,} bytes ({total_size_after/1024/1024:.2f} MB)")
    print(f"Total reduction: {total_size_before - total_size_after:,} bytes ({(total_size_before - total_size_after)/total_size_before*100:.1f}%)")
    
    if not dry_run:
        print(f"Subscribers updated: {subscribers_updated}")
    else:
        print("\n⚠️  DRY RUN - No changes were made. Run with --confirm to apply changes.")
    print()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Clean up oversized device data in DynamoDB.")
    parser.add_argument('--confirm', action='store_true', help="Apply changes (not a dry run).")
    args = parser.parse_args()
    
    cleanup_device_data(dry_run=not args.confirm)

