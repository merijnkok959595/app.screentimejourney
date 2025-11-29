#!/usr/bin/env python3
"""
Add milestone_fact field to all milestones in DynamoDB
Facts about dopamine receptor recovery at each level
"""

import boto3
from decimal import Decimal

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name='eu-north-1')
system_table = dynamodb.Table('stj_system')

# Dopamine/brain science facts for each level
# Based on research about dopamine receptor recovery during abstinence from digital overstimulation

milestone_facts = {
    # Female milestones - Short, concise dopamine facts
    ('female', 0): "Dopamine receptors beginning their recovery.",
    ('female', 1): "Dopamine sensitivity increases by ~15%.",
    ('female', 2): "Neural pathways strengthen significantly.",
    ('female', 3): "Receptor density improves naturally.",
    ('female', 4): "Prefrontal cortex begins to normalize.",
    ('female', 5): "Dopamine D2 receptors show marked recovery.",
    ('female', 6): "Your reward system recalibrates.",
    ('female', 7): "Neuroplasticity peaks in your brain.",
    ('female', 8): "Dopamine baseline stabilizes.",
    ('female', 9): "Executive function reaches peak recovery.",
    ('female', 10): "Complete dopamine receptor reset achieved.",
    
    # Male milestones - Short, concise dopamine facts
    ('male', 0): "Dopamine receptors beginning their recovery.",
    ('male', 1): "Dopamine sensitivity increases by ~15%.",
    ('male', 2): "Neural pathways strengthen significantly.",
    ('male', 3): "Receptor density improves naturally.",
    ('male', 4): "Prefrontal cortex begins to normalize.",
    ('male', 5): "Dopamine D2 receptors show marked recovery.",
    ('male', 6): "Your reward system recalibrates.",
    ('male', 7): "Neuroplasticity peaks in your brain.",
    ('male', 8): "Dopamine baseline stabilizes.",
    ('male', 9): "Executive function reaches peak recovery.",
    ('male', 10): "Complete dopamine receptor reset achieved.",
}

def add_milestone_facts():
    """Add milestone_fact field to all milestones in stj_system"""
    print("🧠 Adding dopamine facts to milestones...")
    
    try:
        # Get current milestones
        response = system_table.get_item(Key={'config_key': 'milestones'})
        
        if 'Item' not in response:
            print("❌ No milestones found in stj_system")
            return False
        
        milestone_collection = response['Item']
        milestones = milestone_collection.get('data', [])
        
        print(f"📊 Found {len(milestones)} milestones")
        
        # Add milestone_fact to each milestone
        updated_count = 0
        for milestone in milestones:
            gender = milestone.get('gene', 'male')
            level = int(milestone.get('level', 0))
            
            # Get the appropriate fact
            fact = milestone_facts.get((gender, level), "Your brain is healing. Each day strengthens your neural pathways.")
            
            # Add the milestone_fact field
            milestone['milestone_fact'] = fact
            updated_count += 1
            
            print(f"✅ {gender.capitalize()} Level {level} ({milestone.get('title', 'Unknown')}): Added fact")
        
        # Update the entire collection back to DynamoDB
        milestone_collection['data'] = milestones
        milestone_collection['last_updated'] = Decimal(str(int(__import__('time').time())))
        
        system_table.put_item(Item=milestone_collection)
        
        print(f"\n🎉 Successfully added milestone_fact to {updated_count} milestones!")
        print("✅ All milestones updated in stj_system table")
        
        return True
        
    except Exception as e:
        print(f"❌ Error adding milestone facts: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Starting milestone facts update...\n")
    success = add_milestone_facts()
    
    if success:
        print("\n✨ Done! Milestone facts have been added to all milestones.")
        print("📱 The video generator will now use these facts instead of descriptions.")
    else:
        print("\n❌ Failed to add milestone facts. Please check the error above.")

