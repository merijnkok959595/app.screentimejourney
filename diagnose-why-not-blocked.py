#!/usr/bin/env python3

import requests
from base64 import b64encode
import subprocess
import socket

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"
DEVICE_ID = 2126394

def check_device_installed_profiles():
    """Check exactly what profiles are installed on the device"""
    
    print("📋 CHECKING INSTALLED PROFILES ON DEVICE")
    print("=" * 45)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    try:
        # Check installed custom configuration profiles
        response = requests.get(f"{BASE_URL}/devices/{DEVICE_ID}/installed_custom_configuration_profiles", headers=headers)
        
        print(f"📡 GET /devices/{DEVICE_ID}/installed_custom_configuration_profiles")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            profiles = response.json()['data']
            
            print(f"✅ Found {len(profiles)} installed profile(s):")
            
            parental_profile_found = False
            
            for profile in profiles:
                profile_id = profile['id']
                attrs = profile['attributes']
                name = attrs.get('name', f'Profile {profile_id}')
                status = attrs.get('install_status', 'Unknown')
                installed_at = attrs.get('installed_at', 'Unknown')
                
                print(f"\n📄 {name}")
                print(f"   ID: {profile_id}")
                print(f"   Status: {status}")
                print(f"   Installed: {installed_at}")
                
                if profile_id == 214139:
                    parental_profile_found = True
                    print(f"   🎯 THIS IS OUR PARENTAL CONTROL PROFILE!")
                    
                    if status == 'installed':
                        print(f"   ✅ Profile is installed - should be working!")
                        return True
                    elif status == 'pending':
                        print(f"   ⏳ Profile still installing...")
                        return False
                    else:
                        print(f"   ❌ Problem with profile: {status}")
                        return False
            
            if not parental_profile_found:
                print(f"\n❌ PARENTAL CONTROL PROFILE NOT FOUND!")
                print("This is why content blocking isn't working!")
                return False
                
        else:
            print(f"❌ Failed to get installed profiles: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    return False

def test_dns_resolution_directly():
    """Test DNS resolution to see what's actually happening"""
    
    print(f"\n🌐 TESTING DNS RESOLUTION")
    print("=" * 30)
    
    # Test sites that should be blocked
    test_sites = ['pornhub.com', 'xvideos.com', 'google.com']
    
    for site in test_sites:
        try:
            print(f"\n🧪 Testing {site}:")
            
            # Get IP address
            ip = socket.gethostbyname(site)
            print(f"   Resolves to: {ip}")
            
            # CleanBrowsing block page IPs are usually:
            # 185.228.168.168, 185.228.169.168, or block page IPs
            if ip in ['185.228.168.168', '185.228.169.168']:
                print(f"   ✅ BLOCKED by CleanBrowsing!")
            elif ip.startswith('185.228.'):
                print(f"   ✅ Likely CleanBrowsing block page")
            elif site == 'pornhub.com' and not ip.startswith('66.254.'):
                print(f"   ✅ May be blocked (unusual IP)")
            else:
                print(f"   ❌ NOT BLOCKED - resolving normally")
                
        except socket.gaierror as e:
            print(f"   ✅ DNS ERROR - likely blocked: {e}")
        except Exception as e:
            print(f"   ❓ Error: {e}")

def check_current_dns_servers():
    """Check what DNS servers the Mac is actually using"""
    
    print(f"\n🔍 CHECKING CURRENT DNS SERVERS")
    print("=" * 35)
    
    try:
        # Check DNS configuration
        result = subprocess.run(['scutil', '--dns'], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            dns_output = result.stdout
            
            # Look for CleanBrowsing DNS servers
            cleanbrowsing_found = False
            
            if '185.228.168.168' in dns_output:
                print("✅ CleanBrowsing DNS 185.228.168.168 found!")
                cleanbrowsing_found = True
                
            if '185.228.169.168' in dns_output:
                print("✅ CleanBrowsing DNS 185.228.169.168 found!")
                cleanbrowsing_found = True
                
            if not cleanbrowsing_found:
                print("❌ CleanBrowsing DNS servers NOT found in DNS config!")
                print("This means the DNS profile isn't active.")
                
                # Show what DNS servers are being used
                lines = dns_output.split('\n')
                for line in lines:
                    if 'nameserver' in line and not line.strip().startswith('#'):
                        print(f"   Current DNS: {line.strip()}")
            
            return cleanbrowsing_found
            
    except Exception as e:
        print(f"💥 Error checking DNS: {e}")
    
    return False

def force_profile_reinstall():
    """Try to force reinstall the profile"""
    
    print(f"\n🔄 FORCING PROFILE REINSTALL")
    print("=" * 35)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    try:
        # First unassign the profile
        print("🗑️ Unassigning profile...")
        response = requests.delete(f"{BASE_URL}/custom_configuration_profiles/214139/devices/{DEVICE_ID}", headers=headers)
        print(f"   Unassign status: {response.status_code}")
        
        # Wait a moment
        import time
        time.sleep(3)
        
        # Reassign the profile
        print("➕ Reassigning profile...")
        response = requests.post(f"{BASE_URL}/custom_configuration_profiles/214139/devices/{DEVICE_ID}", headers=headers)
        print(f"   Reassign status: {response.status_code}")
        
        # Force device refresh again
        print("🔄 Forcing device refresh...")
        response = requests.post(f"{BASE_URL}/devices/{DEVICE_ID}/refresh", headers=headers)
        print(f"   Refresh status: {response.status_code}")
        
        if response.status_code in [200, 202, 204]:
            print("✅ Profile reinstall initiated!")
            return True
        else:
            print(f"❌ Reinstall failed: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    return False

def provide_manual_fix_options():
    """Provide manual troubleshooting options"""
    
    print(f"\n🛠️ MANUAL TROUBLESHOOTING OPTIONS")
    print("=" * 40)
    
    print("🎯 OPTION 1: Check System Preferences")
    print("• Go to System Preferences > Profiles")
    print("• Look for 'ScreenTime Journey - Enhanced MDM Protection'")
    print("• If not there → Profile didn't install")
    print("• If there → Check what settings it contains")
    print("")
    
    print("🎯 OPTION 2: Force DNS Cache Clear")
    print("• Run in Terminal:")
    print("  sudo dscacheutil -flushcache")
    print("  sudo killall -HUP mDNSResponder")
    print("• Restart Safari completely")
    print("")
    
    print("🎯 OPTION 3: Check Network Settings")
    print("• System Preferences > Network")
    print("• Select your WiFi")
    print("• Click Advanced > DNS")
    print("• Should show 185.228.168.168 and 185.228.169.168")
    print("")
    
    print("🎯 OPTION 4: Restart MacBook")
    print("• Sometimes profiles only activate after restart")
    print("• Reboot and test again")
    print("")
    
    print("🎯 OPTION 5: Try Different Browser")
    print("• Test in Chrome or Firefox")
    print("• Sometimes Safari has DNS caching issues")

def create_direct_profile_download():
    """Create a direct profile download as backup"""
    
    print(f"\n📥 CREATING DIRECT PROFILE DOWNLOAD")
    print("=" * 40)
    
    # Create simple working profile content
    profile_content = '''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>PayloadType</key>
            <string>com.apple.dnsSettings.managed</string>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.dns.cleanbrowsing</string>
            <key>PayloadUUID</key>
            <string>12345678-1234-1234-1234-123456789012</string>
            <key>PayloadDisplayName</key>
            <string>CleanBrowsing Adult Filter</string>
            <key>PayloadDescription</key>
            <string>Blocks adult content via DNS</string>
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
            </dict>
        </dict>
    </array>
    <key>PayloadDisplayName</key>
    <string>Emergency CleanBrowsing DNS</string>
    <key>PayloadDescription</key>
    <string>Direct DNS filtering for adult content blocking</string>
    <key>PayloadIdentifier</key>
    <string>com.screentimejourney.emergency.dns</string>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>12345678-1234-1234-1234-123456789999</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>'''
    
    # Save to file
    with open('emergency-dns-profile.mobileconfig', 'w') as f:
        f.write(profile_content)
    
    print("✅ Created emergency-dns-profile.mobileconfig")
    print("📋 MANUAL INSTALLATION:")
    print("1. Double-click emergency-dns-profile.mobileconfig")
    print("2. Install in System Preferences")
    print("3. Test pornhub.com → Should be blocked")

def main():
    print("🔍 DIAGNOSING WHY CONTENT ISN'T BLOCKED")
    print("=" * 45)
    print("Let's find out exactly why pornhub.com is still loading...")
    print("")
    
    # Step 1: Check if profile is actually installed
    profile_installed = check_device_installed_profiles()
    
    # Step 2: Check DNS configuration
    dns_working = check_current_dns_servers()
    
    # Step 3: Test DNS resolution
    test_dns_resolution_directly()
    
    # Step 4: Analysis
    print(f"\n📊 DIAGNOSIS:")
    print("=" * 15)
    
    if profile_installed and dns_working:
        print("✅ Profile installed ✅ DNS configured")
        print("🤔 Issue might be DNS caching or browser cache")
        print("💡 Try: Clear DNS cache + restart browser")
        
    elif profile_installed and not dns_working:
        print("✅ Profile installed ❌ DNS not working")
        print("🤔 Profile installed but DNS settings not active")
        print("💡 Try: Restart MacBook to activate profile")
        
    elif not profile_installed:
        print("❌ Profile NOT installed")
        print("🤔 Profile assignment failed or still pending")
        print("💡 Try: Force profile reinstall")
        
        # Try to force reinstall
        force_profile_reinstall()
        
    else:
        print("❓ Unclear issue - multiple problems detected")
    
    # Step 5: Provide manual options
    provide_manual_fix_options()
    
    # Step 6: Create backup solution
    create_direct_profile_download()
    
    print(f"\n🎯 NEXT STEPS:")
    print("1. Check System Preferences > Profiles")
    print("2. If no profile → Try emergency-dns-profile.mobileconfig")
    print("3. If profile exists → Restart MacBook")
    print("4. Clear DNS cache and test again")

if __name__ == "__main__":
    main()

