#!/usr/bin/env python3
"""
Check if DNS is actually being used or if there's a leak/bypass
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

print("🔍 CHECKING WHY PORNHUB STILL WORKS")
print("=" * 70)

# 1. Check what DNS is actually configured
print("\n1️⃣ CONFIGURED DNS SERVERS:")
print("-" * 70)
dns_config = run_cmd("networksetup -getdnsservers Wi-Fi")
print(f"Wi-Fi DNS: {dns_config}")

# 2. Check what DNS is actually being used
print("\n2️⃣ ACTIVE DNS SERVERS (from scutil):")
print("-" * 70)
scutil_dns = run_cmd("scutil --dns | grep 'nameserver\\[0\\]'")
print(scutil_dns)

# 3. Check DNS resolution for pornhub.com
print("\n3️⃣ DNS LOOKUP FOR pornhub.com:")
print("-" * 70)
dig_result = run_cmd("dig pornhub.com +short")
print(f"Resolved IP: {dig_result}")

dig_server = run_cmd("dig pornhub.com | grep 'SERVER:'")
print(f"DNS Server used: {dig_server}")

# 4. Check if DNS over HTTPS is enabled in Safari
print("\n4️⃣ CHECKING FOR DNS BYPASS:")
print("-" * 70)
print("⚠️  Common DNS bypass mechanisms:")
print("   • Safari using iCloud Private Relay")
print("   • Chrome using DNS over HTTPS (DoH)")
print("   • Firefox using DNS over HTTPS (DoH)")
print("   • VPN or proxy enabled")
print("   • Browser cached the old IP address")

# 5. Check for VPN
print("\n5️⃣ CHECKING FOR VPN/PROXY:")
print("-" * 70)
vpn_check = run_cmd("scutil --nc list")
if vpn_check:
    print(f"VPN Status:\n{vpn_check}")
else:
    print("No VPN detected")

# 6. Check network service order
print("\n6️⃣ NETWORK SERVICE ORDER:")
print("-" * 70)
network_services = run_cmd("networksetup -listnetworkserviceorder | head -20")
print(network_services)

print("\n\n" + "=" * 70)
print("🎯 DIAGNOSIS:")
print("=" * 70)

# Analyze results
if "185.228.168.168" in dns_config:
    print("\n✅ DNS is configured correctly")
else:
    print("\n❌ DNS NOT set to CleanBrowsing!")
    print("   Expected: 185.228.168.168")
    print(f"   Got: {dns_config}")

if "185.228.168.168" in scutil_dns:
    print("✅ System is using CleanBrowsing DNS")
elif "100.64.0.2" in scutil_dns or "192.168" in scutil_dns:
    print("❌ System is using ROUTER DNS (not CleanBrowsing!)")
elif "127.0.0.1" in scutil_dns:
    print("❌ System is using LOCALHOST DNS")

if dig_result and dig_result != "0.0.0.0":
    print(f"\n❌ PROBLEM: pornhub.com resolves to real IP: {dig_result}")
    print("   CleanBrowsing should return 0.0.0.0 for blocked sites")
else:
    print("\n✅ pornhub.com is blocked by DNS (returns 0.0.0.0)")

print("\n\n💡 POSSIBLE CAUSES:")
print("=" * 70)

if "185.228.168.168" not in dns_config:
    print("\n❌ DNS not set correctly!")
    print("   Run: sudo networksetup -setdnsservers Wi-Fi 185.228.168.168 185.228.169.169")
elif "185.228.168.168" in dns_config and "185.228.168.168" not in scutil_dns:
    print("\n❌ DNS is configured but not active!")
    print("   Possible causes:")
    print("   • Router DHCP is overriding DNS")
    print("   • VPN is active")
    print("   • Another network service has priority")
    print("\n   Try:")
    print("   1. Disconnect/reconnect Wi-Fi")
    print("   2. Restart Mac")
    print("   3. Configure DNS at router level instead")

if dig_result and dig_result != "0.0.0.0" and dig_result != "":
    print("\n❌ Browser DNS bypass detected!")
    print("   Likely causes:")
    print("   • Safari using iCloud Private Relay (Settings > Apple ID > iCloud > Private Relay)")
    print("   • Chrome using Secure DNS (chrome://settings/security)")
    print("   • Browser cached old DNS entry")
    print("\n   Solutions:")
    print("   1. Disable iCloud Private Relay")
    print("   2. Disable Chrome Secure DNS")
    print("   3. Clear browser cache (Cmd+Shift+Delete)")
    print("   4. Quit and restart browser completely")
    print("   5. Try incognito/private mode")

print("\n\n🚨 IMMEDIATE ACTIONS:")
print("=" * 70)
print("1. Check if iCloud Private Relay is ON (turn it OFF)")
print("2. Quit Safari completely (Cmd+Q)")
print("3. Clear Safari cache: Safari > Settings > Privacy > Manage Website Data > Remove All")
print("4. Restart Safari and try again")
print("\nIf still doesn't work:")
print("5. Try Chrome in Incognito mode")
print("6. Or configure DNS at ROUTER level (more reliable)")
print("=" * 70)

