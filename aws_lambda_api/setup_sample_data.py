#!/usr/bin/env python3
"""
Setup sample leaderboard data - Delete old records and create 30 sample users
"""

import boto3
import json
import random
from datetime import datetime, timedelta
from decimal import Decimal

# Sample usernames and data
SAMPLE_USERS = [
    {"username": "DigitalWarrior", "gender": "male"},
    {"username": "MindfulMaster", "gender": "female"}, 
    {"username": "TechDetox", "gender": "male"},
    {"username": "FocusQueen", "gender": "female"},
    {"username": "ZenModeOn", "gender": "male"},
    {"username": "ScreenFreeLife", "gender": "female"},
    {"username": "DigitalMinimalist", "gender": "male"},
    {"username": "MindfulTech", "gender": "female"},
    {"username": "FocusKing", "gender": "male"},
    {"username": "BalancedLife", "gender": "female"},
    {"username": "TechWisdom", "gender": "male"},
    {"username": "DigitalBalance", "gender": "female"},
    {"username": "MindfulGamer", "gender": "male"},
    {"username": "FocusedMind", "gender": "female"},
    {"username": "ScreenTimeHero", "gender": "male"},
    {"username": "DigitalWellness", "gender": "female"},
    {"username": "TechMindful", "gender": "male"},
    {"username": "FocusChampion", "gender": "female"},
    {"username": "BalancedTech", "gender": "male"},
    {"username": "MindfulUser", "gender": "female"},
    {"username": "DigitalZen", "gender": "male"},
    {"username": "TechBalance", "gender": "female"},
    {"username": "FocusedLife", "gender": "male"},
    {"username": "ScreenWise", "gender": "female"},
    {"username": "DigitalMindful", "gender": "male"},
    {"username": "TechFocus", "gender": "female"},
    {"username": "MindfulTechie", "gender": "male"},
    {"username": "BalancedScreen", "gender": "female"},
    {"username": "DigitalFocus", "gender": "male"},
    {"username": "TechZenMaster", "gender": "female"}
]

def delete_old_records():
    """Delete all records except theking"""
    dynamodb = boto3.resource('dynamodb', region_name='eu-north-1')
    table = dynamodb.Table('stj_subscribers')
    
    # List of customer IDs to delete
    customer_ids_to_delete = [
        "2492854714525", "4227198082996", "4578233333690", "3251585869955", 
        "1675745641503", "3851735050195", "5616331319920", "7558471562365", 
        "1943147819126", "4973693903526", "6410047518664", "2598403540051", 
        "6744787577985", "9608670127255", "2736504568299", "3389683277463", 
        "5550614112780", "webapp_1756989452", "5803153422537", "8265426434267", 
        "1903671561258"
    ]
    
    print(f"🗑️ Deleting {len(customer_ids_to_delete)} old records...")
    
    for customer_id in customer_ids_to_delete:
        try:
            table.delete_item(Key={'customer_id': customer_id})
            print(f"  ✅ Deleted customer_id: {customer_id}")
        except Exception as e:
            print(f"  ❌ Failed to delete {customer_id}: {e}")

def create_sample_device_data(days_active):
    """Create realistic device data for a user"""
    base_date = datetime.now() - timedelta(days=days_active)
    
    devices = []
    for i in range(random.randint(1, 3)):  # 1-3 devices per user
        device = {
            "device_id": f"device_{random.randint(100000, 999999)}",
            "device_name": random.choice(["iPhone", "iPad", "Android Phone", "Android Tablet"]),
            "platform": random.choice(["ios", "android"]),
            "added_at": base_date.isoformat(),
            "last_checkin": (datetime.now() - timedelta(days=random.randint(0, 7))).isoformat(),
            "screen_time_data": []
        }
        
        # Add screen time data for recent days
        for day in range(min(days_active, 30)):  # Last 30 days max
            date_str = (datetime.now() - timedelta(days=day)).strftime("%Y-%m-%d")
            screen_time = {
                "date": date_str,
                "total_minutes": random.randint(60, 480),  # 1-8 hours
                "app_usage": {
                    "social_media": random.randint(0, 120),
                    "entertainment": random.randint(0, 180),
                    "productivity": random.randint(0, 60)
                }
            }
            device["screen_time_data"].append(screen_time)
        
        devices.append(device)
    
    return devices

def create_sample_records():
    """Create 30 sample user records"""
    dynamodb = boto3.resource('dynamodb', region_name='eu-north-1')
    table = dynamodb.Table('stj_subscribers')
    
    print(f"🎭 Creating {len(SAMPLE_USERS)} sample user records...")
    
    for i, user_data in enumerate(SAMPLE_USERS):
        customer_id = str(9000000000000 + i + 1)  # Start from 9000000000001
        days_active = random.randint(1, 365)  # Random days in focus
        
        # Create realistic commitment data
        commitment_data = {
            "gender": user_data["gender"],
            "commitment_level": random.randint(1, 10),
            "commitment_text": f"I commit to reducing my screen time and living more mindfully.",
            "created_at": (datetime.now() - timedelta(days=days_active)).isoformat()
        }
        
        # Create device data
        devices = create_sample_device_data(days_active)
        
        record = {
            "customer_id": customer_id,
            "email": f"{user_data['username'].lower()}@example.com",
            "username": user_data["username"],
            "gender": user_data["gender"],
            "subscription_status": "active",
            "devices": devices,
            "commitment_data": commitment_data,
            "created_at": (datetime.now() - timedelta(days=days_active)).isoformat(),
            "last_updated": datetime.now().isoformat(),
            "whatsapp_opt_in": random.choice([True, False])
        }
        
        try:
            # Convert to DynamoDB format (handle Decimal for numbers)
            def convert_decimals(obj):
                if isinstance(obj, list):
                    return [convert_decimals(i) for i in obj]
                elif isinstance(obj, dict):
                    return {k: convert_decimals(v) for k, v in obj.items()}
                elif isinstance(obj, float):
                    return Decimal(str(obj))
                else:
                    return obj
            
            record_decimal = convert_decimals(record)
            table.put_item(Item=record_decimal)
            print(f"  ✅ Created user: {user_data['username']} (customer_id: {customer_id})")
            
        except Exception as e:
            print(f"  ❌ Failed to create {user_data['username']}: {e}")

def main():
    print("🚀 Setting up sample leaderboard data...")
    print("=" * 50)
    
    # Step 1: Delete old records
    delete_old_records()
    print()
    
    # Step 2: Create sample records
    create_sample_records()
    print()
    
    print("✅ Sample data setup complete!")
    print("🏆 Leaderboard should now show 31 users (30 samples + theking)")

if __name__ == "__main__":
    main()


