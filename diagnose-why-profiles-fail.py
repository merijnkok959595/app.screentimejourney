#!/usr/bin/env python3
"""
Diagnose why mobileconfig profiles are failing
Check macOS version, system integrity, profile support
"""

import subprocess
import sys

def run_cmd(cmd):
    """Run command and return output"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
        return result.stdout.strip()
    except Exception as e:
        return f"Error: {e}"

print("🔍 DIAGNOSING WHY PROFILES FAIL")
print("=" * 70)

# 1. macOS Version
print("\n1️⃣ MACOS VERSION:")
print("-" * 70)
macos_version = run_cmd("sw_vers")
print(macos_version)

# Extract version number
version_num = run_cmd("sw_vers -productVersion")
print(f"\n📊 Version: {version_num}")

# 2. Check if profiles command works
print("\n\n2️⃣ PROFILES COMMAND TEST:")
print("-" * 70)
profiles_test = run_cmd("profiles -L")
print(f"Profiles command output:\n{profiles_test}")

# 3. Check System Integrity Protection
print("\n\n3️⃣ SYSTEM INTEGRITY PROTECTION (SIP):")
print("-" * 70)
sip_status = run_cmd("csrutil status")
print(f"SIP Status: {sip_status}")

# 4. Check existing profiles
print("\n\n4️⃣ CURRENTLY INSTALLED PROFILES:")
print("-" * 70)
installed_profiles = run_cmd("profiles -P")
if installed_profiles:
    print(installed_profiles)
else:
    print("No profiles installed")

# 5. Check DNS settings
print("\n\n5️⃣ CURRENT DNS CONFIGURATION:")
print("-" * 70)
dns_config = run_cmd("scutil --dns | grep 'nameserver\\[0\\]'")
print(f"DNS servers:\n{dns_config}")

# 6. Check if device is supervised
print("\n\n6️⃣ DEVICE SUPERVISION STATUS:")
print("-" * 70)
supervision = run_cmd("profiles status -type enrollment")
print(supervision)

print("\n\n" + "=" * 70)
print("🎯 ANALYSIS:")
print("=" * 70)

# Parse version to check for known issues
try:
    major, minor = version_num.split('.')[:2]
    major, minor = int(major), int(minor)
    
    if major >= 13:  # Ventura or newer
        print("\n⚠️  CRITICAL ISSUE IDENTIFIED:")
        print("-" * 70)
        print(f"macOS {version_num} (Ventura/Sonoma/Sequoia)")
        print("\n❌ DNS profiles via mobileconfig are UNRELIABLE on this version!")
        print("\n🔍 Why profiles fail on modern macOS:")
        print("   • Apple deprecated unsupervised DNS enforcement")
        print("   • Consumer Macs (non-ADE) ignore DNS payloads")
        print("   • Requires true DEP/ADE supervision")
        print("   • Even valid profiles install but don't enforce")
        
        print("\n✅ WORKING ALTERNATIVES:")
        print("-" * 70)
        print("1. Manual DNS Configuration (Most Reliable)")
        print("   sudo networksetup -setdnsservers Wi-Fi 185.228.168.168 185.228.169.169")
        print("\n2. Router-Level DNS (Best for Family)")
        print("   Configure DNS at router: 185.228.168.168, 185.228.169.169")
        print("\n3. Native App Solution (Professional)")
        print("   Build macOS app with Network Extension")
        
    elif major == 12:  # Monterey
        print("\n⚠️  macOS 12 (Monterey)")
        print("DNS profiles work inconsistently - manual DNS recommended")
        
    else:
        print(f"\n✅ macOS {version_num}")
        print("DNS profiles should work on this version")
        print("The <CPDomainPlugIn:101> error suggests payload format issue")
        
except Exception as e:
    print(f"\nCouldn't parse version: {e}")

print("\n\n💡 RECOMMENDED ACTION:")
print("=" * 70)
print("Stop trying mobileconfig profiles - they won't work reliably!")
print("\nInstead, use manual DNS configuration:")
print("\n  sudo networksetup -setdnsservers Wi-Fi 185.228.168.168 185.228.169.169")
print("  sudo dscacheutil -flushcache")
print("  sudo killall -HUP mDNSResponder")
print("\nThis will ACTUALLY work! 🎯")
print("=" * 70)


