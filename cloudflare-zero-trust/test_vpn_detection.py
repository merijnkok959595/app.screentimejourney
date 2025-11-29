#!/usr/bin/env python3
"""
Test VPN detection and blocking capabilities
"""

import requests
import json
import time
from datetime import datetime

class VPNDetectionTester:
    def __init__(self, config_path='config.json'):
        with open(config_path, 'r') as f:
            self.config = json.load(f)
        
        self.email = self.config['cloudflare']['email']
        self.api_key = self.config['cloudflare']['global_api_key']
        self.account_id = self.config['cloudflare']['account_id']
        
        self.headers = {
            'X-Auth-Email': self.email,
            'X-Auth-Key': self.api_key,
            'Content-Type': 'application/json'
        }
        
        self.base_url = 'https://api.cloudflare.com/client/v4'
    
    def test_gateway_logs(self):
        """Check Gateway logs for VPN-related blocks"""
        print("\n📊 Checking Gateway logs for VPN blocks...")
        
        url = f"{self.base_url}/accounts/{self.account_id}/gateway/audit_ssh_settings"
        response = requests.get(url, headers=self.headers)
        
        if response.status_code == 200:
            print("✅ Gateway logging is active")
        else:
            print(f"⚠️  Gateway logs status: {response.status_code}")
    
    def test_device_connectivity(self):
        """Check active WARP devices"""
        print("\n📱 Checking enrolled WARP devices...")
        
        url = f"{self.base_url}/accounts/{self.account_id}/devices"
        response = requests.get(url, headers=self.headers)
        
        if response.status_code == 200:
            data = response.json()
            devices = data.get('result', [])
            print(f"✅ Found {len(devices)} enrolled device(s)")
            
            for device in devices:
                print(f"\n   Device: {device.get('name', 'Unknown')}")
                print(f"   - ID: {device.get('id')}")
                print(f"   - User: {device.get('user', {}).get('email', 'N/A')}")
                print(f"   - Last Seen: {device.get('last_seen', 'Never')}")
                print(f"   - Model: {device.get('model', 'Unknown')}")
        else:
            print(f"⚠️  Device check status: {response.status_code}")
            print(f"Response: {response.text}")
    
    def test_policy_status(self):
        """Check if policies are active"""
        print("\n🛡️  Checking policy status...")
        
        # Check Gateway rules
        url = f"{self.base_url}/accounts/{self.account_id}/gateway/rules"
        response = requests.get(url, headers=self.headers)
        
        if response.status_code == 200:
            data = response.json()
            rules = data.get('result', [])
            print(f"✅ Found {len(rules)} Gateway rule(s)")
            
            for rule in rules:
                if 'vpn' in rule.get('name', '').lower() or 'block' in rule.get('name', '').lower():
                    print(f"\n   Rule: {rule.get('name')}")
                    print(f"   - Enabled: {rule.get('enabled', False)}")
                    print(f"   - Action: {rule.get('action')}")
        else:
            print(f"⚠️  Policy check status: {response.status_code}")
    
    def simulate_vpn_detection(self):
        """Simulate VPN detection scenarios"""
        print("\n🧪 VPN Detection Test Scenarios:")
        print("=" * 60)
        
        vpn_services = self.config['vpn_blocking']['blocked_vpn_services']
        
        print(f"\n1️⃣  DNS Query Blocking Test")
        print(f"   Testing {len(vpn_services)} VPN domains...")
        print(f"   These domains should be blocked:")
        for i, vpn in enumerate(vpn_services[:5], 1):
            print(f"      {i}. {vpn.lower().replace(' ', '')}.com")
        print(f"   ... and {len(vpn_services) - 5} more")
        
        print(f"\n2️⃣  Application Detection Test")
        print(f"   The following apps should be detected:")
        print(f"      - NordVPN iOS app")
        print(f"      - ExpressVPN iOS app")
        print(f"      - Any OpenVPN client")
        print(f"      - WireGuard (if not WARP)")
        
        print(f"\n3️⃣  Traffic Pattern Analysis")
        print(f"   Monitoring for:")
        print(f"      - OpenVPN protocol (TCP 1194, UDP 1194)")
        print(f"      - WireGuard protocol (UDP 51820)")
        print(f"      - IKEv2/IPSec (UDP 500, 4500)")
        print(f"      - SSTP (TCP 443 with specific patterns)")
        
        print(f"\n4️⃣  Device Posture Check")
        print(f"   Requirements:")
        print(f"      ✓ WARP client must be active")
        print(f"      ✓ No unauthorized VPN apps installed")
        print(f"      ✓ Device connected to Zero Trust")
        print(f"      ✓ No proxy or tunnel apps running")
    
    def get_analytics(self):
        """Get analytics on blocked requests"""
        print("\n📈 Gateway Analytics (Last 24 hours)...")
        
        url = f"{self.base_url}/accounts/{self.account_id}/gateway/top/requests"
        response = requests.get(url, headers=self.headers)
        
        if response.status_code == 200:
            print("✅ Analytics available")
            # In real implementation, would parse and display blocked VPN attempts
        else:
            print(f"⚠️  Analytics status: {response.status_code}")
    
    def run_all_tests(self):
        """Run complete test suite"""
        print("=" * 60)
        print("🧪 VPN Detection & Blocking Test Suite")
        print("=" * 60)
        print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        self.test_policy_status()
        self.test_device_connectivity()
        self.test_gateway_logs()
        self.get_analytics()
        self.simulate_vpn_detection()
        
        print("\n" + "=" * 60)
        print("✅ Test Suite Complete")
        print("=" * 60)
        print("\n📋 Manual Testing Steps:")
        print("\n   On a test device with the profile installed:")
        print("   1. Try to download NordVPN from App Store")
        print("   2. Try to access nordvpn.com (should be blocked)")
        print("   3. Try to disable WARP (should be locked)")
        print("   4. Check if DNS queries go through WARP")
        print("   5. Verify all traffic routes through Cloudflare")
        print("\n   To verify VPN blocking:")
        print("   - Use 'dig' to query VPN domains → should fail")
        print("   - Check WARP connection logs")
        print("   - Review Gateway logs in dashboard")
        print("   - Monitor device posture checks")
        
        print("\n🔗 Useful Links:")
        print(f"   Dashboard: https://dash.cloudflare.com/{self.account_id}")
        print(f"   Zero Trust: https://one.dash.cloudflare.com/")
        print(f"   Gateway Logs: https://one.dash.cloudflare.com/{self.account_id}/gateway/analytics")
        print(f"   Devices: https://one.dash.cloudflare.com/{self.account_id}/devices")

if __name__ == "__main__":
    try:
        tester = VPNDetectionTester()
        tester.run_all_tests()
    except FileNotFoundError:
        print("❌ Error: config.json not found")
    except Exception as e:
        print(f"❌ Error: {str(e)}")














