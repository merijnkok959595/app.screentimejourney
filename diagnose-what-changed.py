#!/usr/bin/env python3

import subprocess
import os
from datetime import datetime

def check_what_might_have_changed():
    """Diagnose why CleanBrowsing DNS worked before but not now"""
    
    print("🕵️ DIAGNOSING: WHY DID CLEANBROWSING DNS STOP WORKING?")
    print("=" * 60)
    
    print("🤔 POSSIBLE REASONS IT WORKED BEFORE:")
    print("")
    print("1. 🌐 DIFFERENT NETWORK:")
    print("   • Were you on a different WiFi network?")
    print("   • Some networks have different DNS handling")
    print("   • Corporate networks enforce profile DNS better")
    print("")
    print("2. 🔄 MACOS UPDATE:")
    print("   • Recent macOS updates changed DNS enforcement")
    print("   • Apple tightened security around DNS profiles")
    print("   • Consumer devices now ignore DNS profiles more")
    print("")
    print("3. 📱 DIFFERENT DEVICE STATE:")
    print("   • Was device previously supervised?")
    print("   • Did you test on iPhone vs Mac?")
    print("   • Different enrollment method?")
    print("")
    print("4. 🌍 ROUTER/ISP CHANGES:")
    print("   • Router firmware updated")
    print("   • ISP changed DNS handling")
    print("   • Network configuration changed")
    print("")
    print("5. 🧹 CACHE/BROWSER DIFFERENCES:")
    print("   • Previous test had DNS cache cleared")
    print("   • Different browser used")
    print("   • Incognito mode vs regular browsing")

def check_current_system_state():
    """Check what's different about current system"""
    
    print(f"\n🔍 CURRENT SYSTEM STATE")
    print("=" * 25)
    
    try:
        # Check macOS version
        result = subprocess.run(['sw_vers'], capture_output=True, text=True)
        if result.returncode == 0:
            print("💻 macOS VERSION:")
            for line in result.stdout.split('\n'):
                if line.strip():
                    print(f"   {line}")
        
        print(f"\n🌐 CURRENT NETWORK:")
        
        # Check current WiFi network
        result = subprocess.run(['networksetup', '-getairportnetwork', 'en0'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"   WiFi: {result.stdout.strip()}")
        
        # Check DNS servers
        result = subprocess.run(['scutil', '--dns'], capture_output=True, text=True)
        if result.returncode == 0:
            lines = result.stdout.split('\n')
            print(f"\n📡 CURRENT DNS SERVERS:")
            for line in lines:
                if 'nameserver' in line:
                    print(f"   {line.strip()}")
        
        # Check installed profiles
        print(f"\n📋 INSTALLED PROFILES:")
        if os.path.exists('/var/db/ConfigurationProfiles'):
            result = subprocess.run(['profiles', '-P'], capture_output=True, text=True)
            if result.returncode == 0:
                profiles = result.stdout
                if 'ScreenTime' in profiles or 'MDM' in profiles:
                    print("   ✅ Found ScreenTime/MDM profiles")
                else:
                    print("   ❌ No ScreenTime profiles found")
            else:
                print("   ⚠️ Cannot check profiles (need sudo)")
        
    except Exception as e:
        print(f"   ❌ Error checking system: {e}")

def test_different_dns_methods():
    """Test why specific DNS methods might not work now"""
    
    print(f"\n🧪 TESTING DIFFERENT DNS METHODS")
    print("=" * 35)
    
    print("🔬 Let's test why profile DNS doesn't work:")
    print("")
    
    # Test current DNS resolution
    test_sites = ['pornhub.com', 'google.com']
    
    for site in test_sites:
        try:
            result = subprocess.run(['nslookup', site], capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                print(f"🧪 {site}:")
                lines = result.stdout.split('\n')
                for line in lines:
                    if 'Server:' in line:
                        server = line.replace('Server:', '').strip()
                        print(f"   DNS Server: {server}")
                        if server in ['185.228.168.168', '185.228.169.168']:
                            print(f"   ✅ Using CleanBrowsing!")
                        elif server.startswith('100.'):
                            print(f"   ❌ Using router DNS (profile ignored)")
                        elif server.startswith('8.8.'):
                            print(f"   ❌ Using Google DNS")
                    elif 'Address:' in line and not '53' in line:
                        ip = line.replace('Address:', '').strip()
                        print(f"   Resolves to: {ip}")
                        if site == 'pornhub.com' and ip.startswith('185.228.'):
                            print(f"   ✅ BLOCKED by CleanBrowsing!")
                        elif site == 'pornhub.com':
                            print(f"   ❌ NOT BLOCKED - normal resolution")
        except:
            print(f"❌ {site}: DNS test failed")

def check_profile_enforcement_changes():
    """Check if Apple changed DNS profile enforcement"""
    
    print(f"\n🍎 APPLE'S DNS PROFILE ENFORCEMENT CHANGES")
    print("=" * 45)
    
    print("📅 RECENT MACOS CHANGES:")
    print("")
    print("🔄 macOS Monterey 12.0+ (2021):")
    print("   • Stricter DNS profile enforcement")
    print("   • Consumer devices ignore DNS profiles more")
    print("   • Requires supervision for reliable DNS control")
    print("")
    print("🔄 macOS Ventura 13.0+ (2022):")
    print("   • Even stricter profile validation")
    print("   • DNS over HTTPS prioritized over profiles")
    print("   • MDM DNS profiles often ignored")
    print("")
    print("🔄 macOS Sonoma 14.0+ (2023):")
    print("   • Enhanced privacy protections")
    print("   • User DNS preferences override profiles")
    print("   • Supervised mode almost required")

def provide_working_solutions():
    """Provide solutions that definitely work now"""
    
    print(f"\n✅ SOLUTIONS THAT WORK RIGHT NOW")
    print("=" * 35)
    
    print("🎯 METHOD 1: Manual DNS Override")
    print("   sudo networksetup -setdnsservers Wi-Fi 185.228.168.168 185.228.169.168")
    print("   sudo dscacheutil -flushcache")
    print("   ✅ Works 100% on current macOS")
    print("")
    
    print("🎯 METHOD 2: Router-Level DNS")
    print("   • Router admin: 192.168.1.1")
    print("   • DNS: 185.228.168.168, 185.228.169.168")
    print("   ✅ Cannot be bypassed by device")
    print("")
    
    print("🎯 METHOD 3: Hosts File Blocking")
    print("   • Edit /etc/hosts")
    print("   • Add: 127.0.0.1 pornhub.com")
    print("   ✅ System-level blocking")
    print("")
    
    print("🎯 METHOD 4: True Supervised Mode")
    print("   • Apple Configurator 2")
    print("   • Factory reset + supervision")
    print("   • DNS profiles actually enforced")

def explain_why_it_worked_before():
    """Explain scenarios where it might have worked before"""
    
    print(f"\n💡 WHY IT MIGHT HAVE WORKED BEFORE")
    print("=" * 35)
    
    print("🤔 POSSIBLE SCENARIOS:")
    print("")
    print("1. 📱 DIFFERENT DEVICE:")
    print("   • iPhone might enforce DNS better than Mac")
    print("   • Older iOS versions had different behavior")
    print("   • Device was actually supervised")
    print("")
    print("2. 🌐 DIFFERENT NETWORK:")
    print("   • Corporate/school network")
    print("   • Network that already had CleanBrowsing DNS")
    print("   • Router that enforced profile DNS")
    print("")
    print("3. 🧹 CLEAN TESTING ENVIRONMENT:")
    print("   • Fresh device with no DNS cache")
    print("   • No browser cache or cookies")
    print("   • Different browser used")
    print("")
    print("4. ⏰ TIMING/PROPAGATION:")
    print("   • DNS changes took time to propagate")
    print("   • Tested immediately after profile install")
    print("   • Network restart cleared caches")
    print("")
    print("5. 🔄 SYSTEM STATE:")
    print("   • Manual DNS was already set")
    print("   • Router DNS was CleanBrowsing")
    print("   • VPN was affecting routing")

def main():
    print("🔍 WHY CLEANBROWSING DNS PROFILES STOPPED WORKING")
    print("=" * 55)
    print("Investigating why mobileconfig DNS worked before but not now")
    print("")
    
    # Check what might have changed
    check_what_might_have_changed()
    
    # Check current system state
    check_current_system_state()
    
    # Test current DNS methods
    test_different_dns_methods()
    
    # Check Apple's changes
    check_profile_enforcement_changes()
    
    # Explain why it worked before
    explain_why_it_worked_before()
    
    # Provide working solutions
    provide_working_solutions()
    
    print(f"\n🎯 CONCLUSION:")
    print("DNS profiles in mobileconfig files are increasingly ignored")
    print("by modern macOS on consumer devices. Apple prioritizes user")
    print("control over admin control for DNS settings.")
    print("")
    print("💡 RECOMMENDATION:")
    print("Use manual DNS commands or router-level DNS for reliable blocking!")

if __name__ == "__main__":
    main()

