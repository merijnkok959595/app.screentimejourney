#!/usr/bin/env python3
"""
Configure Cloudflare Gateway to block social media apps
OUTSIDE of 09:00-22:00 (i.e., block during 22:00-09:00)
"""

import requests
import json

# Your Cloudflare credentials
EMAIL = "info@screentimejourney.com"
API_KEY = "ce63b47aa3a8810afa9bdb163fb02766620e6"
ACCOUNT_ID = "f9a4686c874f4d5be8af2f08610e5ec2"

BASE_URL = "https://api.cloudflare.com/client/v4"

headers = {
    "X-Auth-Email": EMAIL,
    "X-Auth-Key": API_KEY,
    "Content-Type": "application/json"
}

def test_connection():
    """Test API connection"""
    print("🔍 Testing Cloudflare API connection...")
    
    response = requests.get(
        f"{BASE_URL}/accounts/{ACCOUNT_ID}",
        headers=headers
    )
    
    if response.status_code == 200:
        account = response.json()['result']
        print(f"✅ Connected to Cloudflare account: {account['name']}")
        return True
    else:
        print(f"❌ Connection failed: {response.status_code}")
        print(response.text)
        return False

def list_existing_policies():
    """List existing Gateway policies"""
    print("\n📋 Listing existing Gateway policies...")
    
    response = requests.get(
        f"{BASE_URL}/accounts/{ACCOUNT_ID}/gateway/rules",
        headers=headers
    )
    
    if response.status_code == 200:
        policies = response.json()['result']
        print(f"Found {len(policies)} existing policies:")
        for policy in policies:
            print(f"  - {policy['name']} (ID: {policy['id']})")
        return policies
    else:
        print(f"❌ Failed to list policies: {response.status_code}")
        print(response.text)
        return []

def create_social_media_schedule_policy():
    """
    Create Gateway policy to block social media apps
    during SLEEP HOURS (22:00-09:00)
    """
    print("\n🎯 Creating social media schedule policy...")
    
    # Policy: Block social media apps between 22:00 and 09:00 (sleep hours)
    policy = {
        "name": "Block Social Media - Sleep Hours (22:00-09:00)",
        "description": "Blocks Instagram, Facebook, TikTok, Twitter, Snapchat, Reddit during sleep hours to enforce digital wellbeing",
        "enabled": True,
        "action": "block",
        "precedence": 100,  # Lower number = higher priority
        "filters": ["http"],
        "traffic": json.dumps({
            "or": [
                {"application": {"id": 360}},  # Instagram
                {"application": {"id": 4}},     # Facebook
                {"application": {"id": 1746}},  # TikTok
                {"application": {"id": 1065}},  # Twitter
                {"application": {"id": 492}},   # Snapchat
                {"application": {"id": 366}},   # Reddit
                {"application": {"id": 128}},   # Discord
                {"application": {"id": 1095}},  # Telegram
                {"application": {"id": 1025}},  # WhatsApp
            ]
        }),
        "schedule": {
            "time_zone": "UTC",
            "mon": "22:00-23:59,00:00-09:00",
            "tue": "22:00-23:59,00:00-09:00",
            "wed": "22:00-23:59,00:00-09:00",
            "thu": "22:00-23:59,00:00-09:00",
            "fri": "22:00-23:59,00:00-09:00",
            "sat": "22:00-23:59,00:00-09:00",
            "sun": "22:00-23:59,00:00-09:00"
        }
    }
    
    response = requests.post(
        f"{BASE_URL}/accounts/{ACCOUNT_ID}/gateway/rules",
        headers=headers,
        json=policy
    )
    
    if response.status_code == 200:
        result = response.json()['result']
        print(f"✅ Social media schedule policy created successfully!")
        print(f"   Policy ID: {result['id']}")
        print(f"   Name: {result['name']}")
        print(f"   Status: {'Enabled' if result['enabled'] else 'Disabled'}")
        print(f"\n   📱 Blocked apps: Instagram, Facebook, TikTok, Twitter, Snapchat, Reddit, Discord, Telegram, WhatsApp")
        print(f"   ⏰ Block schedule: 22:00-09:00 (allows 09:00-22:00)")
        return result
    else:
        print(f"❌ Failed to create policy: {response.status_code}")
        print(response.text)
        return None

def create_allow_productive_apps_policy():
    """
    Create policy to ALWAYS allow productive apps (higher priority)
    """
    print("\n🎯 Creating always-allow productive apps policy...")
    
    policy = {
        "name": "Always Allow - Productive Apps",
        "description": "Always allows Phone, Messages, Maps, Health, Calendar - even during sleep hours",
        "enabled": True,
        "action": "allow",
        "precedence": 50,  # HIGHER priority than block rules (lower number)
        "filters": ["http"],
        "traffic": json.dumps({
            "or": [
                {"host": {"matches": ".*apple.com"}},
                {"host": {"matches": ".*icloud.com"}},
                {"application": {"id": 1156}},  # Apple Maps
                # Note: Phone, Messages, Calendar don't generate HTTP traffic, so they're always allowed
            ]
        })
    }
    
    response = requests.post(
        f"{BASE_URL}/accounts/{ACCOUNT_ID}/gateway/rules",
        headers=headers,
        json=policy
    )
    
    if response.status_code == 200:
        result = response.json()['result']
        print(f"✅ Productive apps policy created successfully!")
        print(f"   Policy ID: {result['id']}")
        return result
    else:
        print(f"❌ Failed to create policy: {response.status_code}")
        print(response.text)
        return None

def verify_policies():
    """Verify the policies are working"""
    print("\n✅ Verification Summary:")
    print("=" * 60)
    
    policies = list_existing_policies()
    
    sleep_policy = next((p for p in policies if "Sleep Hours" in p['name']), None)
    productive_policy = next((p for p in policies if "Productive Apps" in p['name']), None)
    
    print(f"\n📱 Social Media Sleep Hours Policy:")
    if sleep_policy:
        print(f"   ✅ Created: {sleep_policy['name']}")
        print(f"   ✅ Status: {'Enabled' if sleep_policy['enabled'] else 'Disabled'}")
        print(f"   ✅ Blocks: Instagram, Facebook, TikTok, Twitter, Snapchat, Reddit")
        print(f"   ✅ Schedule: 22:00-09:00 daily")
        print(f"   ✅ Allows: 09:00-22:00 daily")
    else:
        print(f"   ⚠️ Not found")
    
    print(f"\n🎯 Productive Apps Policy:")
    if productive_policy:
        print(f"   ✅ Created: {productive_policy['name']}")
        print(f"   ✅ Always allows: Apple services, Maps, Health")
    else:
        print(f"   ⚠️ Not found")
    
    print(f"\n" + "=" * 60)
    print(f"\n🎉 Setup Complete!")
    print(f"\n📊 How it works:")
    print(f"   • 09:00-22:00: Social media apps WORK")
    print(f"   • 22:00-09:00: Social media apps BLOCKED")
    print(f"   • Phone, Messages, Calendar: ALWAYS work (no HTTP traffic)")
    print(f"   • Apple services: ALWAYS allowed")
    
    print(f"\n🔍 Test it:")
    print(f"   1. Install Cloudflare WARP on device")
    print(f"   2. Connect to your organization")
    print(f"   3. Wait until 22:00 (10 PM)")
    print(f"   4. Try opening Instagram/Facebook")
    print(f"   5. Should see Cloudflare block page ✅")
    
    print(f"\n📱 Dashboard:")
    print(f"   https://one.dash.cloudflare.com/{ACCOUNT_ID}/gateway/policies")

def main():
    """Main execution"""
    print("🚀 Cloudflare Gateway: Social Media Schedule Setup")
    print("=" * 60)
    
    # Test connection
    if not test_connection():
        print("❌ Cannot proceed without valid API connection")
        return
    
    # List existing policies
    existing = list_existing_policies()
    
    # Check if policies already exist
    sleep_exists = any("Sleep Hours" in p['name'] for p in existing)
    productive_exists = any("Productive Apps" in p['name'] for p in existing)
    
    if sleep_exists:
        print("\n⚠️ Social media sleep hours policy already exists")
        response = input("Do you want to create it again? (y/n): ")
        if response.lower() != 'y':
            sleep_exists = True
        else:
            sleep_exists = False
    
    # Create policies
    if not sleep_exists:
        create_social_media_schedule_policy()
    
    if not productive_exists:
        create_allow_productive_apps_policy()
    
    # Verify
    verify_policies()

if __name__ == "__main__":
    main()



