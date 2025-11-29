#!/usr/bin/env python3

import subprocess
import time
import socket

def clear_all_dns_caches():
    """Clear every possible DNS cache on macOS"""
    
    print("🧹 CLEARING ALL DNS CACHES")
    print("=" * 30)
    
    commands = [
        # Primary DNS cache clearing
        ["sudo", "dscacheutil", "-flushcache"],
        ["sudo", "killall", "-HUP", "mDNSResponder"],
        
        # Additional cache clearing
        ["sudo", "killall", "mDNSResponderHelper"],
        ["sudo", "dscacheutil", "-flushcache"],
        
        # Discovery utility caches (if available)
        ["sudo", "discoveryutil", "mdnsflushcache"],
        ["sudo", "discoveryutil", "udnsflushcaches"],
    ]
    
    print("🔧 Running DNS cache clear commands:")
    
    for cmd in commands:
        try:
            print(f"   Running: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                print(f"   ✅ Success")
            else:
                print(f"   ⚠️ Command may have failed: {result.stderr}")
                
        except subprocess.TimeoutExpired:
            print(f"   ⏰ Command timed out")
        except FileNotFoundError:
            print(f"   ❌ Command not found (may not exist on this macOS version)")
        except Exception as e:
            print(f"   ❌ Error: {e}")

def restart_network_interface():
    """Restart network interface to force DNS refresh"""
    
    print(f"\n🔄 RESTARTING NETWORK INTERFACE")
    print("=" * 35)
    
    interfaces = ['en0', 'en1']  # Common WiFi/Ethernet interfaces
    
    for interface in interfaces:
        try:
            print(f"🌐 Restarting {interface}...")
            
            # Take interface down
            down_cmd = ["sudo", "ifconfig", interface, "down"]
            result = subprocess.run(down_cmd, capture_output=True, text=True, timeout=5)
            
            if result.returncode == 0:
                print(f"   ✅ {interface} down")
                
                # Wait a moment
                time.sleep(2)
                
                # Bring interface up
                up_cmd = ["sudo", "ifconfig", interface, "up"]
                result = subprocess.run(up_cmd, capture_output=True, text=True, timeout=5)
                
                if result.returncode == 0:
                    print(f"   ✅ {interface} up")
                else:
                    print(f"   ❌ Failed to bring {interface} up")
            else:
                print(f"   ⚠️ {interface} may not exist or already down")
                
        except Exception as e:
            print(f"   ❌ Error with {interface}: {e}")

def test_dns_after_cache_clear():
    """Test DNS resolution after cache clearing"""
    
    print(f"\n🧪 TESTING DNS AFTER CACHE CLEAR")
    print("=" * 35)
    
    # Wait for network to stabilize
    print("⏰ Waiting 10 seconds for network to stabilize...")
    time.sleep(10)
    
    test_domains = ['pornhub.com', 'google.com', 'apple.com']
    
    for domain in test_domains:
        try:
            print(f"\n🔍 Testing {domain}:")
            
            # Test with nslookup
            result = subprocess.run(['nslookup', domain], capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                output = result.stdout
                
                # Extract DNS server and IP
                lines = output.split('\n')
                dns_server = None
                resolved_ip = None
                
                for line in lines:
                    if 'Server:' in line:
                        dns_server = line.replace('Server:', '').strip()
                    elif 'Address:' in line and '53' not in line and resolved_ip is None:
                        resolved_ip = line.replace('Address:', '').strip()
                
                print(f"   DNS Server: {dns_server}")
                print(f"   Resolves to: {resolved_ip}")
                
                # Check if using CleanBrowsing
                if dns_server in ['185.228.168.168', '185.228.169.168']:
                    print(f"   🎉 SUCCESS! Using CleanBrowsing DNS!")
                    
                    if domain == 'pornhub.com':
                        if resolved_ip and resolved_ip.startswith('185.228.'):
                            print(f"   🛡️ BLOCKED by CleanBrowsing!")
                        else:
                            print(f"   ⚠️ Using CleanBrowsing DNS but site not blocked")
                else:
                    print(f"   ❌ NOT using CleanBrowsing DNS")
                    
                    if domain == 'pornhub.com':
                        print(f"   ❌ Site NOT BLOCKED - using normal DNS")
                        
            else:
                print(f"   ❌ nslookup failed: {result.stderr}")
                
        except Exception as e:
            print(f"   💥 Error testing {domain}: {e}")

def test_with_dig():
    """Test with dig command for more detailed DNS info"""
    
    print(f"\n🔬 DETAILED DNS TEST WITH DIG")
    print("=" * 30)
    
    try:
        result = subprocess.run(['dig', 'pornhub.com'], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            output = result.stdout
            print("📡 dig pornhub.com result:")
            
            # Look for key information
            lines = output.split('\n')
            for line in lines:
                if 'SERVER:' in line:
                    print(f"   DNS Server: {line.strip()}")
                elif 'IN A' in line and 'pornhub.com' in line:
                    print(f"   Resolution: {line.strip()}")
                    
                    # Check if blocked
                    if '185.228.' in line:
                        print(f"   🛡️ BLOCKED by CleanBrowsing!")
                    else:
                        print(f"   ❌ NOT BLOCKED")
        else:
            print("❌ dig command failed")
            
    except FileNotFoundError:
        print("⚠️ dig command not available")
    except Exception as e:
        print(f"❌ dig test error: {e}")

def check_current_profile_status():
    """Check if profiles are actually installed"""
    
    print(f"\n📋 CHECKING PROFILE STATUS")
    print("=" * 25)
    
    try:
        # Check installed profiles
        result = subprocess.run(['profiles', '-P'], capture_output=True, text=True, timeout=5)
        
        if result.returncode == 0:
            profiles_output = result.stdout
            
            if 'ScreenTime' in profiles_output or 'PIN' in profiles_output:
                print("✅ ScreenTime profile found!")
                
                # Look for DNS configuration
                if 'dnsSettings' in profiles_output or 'DNS' in profiles_output:
                    print("✅ DNS settings found in profile")
                else:
                    print("⚠️ No DNS settings visible in profile")
            else:
                print("❌ No ScreenTime profiles found")
                print("🤔 Profile may not be installed or visible")
        else:
            print("⚠️ Cannot check profiles (may need different permissions)")
            
    except Exception as e:
        print(f"❌ Profile check error: {e}")

def main():
    print("🧹 COMPLETE DNS CACHE CLEAR & TEST")
    print("=" * 40)
    print("Clearing all caches and testing CleanBrowsing DNS")
    print("")
    
    # Step 1: Check profile status first
    check_current_profile_status()
    
    # Step 2: Clear all DNS caches
    clear_all_dns_caches()
    
    # Step 3: Restart network interface
    restart_network_interface()
    
    # Step 4: Test DNS resolution
    test_dns_after_cache_clear()
    
    # Step 5: Detailed dig test
    test_with_dig()
    
    print(f"\n🎯 SUMMARY:")
    print("If CleanBrowsing DNS is working:")
    print("• DNS Server should be 185.228.168.168 or 185.228.169.168")
    print("• pornhub.com should resolve to a block page IP")
    print("• Visiting pornhub.com should show 'Access Denied'")
    print("")
    print("If still not working:")
    print("• Profile DNS enforcement is disabled on this macOS version")
    print("• Manual DNS override needed")
    print("")
    print("🧪 NOW TEST: Try visiting pornhub.com in browser!")

if __name__ == "__main__":
    main()

