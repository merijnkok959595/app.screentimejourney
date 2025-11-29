#!/usr/bin/env python3

import requests
from base64 import b64encode
import json

# SimpleMDM API Configuration  
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"

def test_different_api_versions():
    """Test different API versions and base URLs"""
    
    print("🔍 TESTING DIFFERENT SIMPLEMDM API VERSIONS")
    print("=" * 50)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Different base URLs to try
    base_urls = [
        "https://a.simplemdm.com/api/v1",
        "https://a.simplemdm.com/api/v2", 
        "https://a.simplemdm.com/api",
        "https://api.simplemdm.com/v1",
        "https://api.simplemdm.com/v2",
        "https://api.simplemdm.com"
    ]
    
    test_data = {"label": "Test Enrollment"}
    
    for base_url in base_urls:
        print(f"\n🌐 Testing: {base_url}")
        
        # Test enrollment_sessions endpoint
        try:
            response = requests.post(f"{base_url}/enrollment_sessions", 
                                   headers=headers, json=test_data, timeout=5)
            
            if response.status_code != 404:
                print(f"   ✅ /enrollment_sessions: {response.status_code}")
                if response.status_code == 422:
                    print(f"      Validation error - endpoint exists!")
                    print(f"      Response: {response.text[:200]}...")
                elif response.status_code in [200, 201]:
                    print(f"      SUCCESS! Response: {response.text[:200]}...")
            else:
                print(f"   ❌ /enrollment_sessions: 404")
                
        except Exception as e:
            print(f"   💥 /enrollment_sessions: {str(e)[:50]}...")
        
        # Also test if account endpoint works with this base URL
        try:
            account_response = requests.get(f"{base_url}/account", headers=headers, timeout=5)
            if account_response.status_code == 200:
                print(f"   ✅ Account endpoint works - this is valid base URL")
            else:
                print(f"   ❌ Account endpoint: {account_response.status_code}")
        except:
            print(f"   💥 Account endpoint failed")

def check_account_capabilities():
    """Check account capabilities and permissions"""
    
    print(f"\n🔐 CHECKING ACCOUNT CAPABILITIES")
    print("=" * 35)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    base_url = "https://a.simplemdm.com/api/v1"
    
    # Check account details for enrollment capabilities
    try:
        response = requests.get(f"{base_url}/account", headers=headers)
        
        if response.status_code == 200:
            account_data = response.json()
            print("✅ Account details:")
            
            if 'data' in account_data and 'attributes' in account_data['data']:
                attrs = account_data['data']['attributes']
                
                relevant_fields = [
                    'name', 'plan', 'device_limit', 'enrollment_limit',
                    'api_access', 'permissions', 'features', 'capabilities'
                ]
                
                for field in relevant_fields:
                    if field in attrs:
                        print(f"   {field}: {attrs[field]}")
                
                # Look for enrollment-related permissions
                print(f"\n🔍 Looking for enrollment capabilities...")
                full_response = json.dumps(account_data, indent=2)
                
                enrollment_keywords = ['enrollment', 'enroll', 'session', 'onboard']
                found_enrollment_refs = []
                
                for keyword in enrollment_keywords:
                    if keyword.lower() in full_response.lower():
                        found_enrollment_refs.append(keyword)
                
                if found_enrollment_refs:
                    print(f"   Found enrollment references: {found_enrollment_refs}")
                else:
                    print(f"   No enrollment references found in account data")
            
        else:
            print(f"❌ Account check failed: {response.status_code}")
            
    except Exception as e:
        print(f"💥 Account check error: {e}")

def test_enrollment_via_different_methods():
    """Test enrollment creation via different API patterns"""
    
    print(f"\n🧪 TESTING DIFFERENT ENROLLMENT PATTERNS")
    print("=" * 40)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    base_url = "https://a.simplemdm.com/api/v1"
    
    # Pattern 1: Direct enrollment creation
    patterns = [
        ("POST", "/enrollment_sessions", {"label": "Test User"}),
        ("POST", "/enrollments", {"name": "Test Enrollment"}),
        ("POST", "/enrollments/create", {"name": "Test Enrollment"}),
        ("POST", "/enrollment_tokens", {"label": "Test Token"}),
        ("POST", "/onetime_enrollment", {"name": "Test Onetime"}),
    ]
    
    for method, endpoint, data in patterns:
        try:
            if method == "POST":
                response = requests.post(f"{base_url}{endpoint}", 
                                       headers=headers, json=data, timeout=5)
            else:
                response = requests.get(f"{base_url}{endpoint}", headers=headers, timeout=5)
            
            if response.status_code != 404:
                print(f"✅ {method} {endpoint}: {response.status_code}")
                if response.status_code == 422:
                    print(f"   Validation error (endpoint exists)")
                    print(f"   Response: {response.text[:300]}...")
                elif response.status_code in [200, 201]:
                    print(f"   SUCCESS!")
                    print(f"   Response: {response.text[:300]}...")
                else:
                    print(f"   Unexpected response: {response.text[:200]}...")
            else:
                print(f"❌ {method} {endpoint}: 404")
                
        except Exception as e:
            print(f"💥 {method} {endpoint}: {str(e)[:50]}...")

def analyze_documentation_mismatch():
    """Analyze why the documentation might not match our API"""
    
    print(f"\n📚 DOCUMENTATION MISMATCH ANALYSIS")
    print("=" * 40)
    
    print("🤔 POSSIBLE REASONS FOR 404 RESPONSES:")
    print("")
    print("1. 🏢 ENTERPRISE-ONLY FEATURE:")
    print("   • enrollment_sessions might be premium/enterprise only")
    print("   • Our account might be on basic/standard plan")
    print("   • Need to upgrade account for enrollment creation")
    print("")
    
    print("2. 📅 API VERSION MISMATCH:")
    print("   • Documentation might be for newer API version")
    print("   • Our API key might be on older version")
    print("   • Feature might be in beta/preview")
    print("")
    
    print("3. 🔐 PERMISSION ISSUES:")
    print("   • API key might not have enrollment creation permissions")
    print("   • Need different API key with admin privileges")
    print("   • Account setup might be incomplete")
    print("")
    
    print("4. 📖 DOCUMENTATION FROM DIFFERENT PRODUCT:")
    print("   • Might be from Jamf Pro documentation")
    print("   • Could be from Microsoft Intune")
    print("   • Possibly from custom MDM solution")
    print("")
    
    print("💡 NEXT STEPS:")
    print("• ✅ Contact SimpleMDM support directly")
    print("• ✅ Check if account needs upgrade for enrollment features")
    print("• ✅ Verify API key permissions")
    print("• ✅ Look for alternative SimpleMDM enrollment methods")
    print("• ✅ Fall back to our proven hybrid system if needed")

def main():
    print("🔍 SIMPLEMDM API VERSION & CAPABILITY INVESTIGATION")
    print("=" * 60)
    print("Investigating why enrollment_sessions endpoint returns 404")
    print("")
    
    test_different_api_versions()
    check_account_capabilities()
    test_enrollment_via_different_methods()
    analyze_documentation_mismatch()
    
    print(f"\n🎯 CONCLUSION")
    print("=" * 15)
    print("📊 Results will show if:")
    print("• Different API version has enrollment_sessions")
    print("• Account has necessary permissions")  
    print("• Alternative enrollment endpoints exist")
    print("• We need to contact SimpleMDM support")
    print("")
    print("🔄 FALLBACK PLAN:")
    print("If no enrollment creation API exists, our hybrid")
    print("pre-created system is still a solid solution!")

if __name__ == "__main__":
    main()

