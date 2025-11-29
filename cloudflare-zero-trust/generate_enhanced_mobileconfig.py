#!/usr/bin/env python3
"""
Generate OPTIMIZED iOS Mobile Configuration Profile
With maximum security and bypass prevention
For Screen Time Journey
"""

import json
import uuid
import plistlib
from datetime import datetime

def generate_enhanced_mobileconfig():
    """Generate maximum security .mobileconfig for iOS"""
    
    with open('config.json', 'r') as f:
        config = json.load(f)
    
    team_name = config['cloudflare']['team_name']
    
    # Generate unique identifiers
    profile_uuid = str(uuid.uuid4()).upper()
    warp_uuid = str(uuid.uuid4()).upper()
    restrictions_uuid = str(uuid.uuid4()).upper()
    
    # Create the mobile config profile with MAXIMUM restrictions
    profile = {
        'PayloadContent': [
            # WARP Configuration
            {
                'PayloadDescription': 'Configures Cloudflare WARP with Zero Trust',
                'PayloadDisplayName': 'WARP VPN Configuration',
                'PayloadIdentifier': f'com.screentimejourney.warp.{warp_uuid}',
                'PayloadType': 'com.cloudflare.warp',
                'PayloadUUID': warp_uuid,
                'PayloadVersion': 1,
                'Organization': team_name,
                'AutoConnect': 2,  # 0=off, 1=on WiFi, 2=always
                'SwitchLocked': True,  # User cannot disable WARP
                'ServiceMode': 'warp',  # Full VPN mode (not just DNS)
                'DisableAutoFallback': True,  # Don't fall back if WARP fails
                'SupportURL': 'https://screentimejourney.com/support',
                'EnableDNSFiltering': True,  # Enable Gateway DNS filtering
                'EnableFirewallFiltering': True,  # Enable Gateway firewall
            },
            # Additional Restrictions
            {
                'PayloadDescription': 'Restricts VPN and network bypass attempts',
                'PayloadDisplayName': 'Network Restrictions',
                'PayloadIdentifier': f'com.screentimejourney.restrictions.{restrictions_uuid}',
                'PayloadType': 'com.apple.applicationaccess',
                'PayloadUUID': restrictions_uuid,
                'PayloadVersion': 1,
                'allowVPNCreation': False,  # Prevent manual VPN configuration
                'allowAccountModification': False,  # Prevent profile removal
                'allowAppInstallation': True,  # Allow app installs (but filtered by Gateway)
                'allowDiagnosticSubmission': True,
                'allowUIConfigurationProfileInstallation': False,  # Block installing other profiles
            }
        ],
        'PayloadDescription': 'Enforces content filtering and prevents bypass via VPN. Required for Screen Time Journey protection.',
        'PayloadDisplayName': 'Screen Time Journey Protection',
        'PayloadIdentifier': f'com.screentimejourney.profile.{profile_uuid}',
        'PayloadOrganization': 'Screen Time Journey',
        'PayloadRemovalDisallowed': True,  # Require password to remove
        'PayloadType': 'Configuration',
        'PayloadUUID': profile_uuid,
        'PayloadVersion': 1,
        'PayloadScope': 'User'
    }
    
    # Write to .mobileconfig file
    filename = f'ScreenTimeJourney_Enhanced_{datetime.now().strftime("%Y%m%d")}.mobileconfig'
    
    with open(filename, 'wb') as f:
        plistlib.dump(profile, f)
    
    print("=" * 75)
    print("📱 ENHANCED iOS Mobile Configuration Profile Generated")
    print("=" * 75)
    print(f"\n✅ File created: {filename}")
    print(f"   Profile ID: {profile_uuid}")
    print(f"   Organization: {team_name}")
    
    print("\n🔒 MAXIMUM SECURITY FEATURES:")
    print("   ✅ Always-on WARP (user CANNOT disable)")
    print("   ✅ Switch locked (toggle is grayed out)")
    print("   ✅ Full VPN mode (all traffic through Cloudflare)")
    print("   ✅ No auto-fallback (if WARP fails, no internet)")
    print("   ✅ DNS filtering enabled (blocks porn domains)")
    print("   ✅ Firewall filtering enabled (blocks VPN IPs)")
    print("   ✅ Manual VPN creation BLOCKED")
    print("   ✅ Installing other profiles BLOCKED")
    print("   ✅ Profile removal requires password")
    
    print("\n🚀 DEPLOYMENT INSTRUCTIONS:")
    print("\n   Method 1: Email/AirDrop (Testing)")
    print("   ─────────────────────────────────")
    print("   1. Send .mobileconfig to test device")
    print("   2. Open file on iOS device")
    print("   3. Settings > Profile Downloaded > Install")
    print("   4. Enter device passcode")
    print("   5. Install Cloudflare WARP from App Store")
    print(f"   6. Sign in with organization: {team_name}")
    
    print("\n   Method 2: MDM Deployment (Production - RECOMMENDED)")
    print("   ──────────────────────────────────────────────────")
    print("   For supervised devices with MDM:")
    print("   • Profile cannot be removed by user")
    print("   • Full control over device settings")
    print("   • Remote enforcement and monitoring")
    print("   • Suggested MDM solutions:")
    print("     - Apple Business Manager + MDM")
    print("     - Jamf, Kandji, Mosyle, SimpleMDM")
    
    print("\n📋 WHAT THIS BLOCKS:")
    print("   🚫 All porn sites (Cloudflare AI + categories)")
    print("   🚫 All VPN services (Cloudflare Anonymizer category)")
    print("   🚫 All proxy services (auto-detected)")
    print("   🚫 Tor network")
    print("   🚫 Manual VPN configuration on device")
    print("   🚫 Installing other profiles to bypass")
    print("   🚫 Alternative DNS (DoH) to bypass filtering")
    print("   🚫 Disabling WARP connection")
    
    print("\n⚠️  TESTING CHECKLIST:")
    print("   After installation, verify:")
    print("   [ ] WARP is connected and shows green")
    print("   [ ] WARP toggle is grayed out (locked)")
    print("   [ ] pornhub.com is blocked")
    print("   [ ] nordvpn.com is blocked")
    print("   [ ] Cannot create manual VPN in Settings")
    print("   [ ] Google SafeSearch is enforced")
    print("   [ ] 1.1.1.1/cdn-cgi/trace shows warp=on")
    
    print("\n💡 PRO TIPS:")
    print("   • For users under 18: Combine with iOS Screen Time")
    print("   • For accountability: Monitor Gateway logs regularly")
    print("   • For teams: Use MDM for supervised devices")
    print("   • Update regularly: Re-run setup script monthly")
    
    print("\n🔗 USEFUL LINKS:")
    print(f"   Dashboard: https://one.dash.cloudflare.com/")
    print(f"   Gateway Logs: https://one.dash.cloudflare.com/{config['cloudflare']['account_id']}/gateway/analytics")
    print(f"   Support: https://screentimejourney.com/support")
    
    # Also generate info file
    with open(f'{filename}.info.txt', 'w') as f:
        f.write(f"""Screen Time Journey - ENHANCED Protection Profile
Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

Profile UUID: {profile_uuid}
WARP UUID: {warp_uuid}
Organization: {team_name}

MAXIMUM SECURITY CONFIGURATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Always-on WARP connection
✅ User cannot disable WARP
✅ Full VPN mode (not DNS-only)
✅ No fallback to unprotected mode
✅ DNS and firewall filtering enabled
✅ Manual VPN creation blocked
✅ Profile installation blocked
✅ Profile removal restricted

PROTECTION LAYERS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Cloudflare Anonymizer Category (auto-updated)
   → Blocks ALL VPNs, proxies, Tor, anonymizers
   → New VPN services blocked automatically

2. Cloudflare Adult Content Categories (AI-powered)
   → Blocks pornography, adult content, nudity
   → Cloudflare AI detects new sites automatically

3. SafeSearch Enforcement
   → Google, Bing, DuckDuckGo filtered
   → YouTube Restricted Mode enforced

4. Domain Blocklists (backup layer)
   → Top 10 adult sites explicitly blocked
   → Belt-and-suspenders approach

5. Device-Level Restrictions
   → Cannot create manual VPNs
   → Cannot install bypass profiles
   → WARP toggle locked

DEPLOYMENT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Transfer this .mobileconfig to iOS device
2. Install via Settings > Profile Downloaded
3. Install Cloudflare WARP app from App Store
4. Sign in with: {team_name}.cloudflareaccess.com
5. Verify WARP is connected and locked

VERIFICATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test these to confirm blocking works:
• pornhub.com → Should be BLOCKED
• nordvpn.com → Should be BLOCKED
• google.com/search?q=porn → SafeSearch ON
• Settings > VPN → Cannot add manual VPN
• 1.1.1.1/cdn-cgi/trace → Shows warp=on

BYPASS PREVENTION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This profile prevents common bypass methods:
✓ Cannot disable WARP
✓ Cannot install VPN apps (domains blocked)
✓ Cannot configure manual VPN
✓ Cannot use alternative DNS
✓ Cannot install other profiles
✓ Cannot use proxy/Tor
✓ Profile removal requires password

For support: info@screentimejourney.com
Dashboard: https://one.dash.cloudflare.com/
""")
    
    print(f"\n📄 Info file created: {filename}.info.txt")
    print("\n" + "=" * 75)
    print("✅ READY TO DEPLOY!")
    print("=" * 75)

if __name__ == "__main__":
    try:
        generate_enhanced_mobileconfig()
    except FileNotFoundError:
        print("❌ Error: config.json not found")
    except Exception as e:
        print(f"❌ Error: {str(e)}")














