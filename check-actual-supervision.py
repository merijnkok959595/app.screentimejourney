#!/usr/bin/env python3

import subprocess
import json

def check_device_supervision_directly():
    """Check supervision status directly on the device"""
    
    print("🔍 CHECKING ACTUAL DEVICE SUPERVISION STATUS")
    print("=" * 50)
    
    print("📋 MULTIPLE WAYS TO CHECK SUPERVISION:")
    print("")
    
    # Method 1: Profiles command
    print("🎯 METHOD 1: Check via profiles command")
    print("Run this command in Terminal:")
    print("   sudo profiles show -type enrollment")
    print("")
    
    try:
        result = subprocess.run(['profiles', 'show', '-type', 'enrollment'], 
                              capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            output = result.stdout
            
            print("✅ Profiles command output:")
            print("=" * 30)
            print(output)
            
            # Check for supervision indicators
            if 'Supervised: Yes' in output or 'IsSupervised = 1' in output:
                print("✅ DEVICE IS SUPERVISED (via profiles command)")
                supervised_profiles = True
            else:
                print("❌ DEVICE NOT SUPERVISED (via profiles command)")
                supervised_profiles = False
                
        else:
            print(f"❌ Profiles command failed: {result.stderr}")
            supervised_profiles = None
            
    except Exception as e:
        print(f"💥 Error running profiles command: {e}")
        supervised_profiles = None
    
    # Method 2: System Information
    print(f"\n🎯 METHOD 2: Check System Information")
    print("1. 🍎 Apple Menu > About This Mac > System Report")
    print("2. 📱 Look under 'Software' > 'Configuration Profiles'")
    print("3. 👀 Check if any profile shows 'Supervised: Yes'")
    print("")
    
    # Method 3: System Preferences
    print(f"🎯 METHOD 3: Check System Preferences")
    print("1. ⚙️ System Preferences > Profiles")
    print("2. 👀 Look at installed profiles")
    print("3. 📄 Click on any profile to see details")
    print("4. 🔍 Look for supervision indicators")
    print("")
    
    return supervised_profiles

def check_profile_installation_issues():
    """Check for specific profile installation issues"""
    
    print(f"\n🔧 CHECKING PROFILE INSTALLATION ISSUES")
    print("=" * 45)
    
    print("📋 COMMON ISSUES THAT PREVENT ENFORCEMENT:")
    print("")
    
    print("1. 🔄 PROFILE CONFLICTS")
    print("   • Multiple profiles with conflicting settings")
    print("   • Solution: Remove conflicting profiles")
    print("")
    
    print("2. 📱 PAYLOAD FORMAT ERRORS")
    print("   • iOS vs macOS payload differences")
    print("   • Malformed XML in profile")
    print("   • Solution: Use correct format for macOS")
    print("")
    
    print("3. 🌐 DNS ENFORCEMENT ISSUES")
    print("   • DNS profile installed but not enforced")
    print("   • System still using default DNS")
    print("   • Solution: Manual DNS override or restart")
    print("")
    
    print("4. 🛡️ MISSING ENTITLEMENTS")
    print("   • Web filter needs filtering app")
    print("   • DNS proxy needs system extension")
    print("   • Solution: Use built-in filters only")

def test_current_dns_settings():
    """Test what DNS settings are actually active"""
    
    print(f"\n🌐 TESTING CURRENT DNS SETTINGS")
    print("=" * 35)
    
    try:
        # Check current DNS configuration
        result = subprocess.run(['scutil', '--dns'], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            dns_output = result.stdout
            
            # Check for CleanBrowsing DNS
            if '185.228.168.168' in dns_output:
                print("✅ CleanBrowsing DNS found in system configuration!")
                dns_configured = True
            else:
                print("❌ CleanBrowsing DNS NOT found in system configuration")
                dns_configured = False
            
            # Show current nameservers
            lines = dns_output.split('\n')
            print(f"\n📋 Current DNS servers:")
            for line in lines:
                if 'nameserver' in line and not line.strip().startswith('#'):
                    print(f"   {line.strip()}")
            
            return dns_configured
            
    except Exception as e:
        print(f"💥 Error checking DNS: {e}")
        return False

def provide_enforcement_diagnosis():
    """Diagnose why enforcement isn't working"""
    
    print(f"\n🕵️ ENFORCEMENT DIAGNOSIS")
    print("=" * 25)
    
    print("🤔 IF DEVICE SHOWS AS SUPERVISED BUT ENFORCEMENT FAILS:")
    print("")
    
    print("✅ LIKELY CAUSES:")
    print("1. 🔄 Profile format issues (iOS vs macOS)")
    print("2. 🌐 DNS not actually enforced by system")  
    print("3. 📱 Browser bypassing system DNS")
    print("4. 🛡️ Web filter payload not working")
    print("5. ⏱️ Profile changes need restart to activate")
    print("")
    
    print("🛠️ QUICK FIXES TO TRY:")
    print("1. 🔄 Restart MacBook (forces profile activation)")
    print("2. 🌐 Manual DNS override (networksetup command)")
    print("3. 📱 Test in different browsers")
    print("4. 🔧 Clear all DNS caches")
    print("5. 🗑️ Remove conflicting profiles")

def provide_manual_dns_enforcement():
    """Provide manual DNS enforcement as immediate fix"""
    
    print(f"\n🚀 IMMEDIATE FIX: MANUAL DNS ENFORCEMENT")
    print("=" * 45)
    
    print("💪 FORCE CLEANBROWSING DNS RIGHT NOW:")
    print("")
    print("📋 Run these Terminal commands:")
    print("")
    
    commands = [
        "sudo networksetup -setdnsservers Wi-Fi 185.228.168.168 185.228.169.168",
        "sudo dscacheutil -flushcache", 
        "sudo killall -HUP mDNSResponder"
    ]
    
    for i, cmd in enumerate(commands, 1):
        print(f"{i}. {cmd}")
    
    print(f"\n🧪 THEN TEST:")
    print("• dig pornhub.com (should resolve to block page)")
    print("• Visit pornhub.com (should be blocked)")
    print("• Google search 'porn' (should be safe results)")
    
    print(f"\n✅ THIS BYPASSES ALL PROFILE ISSUES!")
    print("Manual DNS will work regardless of supervision/profile problems")

def main():
    print("🔍 ACTUAL DEVICE SUPERVISION CHECK")
    print("=" * 40)
    print("API says supervised=True, but let's check reality...")
    print("")
    
    # Check supervision directly on device
    supervised = check_device_supervision_directly()
    
    # Check DNS settings
    dns_working = test_current_dns_settings()
    
    # Provide diagnosis
    provide_enforcement_diagnosis()
    
    # Check for profile issues
    check_profile_installation_issues()
    
    # Immediate manual fix
    provide_manual_dns_enforcement()
    
    print(f"\n📊 SUMMARY:")
    print("=" * 15)
    
    if supervised is True:
        print("✅ Device appears supervised")
        if dns_working:
            print("✅ DNS configured correctly")
            print("🤔 Issue might be browser cache or profile conflicts")
        else:
            print("❌ DNS not configured - profile not enforced")
            print("💡 Use manual DNS enforcement commands above")
    elif supervised is False:
        print("❌ Device NOT actually supervised")  
        print("🤔 SimpleMDM API wrong - device needs supervision")
    else:
        print("❓ Cannot determine supervision status")
        print("💡 Try manual DNS enforcement as immediate fix")
    
    print(f"\n🎯 IMMEDIATE ACTION:")
    print("Run the 3 DNS enforcement commands above!")
    print("That will force CleanBrowsing regardless of profile issues!")

if __name__ == "__main__":
    main()

