#!/usr/bin/env python3

import requests
import uuid
from base64 import b64encode

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"
PROFILE_ID = 214139  # Your existing profile ID

def create_cleanbrowsing_profile():
    """Create enhanced profile with CleanBrowsing + Screen Time enforcement"""
    
    print("🛡️  Creating Enhanced CleanBrowsing + Screen Time Profile")
    print("=" * 60)
    
    # Generate unique UUIDs
    profile_uuid = str(uuid.uuid4()).upper()
    dns_uuid = str(uuid.uuid4()).upper()
    restrictions_uuid = str(uuid.uuid4()).upper()
    webfilter_uuid = str(uuid.uuid4()).upper()
    
    # Enhanced profile with CleanBrowsing + Screen Time enforcement
    profile_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        
        <!-- CleanBrowsing DNS (Adult Filter + Family Safe) -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.dnsSettings.managed</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.cleanbrowsing</string>
            <key>PayloadUUID</key>
            <string>{dns_uuid}</string>
            <key>PayloadDisplayName</key>
            <string>CleanBrowsing Adult Filter</string>
            <key>DNSSettings</key>
            <dict>
                <key>DNSProtocol</key>
                <string>HTTPS</string>
                <key>ServerURL</key>
                <string>https://doh.cleanbrowsing.org/doh/adult-filter/</string>
                <key>ServerName</key>
                <string>doh.cleanbrowsing.org</string>
                <key>ServerAddresses</key>
                <array>
                    <string>185.228.168.10</string>
                    <string>185.228.169.11</string>
                </array>
                <key>SupplementalMatchDomains</key>
                <array>
                    <string></string>
                </array>
            </dict>
            <key>OnDemandEnabled</key>
            <integer>1</integer>
            <key>OnDemandRules</key>
            <array>
                <dict>
                    <key>Action</key>
                    <string>Connect</string>
                </dict>
            </array>
        </dict>
        
        <!-- Web Content Filter (Built-in Screen Time Filter) -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.webcontent-filter</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.webfilter</string>
            <key>PayloadUUID</key>
            <string>{webfilter_uuid}</string>
            <key>PayloadDisplayName</key>
            <string>Screen Time Web Filter</string>
            <key>FilterType</key>
            <string>BuiltIn</string>
            <key>AutoFilterEnabled</key>
            <true/>
            <key>FilterBrowsers</key>
            <true/>
            <key>FilterSockets</key>
            <true/>
            <key>UserDefinedName</key>
            <string>ScreenTime Journey Adult Content Filter</string>
            <key>PermittedURLs</key>
            <array>
                <string>apple.com</string>
                <string>icloud.com</string>
                <string>google.com</string>
                <string>youtube.com</string>
                <string>wikipedia.org</string>
            </array>
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
        
        <!-- Screen Time Restrictions (Adult Content + Safe Search) -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.applicationaccess</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.restrictions</string>
            <key>PayloadUUID</key>
            <string>{restrictions_uuid}</string>
            <key>PayloadDisplayName</key>
            <string>Screen Time Content Restrictions</string>
            
            <!-- Block Explicit Content -->
            <key>allowExplicitContent</key>
            <false/>
            
            <!-- App Store Ratings -->
            <key>ratingRegion</key>
            <string>us</string>
            <key>ratingApps</key>
            <integer>600</integer>
            <key>ratingMovies</key>
            <integer>1000</integer>
            <key>ratingTVShows</key>
            <integer>1000</integer>
            
            <!-- Force Safe Search on All Search Engines -->
            <key>forceGoogleSafeSearch</key>
            <integer>1</integer>
            <key>forceBingSafeSearch</key>
            <integer>1</integer>
            <key>forceYahooSafeSearch</key>
            <integer>1</integer>
            
            <!-- Block Adult Websites via Screen Time -->
            <key>allowAdultContent</key>
            <false/>
            <key>forceWebContentFilterAutoFilter</key>
            <true/>
            
            <!-- Additional Safety Settings -->
            <key>allowBookstore</key>
            <true/>
            <key>allowBookstoreErotica</key>
            <false/>
            <key>allowPodcasts</key>
            <true/>
            <key>allowPodcastsExplicit</key>
            <false/>
            <key>allowMusicService</key>
            <true/>
            <key>allowExplicitMusic</key>
            <false/>
            
        </dict>
        
    </array>
    
    <key>PayloadDisplayName</key>
    <string>ScreenTime Journey - CleanBrowsing + Screen Time Protection</string>
    
    <key>PayloadIdentifier</key>
    <string>com.screentimejourney.cleanbrowsing.complete</string>
    
    <key>PayloadUUID</key>
    <string>{profile_uuid}</string>
    
    <key>PayloadType</key>
    <string>Configuration</string>
    
    <key>PayloadVersion</key>
    <integer>1</integer>
    
    <key>PayloadDescription</key>
    <string>Complete protection using CleanBrowsing DNS (adult content blocking), Screen Time built-in web filter (enforced), Content restrictions (explicit content blocked, safe search enforced), Social media website blocking, App Store 12+ only.</string>
    
    <key>PayloadOrganization</key>
    <string>ScreenTime Journey</string>
    
    <key>PayloadRemovalDisallowed</key>
    <false/>
    
</dict>
</plist>'''

    return profile_content

def update_simplemdm_profile():
    """Update existing SimpleMDM profile with CleanBrowsing configuration"""
    
    print("🔄 Updating SimpleMDM Profile with CleanBrowsing...")
    
    # Get the enhanced profile content
    profile_content = create_cleanbrowsing_profile()
    
    # Prepare authentication
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth_header}"
    }
    
    # Prepare form data for profile update
    files = {
        'name': (None, 'ScreenTime Journey - CleanBrowsing + Screen Time Protection'),
        'mobileconfig': ('profile.mobileconfig', profile_content, 'application/x-apple-aspen-config')
    }
    
    # Update the existing profile
    response = requests.post(
        f"{BASE_URL}/custom_configuration_profiles/{PROFILE_ID}",
        headers=headers,
        files=files,
        data={'_method': 'PATCH'}
    )
    
    if response.status_code == 200:
        profile_data = response.json()
        
        print("✅ SUCCESS! Profile updated with CleanBrowsing")
        print("=" * 60)
        print(f"📋 Profile ID: {PROFILE_ID}")
        print(f"📋 Profile Name: {profile_data['data']['attributes']['name']}")
        print(f"🔗 Dashboard: https://a.simplemdm.com/configuration_profiles/{PROFILE_ID}")
        
        return True
        
    else:
        print(f"❌ ERROR: Failed to update profile")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        return False

def main():
    print("🛡️  Switch to CleanBrowsing + Screen Time Protection")
    print("=" * 60)
    
    success = update_simplemdm_profile()
    
    if success:
        print("\n🎉 PROFILE UPDATED SUCCESSFULLY!")
        print("=" * 60)
        
        print("📋 What Your Enhanced Profile Now Does:")
        print("  ✅ CleanBrowsing DNS (HTTPS + IP fallback)")
        print("  ✅ Blocks ALL adult websites (DNS level)")
        print("  ✅ Screen Time adult content filter (ENFORCED)")
        print("  ✅ Safe Search enforced (Google, Bing, Yahoo)")
        print("  ✅ Social media websites blocked")
        print("  ✅ Explicit content blocked (Apps, Music, Books)")
        print("  ✅ App Store 12+ ratings only")
        print("")
        
        print("📲 For Existing Enrolled Devices:")
        print("  • Profile will auto-update within 5-10 minutes")
        print("  • No user action required")
        print("  • Enhanced protection will activate automatically")
        print("")
        
        print("📱 For New Enrollments:")
        print("  • Use the same enrollment URL")
        print("  • Enhanced profile installs automatically")
        print("  • Maximum protection from day 1")
        print("")
        
        print("🧪 Test Your Enhanced Protection:")
        print("  1. Try: pornhub.com → Should be BLOCKED (CleanBrowsing)")
        print("  2. Try: facebook.com → Should be BLOCKED (Web Filter)")
        print("  3. Google adult terms → Only safe results (Safe Search)")
        print("  4. App Store → Only 12+ apps visible")
        print("")
        
        print("🎯 Why This is Better Than Cloudflare:")
        print("  ✅ No WARP app needed")
        print("  ✅ Works immediately on enrollment")
        print("  ✅ CleanBrowsing specializes in content filtering")
        print("  ✅ Screen Time integration (native iOS/macOS)")
        print("  ✅ Simpler, more reliable")
        print("")
        
        print(f"🔗 Manage: https://a.simplemdm.com/configuration_profiles/{PROFILE_ID}")
        
    else:
        print("❌ Failed to update profile")

if __name__ == "__main__":
    main()


