#!/usr/bin/env python3

import requests
from base64 import b64encode
import json

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def comprehensive_api_enrollment_check():
    """Final comprehensive check for ANY way to create enrollments via API"""
    
    print("🔍 FINAL API ENROLLMENT CREATION CHECK")
    print("=" * 50)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    print("📡 Testing ALL possible API endpoints...")
    print("-" * 40)
    
    # All possible enrollment creation endpoints
    enrollment_endpoints = [
        # Standard paths
        'enrollments',
        'enrollment', 
        'enrollments/create',
        'enrollments/new',
        
        # Single-use variants
        'enrollments/onetime',
        'enrollments/temporary',
        'enrollments/single_use',
        'onetime_enrollments',
        'temporary_enrollments',
        'single_use_enrollments',
        
        # Invitation-based
        'invitations',
        'device_invitations',
        'enrollment_invitations',
        'invite',
        
        # Device-specific
        'devices/enroll',
        'device_enrollments',
        'devices/enrollment',
        
        # Alternative names
        'enrollment_urls',
        'enrollment_links',
        'registration',
        'device_registration'
    ]
    
    results = {
        'working': [],
        'not_found': [],
        'other_errors': []
    }
    
    for endpoint in enrollment_endpoints:
        try:
            # Try POST (create)
            response = requests.post(f"{BASE_URL}/{endpoint}", 
                                   headers=headers, 
                                   json={'name': 'Test'}, 
                                   timeout=10)
            
            status = response.status_code
            
            if status == 404:
                results['not_found'].append(endpoint)
                print(f"❌ POST /{endpoint}: 404 (Not Found)")
            elif status in [200, 201]:
                results['working'].append(endpoint)
                print(f"✅ POST /{endpoint}: {status} - WORKING!")
                print(f"   Response: {response.text[:200]}...")
            else:
                results['other_errors'].append((endpoint, status))
                print(f"⚠️ POST /{endpoint}: {status}")
                if status in [400, 422]:  # Validation errors might show required fields
                    print(f"   Response: {response.text[:300]}...")
                    
        except Exception as e:
            print(f"💥 POST /{endpoint}: Error - {str(e)[:50]}...")
    
    return results

def check_webhook_endpoints():
    """Check if we can create webhooks that might trigger enrollment creation"""
    
    print(f"\n📡 WEBHOOK-BASED ENROLLMENT CREATION")
    print("-" * 40)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Check webhook endpoints
    webhook_endpoints = ['webhooks', 'webhook_urls', 'notifications', 'callbacks']
    
    for endpoint in webhook_endpoints:
        response = requests.get(f"{BASE_URL}/{endpoint}", headers=headers)
        print(f"GET /{endpoint}: {response.status_code}")
        
        if response.status_code == 200:
            print(f"   Available webhook options might exist")

def check_admin_api_access():
    """Check if account has admin-level API access"""
    
    print(f"\n🔐 ACCOUNT API ACCESS LEVEL")
    print("-" * 30)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Check account details
    account_response = requests.get(f"{BASE_URL}/account", headers=headers)
    
    if account_response.status_code == 200:
        account_data = account_response.json()
        print("✅ Account API access confirmed")
        
        if 'data' in account_data and 'attributes' in account_data['data']:
            attrs = account_data['data']['attributes']
            
            # Check relevant permissions
            relevant_fields = ['name', 'plan', 'device_limit', 'enrollment_limit']
            print("\n📋 Account details:")
            
            for field in relevant_fields:
                if field in attrs:
                    print(f"   {field}: {attrs[field]}")
        
        # Check if there are any admin-only endpoints
        admin_endpoints = ['admin', 'organization', 'billing', 'settings']
        
        print(f"\n🔧 Admin endpoint access:")
        for endpoint in admin_endpoints:
            response = requests.get(f"{BASE_URL}/{endpoint}", headers=headers)
            status = "✅" if response.status_code == 200 else "❌"
            print(f"   {status} /{endpoint}: {response.status_code}")
    
    else:
        print(f"❌ Account access failed: {account_response.status_code}")

def explain_api_limitations():
    """Explain why SimpleMDM likely doesn't have enrollment creation API"""
    
    print(f"\n💡 WAAROM GEEN ENROLLMENT CREATION API?")
    print("=" * 45)
    
    print(f"🏢 BUSINESS REDENEN:")
    print(f"• 💰 Enrollment URLs zijn SimpleMDM's core product")
    print(f"• 🔐 Security: Voorkomen van bulk/automated misbruik")
    print(f"• 🎛️ Control: SimpleMDM houdt controle over enrollment flow")
    print(f"• 📊 Analytics: Tracking van enrollment performance")
    print(f"")
    
    print(f"🔧 TECHNISCHE REDENEN:")
    print(f"• 🎫 Enrollment URLs bevatten security tokens")
    print(f"• 📱 Device-specific enrollment logic")
    print(f"• 🔒 Apple MDM certificate integration")
    print(f"• 🚨 Fraud prevention mechanisms")
    print(f"")
    
    print(f"📈 ALTERNATIVE MDM PROVIDERS:")
    print(f"• Jamf Pro: Heeft enrollment API")
    print(f"• Microsoft Intune: PowerShell cmdlets")
    print(f"• VMware Workspace ONE: REST API")
    print(f"• Maar SimpleMDM kiest voor dashboard-only approach")

def provide_workaround_solutions():
    """Provide final workaround solutions"""
    
    print(f"\n🛠️ WORKAROUND OPLOSSINGEN")
    print("=" * 30)
    
    print(f"🎯 OPTIE 1: Hybrid Database Solution (Aanbevolen)")
    print(f"✅ Handmatig 50-100 enrollment URLs maken")
    print(f"✅ Database tracking voor single-use")
    print(f"✅ Automated assignment via eigen API")
    print(f"✅ Behoud alle SimpleMDM remote management")
    print(f"")
    
    print(f"🎯 OPTIE 2: SimpleMDM Browser Automation")
    automation_code = '''
from selenium import webdriver
from selenium.webdriver.common.by import By

def create_enrollment_via_browser():
    """Automate SimpleMDM dashboard via Selenium"""
    
    driver = webdriver.Chrome()
    
    # Login to SimpleMDM
    driver.get("https://a.simplemdm.com/login")
    driver.find_element(By.NAME, "email").send_keys("your-email")
    driver.find_element(By.NAME, "password").send_keys("your-password")
    driver.find_element(By.NAME, "commit").click()
    
    # Create enrollment
    driver.get("https://a.simplemdm.com/enrollments/new")
    driver.find_element(By.NAME, "enrollment[name]").send_keys("Auto-Generated")
    driver.find_element(By.NAME, "commit").click()
    
    # Extract URL
    enrollment_url = driver.find_element(By.ID, "enrollment-url").get_attribute("value")
    
    driver.quit()
    return enrollment_url
'''
    print(automation_code)
    
    print(f"⚠️ Risico's browser automation:")
    print(f"• 🚫 Tegen SimpleMDM ToS")
    print(f"• 💔 Breekt bij UI changes")  
    print(f"• 🐌 Langzaam en fragiel")
    print(f"")
    
    print(f"🎯 OPTIE 3: Direct Profile Distribution")
    print(f"✅ Generate unique profiles per customer")
    print(f"✅ Host op S3 met expiring URLs")
    print(f"✅ Volledig geautomatiseerd")
    print(f"❌ Geen remote management mogelijk")

def main():
    print("🔍 SimpleMDM API Enrollment Creation - Final Check")
    print("=" * 60)
    print("Definitieve check: Kan enrollment creation via API?")
    print("")
    
    # Comprehensive API check
    results = comprehensive_api_enrollment_check()
    
    # Webhook check
    check_webhook_endpoints()
    
    # Account access check
    check_admin_api_access()
    
    # Analysis
    print(f"\n📊 RESULTATEN SAMENVATTING")
    print("=" * 30)
    print(f"✅ Working endpoints: {len(results['working'])}")
    print(f"❌ Not found (404): {len(results['not_found'])}")
    print(f"⚠️ Other errors: {len(results['other_errors'])}")
    
    if results['working']:
        print(f"\n🎉 GEVONDEN! Working endpoints:")
        for endpoint in results['working']:
            print(f"   ✅ {endpoint}")
    else:
        print(f"\n❌ CONCLUSIE: Geen enrollment creation API beschikbaar")
    
    # Explanations and solutions
    explain_api_limitations()
    provide_workaround_solutions()
    
    print(f"\n✅ AANBEVELING:")
    print(f"Gebruik Hybrid Database Solution:")
    print(f"1. 🌐 Handmatig enrollment URLs maken (1x per week)")
    print(f"2. 💾 Database tracking voor automation")
    print(f"3. 🤖 Eigen API voor customer assignment")
    print(f"4. 🎛️ Behoud SimpleMDM remote management")

if __name__ == "__main__":
    main()

