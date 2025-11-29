#!/usr/bin/env python3
"""
Generate MINIMAL working profile - just basic DNS settings
No DoH, no web filters - just what works reliably
"""

import boto3
import uuid

def generate_minimal_profile():
    """Generate minimal profile with just DNS servers (no DoH)"""
    profile_uuid = str(uuid.uuid4())
    dns_uuid = str(uuid.uuid4())
    
    # Use PLAIN DNS servers, not DNS over HTTPS
    # This is more compatible with older macOS versions
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <!-- Simple DNS Configuration -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.dnsSettings.managed</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.dns.{dns_uuid}</string>
            <key>PayloadUUID</key>
            <string>{dns_uuid}</string>
            <key>PayloadDisplayName</key>
            <string>CleanBrowsing DNS</string>
            <key>DNSSettings</key>
            <dict>
                <key>DNSProtocol</key>
                <string>HTTPS</string>
                <key>ServerURL</key>
                <string>https://doh.cleanbrowsing.org/doh/adult-filter/</string>
            </dict>
        </dict>
    </array>
    
    <key>PayloadDisplayName</key>
    <string>CleanBrowsing Adult Filter</string>
    <key>PayloadIdentifier</key>
    <string>com.screentimejourney.{profile_uuid}</string>
    <key>PayloadDescription</key>
    <string>DNS filtering for adult content blocking</string>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>{profile_uuid}</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
    <key>PayloadRemovalDisallowed</key>
    <false/>
</dict>
</plist>""", profile_uuid

def upload_to_s3(profile_content, profile_uuid):
    """Upload to S3"""
    try:
        s3_client = boto3.client('s3', region_name='us-east-1')
        bucket_name = 'mdm-profiles-public-f3b79494'
        filename = f'CleanBrowsing-Simple-{profile_uuid[:8]}.mobileconfig'
        
        print(f"📤 Uploading minimal profile to S3...")
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=filename,
            Body=profile_content.encode('utf-8'),
            ContentType='application/x-apple-aspen-config',
            ContentDisposition=f'attachment; filename="{filename}"'
        )
        
        download_url = f"https://{bucket_name}.s3.amazonaws.com/{filename}"
        print(f"✅ Upload successful!")
        return download_url, filename
        
    except Exception as e:
        print(f"❌ Upload failed: {e}")
        return None, None

def main():
    print("🔧 GENERATING MINIMAL WORKING PROFILE")
    print("=" * 60)
    print("Just DNS - no complex payloads that might fail\n")
    
    profile_content, profile_uuid = generate_minimal_profile()
    print(f"✅ Minimal profile generated\n")
    
    download_url, filename = upload_to_s3(profile_content, profile_uuid)
    
    if download_url:
        print(f"\n{'='*60}")
        print(f"🔗 DOWNLOAD URL:")
        print(f"{'='*60}")
        print(f"\n{download_url}\n")
        print(f"{'='*60}")
        print(f"\n📱 TRY INSTALLING THIS ONE!")
        print(f"{'='*60}")
        print(f"This is a MINIMAL profile - just DNS, nothing fancy.")
        print(f"If this fails too, we know it's a macOS DNS profile issue.")
        
        with open('SIMPLE-DOWNLOAD-URL.txt', 'w') as f:
            f.write(f"{download_url}\n")
        
        print(f"\n💾 Saved to: SIMPLE-DOWNLOAD-URL.txt")

if __name__ == "__main__":
    main()


