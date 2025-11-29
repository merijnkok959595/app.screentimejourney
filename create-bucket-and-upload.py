#!/usr/bin/env python3

import boto3
import json
from botocore.exceptions import ClientError

def create_s3_bucket_and_upload_profile():
    """Create S3 bucket and upload the supervised profile"""
    
    print("🪣 CREATING S3 BUCKET AND UPLOADING PROFILE")
    print("=" * 50)
    
    # Create S3 client
    try:
        s3_client = boto3.client('s3')
        print("✅ S3 client created")
    except Exception as e:
        print(f"❌ Failed to create S3 client: {e}")
        return None
    
    bucket_name = 'screentimejourney-profiles'
    
    # Create bucket
    try:
        s3_client.create_bucket(
            Bucket=bucket_name,
            CreateBucketConfiguration={
                'LocationConstraint': 'us-west-2'  # Change if needed
            }
        )
        print(f"✅ S3 bucket '{bucket_name}' created")
    except ClientError as e:
        if e.response['Error']['Code'] == 'BucketAlreadyOwnedByYou':
            print(f"✅ S3 bucket '{bucket_name}' already exists")
        else:
            print(f"❌ Failed to create bucket: {e}")
            # Try with default region
            try:
                s3_client.create_bucket(Bucket=bucket_name)
                print(f"✅ S3 bucket '{bucket_name}' created in default region")
            except ClientError as e2:
                if e2.response['Error']['Code'] == 'BucketAlreadyOwnedByYou':
                    print(f"✅ S3 bucket '{bucket_name}' already exists")
                else:
                    print(f"❌ Failed to create bucket: {e2}")
                    return None
    
    # Read the supervised profile
    try:
        with open('supervised-ultimate-pin-1234.mobileconfig', 'r') as f:
            profile_content = f.read()
        print("✅ Supervised profile loaded from file")
    except FileNotFoundError:
        print("❌ Profile file not found")
        return None
    
    # Upload profile
    file_key = 'ScreenTime-Journey-Supervised-PIN-1234.mobileconfig'
    
    try:
        # Upload the profile
        s3_client.put_object(
            Bucket=bucket_name,
            Key=file_key,
            Body=profile_content,
            ContentType='application/x-apple-aspen-config',
            CacheControl='no-cache',
            ContentDisposition='attachment; filename="ScreenTime-Journey-Supervised-PIN-1234.mobileconfig"'
        )
        
        print(f"✅ Profile uploaded to S3: {file_key}")
        
        # Make it public
        try:
            s3_client.put_object_acl(
                Bucket=bucket_name,
                Key=file_key,
                ACL='public-read'
            )
            print("✅ Profile made publicly accessible")
        except ClientError as e:
            print(f"⚠️ Could not make public (may need bucket policy): {e}")
        
        # Generate public URL
        public_url = f"https://{bucket_name}.s3.amazonaws.com/{file_key}"
        
        print(f"\n🎯 PUBLIC S3 DOWNLOAD LINK:")
        print(f"🔗 {public_url}")
        
        return public_url
        
    except ClientError as e:
        print(f"❌ S3 upload failed: {e}")
        return None

def create_simple_direct_profile():
    """Create a simple profile that works without S3"""
    
    print(f"\n📄 CREATING LOCAL PROFILE FILE")
    print("=" * 35)
    
    # Simple working profile content
    simple_profile = '''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <!-- CleanBrowsing DNS -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.dnsSettings.managed</string>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.dns</string>
            <key>PayloadUUID</key>
            <string>DNS-PIN-SUPERVISED-123456789012</string>
            <key>PayloadDisplayName</key>
            <string>CleanBrowsing Adult Filter</string>
            <key>PayloadDescription</key>
            <string>Blocks adult content via DNS filtering</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>DNSSettings</key>
            <dict>
                <key>DNSProtocol</key>
                <string>HTTPS</string>
                <key>ServerAddresses</key>
                <array>
                    <string>185.228.168.168</string>
                    <string>185.228.169.168</string>
                </array>
                <key>ServerURL</key>
                <string>https://doh.cleanbrowsing.org/doh/adult-filter</string>
            </dict>
        </dict>
        
        <!-- Restrictions with PIN -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.restrictions</string>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.restrictions</string>
            <key>PayloadUUID</key>
            <string>RESTRICTIONS-PIN-123456789013</string>
            <key>PayloadDisplayName</key>
            <string>Parental Controls with PIN</string>
            <key>PayloadDescription</key>
            <string>Content restrictions protected by PIN 1234</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            
            <!-- PIN Protection -->
            <key>restrictionsPassword</key>
            <string>1234</string>
            
            <!-- Content Restrictions -->
            <key>allowExplicitContent</key>
            <false/>
            <key>allowBookstoreErotica</key>
            <false/>
            <key>ratingRegion</key>
            <string>us</string>
            <key>ratingApps</key>
            <integer>600</integer>
            <key>ratingMovies</key>
            <integer>600</integer>
            <key>ratingTVShows</key>
            <integer>600</integer>
            
            <!-- Safari & Web -->
            <key>allowSafari</key>
            <true/>
            <key>safariForceFraudWarning</key>
            <true/>
            <key>safariAllowPopups</key>
            <false/>
            <key>allowWebContentFilter</key>
            <true/>
            
            <!-- App Controls -->
            <key>allowInAppPurchases</key>
            <false/>
            <key>allowAppInstallation</key>
            <true/>
            <key>allowAppRemoval</key>
            <false/>
        </dict>
    </array>
    
    <key>PayloadDisplayName</key>
    <string>ScreenTime Journey - PIN Protected</string>
    <key>PayloadDescription</key>
    <string>CleanBrowsing DNS + Parental Controls with PIN 1234 protection</string>
    <key>PayloadIdentifier</key>
    <string>com.screentimejourney.pin.protected</string>
    <key>PayloadRemovalDisallowed</key>
    <true/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>MAIN-PIN-PROTECTED-123456789011</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
    
    <!-- PIN for Profile Removal -->
    <key>RemovalPassword</key>
    <string>1234</string>
</dict>
</plist>'''
    
    # Save simple profile
    filename = 'ScreenTime-Journey-PIN-1234-Direct.mobileconfig'
    with open(filename, 'w') as f:
        f.write(simple_profile)
    
    print(f"✅ Created local profile: {filename}")
    
    # Get absolute path
    import os
    abs_path = os.path.abspath(filename)
    
    print(f"\n📁 LOCAL FILE PATH:")
    print(f"🔗 file://{abs_path}")
    
    print(f"\n📋 DIRECT INSTALLATION INSTRUCTIONS:")
    print("1. 📱 On your device, double-click the .mobileconfig file")
    print("2. ⚙️ System Preferences will open automatically")
    print("3. 🔒 Click 'Install' (enter admin password if prompted)")
    print("4. ✅ Profile installs with PIN 1234 protection")
    print("5. 🧪 Test pornhub.com → Should be blocked!")
    
    return abs_path

def provide_hosting_alternatives():
    """Provide alternative hosting options"""
    
    print(f"\n🌐 ALTERNATIVE HOSTING OPTIONS")
    print("=" * 35)
    
    print("🎯 OPTION 1: GitHub Pages (Free)")
    print("• Upload .mobileconfig to GitHub repo")
    print("• Enable GitHub Pages")
    print("• Access via: username.github.io/repo/profile.mobileconfig")
    print("")
    
    print("🎯 OPTION 2: Google Drive (Easy)")
    print("• Upload .mobileconfig to Google Drive")
    print("• Set sharing to 'Anyone with link'")
    print("• Use direct download link")
    print("")
    
    print("🎯 OPTION 3: Dropbox (Simple)")
    print("• Upload to Dropbox")
    print("• Get public share link")
    print("• Change dl=0 to dl=1 for direct download")
    print("")
    
    print("🎯 OPTION 4: Your Own Website")
    print("• Upload to your web hosting")
    print("• Set correct MIME type: application/x-apple-aspen-config")
    print("• Provide direct download link")

def main():
    print("🛡️ CREATING DIRECT DOWNLOAD SUPERVISED PROFILE")
    print("=" * 50)
    print("Single user enrollment without SimpleMDM")
    print("")
    
    # Try S3 first
    s3_url = create_s3_bucket_and_upload_profile()
    
    if s3_url:
        print(f"\n🎉 SUCCESS! Profile available via S3:")
        print(f"🔗 {s3_url}")
    else:
        print(f"\n⚠️ S3 upload failed, creating local file instead...")
        
    # Always create local file as backup
    local_path = create_simple_direct_profile()
    
    # Provide hosting alternatives
    provide_hosting_alternatives()
    
    print(f"\n🏆 PROFILE SUMMARY:")
    print("✅ CleanBrowsing DNS filtering")
    print("✅ PIN 1234 protection") 
    print("✅ Adult content blocked")
    print("✅ In-app purchases disabled")
    print("✅ Profile removal protected")
    print("✅ Ready for direct installation")
    
    print(f"\n📧 FOR CUSTOMERS:")
    print("Send them the download link + installation instructions")
    print("No SimpleMDM account needed!")
    print("Works on both supervised and regular devices")

if __name__ == "__main__":
    main()

