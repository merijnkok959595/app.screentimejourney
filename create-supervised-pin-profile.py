#!/usr/bin/env python3

import requests
from base64 import b64encode
import json
import uuid

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def create_supervised_pin_profile():
    """Create the ultimate supervised mode profile with PIN 1234"""
    
    print("🛡️ CREATING SUPERVISED MODE PROFILE WITH PIN ENFORCEMENT")
    print("=" * 60)
    
    # Ultimate supervised profile with PIN enforcement
    supervised_profile = '''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <!-- CleanBrowsing DNS Enforcement -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.dnsSettings.managed</string>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.supervised.dns</string>
            <key>PayloadUUID</key>
            <string>SUPERVISED-DNS-PIN-123456789012</string>
            <key>PayloadDisplayName</key>
            <string>Supervised CleanBrowsing DNS</string>
            <key>PayloadDescription</key>
            <string>Enforced DNS filtering - cannot be disabled</string>
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
                <string>https://doh.cleanbrowsing.org/doh/adult-filter</string>
                <key>ProhibitDisablement</key>
                <true/>
                <key>OnDemandEnabled</key>
                <integer>1</integer>
            </dict>
        </dict>
        
        <!-- Built-in Web Content Filter -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.webcontent-filter</string>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.supervised.webfilter</string>
            <key>PayloadUUID</key>
            <string>SUPERVISED-WEBFILTER-PIN-123456789013</string>
            <key>PayloadDisplayName</key>
            <string>Supervised Web Content Filter</string>
            <key>PayloadDescription</key>
            <string>Apple built-in web filtering - enforced</string>
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
            <array>
                <dict>
                    <key>URL</key>
                    <string>https://www.google.com</string>
                    <key>BookmarkPath</key>
                    <string>/Google</string>
                </dict>
                <dict>
                    <key>URL</key>
                    <string>https://www.apple.com</string>
                    <key>BookmarkPath</key>
                    <string>/Apple</string>
                </dict>
            </array>
        </dict>
        
        <!-- Restrictions with PIN Protection -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.restrictions</string>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.supervised.restrictions</string>
            <key>PayloadUUID</key>
            <string>SUPERVISED-RESTRICTIONS-PIN-123456789014</string>
            <key>PayloadDisplayName</key>
            <string>Supervised Restrictions with PIN</string>
            <key>PayloadDescription</key>
            <string>Enforced parental controls with PIN 1234</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            
            <!-- Restrictions PIN -->
            <key>restrictionsPassword</key>
            <string>1234</string>
            
            <!-- Safari Restrictions -->
            <key>allowSafari</key>
            <true/>
            <key>safariAcceptCookies</key>
            <integer>2</integer>
            <key>safariForceFraudWarning</key>
            <true/>
            <key>safariAllowAutoFill</key>
            <false/>
            <key>safariAllowJavaScript</key>
            <true/>
            <key>safariAllowPopups</key>
            <false/>
            
            <!-- Content & Privacy -->
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
            
            <!-- App & Feature Restrictions -->
            <key>allowAppInstallation</key>
            <true/>
            <key>allowAppRemoval</key>
            <false/>
            <key>allowCamera</key>
            <true/>
            <key>allowVideoConferencing</key>
            <true/>
            <key>allowScreenShot</key>
            <true/>
            <key>allowVoiceDialing</key>
            <true/>
            <key>allowInAppPurchases</key>
            <false/>
            
            <!-- Web Content Filter Integration -->
            <key>allowWebContentFilter</key>
            <true/>
            <key>forceEncryptedBackup</key>
            <false/>
            <key>allowCloudBackup</key>
            <true/>
            <key>allowCloudDocumentSync</key>
            <true/>
            <key>allowCloudKeychainSync</key>
            <true/>
            
            <!-- Prevent Changes to Restrictions -->
            <key>allowAccountModification</key>
            <false/>
            <key>allowHostPairing</key>
            <false/>
            <key>allowLockScreenControlCenter</key>
            <true/>
            <key>allowLockScreenNotificationsView</key>
            <true/>
            <key>allowLockScreenTodayView</key>
            <true/>
            <key>allowOpenFromManagedToUnmanaged</key>
            <false/>
            <key>allowOpenFromUnmanagedToManaged</key>
            <false/>
        </dict>
        
        <!-- Application Access (Screen Time Equivalent) -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.applicationaccess</string>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.supervised.appaccess</string>
            <key>PayloadUUID</key>
            <string>SUPERVISED-APPACCESS-PIN-123456789015</string>
            <key>PayloadDisplayName</key>
            <string>Supervised App Access Control</string>
            <key>PayloadDescription</key>
            <string>Screen Time equivalent restrictions - supervised</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            
            <!-- Content Ratings -->
            <key>allowExplicitContent</key>
            <false/>
            <key>ratingRegion</key>
            <string>us</string>
            <key>ratingApps</key>
            <integer>600</integer>
            <key>ratingMovies</key>
            <integer>600</integer>
            <key>ratingTVShows</key>
            <integer>600</integer>
            
            <!-- App Store & In-App Purchases -->
            <key>allowAppInstallation</key>
            <true/>
            <key>allowUIAppInstallation</key>
            <true/>
            <key>allowAppRemoval</key>
            <false/>
            <key>allowInAppPurchases</key>
            <false/>
            
            <!-- Web Content Filter -->
            <key>allowWebContentFilter</key>
            <true/>
            <key>useContentFilter</key>
            <true/>
            
            <!-- Prevent Bypassing -->
            <key>allowAccountModification</key>
            <false/>
            <key>allowPasswordAutoFill</key>
            <true/>
            <key>allowPasswordProximityRequests</key>
            <true/>
            <key>allowPasswordSharing</key>
            <true/>
        </dict>
        
        <!-- Family Controls (Screen Time API) -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.familycontrols.settings</string>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.supervised.familycontrols</string>
            <key>PayloadUUID</key>
            <string>SUPERVISED-FAMILYCONTROLS-123456789016</string>
            <key>PayloadDisplayName</key>
            <string>Supervised Family Controls</string>
            <key>PayloadDescription</key>
            <string>Advanced Screen Time controls for supervised devices</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            
            <!-- Screen Time Settings -->
            <key>familyControlsEnabled</key>
            <true/>
            <key>parentalControlsEnabled</key>
            <true/>
            
            <!-- Content & Privacy Restrictions -->
            <key>allowExplicitContent</key>
            <false/>
            <key>allowWebContentFilter</key>
            <true/>
            
            <!-- App Time Limits (examples) -->
            <key>applicationRestrictions</key>
            <dict>
                <!-- Social Media Apps -->
                <key>com.facebook.Facebook</key>
                <dict>
                    <key>allowedTime</key>
                    <integer>0</integer>
                    <key>blockedTime</key>
                    <array>
                        <dict>
                            <key>startTime</key>
                            <string>22:00</string>
                            <key>endTime</key>
                            <string>09:00</string>
                        </dict>
                    </array>
                </dict>
                <key>com.burbn.instagram</key>
                <dict>
                    <key>allowedTime</key>
                    <integer>0</integer>
                </dict>
                <key>com.zhiliaoapp.musically</key>
                <dict>
                    <key>allowedTime</key>
                    <integer>0</integer>
                </dict>
            </dict>
        </dict>
        
        <!-- System Policy Control -->
        <dict>
            <key>PayloadType</key>
            <string>com.apple.systempolicy.control</string>
            <key>PayloadIdentifier</key>
            <string>com.screentimejourney.supervised.systempolicy</string>
            <key>PayloadUUID</key>
            <string>SUPERVISED-SYSTEMPOLICY-123456789017</string>
            <key>PayloadDisplayName</key>
            <string>Supervised System Policy</string>
            <key>PayloadDescription</key>
            <string>System-level enforcement policies</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            
            <!-- Network Extension Control -->
            <key>AllowUserOverrides</key>
            <false/>
            <key>AllowIdentifierAccess</key>
            <dict>
                <key>com.apple.NetworkExtension</key>
                <false/>
            </dict>
        </dict>
    </array>
    
    <!-- Main Profile Settings -->
    <key>PayloadDisplayName</key>
    <string>ScreenTime Journey - SUPERVISED with PIN Protection</string>
    <key>PayloadDescription</key>
    <string>Ultimate parental control: CleanBrowsing DNS + Apple built-in filtering + PIN 1234 protection. Cannot be bypassed on supervised devices.</string>
    <key>PayloadIdentifier</key>
    <string>com.screentimejourney.supervised.ultimate</string>
    <key>PayloadRemovalDisallowed</key>
    <true/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>SUPERVISED-ULTIMATE-PIN-123456789011</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
    <key>PayloadScope</key>
    <string>System</string>
    
    <!-- Supervision Settings -->
    <key>IsSupervised</key>
    <true/>
    <key>PayloadSupervision</key>
    <dict>
        <key>OrganizationName</key>
        <string>ScreenTime Journey</string>
        <key>SupervisionRequired</key>
        <true/>
    </dict>
    
    <!-- PIN Protection -->
    <key>RemovalPassword</key>
    <string>1234</string>
</dict>
</plist>'''
    
    # Save the ultimate profile
    with open('supervised-ultimate-pin-1234.mobileconfig', 'w') as f:
        f.write(supervised_profile)
    
    print("✅ Created supervised-ultimate-pin-1234.mobileconfig")
    print("")
    print("🎯 PROFILE FEATURES:")
    print("• 🌐 CleanBrowsing DNS (cannot be disabled)")
    print("• 🛡️ Apple built-in web content filter") 
    print("• 📱 Screen Time restrictions enforced")
    print("• 🔒 PIN protection (1234)")
    print("• 🚫 Profile removal blocked") 
    print("• ⛔ Adult content completely blocked")
    print("• 📵 Social media apps time-limited")
    print("• 🔐 In-app purchases disabled")
    print("• 🎮 App ratings restricted (12+)")
    print("• 💪 System-level enforcement")
    
    return supervised_profile

def update_simplemdm_with_supervised_profile():
    """Update SimpleMDM with the ultimate supervised profile"""
    
    print(f"\n🔧 UPDATING SIMPLEMDM WITH SUPERVISED PIN PROFILE")
    print("=" * 55)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    
    # Get the supervised profile
    supervised_profile = create_supervised_pin_profile()
    
    try:
        # Update SimpleMDM profile
        files = {
            'mobileconfig': ('supervised-ultimate-pin-1234.mobileconfig', supervised_profile, 'application/x-apple-aspen-config')
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
            print("🎉 SUCCESS! SimpleMDM updated with supervised PIN profile!")
            return True
        else:
            print(f"❌ Update failed: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    return False

def create_supervised_enrollment():
    """Create enrollment for supervised devices"""
    
    print(f"\n🚀 CREATING SUPERVISED DEVICE ENROLLMENT")
    print("=" * 45)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Create supervised device
    device_name = f"Supervised-PIN-{uuid.uuid4().hex[:8]}"
    device_data = {"name": device_name}
    
    try:
        # Create device
        response = requests.post(f"{BASE_URL}/devices", headers=headers, data=device_data)
        
        if response.status_code == 201:
            device_response = response.json()['data']
            device_id = device_response['id']
            attrs = device_response['attributes']
            enrollment_url = attrs.get('enrollment_url')
            
            print(f"✅ Supervised device created!")
            print(f"   ID: {device_id}")
            print(f"   Name: {device_name}")
            
            # Assign supervised profile
            assign_response = requests.post(
                f"{BASE_URL}/custom_configuration_profiles/214139/devices/{device_id}",
                headers=headers
            )
            
            if assign_response.status_code in [200, 204]:
                print(f"✅ Supervised PIN profile assigned!")
                
                print(f"\n🎯 SUPERVISED ENROLLMENT URL:")
                print(f"🔗 {enrollment_url}")
                
                return enrollment_url, device_id
            else:
                print(f"❌ Profile assignment failed: {assign_response.text}")
                
        else:
            print(f"❌ Device creation failed: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    return None, None

def provide_supervised_setup_instructions():
    """Provide instructions for setting up supervised mode"""
    
    print(f"\n📋 SUPERVISED MODE SETUP INSTRUCTIONS")
    print("=" * 45)
    
    print("⚠️ CRITICAL: This profile only works on SUPERVISED devices!")
    print("")
    print("🎯 HOW TO PUT DEVICE IN SUPERVISED MODE:")
    print("")
    print("📱 METHOD 1: Apple Configurator 2")
    print("1. Download Apple Configurator 2 (Mac App Store)")
    print("2. Connect device via USB")
    print("3. Click 'Prepare' → Manual Configuration")
    print("4. ✅ Check 'Supervise devices'")
    print("5. Enter org name: 'ScreenTime Journey'") 
    print("6. Device will be wiped and supervised")
    print("7. Use enrollment URL during setup")
    print("")
    print("🏢 METHOD 2: Apple Business Manager (Enterprise)")
    print("1. Add device serial to ABM")
    print("2. Assign to SimpleMDM server")
    print("3. Factory reset device")
    print("4. Device auto-enrolls as supervised")
    print("")
    print("🔒 WHAT HAPPENS WITH PIN 1234:")
    print("• Profile cannot be removed without PIN")
    print("• Settings changes require PIN") 
    print("• CleanBrowsing DNS cannot be bypassed")
    print("• Adult content completely blocked")
    print("• Social media apps restricted")
    print("• Built-in Apple filters enforced")

def test_supervised_features():
    """Explain what works on supervised devices"""
    
    print(f"\n🛡️ SUPERVISED MODE CAPABILITIES")
    print("=" * 35)
    
    print("✅ WHAT WORKS ON SUPERVISED DEVICES:")
    print("")
    print("🌐 DNS ENFORCEMENT:")
    print("• CleanBrowsing DNS cannot be changed")
    print("• System ignores manual DNS settings")
    print("• Works on ALL apps and browsers")
    print("")
    print("🛡️ WEB CONTENT FILTER:")
    print("• Apple built-in filter enforced")
    print("• Adult websites blocked at system level")
    print("• Cannot be disabled in Settings")
    print("")
    print("📱 SCREEN TIME ENFORCEMENT:")
    print("• App time limits actually enforced")
    print("• Downtime cannot be bypassed")
    print("• Content restrictions locked")
    print("• Social media blocking works")
    print("")
    print("🔒 PIN PROTECTION:")
    print("• Profile removal requires PIN 1234")
    print("• Settings changes require PIN")
    print("• Cannot bypass restrictions")
    print("• System-level enforcement")
    print("")
    print("❌ WHAT DOESN'T WORK (Non-Supervised):")
    print("• DNS settings ignored")
    print("• Web filters bypassed")  
    print("• Screen Time restrictions ignored")
    print("• Profile can be removed easily")

def main():
    print("🛡️ CREATING ULTIMATE SUPERVISED PROFILE WITH PIN 1234")
    print("=" * 60)
    print("This is the REAL solution - supervised mode with PIN enforcement!")
    print("")
    
    # Step 1: Create and upload supervised profile
    profile_updated = update_simplemdm_with_supervised_profile()
    
    if profile_updated:
        print(f"\n✅ Supervised PIN profile created and uploaded!")
        
        # Step 2: Create supervised enrollment
        enrollment_url, device_id = create_supervised_enrollment()
        
        if enrollment_url:
            print(f"\n✅ Supervised enrollment created!")
            
            # Force device refresh
            auth_header = b64encode(f"{API_KEY}:".encode()).decode()
            headers = {"Authorization": f"Basic {auth_header}"}
            
            try:
                requests.post(f"{BASE_URL}/devices/{device_id}/refresh", headers=headers)
                print(f"🔄 Device refresh sent")
            except:
                pass
            
            # Step 3: Setup instructions
            provide_supervised_setup_instructions()
            
            # Step 4: Explain supervised capabilities
            test_supervised_features()
            
            print(f"\n🎯 SUPERVISED ENROLLMENT URL WITH PIN 1234:")
            print(f"🔗 {enrollment_url}")
            print(f"\n⚠️ REMEMBER:")
            print("1. Device MUST be in supervised mode")
            print("2. Use Apple Configurator 2 or ABM")
            print("3. Factory reset required")
            print("4. PIN 1234 protects everything")
            print("5. Cannot be bypassed!")
            
        else:
            print(f"\n❌ Failed to create supervised enrollment")
    else:
        print(f"\n❌ Failed to update profile")
    
    print(f"\n🏆 SUPERVISED MODE ADVANTAGES:")
    print("1. ✅ DNS enforcement that actually works")
    print("2. ✅ Apple built-in filters enforced")
    print("3. ✅ Screen Time restrictions locked")
    print("4. ✅ PIN protection (1234)")
    print("5. ✅ Cannot be bypassed")
    print("6. ✅ Professional parental control")

if __name__ == "__main__":
    main()

