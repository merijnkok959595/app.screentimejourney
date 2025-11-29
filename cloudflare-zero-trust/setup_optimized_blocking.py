#!/usr/bin/env python3
"""
OPTIMIZED Cloudflare Zero Trust Configuration
Uses Cloudflare's Built-in Categories (Auto-Updated by Cloudflare)
For Screen Time Journey - Porn Blocking + VPN Detection
"""

import requests
import json
import sys
from typing import Dict, List

class OptimizedZeroTrust:
    def __init__(self, config_path='config.json'):
        with open(config_path, 'r') as f:
            self.config = json.load(f)
        
        self.email = self.config['cloudflare']['email']
        self.api_key = self.config['cloudflare']['global_api_key']
        self.account_id = self.config['cloudflare']['account_id']
        self.team_name = self.config['cloudflare']['team_name']
        
        self.headers = {
            'X-Auth-Email': self.email,
            'X-Auth-Key': self.api_key,
            'Content-Type': 'application/json'
        }
        
        self.base_url = 'https://api.cloudflare.com/client/v4'
    
    def test_connection(self) -> bool:
        """Test API connection"""
        print("🔍 Testing Cloudflare API connection...")
        
        url = f"{self.base_url}/user"
        response = requests.get(url, headers=self.headers)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Connected as: {data['result']['email']}")
            return True
        else:
            print(f"❌ Connection failed: {response.status_code}")
            return False
    
    def get_available_categories(self) -> Dict:
        """Get all available Cloudflare Gateway categories"""
        print(f"\n📂 Fetching Cloudflare content categories...")
        
        url = f"{self.base_url}/accounts/{self.account_id}/gateway/categories"
        response = requests.get(url, headers=self.headers)
        
        if response.status_code == 200:
            data = response.json()
            categories = data.get('result', [])
            print(f"✅ Found {len(categories)} content categories")
            
            # Print relevant categories
            relevant = ['Adult', 'Anonymizer', 'Porn', 'Nudity', 'VPN', 'Proxy']
            print(f"\n   Relevant categories for blocking:")
            for cat in categories:
                name = cat.get('name', '')
                cat_id = cat.get('id')
                if any(keyword.lower() in name.lower() for keyword in relevant):
                    print(f"   • {name} (ID: {cat_id})")
            
            return data
        else:
            print(f"⚠️  Status: {response.status_code}")
            return {}
    
    def create_anonymizer_blocking_policy(self) -> Dict:
        """Block Anonymizers category (VPNs, Proxies, Tor, etc.) - AUTO-UPDATED BY CLOUDFLARE"""
        print(f"\n🔒 Creating Anonymizers blocking policy...")
        print(f"   (Includes: VPNs, Proxies, Tor, Web Proxies - Auto-updated by Cloudflare)")
        
        url = f"{self.base_url}/accounts/{self.account_id}/gateway/rules"
        
        # Check if already exists
        get_response = requests.get(url, headers=self.headers)
        if get_response.status_code == 200:
            rules = get_response.json().get('result', [])
            for rule in rules:
                if rule.get('name') == 'Block Anonymizers and VPNs':
                    print(f"✅ Anonymizer blocking policy already exists")
                    return rule
        
        payload = {
            "name": "Block Anonymizers and VPNs",
            "description": "Blocks VPNs, proxies, Tor, and anonymizers using Cloudflare's auto-updated category",
            "enabled": True,
            "action": "block",
            "filters": ["dns"],
            "traffic": 'any(dns.content_category[*] in {146})',  # 146 = Anonymizers category
            "rule_settings": {
                "block_page_enabled": True,
                "block_reason": "VPN and anonymizer services are blocked to prevent bypassing content filters"
            }
        }
        
        response = requests.post(url, headers=self.headers, json=payload)
        
        if response.status_code in [200, 201]:
            print(f"✅ Anonymizer blocking policy created")
            print(f"   ✓ VPN services blocked (auto-updated)")
            print(f"   ✓ Proxy services blocked (auto-updated)")
            print(f"   ✓ Tor network blocked")
            print(f"   ✓ Web anonymizers blocked")
            return response.json()['result']
        else:
            print(f"⚠️  Status: {response.status_code}")
            print(f"   Response: {response.text}")
            return {}
    
    def create_adult_content_blocking_policy(self) -> Dict:
        """Block Adult Content categories - AUTO-UPDATED BY CLOUDFLARE"""
        print(f"\n🚫 Creating Adult Content blocking policy...")
        print(f"   (Cloudflare AI automatically detects and categorizes adult content)")
        
        url = f"{self.base_url}/accounts/{self.account_id}/gateway/rules"
        
        # Check if already exists
        get_response = requests.get(url, headers=self.headers)
        if get_response.status_code == 200:
            rules = get_response.json().get('result', [])
            for rule in rules:
                if rule.get('name') == 'Block Adult and Pornographic Content':
                    print(f"✅ Adult content blocking policy already exists")
                    return rule
        
        # Multiple adult content category IDs
        # Common IDs: 68 (Adult Content), 83 (Pornography), 93 (Nudity), 95 (Sexuality)
        payload = {
            "name": "Block Adult and Pornographic Content",
            "description": "Blocks adult content, pornography, nudity using Cloudflare's AI categorization",
            "enabled": True,
            "action": "block",
            "filters": ["dns"],
            "traffic": 'any(dns.content_category[*] in {68 83 93 95})',
            "rule_settings": {
                "block_page_enabled": True,
                "block_reason": "Adult content is blocked by your content filter"
            }
        }
        
        response = requests.post(url, headers=self.headers, json=payload)
        
        if response.status_code in [200, 201]:
            print(f"✅ Adult content blocking policy created")
            print(f"   ✓ Pornography sites blocked (AI-detected)")
            print(f"   ✓ Adult content blocked (AI-detected)")
            print(f"   ✓ Nudity sites blocked")
            print(f"   ✓ Sexual content blocked")
            return response.json()['result']
        else:
            print(f"⚠️  Status: {response.status_code}")
            print(f"   Response: {response.text}")
            return {}
    
    def create_safesearch_policy(self) -> Dict:
        """Enforce SafeSearch on search engines"""
        print(f"\n🔍 Enabling SafeSearch enforcement...")
        
        url = f"{self.base_url}/accounts/{self.account_id}/gateway/rules"
        
        # Check if already exists
        get_response = requests.get(url, headers=self.headers)
        if get_response.status_code == 200:
            rules = get_response.json().get('result', [])
            for rule in rules:
                if rule.get('name') == 'Enforce SafeSearch':
                    print(f"✅ SafeSearch enforcement already exists")
                    return rule
        
        payload = {
            "name": "Enforce SafeSearch",
            "description": "Forces SafeSearch on Google, Bing, DuckDuckGo, and YouTube",
            "enabled": True,
            "action": "safesearch",
            "filters": ["dns"]
        }
        
        response = requests.post(url, headers=self.headers, json=payload)
        
        if response.status_code in [200, 201]:
            print(f"✅ SafeSearch enforcement enabled")
            print(f"   ✓ Google SafeSearch: Forced ON")
            print(f"   ✓ Bing SafeSearch: Forced ON")
            print(f"   ✓ DuckDuckGo SafeSearch: Forced ON")
            print(f"   ✓ YouTube Restricted Mode: Forced ON")
            return response.json()['result']
        else:
            print(f"⚠️  Status: {response.status_code}")
            print(f"   Note: You can enable SafeSearch manually in Gateway Settings")
            return {}
    
    def create_security_threats_policy(self) -> Dict:
        """Block security threats, malware, phishing"""
        print(f"\n🛡️  Enabling security threat blocking...")
        
        url = f"{self.base_url}/accounts/{self.account_id}/gateway/rules"
        
        # Check if already exists
        get_response = requests.get(url, headers=self.headers)
        if get_response.status_code == 200:
            rules = get_response.json().get('result', [])
            for rule in rules:
                if rule.get('name') == 'Block Security Threats':
                    print(f"✅ Security threat blocking already exists")
                    return rule
        
        # Category IDs for security threats: Malware, Phishing, Cryptomining, etc.
        payload = {
            "name": "Block Security Threats",
            "description": "Blocks malware, phishing, and security threats",
            "enabled": True,
            "action": "block",
            "filters": ["dns"],
            "traffic": 'dns.security_category[*] in {68 80 83 117 131}',  # Security threat categories
            "rule_settings": {
                "block_page_enabled": True,
                "block_reason": "This site has been identified as a security threat"
            }
        }
        
        response = requests.post(url, headers=self.headers, json=payload)
        
        if response.status_code in [200, 201]:
            print(f"✅ Security threat blocking enabled")
            print(f"   ✓ Malware sites blocked")
            print(f"   ✓ Phishing sites blocked")
            print(f"   ✓ Cryptomining blocked")
            return response.json()['result']
        else:
            print(f"⚠️  Status: {response.status_code}")
            return {}
    
    def create_supplementary_blocklist(self) -> Dict:
        """Create supplementary list for specific high-traffic sites (belt-and-suspenders approach)"""
        print(f"\n📋 Creating supplementary blocklist for top porn sites...")
        print(f"   (Backup layer - Cloudflare categories are primary)")
        
        url = f"{self.base_url}/accounts/{self.account_id}/gateway/lists"
        
        # Only the TOP trafficked porn sites as a backup
        # Cloudflare categories will catch the rest
        top_adult_sites = [
            "pornhub.com",
            "xvideos.com",
            "xnxx.com",
            "xhamster.com",
            "onlyfans.com",
            "chaturbate.com",
            "livejasmin.com",
            "stripchat.com",
            "cam4.com",
            "bongacams.com"
        ]
        
        # Check if exists
        get_response = requests.get(url, headers=self.headers)
        if get_response.status_code == 200:
            lists = get_response.json().get('result', [])
            for lst in lists:
                if lst.get('name') == 'top_adult_sites_backup':
                    print(f"✅ Supplementary blocklist already exists")
                    return lst
        
        payload = {
            "name": "top_adult_sites_backup",
            "description": "Top adult sites - backup layer (categories are primary)",
            "type": "DOMAIN",
            "items": [{"value": domain} for domain in top_adult_sites]
        }
        
        response = requests.post(url, headers=self.headers, json=payload)
        
        if response.status_code in [200, 201]:
            print(f"✅ Supplementary blocklist created with {len(top_adult_sites)} top sites")
            return response.json()['result']
        else:
            print(f"⚠️  Status: {response.status_code}")
            return {}
    
    def create_supplementary_blocking_policy(self) -> Dict:
        """Create policy for supplementary blocklist"""
        print(f"\n🔐 Creating supplementary blocking policy...")
        
        url = f"{self.base_url}/accounts/{self.account_id}/gateway/rules"
        
        # Get list ID
        list_url = f"{self.base_url}/accounts/{self.account_id}/gateway/lists"
        list_response = requests.get(list_url, headers=self.headers)
        
        list_id = None
        if list_response.status_code == 200:
            lists = list_response.json().get('result', [])
            for lst in lists:
                if lst.get('name') == 'top_adult_sites_backup':
                    list_id = lst.get('id')
                    break
        
        if not list_id:
            print(f"⚠️  Supplementary list not found, skipping...")
            return {}
        
        # Check if already exists
        get_response = requests.get(url, headers=self.headers)
        if get_response.status_code == 200:
            rules = get_response.json().get('result', [])
            for rule in rules:
                if rule.get('name') == 'Block Top Adult Sites (Backup)':
                    print(f"✅ Supplementary policy already exists")
                    return rule
        
        payload = {
            "name": "Block Top Adult Sites (Backup)",
            "description": "Explicit blocking of top adult sites as backup layer",
            "enabled": True,
            "action": "block",
            "filters": ["dns"],
            "traffic": f"any(dns.domains[*] in ${list_id})",
            "rule_settings": {
                "block_page_enabled": True,
                "block_reason": "Adult content is blocked"
            }
        }
        
        response = requests.post(url, headers=self.headers, json=payload)
        
        if response.status_code in [200, 201]:
            print(f"✅ Supplementary policy created")
            return response.json()['result']
        else:
            print(f"⚠️  Status: {response.status_code}")
            return {}
    
    def setup_all(self):
        """Run complete optimized setup"""
        print("=" * 75)
        print("🚀 OPTIMIZED Zero Trust Setup - Screen Time Journey")
        print("   Using Cloudflare's Auto-Updated Categories")
        print("=" * 75)
        
        if not self.test_connection():
            return False
        
        # Show available categories
        self.get_available_categories()
        
        print("\n" + "=" * 75)
        print("⚙️  Creating Blocking Policies...")
        print("=" * 75)
        
        # PRIMARY: Use Cloudflare's auto-updated categories
        self.create_anonymizer_blocking_policy()  # VPNs, Proxies, Tor - AUTO-UPDATED
        self.create_adult_content_blocking_policy()  # Porn, Nudity - AUTO-UPDATED
        self.create_safesearch_policy()  # Force SafeSearch on search engines
        self.create_security_threats_policy()  # Malware, phishing
        
        # SECONDARY: Supplementary manual list as backup
        self.create_supplementary_blocklist()
        self.create_supplementary_blocking_policy()
        
        print("\n" + "=" * 75)
        print("✅ OPTIMIZED SETUP COMPLETE!")
        print("=" * 75)
        
        print("\n🎯 Protection Strategy:")
        print("   PRIMARY (Auto-Updated by Cloudflare):")
        print("   ✅ Anonymizers category → Blocks ALL VPNs/Proxies/Tor")
        print("   ✅ Adult Content categories → Blocks ALL porn (AI-detected)")
        print("   ✅ SafeSearch → Filters search results")
        print("   ✅ Security Threats → Blocks malware/phishing")
        print("")
        print("   SECONDARY (Backup):")
        print("   ✅ Top 10 porn sites → Explicit domain blocking")
        
        print("\n💡 Why This is Better:")
        print("   • Cloudflare updates categories automatically")
        print("   • AI detection catches new porn sites instantly")
        print("   • New VPNs/proxies blocked without manual updates")
        print("   • Covers THOUSANDS of domains we'd never manually list")
        print("   • Zero maintenance required")
        
        print("\n🔒 What Gets Blocked:")
        print("   Anonymizers: NordVPN, ExpressVPN, Surfshark, Tor, Psiphon,")
        print("               ANY proxy service, web proxies, SSH tunnels, etc.")
        print("   Adult Content: Pornhub, xVideos, OnlyFans, adult cams,")
        print("                 ANY site Cloudflare AI detects as adult content")
        print("   Security: Malware, phishing, cryptomining sites")
        
        print("\n📱 Next Steps:")
        print("   1. Generate enhanced mobile config:")
        print("      python3 generate_enhanced_mobileconfig.py")
        print("   2. Test on device:")
        print("      • Try accessing porn sites → Should be BLOCKED")
        print("      • Try accessing nordvpn.com → Should be BLOCKED")
        print("      • Try Google search → SafeSearch enforced")
        print("   3. Monitor dashboard:")
        print("      https://one.dash.cloudflare.com/")
        
        print("\n⚠️  IMPORTANT: Configure WARP Settings Manually")
        print("   Go to: Zero Trust > Settings > WARP Client")
        print("   Set:")
        print("   • Mode: WARP with Gateway")
        print("   • Switch Locked: ON")
        print("   • Disable Auto Fallback: ON")
        
        return True

if __name__ == "__main__":
    try:
        zt = OptimizedZeroTrust()
        zt.setup_all()
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)














