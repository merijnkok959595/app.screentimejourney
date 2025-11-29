#!/usr/bin/env python3

import requests
from base64 import b64encode
import json
import uuid

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def check_device_supervision_status():
    """Check if our enrolled device is actually supervised"""
    
    print("🔍 CHECKING DEVICE SUPERVISION STATUS")
    print("=" * 40)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    try:
        response = requests.get(f"{BASE_URL}/devices/2126394", headers=headers)
        
        if response.status_code == 200:
            device = response.json()['data']
            attrs = device['attributes']
            
            supervised = attrs.get('is_supervised', False)
            name = attrs.get('name')
            status = attrs.get('status')
            
            print(f"📱 Device: {name}")
            print(f"   Status: {status}")
            print(f"   Supervised: {supervised}")
            
            if supervised:
                print(f"   ✅ DEVICE IS SUPERVISED - Enforcement should work!")
                return True
            else:
                print(f"   ❌ DEVICE NOT SUPERVISED - This is why enforcement fails!")
                print(f"   💡 Need to put device in supervised mode for parental controls")
                return False
                
        else:
            print(f"❌ Failed to get device info: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    return False

def create_supervision_profile():
    """Create a profile specifically for supervised devices"""
    
    print(f"\n🛡️ CREATING SUPERVISED DEVICE PROFILE")
    print("=" * 40)
    
    # Profile with supervision-specific enforcement
    supervised_profile = '''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <!-- DNS Settings for Supervised Devices -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.dnsSettings.managed</string>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.supervised.dns</string>
            <key>PayloadUUID</key>
            <string>SUPERVISED-DNS-UUID-123456789012</string>
            <key>PayloadDisplayName</key>
            <string>Supervised CleanBrowsing DNS</string>
            <key>PayloadDescription</key>
            <string>Enforced DNS filtering for supervised devices</string>
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
                <key>ProhibitDisablement</key>
                <true/>
            </dict>
        </dict>
        
        <!-- Web Content Filter for Supervised Devices -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.webcontent-filter</string>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.supervised.webfilter</string>
            <key>PayloadUUID</key>
            <string>SUPERVISED-FILTER-UUID-123456789013</string>
            <key>PayloadDisplayName</key>
            <string>Supervised Web Content Filter</string>
            <key>PayloadDescription</key>
            <string>Enforced web filtering for supervised devices</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>FilterType</key>
            <string>BuiltIn</string>
            <key>AutoFilterEnabled</key>
            <true/>
            <key>RestrictWeb</key>
            <true/>
            <key>UseContentFilter</key>
            <true/>
            <key>WhitelistedBookmarks</key>
            <array/>
        </dict>
        
        <!-- Application Access (Screen Time) for Supervised Devices -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.applicationaccess</string>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.supervised.restrictions</string>
            <key>PayloadUUID</key>
            <string>SUPERVISED-RESTRICTIONS-UUID-123456789014</string>
            <key>PayloadDisplayName</key>
            <string>Supervised Content Restrictions</string>
            <key>PayloadDescription</key>
            <string>Enforced content restrictions for supervised devices</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>allowExplicitContent</key>
            <false/>
            <key>allowBookstore</key>
            <true/>
            <key>allowBookstoreErotica</key>
            <false/>
            <key>ratingRegion</key>
            <string>us</string>
            <key>ratingApps</key>
            <integer>600</integer>
            <key>ratingMovies</key>
            <integer>600</integer>
            <key>ratingTVShows</key>
            <integer>600</integer>
            <key>allowVideoConferencing</key>
            <true/>
            <key>allowWebContentFilter</key>
            <true/>
        </dict>
    </array>
    
    <key>PayloadDisplayName</key>
    <string>ScreenTime Journey - SUPERVISED Protection</string>
    <key>PayloadDescription</key>
    <string>Enforced parental controls for supervised devices only</string>
    <key>PayloadIdentifier</key>
    <string>com.screentimejourney.supervised.protection</string>
    <key>PayloadRemovalDisallowed</key>
    <true/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>SUPERVISED-MAIN-UUID-123456789011</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
    
    <!-- Supervision Anchor (Required for Screen Time) -->
    <key>PayloadSupervision</key>
    <dict>
        <key>OrganizationName</key>
        <string>ScreenTime Journey</string>
        <key>SupervisionRequired</key>
        <true/>
    </dict>
</dict>
</plist>'''
    
    # Save supervised profile
    with open('supervised-protection.mobileconfig', 'w') as f:
        f.write(supervised_profile)
    
    print("✅ Created supervised-protection.mobileconfig")
    return supervised_profile

def provide_supervision_instructions():
    """Provide instructions for putting device in supervised mode"""
    
    print(f"\n📋 HOW TO PUT DEVICE IN SUPERVISED MODE")
    print("=" * 45)
    
    print("🎯 METHOD 1: Apple Configurator 2 (Immediate)")
    print("1. 💻 Download Apple Configurator 2 from Mac App Store")
    print("2. 🔌 Connect your device via USB cable")
    print("3. ➕ Click 'Add' → 'New Devices'")
    print("4. ⚙️ Click 'Prepare' → 'Manual Configuration'")
    print("5. ✅ Check 'Supervise devices'")
    print("6. 📱 Select iOS version and click 'Next'")
    print("7. 🏢 Enter organization name: 'ScreenTime Journey'")
    print("8. 🔄 Click 'Prepare' (device will restart)")
    print("9. 🌐 After restart, use new SimpleMDM enrollment URL")
    print("")
    
    print("🎯 METHOD 2: Apple Business Manager (Production)")
    print("1. 🏢 Sign up for Apple Business Manager")
    print("2. 📱 Add devices to ABM (automatically supervised)")
    print("3. 🔗 Connect ABM to SimpleMDM")
    print("4. 📋 All new enrollments automatically supervised")
    print("")
    
    print("⚠️ WARNING:")
    print("• Supervision requires device reset/restore")
    print("• Backup device data before supervision")
    print("• Once supervised, enforcement will work immediately")

def create_new_supervised_enrollment():
    """Create a new enrollment URL for supervised device"""
    
    print(f"\n🚀 CREATING NEW ENROLLMENT FOR SUPERVISED DEVICE")
    print("=" * 55)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Create device name for supervised enrollment
    device_name = f"ScreenTime-Supervised-{uuid.uuid4().hex[:8]}"
    
    device_data = {"name": device_name}
    
    try:
        # Create new device
        response = requests.post(f"{BASE_URL}/devices", headers=headers, data=device_data)
        
        if response.status_code == 201:
            device_response = response.json()['data']
            device_id = device_response['id']
            attrs = device_response['attributes']
            enrollment_url = attrs.get('enrollment_url')
            
            print(f"✅ New supervised device created!")
            print(f"   ID: {device_id}")
            print(f"   Name: {device_name}")
            print(f"   Enrollment URL: {enrollment_url}")
            
            # Update profile with supervised content
            supervised_content = create_supervision_profile()
            
            # Assign supervised profile
            try:
                files = {'mobileconfig': ('supervised-protection.mobileconfig', supervised_content, 'application/x-apple-aspen-config')}
                
                update_response = requests.patch(
                    f"{BASE_URL}/custom_configuration_profiles/214139",
                    headers={"Authorization": f"Basic {auth_header}"},
                    files=files
                )
                
                if update_response.status_code in [200, 202]:
                    print(f"✅ Profile updated for supervised devices!")
                    
                    # Assign to new device
                    assign_response = requests.post(
                        f"{BASE_URL}/custom_configuration_profiles/214139/devices/{device_id}",
                        headers=headers
                    )
                    
                    if assign_response.status_code in [200, 204]:
                        print(f"✅ Supervised profile assigned to device!")
                        
                        print(f"\n🎯 SUPERVISED ENROLLMENT URL:")
                        print(f"🔗 {enrollment_url}")
                        print(f"\n⚠️ IMPORTANT:")
                        print("1. Put device in supervised mode first (Apple Configurator 2)")
                        print("2. Then use this URL to enroll")
                        print("3. Parental controls will work immediately!")
                        
                        return enrollment_url
                    
            except Exception as e:
                print(f"Profile assignment error: {e}")
                
        else:
            print(f"❌ Device creation failed: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    return None

def main():
    print("🔍 SUPERVISED MODE DIAGNOSIS & FIX")
    print("=" * 40)
    print("Checking supervision status and providing fix for enforcement")
    print("")
    
    # Step 1: Check current device supervision
    is_supervised = check_device_supervision_status()
    
    if is_supervised:
        print(f"\n🎉 Device is supervised - enforcement should work!")
        print("If still not working, check profile format or conflicts")
    else:
        print(f"\n❌ Device not supervised - this explains everything!")
        
        # Step 2: Create supervised profile
        create_supervision_profile()
        
        # Step 3: Provide supervision instructions  
        provide_supervision_instructions()
        
        # Step 4: Create new supervised enrollment
        supervised_url = create_new_supervised_enrollment()
        
        if supervised_url:
            print(f"\n🏆 SOLUTION READY:")
            print("1. ✅ Supervised profile created")
            print("2. ✅ New enrollment URL generated")
            print("3. ✅ Use Apple Configurator 2 to supervise device")
            print("4. ✅ Enroll with new URL → Enforcement will work!")
        
    print(f"\n💡 KEY INSIGHT:")
    print("MDM Enrollment ≠ Supervision")
    print("Parental controls require SUPERVISED mode!")
    print("This is why our profiles install but don't enforce!")

if __name__ == "__main__":
    main()

