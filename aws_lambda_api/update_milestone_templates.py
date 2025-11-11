#!/usr/bin/env python3
"""
Script to update level_template field in all milestones
Pattern: m0, m1, m2... for male, f0, f1, f2... for female
"""

import boto3
import json
from decimal import Decimal

def decimal_default(obj):
    """Helper for JSON serialization of Decimal"""
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError

def update_milestone_templates():
    """Update all milestone level_template fields"""
    
    print("🔄 Updating milestone templates in DynamoDB...")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    
    # Initialize DynamoDB
    dynamodb = boto3.resource('dynamodb', region_name='eu-north-1')
    table = dynamodb.Table('stj_system')
    
    # 1. Fetch current milestone data
    print("\n📥 Fetching current milestone data...")
    response = table.get_item(Key={'config_key': 'milestones'})
    
    if 'Item' not in response:
        print("❌ Milestones not found in database!")
        return
    
    item = response['Item']
    milestones = item.get('data', [])
    
    print(f"✅ Found {len(milestones)} milestones")
    
    # 2. Update each milestone's level_template
    print("\n🔄 Updating level_template fields...")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    
    updated_count = 0
    
    for milestone in milestones:
        gene = milestone.get('gene', 'male').lower()
        level = int(milestone.get('level', 0))
        title = milestone.get('title', 'Unknown')
        
        # Generate level_template: m0, m1, m2... or f0, f1, f2...
        prefix = 'm' if gene == 'male' else 'f'
        new_template = f"{prefix}{level}"
        
        old_template = milestone.get('level_template', '')
        
        # Update the field
        milestone['level_template'] = new_template
        
        print(f"  {'✅' if old_template != new_template else '⚪'} Level {level:2d} ({gene:6s}) - {title:30s} → {new_template}")
        
        if old_template != new_template:
            updated_count += 1
    
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"\n📊 Updated {updated_count} milestone templates")
    
    # 3. Write back to DynamoDB
    print("\n💾 Writing updated data back to DynamoDB...")
    
    try:
        table.put_item(Item=item)
        print("✅ Successfully updated milestone data in DynamoDB!")
    except Exception as e:
        print(f"❌ Error updating DynamoDB: {e}")
        return
    
    # 4. Create backup
    print("\n💾 Creating backup...")
    backup_file = 'milestone_templates_backup.json'
    
    with open(backup_file, 'w') as f:
        json.dump(item, f, indent=2, default=decimal_default)
    
    print(f"✅ Backup saved to: {backup_file}")
    
    # 5. Show summary
    print("\n" + "━" * 70)
    print("✅ UPDATE COMPLETE!")
    print("━" * 70)
    print("\nTemplate Pattern:")
    print("  Male:   m0, m1, m2, m3, ...")
    print("  Female: f0, f1, f2, f3, ...")
    print("\n📊 Summary:")
    
    male_count = len([m for m in milestones if m.get('gene', '').lower() == 'male'])
    female_count = len([m for m in milestones if m.get('gene', '').lower() == 'female'])
    
    print(f"  Total milestones:  {len(milestones)}")
    print(f"  Male milestones:   {male_count}")
    print(f"  Female milestones: {female_count}")
    print(f"  Templates updated: {updated_count}")
    
    print("\n🎯 Example templates:")
    for milestone in milestones[:5]:
        gene = milestone.get('gene', 'male')
        level = milestone.get('level', 0)
        title = milestone.get('title', 'Unknown')
        template = milestone.get('level_template', '')
        print(f"  {template:4s} - {title} ({gene})")
    
    print("\n✅ All done!")
    print("━" * 70)

if __name__ == '__main__':
    update_milestone_templates()

