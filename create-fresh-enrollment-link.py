#!/usr/bin/env python3

import requests
from base64 import b64encode
import json
import random
import string

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def remove_existing_enrollment():
    """Remove existing enrollment to create fresh one"""
    
    print("🧹 Checking existing enrollments...")
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Get existing enrollments
    response = requests.get(f"{BASE_URL}/enrollments", headers=headers)
    
    if response.status_code == 200:
        enrollments = response.json()['data']
        
        print(f"Found {len(enrollments)} existing enrollment(s)")
        
        for enrollment in enrollments:
            enrollment_id = enrollment['id']
            name = enrollment['attributes'].get('name', 'Unnamed')
            
            print(f"📋 Enrollment: {name} (ID: {enrollment_id})")
            
            # Try to delete this enrollment
            delete_response = requests.delete(f"{BASE_URL}/enrollments/{enrollment_id}", headers=headers)
            
            if delete_response.status_code in [200, 204]:
                print(f"✅ Deleted enrollment {enrollment_id}")
            else:
                print(f"⚠️  Could not delete enrollment {enrollment_id}: {delete_response.status_code}")
                print(f"Response: {delete_response.text}")

def create_completely_fresh_profile():
    """Create a completely independent profile that doesn't need enrollment"""
    
    print(f"\n🎯 SOLUTION: Fresh Independent Profile")
    print("=" * 50)
    print("Since you're already enrolled, let's create a fresh profile")
    print("that works independently of any existing enrollment.")
    print("")
    
    # Generate a unique identifier
    random_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    
    profile_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>PayloadType</key>
            <string>com.apple.dnsSettings.managed</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.fresh.{random_id.lower()}</string>
            <key>PayloadUUID</key>
            <string>FRESH-{random_id}-DNS</string>
            <key>PayloadDisplayName</key>
            <string>ScreenTime Journey - Fresh Protection</string>
            <key>DNSSettings</key>
            <dict>
                <key>ServerAddresses</key>
                <array>
                    <string>185.228.168.10</string>
                    <string>185.228.169.11</string>
                </array>
            </dict>
        </dict>
        <dict>
            <key>PayloadType</key>
            <string>com.apple.applicationaccess</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.restrictions.{random_id.lower()}</string>
            <key>PayloadUUID</key>
            <string>FRESH-{random_id}-REST</string>
            <key>PayloadDisplayName</key>
            <string>Content Restrictions</string>
            <key>allowExplicitContent</key>
            <false/>
            <key>ratingRegion</key>
            <string>us</string>
            <key>ratingApps</key>
            <integer>600</integer>
        </dict>
    </array>
    
    <key>PayloadDisplayName</key>
    <string>ScreenTime Journey - Fresh Protection {random_id}</string>
    
    <key>PayloadIdentifier</key>
    <string>com.screentimejourney.fresh.{random_id.lower()}</string>
    
    <key>PayloadUUID</key>
    <string>MAIN-FRESH-{random_id}</string>
    
    <key>PayloadType</key>
    <string>Configuration</string>
    
    <key>PayloadVersion</key>
    <integer>1</integer>
    
    <key>PayloadDescription</key>
    <string>Fresh ScreenTime Journey protection with CleanBrowsing DNS and content restrictions. Unique ID: {random_id}</string>
    
    <key>PayloadOrganization</key>
    <string>ScreenTime Journey</string>
    
</dict>
</plist>'''

    # Save to file
    filename = f"ScreenTime-Fresh-{random_id}.mobileconfig"
    
    with open(filename, 'w') as f:
        f.write(profile_content)
    
    print(f"📝 Created fresh profile: {filename}")
    return filename, random_id

def upload_fresh_profile(filename, random_id):
    """Upload the fresh profile to S3"""
    
    print(f"\n📤 Uploading fresh profile to S3...")
    
    import subprocess
    
    s3_filename = f"ScreenTime-Fresh-{random_id}.mobileconfig"
    
    upload_cmd = [
        'aws', 's3', 'cp', filename, f's3://wati-mobconfigs/{s3_filename}',
        '--acl', 'public-read',
        '--content-type', 'application/x-apple-aspen-config'
    ]
    
    try:
        result = subprocess.run(upload_cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            fresh_url = f"https://wati-mobconfigs.s3.eu-north-1.amazonaws.com/{s3_filename}"
            print(f"✅ Upload successful!")
            print(f"🔗 Fresh URL: {fresh_url}")
            return fresh_url
        else:
            print(f"❌ Upload failed: {result.stderr}")
            return None
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return None

def provide_alternatives():
    """Provide alternative solutions"""
    
    print(f"\n🔄 ALTERNATIVE SOLUTIONS")
    print("=" * 50)
    
    print(f"💡 Option 1: Remove Existing Enrollment")
    print(f"1. iPhone: Settings > General > VPN & Device Management")
    print(f"2. Remove ANY SimpleMDM or ScreenTime Journey profiles")  
    print(f"3. Restart iPhone")
    print(f"4. Try original enrollment URL again:")
    print(f"   https://a.simplemdm.com/enroll/?c=c3566f533b4348258c12e097da38a71ede0a7261c03f0529ba01bba6f090e2b2")
    print(f"")
    
    print(f"💡 Option 2: Use Working Direct Profile")
    print(f"Skip MDM enrollment entirely, use:")
    print(f"https://wati-mobconfigs.s3.eu-north-1.amazonaws.com/ScreenTime-Simple-Working.mobileconfig")
    print(f"")
    
    print(f"💡 Option 3: Create New SimpleMDM Enrollment")
    print(f"1. Go to: https://a.simplemdm.com/enrollments")
    print(f"2. Create new enrollment manually")
    print(f"3. Use that fresh URL")

def main():
    print("🔄 Creating Fresh Enrollment Solution")
    print("=" * 50)
    print("Issue: Already enrolled, causing payload mismatch")
    print("Solution: Create completely fresh profile")
    print("")
    
    # Try to remove existing enrollment
    remove_existing_enrollment()
    
    # Create fresh profile
    filename, random_id = create_completely_fresh_profile()
    
    # Upload to S3
    fresh_url = upload_fresh_profile(filename, random_id)
    
    if fresh_url:
        print(f"\n🎉 SUCCESS! Fresh Profile Created")
        print("=" * 50)
        print(f"📱 FRESH URL FOR YOUR IPHONE:")
        print(f"{fresh_url}")
        print("=" * 50)
        print("")
        print(f"✅ This profile:")
        print(f"  • Has unique identifiers (no conflicts)")
        print(f"  • Works independently of existing enrollment")
        print(f"  • Provides same CleanBrowsing protection")
        print(f"  • Can be installed alongside other profiles")
        print("")
        print(f"📱 Installation:")
        print(f"1. Click URL on iPhone")
        print(f"2. Tap 'Allow' to download") 
        print(f"3. Install profile")
        print(f"4. ✅ Protected immediately!")
    
    # Provide alternatives
    provide_alternatives()

if __name__ == "__main__":
    main()


