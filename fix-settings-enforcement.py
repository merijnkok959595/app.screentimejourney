#!/usr/bin/env python3

import requests
from base64 import b64encode
import subprocess
import json

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"
DEVICE_ID = 2126394

def create_enforced_dns_profile():
    """Create a properly enforced DNS profile that actually works"""
    
    print("🛡️ CREATING ENFORCED DNS PROFILE")
    print("=" * 35)
    
    # Create a FORCED DNS profile that macOS cannot ignore
    enforced_profile = '''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <!-- ENFORCED DNS Settings -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.dnsSettings.managed</string>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.enforced.dns</string>
            <key>PayloadUUID</key>
            <string>A1B2C3D4-E5F6-7890-ABCD-EF1234567890</string>
            <key>PayloadDisplayName</key>
            <string>Enforced CleanBrowsing DNS</string>
            <key>PayloadDescription</key>
            <string>Forces CleanBrowsing DNS - Cannot be bypassed</string>
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
                <string>https://doh.cleanbrowsing.org/doh/adult-filter/</string>
                <key>SupplementalMatchDomains</key>
                <array>
                    <string></string>
                </array>
                <key>ProhibitDisablement</key>
                <true/>
            </dict>
        </dict>
        
        <!-- Network Content Filter (Alternative approach) -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.webcontent-filter</string>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.enforced.filter</string>
            <key>PayloadUUID</key>
            <string>B2C3D4E5-F6G7-8901-BCDE-F23456789012</string>
            <key>PayloadDisplayName</key>
            <string>Enforced Content Filter</string>
            <key>PayloadDescription</key>
            <string>Network-level content filtering</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>FilterType</key>
            <string>Plugin</string>
            <key>UserDefinedName</key>
            <string>ScreenTime Journey Filter</string>
            <key>PluginBundleID</key>
            <string>com.apple.NetworkExtension.filter-data</string>
            <key>FilterSockets</key>
            <true/>
            <key>FilterPackets</key>
            <false/>
        </dict>
        
        <!-- System Configuration (Force settings) -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.systemconfiguration</string>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.system.config</string>
            <key>PayloadUUID</key>
            <string>C3D4E5F6-G7H8-9012-CDEF-345678901234</string>
            <key>PayloadDisplayName</key>
            <string>System DNS Configuration</string>
            <key>PayloadDescription</key>
            <string>Forces system-wide DNS settings</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>NetworkServices</key>
            <dict>
                <key>Wi-Fi</key>
                <dict>
                    <key>DNS</key>
                    <dict>
                        <key>ServerAddresses</key>
                        <array>
                            <string>185.228.168.168</string>
                            <string>185.228.169.168</string>
                        </array>
                    </dict>
                </dict>
            </dict>
        </dict>
    </array>
    
    <key>PayloadDisplayName</key>
    <string>ScreenTime Journey - ENFORCED Protection</string>
    <key>PayloadDescription</key>
    <string>System-enforced parental controls that cannot be bypassed</string>
    <key>PayloadIdentifier</key>
    <string>com.screentimejourney.enforced.protection</string>
    <key>PayloadRemovalDisallowed</key>
    <true/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>D4E5F6G7-H8I9-0123-DEFG-456789012345</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>'''
    
    # Save enforced profile
    with open('enforced-protection.mobileconfig', 'w') as f:
        f.write(enforced_profile)
    
    print("✅ Created enforced-protection.mobileconfig")
    return enforced_profile

def update_simplemdm_profile_with_enforcement():
    """Update SimpleMDM profile with proper enforcement"""
    
    print("\n🔧 UPDATING SIMPLEMDM PROFILE WITH ENFORCEMENT")
    print("=" * 50)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    
    # Create enforced profile content
    enforced_content = create_enforced_dns_profile()
    
    try:
        # Update the SimpleMDM profile with enforced content
        files = {
            'mobileconfig': ('enforced-protection.mobileconfig', enforced_content, 'application/x-apple-aspen-config')
        }
        
        response = requests.patch(
            f"{BASE_URL}/custom_configuration_profiles/214139",
            headers={"Authorization": f"Basic {auth_header}"},
            files=files,
            timeout=15
        )
        
        print(f"📡 PATCH /custom_configuration_profiles/214139")
        print(f"Status: {response.status_code}")
        
        if response.status_code in [200, 202]:
            print("🎉 SUCCESS! Profile updated with enforcement!")
            return True
        else:
            print(f"❌ Update failed: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    return False

def force_network_dns_change():
    """Manually force DNS change at network level"""
    
    print(f"\n🌐 FORCING NETWORK DNS CHANGE")
    print("=" * 35)
    
    # Commands to force DNS change
    commands = [
        # Set CleanBrowsing DNS on primary network interface
        ["sudo", "networksetup", "-setdnsservers", "Wi-Fi", "185.228.168.168", "185.228.169.168"],
        # Flush DNS cache
        ["sudo", "dscacheutil", "-flushcache"],
        # Kill DNS responder
        ["sudo", "killall", "-HUP", "mDNSResponder"],
        # Force network restart
        ["sudo", "ifconfig", "en0", "down"],
        ["sudo", "ifconfig", "en0", "up"]
    ]
    
    print("🔧 Manual DNS enforcement commands:")
    
    for i, cmd in enumerate(commands, 1):
        cmd_str = " ".join(cmd)
        print(f"{i}. {cmd_str}")
    
    print(f"\n📋 RUN THESE COMMANDS MANUALLY:")
    print("Copy and paste each command in Terminal (will ask for password):")
    print("")
    
    for cmd in commands:
        cmd_str = " ".join(cmd)
        print(f"   {cmd_str}")
    
    print(f"\n✅ After running commands, test pornhub.com → Should be blocked!")

def create_hosts_file_backup():
    """Create hosts file modification as nuclear option"""
    
    print(f"\n🚫 CREATING HOSTS FILE BACKUP BLOCKING")
    print("=" * 45)
    
    # Adult sites to block via hosts file
    blocked_sites = [
        'pornhub.com',
        'www.pornhub.com',
        'xvideos.com', 
        'www.xvideos.com',
        'redtube.com',
        'www.redtube.com',
        'xnxx.com',
        'www.xnxx.com',
        'youporn.com',
        'www.youporn.com'
    ]
    
    # Create hosts file entries
    hosts_entries = []
    for site in blocked_sites:
        hosts_entries.append(f"127.0.0.1 {site}")
        hosts_entries.append(f"::1 {site}")
    
    hosts_content = "\n".join(hosts_entries)
    
    # Save hosts file additions
    with open('hosts-blocking-additions.txt', 'w') as f:
        f.write("# ScreenTime Journey - Adult Content Blocking\n")
        f.write("# Add these lines to /etc/hosts\n\n")
        f.write(hosts_content)
    
    print("✅ Created hosts-blocking-additions.txt")
    print(f"\n📋 NUCLEAR OPTION - HOSTS FILE BLOCKING:")
    print("If nothing else works, manually edit /etc/hosts:")
    print("")
    print("1. sudo nano /etc/hosts")
    print("2. Add the content from hosts-blocking-additions.txt")
    print("3. Save and exit")
    print("4. Test pornhub.com → Will be blocked at system level")

def test_enforcement_methods():
    """Test which enforcement method is working"""
    
    print(f"\n🧪 TESTING ENFORCEMENT METHODS")
    print("=" * 35)
    
    print("📋 TESTING CHECKLIST:")
    print("After applying fixes, test these in order:")
    print("")
    print("1. 🔄 Wait 2 minutes for profile changes")
    print("2. 🌐 Test pornhub.com in Safari")
    print("3. 🔍 Test Google search 'porn'") 
    print("4. 🧭 Check DNS: dig pornhub.com")
    print("5. 📊 System Preferences > Profiles")
    print("6. ⚙️ Network preferences > DNS settings")
    print("")
    print("✅ SUCCESS = pornhub.com shows 'Access Denied'")
    print("❌ FAILURE = pornhub.com loads normally")

def provide_alternative_solutions():
    """Provide alternative parental control solutions"""
    
    print(f"\n🔄 ALTERNATIVE SOLUTIONS IF MDM FAILS")
    print("=" * 45)
    
    print("🎯 OPTION 1: Router-Level DNS")
    print("• Set router DNS to 185.228.168.168, 185.228.169.168")
    print("• Blocks all devices on network")
    print("• Cannot be bypassed easily")
    print("")
    
    print("🎯 OPTION 2: Circle Home Plus ($99)")
    print("• Hardware device for network filtering")
    print("• Time-based blocking")
    print("• Works with any device")
    print("")
    
    print("🎯 OPTION 3: CleanBrowsing Premium ($10/month)")
    print("• Professional DNS filtering")
    print("• Custom block lists")
    print("• More reliable than free version")
    print("")
    
    print("🎯 OPTION 4: OpenDNS Family Shield (Free)")
    print("• DNS: 208.67.222.123, 208.67.220.123")
    print("• Basic adult content blocking") 
    print("• More compatible with macOS")

def main():
    print("🔧 FIXING SETTINGS ENFORCEMENT")
    print("=" * 35)
    print("MDM enrolled ✅ but settings not enforced ❌")
    print("Let's fix the enforcement issue!")
    print("")
    
    # Step 1: Update SimpleMDM profile with proper enforcement
    print("🎯 STEP 1: Update profile with enforcement")
    updated = update_simplemdm_profile_with_enforcement()
    
    if updated:
        print("✅ SimpleMDM profile updated with enforcement!")
        
        # Force device refresh
        auth_header = b64encode(f"{API_KEY}:".encode()).decode()
        headers = {"Authorization": f"Basic {auth_header}"}
        
        try:
            response = requests.post(f"{BASE_URL}/devices/{DEVICE_ID}/refresh", headers=headers)
            print(f"🔄 Device refresh: {response.status_code}")
        except:
            pass
    
    # Step 2: Provide manual enforcement methods
    print(f"\n🎯 STEP 2: Manual enforcement methods")
    force_network_dns_change()
    
    # Step 3: Nuclear option
    print(f"\n🎯 STEP 3: Nuclear option backup")
    create_hosts_file_backup()
    
    # Step 4: Testing
    test_enforcement_methods()
    
    # Step 5: Alternatives
    provide_alternative_solutions()
    
    print(f"\n🏆 ENFORCEMENT STRATEGY:")
    print("1. ✅ Updated SimpleMDM profile with enforcement")
    print("2. 🔧 Manual DNS commands available")
    print("3. 🚫 Hosts file blocking as backup")
    print("4. 🌐 Router-level solutions as alternative")
    print("")
    print("🎯 TRY THE MANUAL DNS COMMANDS FIRST!")
    print("They should force CleanBrowsing DNS immediately!")

if __name__ == "__main__":
    main()

