#!/usr/bin/env python3
"""
Generate CleanBrowsing DNS profile and upload to S3
Returns download URL
"""

import boto3
import uuid
import json

def generate_macos_profile():
    """Generate macOS profile with CleanBrowsing DNS"""
    profile_uuid = str(uuid.uuid4())
    dns_uuid = str(uuid.uuid4())
    web_filter_uuid = str(uuid.uuid4())
    restrictions_uuid = str(uuid.uuid4())
    
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <!-- CleanBrowsing DNS Filter -->
        <dict>
            <key>DNSSettings</key>
            <dict>
                <key>DNSProtocol</key>
                <string>HTTPS</string>
                <key>ServerURL</key>
                <string>https://doh.cleanbrowsing.org/doh/adult-filter/</string>
            </dict>
            <key>PayloadDisplayName</key>
            <string>CleanBrowsing DNS</string>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.dns.{dns_uuid}</string>
            <key>PayloadType</key>
            <string>com.apple.dnsSettings.managed</string>
            <key>PayloadUUID</key>
            <string>{dns_uuid}</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
        </dict>
        
        <!-- Web Content Filter -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.webcontent-filter</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.webfilter.{web_filter_uuid}</string>
            <key>PayloadUUID</key>
            <string>{web_filter_uuid}</string>
            <key>PayloadDisplayName</key>
            <string>Web Content Filter</string>
            <key>FilterType</key>
            <string>BuiltIn</string>
            <key>AutoFilterEnabled</key>
            <true/>
            <key>PermittedURLs</key>
            <array>
                <string>apple.com</string>
            </array>
            <key>DenyListURLs</key>
            <array>
                <string>facebook.com</string>
                <string>instagram.com</string>
                <string>twitter.com</string>
                <string>x.com</string>
                <string>tiktok.com</string>
                <string>snapchat.com</string>
                <string>reddit.com</string>
            </array>
        </dict>
        
        <!-- Content Restrictions -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.applicationaccess</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.restrictions.{restrictions_uuid}</string>
            <key>PayloadUUID</key>
            <string>{restrictions_uuid}</string>
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
    <string>ScreenTime Journey - Merijn Mac</string>
    <key>PayloadIdentifier</key>
    <string>com.screentimejourney.profile.{profile_uuid}</string>
    <key>PayloadDescription</key>
    <string>Blocks adult content, porn sites (CleanBrowsing DNS), and social media websites. PIN: 1234</string>
    <key>PayloadRemovalDisallowed</key>
    <true/>
    <key>RemovalPassword</key>
    <string>1234</string>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>{profile_uuid}</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>""", profile_uuid

def upload_to_s3(profile_content, profile_uuid):
    """Upload profile to S3 and return download URL"""
    try:
        s3_client = boto3.client('s3', region_name='us-east-1')
        bucket_name = 'mdm-profiles-public-f3b79494'
        filename = f'ScreenTime-Journey-Mac-{profile_uuid[:8]}.mobileconfig'
        s3_key = filename
        
        print(f"📤 Uploading to S3...")
        print(f"   Bucket: {bucket_name}")
        print(f"   Key: {s3_key}")
        
        # Upload with public-read ACL
        s3_client.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=profile_content.encode('utf-8'),
            ContentType='application/x-apple-aspen-config',
            ContentDisposition=f'attachment; filename="{filename}"'
        )
        
        # Generate download URL
        download_url = f"https://{bucket_name}.s3.amazonaws.com/{s3_key}"
        
        print(f"✅ Upload successful!")
        return download_url, filename
        
    except Exception as e:
        print(f"❌ Upload failed: {e}")
        return None, None

def main():
    print("🔧 GENERATING CLEANBROWSING DNS PROFILE")
    print("=" * 60)
    
    # Generate profile
    print("\n📝 Generating profile content...")
    profile_content, profile_uuid = generate_macos_profile()
    print(f"✅ Profile generated (UUID: {profile_uuid[:8]})")
    
    # Upload to S3
    print(f"\n📤 Uploading to S3...")
    download_url, filename = upload_to_s3(profile_content, profile_uuid)
    
    if download_url:
        print(f"\n{'='*60}")
        print(f"🎉 SUCCESS! YOUR DOWNLOAD URL:")
        print(f"{'='*60}")
        print(f"\n🔗 {download_url}\n")
        print(f"{'='*60}")
        print(f"\n📱 INSTALLATION STEPS:")
        print(f"{'='*60}")
        print(f"1. Click the URL above in Safari (NOT Chrome!)")
        print(f"2. Profile downloads → System Preferences opens")
        print(f"3. Click 'Install' button")
        print(f"4. Enter your Mac admin password")
        print(f"5. Click 'Install' again to confirm")
        print(f"\n🔐 PIN: 1234 (to remove profile later)")
        print(f"\n✅ VERIFY INSTALLATION:")
        print(f"{'='*60}")
        print(f"After installing, run these commands:")
        print(f"\n  # Check if profile is installed")
        print(f"  profiles -P | grep ScreenTime")
        print(f"\n  # Clear DNS cache")
        print(f"  sudo dscacheutil -flushcache")
        print(f"  sudo killall -HUP mDNSResponder")
        print(f"\n  # Test DNS")
        print(f"  dig pornhub.com")
        print(f"\n  # Should show CleanBrowsing DNS:")
        print(f"  # ;; SERVER: 185.228.168.168")
        print(f"\n  # Test in Safari:")
        print(f"  # Visit pornhub.com → Should be blocked!")
        print(f"\n{'='*60}")
        
        # Save URL to file
        with open('DOWNLOAD-URL.txt', 'w') as f:
            f.write(f"Your CleanBrowsing DNS Profile Download URL:\n\n")
            f.write(f"{download_url}\n\n")
            f.write(f"PIN: 1234\n\n")
            f.write(f"Click the URL in Safari to install!\n")
        
        print(f"\n💾 URL saved to: DOWNLOAD-URL.txt")
        
    else:
        print(f"\n❌ Failed to generate download URL")

if __name__ == "__main__":
    main()


