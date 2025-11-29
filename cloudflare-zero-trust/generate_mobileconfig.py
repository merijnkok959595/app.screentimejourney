#!/usr/bin/env python3
"""
Generate iOS Mobile Configuration Profile for Cloudflare WARP
with Zero Trust enrollment and VPN blocking
"""

import json
import uuid
import plistlib
from datetime import datetime

def generate_mobileconfig():
    """Generate .mobileconfig file for iOS WARP enrollment"""
    
    with open('config.json', 'r') as f:
        config = json.load(f)
    
    team_name = config['cloudflare']['team_name']
    
    # Generate unique identifiers
    profile_uuid = str(uuid.uuid4()).upper()
    warp_uuid = str(uuid.uuid4()).upper()
    
    # Create the mobile config profile
    profile = {
        'PayloadContent': [
            {
                'PayloadDescription': 'Configures Cloudflare WARP VPN',
                'PayloadDisplayName': 'Screen Time Journey - WARP Configuration',
                'PayloadIdentifier': f'com.screentimejourney.warp.{warp_uuid}',
                'PayloadType': 'com.cloudflare.warp',
                'PayloadUUID': warp_uuid,
                'PayloadVersion': 1,
                'Organization': team_name,
                'AutoConnect': 2,  # Always on
                'SwitchLocked': True,  # Prevent user from disabling
                'ServiceMode': 'warp',  # Full VPN mode (not just DNS)
                'DisableAutoFallback': True,  # Don't fall back if WARP fails
                'SupportURL': 'https://screentimejourney.com/support',
                'EnableDNSFiltering': True,
                'EnableFirewallFiltering': True,
            }
        ],
        'PayloadDescription': 'This profile enables Cloudflare WARP for Screen Time Journey with VPN detection and blocking.',
        'PayloadDisplayName': 'Screen Time Journey Protection',
        'PayloadIdentifier': f'com.screentimejourney.profile.{profile_uuid}',
        'PayloadOrganization': 'Screen Time Journey',
        'PayloadRemovalDisallowed': True,  # Make it harder to remove
        'PayloadType': 'Configuration',
        'PayloadUUID': profile_uuid,
        'PayloadVersion': 1,
        'PayloadScope': 'User'
    }
    
    # Write to .mobileconfig file
    filename = f'ScreenTimeJourney_WARP_{datetime.now().strftime("%Y%m%d")}.mobileconfig'
    
    with open(filename, 'wb') as f:
        plistlib.dump(profile, f)
    
    print("=" * 60)
    print("📱 iOS Mobile Configuration Profile Generated")
    print("=" * 60)
    print(f"\n✅ File created: {filename}")
    print(f"   Profile ID: {profile_uuid}")
    print(f"   Organization: {team_name}")
    print("\n📋 Profile Features:")
    print("   ✓ Always-on WARP connection")
    print("   ✓ Locked (user cannot disable)")
    print("   ✓ Full VPN mode (not DNS-only)")
    print("   ✓ No auto-fallback to unprotected mode")
    print("   ✓ DNS filtering enabled")
    print("   ✓ Firewall filtering enabled")
    print("\n🚀 Deployment Instructions:")
    print("   1. Email the .mobileconfig file to test device")
    print("   2. Open file on iOS device")
    print("   3. Go to Settings > Profile Downloaded")
    print("   4. Tap 'Install' and enter passcode")
    print("   5. Download Cloudflare WARP app from App Store")
    print("   6. Open WARP and sign in with Zero Trust")
    print(f"   7. Use organization: {team_name}")
    print("\n⚠️  IMPORTANT:")
    print("   - This profile prevents disabling WARP")
    print("   - Removal requires MDM or manual profile removal")
    print("   - Test thoroughly before production deployment")
    
    # Also generate a signed version info
    with open(f'{filename}.info.txt', 'w') as f:
        f.write(f"""Screen Time Journey - WARP Configuration Profile
Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

Profile UUID: {profile_uuid}
WARP Payload UUID: {warp_uuid}
Organization: {team_name}

CONFIGURATION:
- Mode: Always-On WARP
- Switch Locked: Yes (user cannot disable)
- Service Mode: Full WARP VPN
- Auto-Fallback: Disabled
- DNS Filtering: Enabled
- Firewall Filtering: Enabled
- Profile Removal: Restricted

DEPLOYMENT:
1. Transfer this .mobileconfig file to target iOS device
2. Install via Settings > Profile Downloaded
3. Install Cloudflare WARP from App Store
4. Authenticate with: {team_name}.cloudflareaccess.com

VPN DETECTION:
This configuration works with Zero Trust Gateway policies to:
- Block DNS queries to known VPN services
- Detect VPN applications running on device
- Require WARP connection for all traffic
- Prevent bypass attempts

TESTING VPN BLOCKING:
1. Install profile on test device
2. Try to install/run VPN apps (NordVPN, ExpressVPN, etc.)
3. Check WARP logs for blocked connections
4. Verify DNS queries to VPN domains are blocked
5. Confirm device cannot access services without WARP

For support: https://screentimejourney.com/support
""")
    
    print(f"\n📄 Info file created: {filename}.info.txt")
    print("\n" + "=" * 60)

if __name__ == "__main__":
    try:
        generate_mobileconfig()
    except FileNotFoundError:
        print("❌ Error: config.json not found")
    except Exception as e:
        print(f"❌ Error: {str(e)}")














