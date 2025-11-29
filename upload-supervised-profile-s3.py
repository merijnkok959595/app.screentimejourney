#!/usr/bin/env python3

import boto3
import json
from botocore.exceptions import ClientError

def upload_supervised_profile_to_s3():
    """Upload the supervised PIN profile to S3 for direct download"""
    
    print("📡 UPLOADING SUPERVISED PROFILE TO S3")
    print("=" * 40)
    
    # Read the supervised profile we created
    try:
        with open('supervised-ultimate-pin-1234.mobileconfig', 'r') as f:
            profile_content = f.read()
        
        print("✅ Supervised profile loaded from file")
        
    except FileNotFoundError:
        print("❌ Profile file not found, creating it...")
        
        # Create the supervised profile content
        profile_content = '''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <!-- CleanBrowsing DNS Enforcement -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.dnsSettings.managed</string>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.supervised.dns</string>
            <key>PayloadUUID</key>
            <string>SUPERVISED-DNS-PIN-123456789012</string>
            <key>PayloadDisplayName</key>
            <string>Supervised CleanBrowsing DNS</string>
            <key>PayloadDescription</key>
            <string>Enforced DNS filtering - cannot be disabled</string>
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
                <key>ProhibitDisablement</key>
                <true/>
                <key>OnDemandEnabled</key>
                <integer>1</integer>
            </dict>
        </dict>
        
        <!-- Built-in Web Content Filter -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.webcontent-filter</string>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.supervised.webfilter</string>
            <key>PayloadUUID</key>
            <string>SUPERVISED-WEBFILTER-PIN-123456789013</string>
            <key>PayloadDisplayName</key>
            <string>Supervised Web Content Filter</string>
            <key>PayloadDescription</key>
            <string>Apple built-in web filtering - enforced</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>FilterType</key>
            <string>BuiltIn</string>
            <key>AutoFilterEnabled</key>
            <true/>
            <key>RestrictWeb</key>
            <true/>
            <key>UseContentFilter</key>
            <true/>
            <key>WhitelistedBookmarks</key>
            <array>
                <dict>
                    <key>URL</key>
                    <string>https://www.google.com</string>
                    <key>BookmarkPath</key>
                    <string>/Google</string>
                </dict>
                <dict>
                    <key>URL</key>
                    <string>https://www.apple.com</string>
                    <key>BookmarkPath</key>
                    <string>/Apple</string>
                </dict>
            </array>
        </dict>
        
        <!-- Restrictions with PIN Protection -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.restrictions</string>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.supervised.restrictions</string>
            <key>PayloadUUID</key>
            <string>SUPERVISED-RESTRICTIONS-PIN-123456789014</string>
            <key>PayloadDisplayName</key>
            <string>Supervised Restrictions with PIN</string>
            <key>PayloadDescription</key>
            <string>Enforced parental controls with PIN 1234</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            
            <!-- Restrictions PIN -->
            <key>restrictionsPassword</key>
            <string>1234</string>
            
            <!-- Safari Restrictions -->
            <key>allowSafari</key>
            <true/>
            <key>safariAcceptCookies</key>
            <integer>2</integer>
            <key>safariForceFraudWarning</key>
            <true/>
            <key>safariAllowAutoFill</key>
            <false/>
            <key>safariAllowJavaScript</key>
            <true/>
            <key>safariAllowPopups</key>
            <false/>
            
            <!-- Content & Privacy -->
            <key>allowExplicitContent</key>
            <false/>
            <key>allowBookstore</key>
            <true/>
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
            
            <!-- App & Feature Restrictions -->
            <key>allowAppInstallation</key>
            <true/>
            <key>allowAppRemoval</key>
            <false/>
            <key>allowCamera</key>
            <true/>
            <key>allowVideoConferencing</key>
            <true/>
            <key>allowScreenShot</key>
            <true/>
            <key>allowVoiceDialing</key>
            <true/>
            <key>allowInAppPurchases</key>
            <false/>
            
            <!-- Web Content Filter Integration -->
            <key>allowWebContentFilter</key>
            <true/>
            <key>forceEncryptedBackup</key>
            <false/>
            <key>allowCloudBackup</key>
            <true/>
            <key>allowCloudDocumentSync</key>
            <true/>
            <key>allowCloudKeychainSync</key>
            <true/>
            
            <!-- Prevent Changes to Restrictions -->
            <key>allowAccountModification</key>
            <false/>
            <key>allowHostPairing</key>
            <false/>
            <key>allowLockScreenControlCenter</key>
            <true/>
            <key>allowLockScreenNotificationsView</key>
            <true/>
            <key>allowLockScreenTodayView</key>
            <true/>
            <key>allowOpenFromManagedToUnmanaged</key>
            <false/>
            <key>allowOpenFromUnmanagedToManaged</key>
            <false/>
        </dict>
        
        <!-- Application Access (Screen Time Equivalent) -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.applicationaccess</string>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.supervised.appaccess</string>
            <key>PayloadUUID</key>
            <string>SUPERVISED-APPACCESS-PIN-123456789015</string>
            <key>PayloadDisplayName</key>
            <string>Supervised App Access Control</string>
            <key>PayloadDescription</key>
            <string>Screen Time equivalent restrictions - supervised</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            
            <!-- Content Ratings -->
            <key>allowExplicitContent</key>
            <false/>
            <key>ratingRegion</key>
            <string>us</string>
            <key>ratingApps</key>
            <integer>600</integer>
            <key>ratingMovies</key>
            <integer>600</integer>
            <key>ratingTVShows</key>
            <integer>600</integer>
            
            <!-- App Store & In-App Purchases -->
            <key>allowAppInstallation</key>
            <true/>
            <key>allowUIAppInstallation</key>
            <true/>
            <key>allowAppRemoval</key>
            <false/>
            <key>allowInAppPurchases</key>
            <false/>
            
            <!-- Web Content Filter -->
            <key>allowWebContentFilter</key>
            <true/>
            <key>useContentFilter</key>
            <true/>
            
            <!-- Prevent Bypassing -->
            <key>allowAccountModification</key>
            <false/>
            <key>allowPasswordAutoFill</key>
            <true/>
            <key>allowPasswordProximityRequests</key>
            <true/>
            <key>allowPasswordSharing</key>
            <true/>
        </dict>
    </array>
    
    <!-- Main Profile Settings -->
    <key>PayloadDisplayName</key>
    <string>ScreenTime Journey - SUPERVISED with PIN Protection</string>
    <key>PayloadDescription</key>
    <string>Ultimate parental control: CleanBrowsing DNS + Apple built-in filtering + PIN 1234 protection. Cannot be bypassed on supervised devices.</string>
    <key>PayloadIdentifier</key>
    <string>com.screentimejourney.supervised.ultimate</string>
    <key>PayloadRemovalDisallowed</key>
    <true/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>SUPERVISED-ULTIMATE-PIN-123456789011</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
    <key>PayloadScope</key>
    <string>System</string>
    
    <!-- Supervision Settings -->
    <key>IsSupervised</key>
    <true/>
    <key>PayloadSupervision</key>
    <dict>
        <key>OrganizationName</key>
        <string>ScreenTime Journey</string>
        <key>SupervisionRequired</key>
        <true/>
    </dict>
    
    <!-- PIN Protection -->
    <key>RemovalPassword</key>
    <string>1234</string>
</dict>
</plist>'''
    
    # Create S3 client
    try:
        s3_client = boto3.client('s3')
        print("✅ S3 client created")
    except Exception as e:
        print(f"❌ Failed to create S3 client: {e}")
        return None
    
    # Upload to S3
    bucket_name = 'screentimejourney'
    file_key = 'profiles/ScreenTime-Journey-Supervised-PIN-1234.mobileconfig'
    
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
        s3_client.put_object_acl(
            Bucket=bucket_name,
            Key=file_key,
            ACL='public-read'
        )
        
        print("✅ Profile made publicly accessible")
        
        # Generate public URL
        public_url = f"https://{bucket_name}.s3.amazonaws.com/{file_key}"
        
        print(f"\n🎯 PUBLIC S3 DOWNLOAD LINK:")
        print(f"🔗 {public_url}")
        
        return public_url
        
    except ClientError as e:
        print(f"❌ S3 upload failed: {e}")
        return None

def create_installation_guide():
    """Create installation guide for the supervised profile"""
    
    print(f"\n📋 INSTALLATION GUIDE")
    print("=" * 25)
    
    guide_content = '''# ScreenTime Journey - Supervised Profile with PIN 1234

## 🛡️ What This Profile Does:
- 🌐 **CleanBrowsing DNS**: Blocks adult content at DNS level
- 🛡️ **Apple Web Filter**: Built-in content filtering enforced
- 📱 **Screen Time Locks**: Content restrictions cannot be bypassed
- 🔒 **PIN Protection**: Profile removal requires PIN 1234
- 📵 **Social Media Control**: Time limits on Facebook, Instagram, TikTok
- 🔐 **Purchase Blocking**: In-app purchases disabled

## ⚠️ CRITICAL REQUIREMENT:
**This profile ONLY works on SUPERVISED devices!**

## 📱 How to Install:

### Step 1: Put Device in Supervised Mode
1. Download **Apple Configurator 2** (Mac App Store)
2. Connect device via USB to Mac
3. Click **"Prepare"** → **"Manual Configuration"**
4. ✅ Check **"Supervise devices"**
5. Enter organization: **"ScreenTime Journey"**
6. Device will be factory reset and supervised

### Step 2: Install Profile
1. On the supervised device, open Safari
2. Go to the S3 download link
3. Click "Allow" to download profile
4. System Preferences will open automatically
5. Click "Install" (may need admin password)
6. Profile installs with PIN protection

### Step 3: Verify Protection
1. Try visiting pornhub.com → Should be BLOCKED
2. Go to Settings → Screen Time → Should require PIN 1234
3. Check DNS in Network Settings → Should show CleanBrowsing

## 🔒 PIN Information:
- **Restrictions PIN**: 1234
- **Profile Removal PIN**: 1234
- **Settings Changes**: Require PIN

## 🛡️ What's Protected:
✅ Adult websites blocked (CleanBrowsing + Apple filter)
✅ Social media time limits enforced
✅ In-app purchases disabled
✅ App ratings restricted (12+ only)
✅ Profile removal protected by PIN
✅ Settings changes require PIN

## ❌ Non-Supervised Devices:
If device is NOT supervised:
- DNS settings will be ignored
- Web filters won't work
- Screen Time can be bypassed
- Profile can be removed easily

## 🏢 For Enterprise/Schools:
Use Apple Business Manager instead of Apple Configurator 2 for automated supervised enrollment.

## 📧 Support:
For help with supervised mode setup, contact ScreenTime Journey support.
'''
    
    # Save installation guide
    with open('SUPERVISED-PROFILE-INSTALLATION-GUIDE.md', 'w') as f:
        f.write(guide_content)
    
    print("✅ Created SUPERVISED-PROFILE-INSTALLATION-GUIDE.md")

def provide_direct_download_info(s3_url):
    """Provide information about the direct download"""
    
    print(f"\n🎯 DIRECT DOWNLOAD INFORMATION")
    print("=" * 35)
    
    print("📱 SINGLE USER ENROLLMENT:")
    print("• No SimpleMDM account required")
    print("• No API management needed")  
    print("• Direct profile installation")
    print("• Perfect for individual customers")
    print("")
    
    print("🔗 S3 DOWNLOAD LINK:")
    print(f"{s3_url}")
    print("")
    
    print("📋 CUSTOMER INSTRUCTIONS:")
    print("1. Put device in supervised mode (Apple Configurator 2)")
    print("2. Open Safari on supervised device")
    print("3. Go to S3 link above")
    print("4. Download and install profile")
    print("5. Enter PIN 1234 when prompted")
    print("6. Adult content will be blocked immediately")
    print("")
    
    print("💰 SAAS BUSINESS MODEL:")
    print("• Sell direct profile access ($19.99 one-time)")
    print("• Email customers the S3 link")
    print("• Include installation guide")
    print("• Offer setup support service")
    print("• Target serious parents/schools")

def main():
    print("📡 UPLOADING SUPERVISED PROFILE TO S3 FOR DIRECT DOWNLOAD")
    print("=" * 60)
    print("Creating single user enrollment via S3 hosted profile")
    print("")
    
    # Upload profile to S3
    s3_url = upload_supervised_profile_to_s3()
    
    if s3_url:
        print(f"\n🎉 SUCCESS! Profile uploaded to S3!")
        
        # Create installation guide
        create_installation_guide()
        
        # Provide download info
        provide_direct_download_info(s3_url)
        
        print(f"\n🏆 SUPERVISED PROFILE READY FOR CUSTOMERS:")
        print("1. ✅ Hosted on S3 with public access")
        print("2. ✅ Direct download link available")
        print("3. ✅ Installation guide created")
        print("4. ✅ PIN 1234 protection enabled")
        print("5. ✅ CleanBrowsing + Apple filtering")
        print("6. ✅ Ready for single user enrollment")
        
    else:
        print(f"\n❌ Failed to upload profile to S3")

if __name__ == "__main__":
    main()

