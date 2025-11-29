#!/usr/bin/env python3

import subprocess
import socket
import time

def clear_all_dns_caches():
    """Clear all possible DNS caches"""
    
    print("🧹 CLEARING ALL DNS CACHES")
    print("=" * 30)
    
    commands = [
        # macOS DNS cache clearing
        ["sudo", "dscacheutil", "-flushcache"],
        ["sudo", "killall", "-HUP", "mDNSResponder"],
        ["sudo", "killall", "mDNSResponderHelper"],
        ["sudo", "dscacheutil", "-flushcache"],
        
        # Network interface restart
        ["sudo", "ifconfig", "en0", "down"],
        ["sudo", "ifconfig", "en0", "up"],
        
        # Additional cache clearing
        ["sudo", "discoveryutil", "mdnsflushcache"],
        ["sudo", "discoveryutil", "udnsflushcaches"],
    ]
    
    print("🔧 DNS CACHE CLEARING COMMANDS:")
    print("Run these commands in Terminal:")
    print("")
    
    for i, cmd in enumerate(commands, 1):
        cmd_str = " ".join(cmd)
        print(f"{i}. {cmd_str}")
    
    print(f"\n💡 OR run this one-liner:")
    one_liner = " && ".join([" ".join(cmd) for cmd in commands[:4]])
    print(f"{one_liner}")

def test_dns_resolution():
    """Test DNS resolution to see what's actually happening"""
    
    print(f"\n🔍 TESTING DNS RESOLUTION")
    print("=" * 30)
    
    test_domains = [
        'pornhub.com',
        'google.com',
        'apple.com'
    ]
    
    for domain in test_domains:
        try:
            print(f"\n🧪 Testing {domain}:")
            
            # Test with nslookup
            result = subprocess.run(['nslookup', domain], capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                output = result.stdout
                print("📡 nslookup result:")
                
                # Extract server and IP
                lines = output.split('\n')
                for line in lines:
                    if 'Server:' in line:
                        server = line.replace('Server:', '').strip()
                        print(f"   DNS Server: {server}")
                        
                        if server in ['185.228.168.168', '185.228.169.168']:
                            print("   ✅ Using CleanBrowsing DNS!")
                        else:
                            print("   ❌ NOT using CleanBrowsing DNS")
                    
                    if 'Address:' in line and '53' not in line:
                        ip = line.replace('Address:', '').strip()
                        print(f"   Resolves to: {ip}")
                        
                        if domain == 'pornhub.com':
                            if ip.startswith('185.228.'):
                                print("   ✅ BLOCKED by CleanBrowsing!")
                            else:
                                print("   ❌ NOT BLOCKED - resolving normally")
            else:
                print(f"   ❌ nslookup failed: {result.stderr}")
                
        except Exception as e:
            print(f"   💥 Error testing {domain}: {e}")

def check_browser_dns_bypass():
    """Check if browser is bypassing DNS"""
    
    print(f"\n🌐 CHECKING BROWSER DNS BYPASS")
    print("=" * 35)
    
    print("🔍 COMMON DNS BYPASS METHODS:")
    print("")
    print("1. 🔒 DNS over HTTPS (DoH)")
    print("   • Chrome: chrome://settings/security")
    print("   • Firefox: about:preferences#privacy")
    print("   • Safari: No DoH settings (should work)")
    print("")
    
    print("2. 🛡️ DNS over TLS (DoT)")
    print("   • Check System Preferences > Network > Advanced > DNS")
    print("   • Should show CleanBrowsing servers")
    print("")
    
    print("3. 🌍 VPN/Proxy Usage")
    print("   • Check if VPN is active")
    print("   • VPN can bypass DNS filtering")
    print("")
    
    print("4. 📱 Browser Cache")
    print("   • Clear browser cache completely")
    print("   • Try incognito/private mode")

def force_dns_settings():
    """Force DNS settings at system level"""
    
    print(f"\n💪 FORCING DNS SETTINGS")
    print("=" * 25)
    
    print("🔧 MANUAL DNS OVERRIDE:")
    print("Run these commands to force CleanBrowsing DNS:")
    print("")
    
    print("1. Set DNS on WiFi interface:")
    print("   sudo networksetup -setdnsservers Wi-Fi 185.228.168.168 185.228.169.168")
    print("")
    
    print("2. Set DNS on Ethernet interface:")
    print("   sudo networksetup -setdnsservers Ethernet 185.228.168.168 185.228.169.168")
    print("")
    
    print("3. Clear all caches:")
    print("   sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder")
    print("")
    
    print("4. Restart network:")
    print("   sudo ifconfig en0 down && sudo ifconfig en0 up")

def check_profile_installation():
    """Check if profile is actually installed and working"""
    
    print(f"\n📋 CHECKING PROFILE INSTALLATION")
    print("=" * 35)
    
    print("🔍 VERIFICATION STEPS:")
    print("")
    print("1. 📱 System Preferences > Profiles")
    print("   • Look for 'ScreenTime Journey - PIN Protected'")
    print("   • Should show DNS and Restrictions sections")
    print("")
    
    print("2. 🌐 Network Settings Check")
    print("   • System Preferences > Network")
    print("   • Select your connection > Advanced > DNS")
    print("   • Should show: 185.228.168.168, 185.228.169.168")
    print("")
    
    print("3. 🔒 Restrictions Check")
    print("   • Try changing DNS settings manually")
    print("   • Should require PIN 1234")
    print("")
    
    print("4. 🧪 Terminal DNS Test")
    print("   • Run: dig pornhub.com")
    print("   • Should resolve to CleanBrowsing block page")

def provide_nuclear_options():
    """Provide nuclear options if nothing else works"""
    
    print(f"\n☢️ NUCLEAR OPTIONS (IF NOTHING WORKS)")
    print("=" * 40)
    
    print("🎯 OPTION 1: Router-Level DNS")
    print("• Set router DNS to 185.228.168.168, 185.228.169.168")
    print("• Blocks ALL devices on network")
    print("• Cannot be bypassed by device settings")
    print("")
    
    print("🎯 OPTION 2: Hosts File Blocking")
    print("• Edit /etc/hosts file")
    print("• Add: 127.0.0.1 pornhub.com")
    print("• Blocks at system level")
    print("")
    
    print("🎯 OPTION 3: Supervised Mode Required")
    print("• Use Apple Configurator 2")
    print("• Put device in supervised mode")
    print("• Reinstall profile on supervised device")
    print("• DNS enforcement actually works")

def immediate_test_sequence():
    """Provide immediate test sequence"""
    
    print(f"\n⚡ IMMEDIATE FIX SEQUENCE")
    print("=" * 25)
    
    print("🚀 TRY THIS RIGHT NOW (5 minutes):")
    print("")
    print("1. 🧹 Clear DNS cache:")
    print("   sudo dscacheutil -flushcache")
    print("   sudo killall -HUP mDNSResponder")
    print("")
    print("2. 💪 Force CleanBrowsing DNS:")
    print("   sudo networksetup -setdnsservers Wi-Fi 185.228.168.168 185.228.169.168")
    print("")
    print("3. 🔄 Restart network:")
    print("   sudo ifconfig en0 down && sudo ifconfig en0 up")
    print("")
    print("4. 🌐 Close ALL browsers")
    print("")
    print("5. ⏰ Wait 2 minutes")
    print("")
    print("6. 🧪 Test pornhub.com in Safari")
    print("")
    print("7. 📱 If still not blocked → Router DNS method")

def main():
    print("🚨 FIXING PORNHUB STILL ACCESSIBLE ISSUE")
    print("=" * 45)
    print("DNS caching and browser bypass are likely culprits!")
    print("")
    
    # Immediate test sequence
    immediate_test_sequence()
    
    # Clear DNS caches
    clear_all_dns_caches()
    
    # Test current DNS resolution
    test_dns_resolution()
    
    # Check browser bypass
    check_browser_dns_bypass()
    
    # Force DNS settings
    force_dns_settings()
    
    # Check profile installation
    check_profile_installation()
    
    # Nuclear options
    provide_nuclear_options()
    
    print(f"\n🎯 MOST LIKELY CAUSES:")
    print("1. 🧹 DNS cache not cleared (run cache clear commands)")
    print("2. 🌐 Browser using DNS over HTTPS (disable in browser)")
    print("3. 📋 Profile not actually enforcing DNS (need supervised mode)")
    print("4. 🛡️ VPN/proxy bypassing DNS (disable VPN)")
    print("5. 🔄 Network settings not refreshed (restart network)")
    
    print(f"\n💡 QUICK FIX:")
    print("Run the immediate fix sequence above!")
    print("99% chance it's DNS caching or browser bypass.")

if __name__ == "__main__":
    main()

