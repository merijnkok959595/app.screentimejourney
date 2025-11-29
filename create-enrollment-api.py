#!/usr/bin/env python3

import requests
from base64 import b64encode
import json

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def try_create_enrollment():
    """Try different methods to create enrollment via API"""
    
    print("🔄 Attempting to Create Enrollment via API...")
    print("=" * 50)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    
    # Method 1: Try with assignment groups (this might be the right approach)
    print("📡 Method 1: Using Assignment Groups approach...")
    
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # First, get or create an assignment group
    groups_response = requests.get(f"{BASE_URL}/assignment_groups", headers=headers)
    
    if groups_response.status_code == 200:
        groups = groups_response.json()['data']
        print(f"Found {len(groups)} assignment groups")
        
        if not groups:
            # Create an assignment group first
            print("Creating assignment group...")
            group_data = {
                'name': 'iPhone Enrollment Group'
            }
            
            create_group = requests.post(
                f"{BASE_URL}/assignment_groups",
                headers=headers,
                data=group_data
            )
            
            if create_group.status_code == 201:
                group = create_group.json()['data']
                group_id = group['id']
                print(f"✅ Created group ID: {group_id}")
            else:
                print(f"❌ Failed to create group: {create_group.status_code}")
                group_id = None
        else:
            group_id = groups[0]['id']
            print(f"Using existing group ID: {group_id}")
    
    # Method 2: Try the device invitation approach
    print("\n📡 Method 2: Device Invitation approach...")
    
    # Send invitation to email (this often generates enrollment links)
    invitation_data = {
        'email': 'info@screentimejourney.com',
        'message': 'ScreenTime Journey iPhone Enrollment'
    }
    
    # Try different invitation endpoints
    endpoints_to_try = [
        f"{BASE_URL}/invitations",
        f"{BASE_URL}/device_invitations", 
        f"{BASE_URL}/enrollments/invite"
    ]
    
    for endpoint in endpoints_to_try:
        print(f"Trying: {endpoint}")
        
        invite_response = requests.post(
            endpoint,
            headers=headers,
            data=invitation_data
        )
        
        print(f"Status: {invite_response.status_code}")
        
        if invite_response.status_code in [200, 201, 204]:
            print("✅ Invitation sent! Check email for enrollment link")
            return True
        else:
            print(f"Response: {invite_response.text[:100]}")
    
    # Method 3: Check existing enrollments again and refresh
    print("\n📡 Method 3: Checking for existing enrollments...")
    
    enrollments_response = requests.get(f"{BASE_URL}/enrollments", headers=headers)
    
    if enrollments_response.status_code == 200:
        enrollments_data = enrollments_response.json()
        
        if 'data' in enrollments_data and enrollments_data['data']:
            for enrollment in enrollments_data['data']:
                enrollment_id = enrollment['id']
                url = enrollment['attributes']['url']
                
                print("✅ Found existing enrollment!")
                print(f"ID: {enrollment_id}")
                print(f"URL: {url}")
                return url
        else:
            print("No existing enrollments found")
    
    return None

def create_fresh_enrollment_alternative():
    """Alternative approach using different API patterns"""
    
    print("\n🔄 Alternative: Direct enrollment creation...")
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Try using the account endpoint to get enrollment info
    account_response = requests.get(f"{BASE_URL}/account", headers=headers)
    
    if account_response.status_code == 200:
        account_data = account_response.json()['data']['attributes']
        
        # Some MDM systems have a default enrollment URL pattern
        account_name = account_data['name'].lower()
        
        # Generate potential enrollment URLs based on common patterns
        potential_urls = [
            f"https://a.simplemdm.com/enroll/{account_name}",
            f"https://a.simplemdm.com/enroll?account={account_name}",
            f"https://a.simplemdm.com/enroll?org={account_name}",
            "https://a.simplemdm.com/enroll"
        ]
        
        print("🔗 Potential enrollment URLs to try:")
        for url in potential_urls:
            print(f"  {url}")
        
        return potential_urls[0]  # Return the first one to try
    
    return None

def main():
    print("🛡️  SimpleMDM Enrollment Link Generator")
    print("=" * 50)
    
    # Try to create enrollment
    result = try_create_enrollment()
    
    if result:
        if isinstance(result, str):  # Got a URL
            print(f"\n🎉 SUCCESS!")
            print("=" * 50)
            print(f"📱 ENROLLMENT URL:")
            print(f"{result}")
            print("")
            print("📲 iPhone Instructions:")
            print("1. Copy the URL above")
            print("2. Text/email to your iPhone")
            print("3. Open in Safari on iPhone")
            print("4. Install SimpleMDM enrollment")
            print("5. CleanBrowsing profile auto-installs!")
        else:  # Invitation sent
            print("\n✅ Enrollment invitation sent!")
            print("📧 Check your email: info@screentimejourney.com")
            print("📱 Open the enrollment link on your iPhone")
    
    # Try alternative approach
    alt_url = create_fresh_enrollment_alternative()
    
    if alt_url:
        print(f"\n🔄 ALTERNATIVE URL TO TRY:")
        print(f"{alt_url}")
        print("")
        print("📱 If the above doesn't work, try this URL on your iPhone")

if __name__ == "__main__":
    main()


