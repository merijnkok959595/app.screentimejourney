#!/usr/bin/env python3

import requests
from base64 import b64encode
import uuid
import json

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def create_enhanced_screentime_profile():
    """Create enhanced MDM profile with Screen Time app blocking"""
    
    print("🛡️  Creating Enhanced MDM Profile with Screen Time App Blocking")
    print("=" * 70)
    
    # Generate unique UUIDs
    profile_uuid = str(uuid.uuid4()).upper()
    dns_uuid = str(uuid.uuid4()).upper()
    webfilter_uuid = str(uuid.uuid4()).upper()
    restrictions_uuid = str(uuid.uuid4()).upper()
    screentime_uuid = str(uuid.uuid4()).upper()
    
    # Enhanced profile with Screen Time app blocking
    profile_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        
        <!-- CleanBrowsing DNS -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.dnsSettings.managed</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.dns.mdm</string>
            <key>PayloadUUID</key>
            <string>{dns_uuid}</string>
            <key>PayloadDisplayName</key>
            <string>CleanBrowsing DNS Filter</string>
            <key>DNSSettings</key>
            <dict>
                <key>DNSProtocol</key>
                <string>HTTPS</string>
                <key>ServerURL</key>
                <string>https://doh.cleanbrowsing.org/doh/adult-filter/</string>
                <key>ServerAddresses</key>
                <array>
                    <string>185.228.168.10</string>
                    <string>185.228.169.11</string>
                </array>
            </dict>
        </dict>
        
        <!-- Web Content Filter -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.webcontent-filter</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.webfilter.mdm</string>
            <key>PayloadUUID</key>
            <string>{webfilter_uuid}</string>
            <key>PayloadDisplayName</key>
            <string>Web Content Filter</string>
            <key>FilterType</key>
            <string>BuiltIn</string>
            <key>AutoFilterEnabled</key>
            <true/>
            <key>FilterBrowsers</key>
            <true/>
            <key>FilterSockets</key>
            <true/>
            <key>DenyListURLs</key>
            <array>
                <string>facebook.com</string>
                <string>*.facebook.com</string>
                <string>instagram.com</string>
                <string>*.instagram.com</string>
                <string>twitter.com</string>
                <string>*.twitter.com</string>
                <string>x.com</string>
                <string>*.x.com</string>
                <string>tiktok.com</string>
                <string>*.tiktok.com</string>
                <string>snapchat.com</string>
                <string>*.snapchat.com</string>
                <string>reddit.com</string>
                <string>*.reddit.com</string>
                <string>discord.com</string>
                <string>*.discord.com</string>
            </array>
        </dict>
        
        <!-- Content & Privacy Restrictions -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.applicationaccess</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.restrictions.mdm</string>
            <key>PayloadUUID</key>
            <string>{restrictions_uuid}</string>
            <key>PayloadDisplayName</key>
            <string>Content & Privacy Restrictions</string>
            
            <!-- Basic Content Restrictions -->
            <key>allowExplicitContent</key>
            <false/>
            <key>ratingRegion</key>
            <string>us</string>
            <key>ratingApps</key>
            <integer>600</integer>
            <key>ratingMovies</key>
            <integer>1000</integer>
            
            <!-- Safe Search -->
            <key>forceGoogleSafeSearch</key>
            <integer>1</integer>
            <key>forceBingSafeSearch</key>
            <integer>1</integer>
            <key>forceYahooSafeSearch</key>
            <integer>1</integer>
            
            <!-- Screen Time Controls -->
            <key>allowScreenTimeModification</key>
            <false/>
            <key>forceWebContentFilterAutoFilter</key>
            <true/>
            
            <!-- App Store & iTunes -->
            <key>allowAppInstallation</key>
            <true/>
            <key>allowAppRemoval</key>
            <true/>
            <key>allowInAppPurchases</key>
            <false/>
            
            <!-- Restrict Social Media Apps -->
            <key>restrictedBundleIDs</key>
            <array>
                <string>com.facebook.Facebook</string>
                <string>com.burbn.instagram</string>
                <string>com.atebits.Tweetie2</string>
                <string>com.zhiliaoapp.musically</string>
                <string>com.toyopagroup.picaboo</string>
                <string>com.reddit.Reddit</string>
                <string>com.hammerandchisel.discord</string>
            </array>
            
        </dict>
        
        <!-- Screen Time Configuration -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.screentime</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.screentime.mdm</string>
            <key>PayloadUUID</key>
            <string>{screentime_uuid}</string>
            <key>PayloadDisplayName</key>
            <string>Screen Time Management</string>
            
            <!-- Block Social Media Apps During Downtime -->
            <key>familyControlsEnabled</key>
            <true/>
            
            <!-- App Limits for Social Media -->
            <key>appLimits</key>
            <dict>
                <key>com.facebook.Facebook</key>
                <dict>
                    <key>allowance</key>
                    <integer>0</integer>
                    <key>enabled</key>
                    <true/>
                </dict>
                <key>com.burbn.instagram</key>
                <dict>
                    <key>allowance</key>
                    <integer>0</integer>
                    <key>enabled</key>
                    <true/>
                </dict>
                <key>com.zhiliaoapp.musically</key>
                <dict>
                    <key>allowance</key>
                    <integer>0</integer>
                    <key>enabled</key>
                    <true/>
                </dict>
            </dict>
            
            <!-- Downtime Schedule (22:00-09:00) -->
            <key>bedtime</key>
            <dict>
                <key>enabled</key>
                <true/>
                <key>schedule</key>
                <dict>
                    <key>weekdays</key>
                    <dict>
                        <key>start</key>
                        <string>22:00</string>
                        <key>end</key>
                        <string>09:00</string>
                    </dict>
                    <key>weekends</key>
                    <dict>
                        <key>start</key>
                        <string>22:00</string>
                        <key>end</key>
                        <string>09:00</string>
                    </dict>
                </dict>
            </dict>
            
        </dict>
        
    </array>
    
    <key>PayloadDisplayName</key>
    <string>ScreenTime Journey - Complete MDM Protection</string>
    
    <key>PayloadIdentifier</key>
    <string>com.screentimejourney.complete.mdm</string>
    
    <key>PayloadUUID</key>
    <string>{profile_uuid}</string>
    
    <key>PayloadType</key>
    <string>Configuration</string>
    
    <key>PayloadVersion</key>
    <integer>1</integer>
    
    <key>PayloadDescription</key>
    <string>Complete MDM protection with CleanBrowsing DNS, web content filtering, Screen Time app blocking, downtime schedule (22:00-09:00), and content restrictions. Managed via SimpleMDM.</string>
    
    <key>PayloadOrganization</key>
    <string>ScreenTime Journey</string>
    
    <key>PayloadRemovalDisallowed</key>
    <true/>
    
</dict>
</plist>'''

    return profile_content

def update_simplemdm_profile():
    """Update SimpleMDM profile with Screen Time app blocking"""
    
    print("🔄 Updating SimpleMDM Profile with Screen Time App Blocking...")
    
    # Get the enhanced profile content
    profile_content = create_enhanced_screentime_profile()
    
    # Prepare authentication
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Update the existing profile (ID: 214139)
    files = {
        'name': (None, 'ScreenTime Journey - Complete MDM Protection'),
        'mobileconfig': ('profile.mobileconfig', profile_content, 'application/x-apple-aspen-config')
    }
    
    # Use PATCH method to update
    response = requests.post(
        f"{BASE_URL}/custom_configuration_profiles/214139",
        headers=headers,
        files=files,
        data={'_method': 'PATCH'}
    )
    
    if response.status_code == 200:
        profile_data = response.json()
        
        print("✅ SUCCESS! Profile updated with Screen Time blocking")
        print("=" * 60)
        print(f"📋 Profile ID: 214139")
        print(f"📋 Profile Name: {profile_data['data']['attributes']['name']}")
        
        return True
    else:
        print(f"❌ ERROR: Failed to update profile")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        return False

def create_new_enrollment():
    """Create a fresh SimpleMDM enrollment (now that old one is deleted)"""
    
    print(f"\n🔄 Creating Fresh SimpleMDM Enrollment...")
    print("Since we deleted the conflicting enrollment, let's create a new one.")
    print("")
    print("💡 Manual creation required (API endpoints not available)")
    print("")
    print("📋 STEPS:")
    print("1. 🌐 Go to: https://a.simplemdm.com/enrollments")
    print("2. ➕ Click 'Create Enrollment'")
    print("3. 📝 Name: 'ScreenTime Journey - iPhone MDM Enrollment'")
    print("4. ⚙️  Configure auto-assignment to your profile (ID: 214139)")
    print("5. 💾 Save and copy enrollment URL")
    print("6. 📱 Test enrollment on iPhone")
    
    print(f"\n🎯 What will happen after enrollment:")
    print("✅ iPhone enrolls in SimpleMDM")
    print("✅ Enhanced profile auto-assigns (with Screen Time)")
    print("✅ Social media apps blocked 22:00-09:00")
    print("✅ Adult content blocked 24/7")
    print("✅ Remote management enabled")

def explain_screentime_limitations():
    """Explain Screen Time MDM limitations"""
    
    print(f"\n📋 Screen Time MDM Capabilities & Limitations")
    print("=" * 60)
    
    print(f"🏢 SUPERVISED DEVICES (Full Control):")
    print(f"  ✅ App blocking via bundle IDs")
    print(f"  ✅ Downtime schedules enforced")
    print(f"  ✅ App limits enforced")
    print(f"  ✅ Cannot be disabled by user")
    print(f"  ✅ Complete Screen Time lock")
    print(f"")
    
    print(f"📱 UNSUPERVISED DEVICES (Limited Control):")
    print(f"  ⚠️  App restrictions (some bypass possible)")
    print(f"  ⚠️  Downtime suggestions (can be ignored)")
    print(f"  ✅ Content filtering (reliable)")
    print(f"  ✅ DNS blocking (reliable)")
    print(f"  ✅ Web content filter (reliable)")
    print(f"")
    
    print(f"💡 RECOMMENDATION:")
    print(f"  • Use MDM profile for DNS + content filtering (reliable)")
    print(f"  • Add Screen Time payloads (may work partially)")
    print(f"  • Combine with Cloudflare WARP for app blocking")
    print(f"  • Consider device supervision for full control")

def main():
    print("🏢 SimpleMDM + Screen Time App Blocking Setup")
    print("=" * 60)
    
    # Update profile with Screen Time
    success = update_simplemdm_profile()
    
    if success:
        print("\n🎉 ENHANCED PROFILE UPDATED!")
        print("=" * 60)
        
        print("📋 What Your Enhanced Profile Now Includes:")
        print("  ✅ CleanBrowsing DNS (adult content blocking)")
        print("  ✅ Web content filter (social media websites)")
        print("  ✅ Content & privacy restrictions")
        print("  ✅ Screen Time app blocking configuration")
        print("  ✅ Downtime schedule (22:00-09:00)")
        print("  ✅ App limits for social media apps")
        print("  ✅ Safe search enforcement")
        print("  🔒 Profile removal disabled")
        
    # Create new enrollment
    create_new_enrollment()
    
    # Explain limitations
    explain_screentime_limitations()
    
    print(f"\n🚀 NEXT STEPS:")
    print("=" * 60)
    print("1. 🌐 Go to SimpleMDM dashboard and create new enrollment")
    print("2. 📱 Test enrollment on iPhone")
    print("3. ✅ Verify Screen Time restrictions apply")
    print("4. 🔄 If app blocking doesn't work fully, add Cloudflare WARP")
    print("5. 📊 Monitor customer success rates")
    
    print(f"\n💡 Business Strategy:")
    print("  • Market as 'Complete MDM Protection'")
    print("  • Price higher ($29/month) due to Screen Time features")
    print("  • Target families & accountability partners")
    print("  • Provide supervised device setup for enterprise customers")

if __name__ == "__main__":
    main()


