#!/usr/bin/env python3

import requests
from base64 import b64encode
import json

# SimpleMDM API Configuration  
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def check_device_profile_status():
    """Check if the profile is now assigned to the device"""
    
    print("📊 CHECKING DEVICE PROFILE STATUS")
    print("=" * 35)
    
    device_id = 2126389
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    try:
        # Get device details
        response = requests.get(f"{BASE_URL}/devices/{device_id}", headers=headers)
        
        if response.status_code == 200:
            device = response.json()['data']
            attrs = device['attributes']
            
            print(f"📱 Device: {attrs.get('name')}")
            print(f"   Status: {attrs.get('status')}")
            print(f"   Last seen: {attrs.get('last_seen_at')}")
            print(f"   Supervised: {attrs.get('is_supervised', 'Unknown')}")
            
        else:
            print(f"❌ Failed to get device: {response.status_code}")
            
    except Exception as e:
        print(f"💥 Error: {e}")

def test_dns_resolution():
    """Test if CleanBrowsing DNS is working"""
    
    print(f"\n🌐 TESTING DNS RESOLUTION")
    print("=" * 25)
    
    print("🧪 Testing DNS servers...")
    
    # Test if we can resolve CleanBrowsing servers
    import socket
    
    cleanbrowsing_servers = ["185.228.168.168", "185.228.169.168"]
    
    for server in cleanbrowsing_servers:
        try:
            # Simple connectivity test
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(3)
            result = sock.connect_ex((server, 53))  # DNS port
            sock.close()
            
            if result == 0:
                print(f"✅ {server} - Reachable")
            else:
                print(f"❌ {server} - Not reachable")
                
        except Exception as e:
            print(f"❌ {server} - Error: {e}")

def provide_testing_instructions():
    """Provide instructions for testing content blocking"""
    
    print(f"\n🧪 TESTING INSTRUCTIONS")
    print("=" * 25)
    
    print("📋 ON YOUR MACBOOK, TRY THESE TESTS:")
    print("")
    
    print("1. 🚫 ADULT CONTENT BLOCKING:")
    print("   • pornhub.com → Should be blocked")
    print("   • xvideos.com → Should be blocked") 
    print("   • redtube.com → Should be blocked")
    print("")
    
    print("2. 🔍 SAFE SEARCH:")
    print("   • Google search 'porn' → Safe results only")
    print("   • Bing search 'adult content' → Filtered")
    print("")
    
    print("3. 📱 SOCIAL MEDIA (if configured):")
    print("   • facebook.com → May be blocked")
    print("   • instagram.com → May be blocked")
    print("   • tiktok.com → May be blocked")
    print("")
    
    print("⚠️ TROUBLESHOOTING IF NOT WORKING:")
    print("• ⏱️ Wait 5-10 minutes (DNS changes take time)")
    print("• 🔄 Clear DNS cache: sudo dscacheutil -flushcache")
    print("• 🌐 Try different browser (Chrome, Firefox)")
    print("• 🔄 Restart browser completely")
    print("• 📊 Check System Preferences > Profiles")
    print("")
    
    print("🔍 CHECK IF PROFILE INSTALLED:")
    print("• System Preferences > Profiles")
    print("• Look for 'ScreenTime Journey - Enhanced MDM Protection'")
    print("• Should show DNS and Web Content Filter settings")

def manual_assignment_instructions():
    """Provide manual assignment instructions"""
    
    print(f"\n🛠️ IF STILL NOT WORKING - MANUAL ASSIGNMENT:")
    print("=" * 50)
    
    print("Go to SimpleMDM Dashboard:")
    print("1. 🌐 https://a.simplemdm.com")
    print("2. 📱 Go to Devices")
    print("3. 🔍 Find 'ScreenTime-Test-145420'")
    print("4. 📋 Click on the device")
    print("5. ➕ Click 'Assign Profile' or 'Configurations'")
    print("6. ✅ Select 'ScreenTime Journey - Enhanced MDM Protection'")
    print("7. 📤 Click 'Assign' or 'Push'")
    print("8. ⏱️ Wait 2-3 minutes")
    print("9. 🧪 Test content blocking")

def check_profile_updated():
    """Check if the profile was successfully updated with payloads"""
    
    print(f"\n📦 CHECKING UPDATED PROFILE")
    print("=" * 30)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Try to get profile info via different endpoint
    endpoints_to_try = [
        f"/custom_configuration_profiles",
        f"/configuration_profiles"
    ]
    
    for endpoint in endpoints_to_try:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
            
            print(f"📡 GET {endpoint}: {response.status_code}")
            
            if response.status_code == 200:
                profiles = response.json()['data']
                
                for profile in profiles:
                    if profile['id'] == 214139:
                        attrs = profile['attributes']
                        payloads = attrs.get('payloads', [])
                        
                        print(f"✅ Found profile 214139:")
                        print(f"   Name: {attrs.get('name')}")
                        print(f"   Payloads: {len(payloads)}")
                        
                        if payloads:
                            print(f"   🎯 Profile now has content!")
                            for i, payload in enumerate(payloads):
                                payload_type = payload.get('PayloadType', 'Unknown')
                                print(f"      {i+1}. {payload_type}")
                        else:
                            print(f"   ❌ Profile still empty")
                        
                        return len(payloads) > 0
                        
        except Exception as e:
            print(f"Error with {endpoint}: {e}")
    
    return False

def main():
    print("🔍 CHECKING IF CONTENT BLOCKING IS NOW WORKING")
    print("=" * 50)
    
    # Check device status
    check_device_profile_status()
    
    # Check if profile was updated
    profile_has_content = check_profile_updated()
    
    if profile_has_content:
        print(f"\n✅ Profile successfully updated with parental controls!")
    else:
        print(f"\n❌ Profile update may have failed")
    
    # DNS test
    test_dns_resolution()
    
    # Testing instructions
    provide_testing_instructions()
    
    # Manual fallback
    manual_assignment_instructions()
    
    print(f"\n🎯 NEXT STEPS:")
    print("1. 🧪 Test pornhub.com on your MacBook")
    print("2. 📊 Check System Preferences > Profiles")
    print("3. 🔄 If not working, wait 5 minutes and try again")
    print("4. 🛠️ If still not working, use manual assignment")

if __name__ == "__main__":
    main()

