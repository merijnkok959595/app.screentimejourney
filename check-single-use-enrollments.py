#!/usr/bin/env python3

import requests
from base64 import b64encode
import json

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def check_single_use_enrollment_methods():
    """Check all possible methods for single-use/one-time enrollments"""
    
    print("🔍 Checking SimpleMDM Single-Use/One-Time Enrollment Options...")
    print("=" * 70)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Method 1: Check if there's a one-time enrollment endpoint
    print("📡 Method 1: One-time enrollment endpoint...")
    
    onetime_data = {
        'name': 'Single Use Enrollment',
        'single_use': True,
        'expires_after_enrollment': True
    }
    
    endpoints_to_try = [
        'enrollments/onetime',
        'enrollments/single_use', 
        'onetime_enrollments',
        'single_use_enrollments',
        'temporary_enrollments'
    ]
    
    for endpoint in endpoints_to_try:
        response = requests.post(f"{BASE_URL}/{endpoint}", headers=headers, json=onetime_data)
        print(f"  POST /{endpoint}: {response.status_code}")
        if response.status_code not in [404, 405]:
            print(f"    Response: {response.text[:200]}...")
    
    # Method 2: Check if regular enrollments have single-use options
    print(f"\n📡 Method 2: Regular enrollments with single-use parameters...")
    
    single_use_params = [
        {'single_use': True},
        {'one_time': True},
        {'expires_after_enrollment': True},
        {'max_enrollments': 1},
        {'temporary': True}
    ]
    
    for params in single_use_params:
        response = requests.post(f"{BASE_URL}/enrollments", headers=headers, json=params)
        print(f"  POST /enrollments with {params}: {response.status_code}")
        if response.status_code not in [404, 405]:
            print(f"    Response: {response.text[:200]}...")

def check_invitation_based_enrollments():
    """Check if invitation-based enrollments can be single-use"""
    
    print(f"\n📨 Method 3: Invitation-based single-use enrollments...")
    print("-" * 50)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Try invitation endpoints with single-use parameters
    invitation_endpoints = [
        'device_invitations',
        'invitations', 
        'enrollment_invitations'
    ]
    
    test_email = "test@screentimejourney.com"
    
    for endpoint in invitation_endpoints:
        invitation_data = {
            'email': test_email,
            'single_use': True,
            'expires_after_enrollment': True,
            'custom_configuration_profile_id': 214139  # Our enhanced profile
        }
        
        response = requests.post(f"{BASE_URL}/{endpoint}", headers=headers, json=invitation_data)
        print(f"  POST /{endpoint}: {response.status_code}")
        if response.status_code not in [404, 405, 422]:
            print(f"    Response: {response.text[:300]}...")
            
            # If successful, try to get the invitation URL
            if response.status_code == 201:
                try:
                    data = response.json()
                    if 'data' in data and 'attributes' in data['data']:
                        url = data['data']['attributes'].get('url', 'No URL found')
                        print(f"    ✅ INVITATION URL: {url}")
                except:
                    pass

def check_device_specific_enrollments():
    """Check if device-specific enrollments are possible"""
    
    print(f"\n📱 Method 4: Device-specific enrollment URLs...")
    print("-" * 50)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Try device-specific enrollment
    device_enrollment_data = {
        'device_identifier': 'TEMP-DEVICE-' + str(hash('test'))[-8:],
        'enrollment_type': 'device_specific',
        'single_use': True,
        'custom_configuration_profile_id': 214139
    }
    
    device_endpoints = [
        'devices/enroll',
        'device_enrollments',
        'devices/enrollment_url'
    ]
    
    for endpoint in device_endpoints:
        response = requests.post(f"{BASE_URL}/{endpoint}", headers=headers, json=device_enrollment_data)
        print(f"  POST /{endpoint}: {response.status_code}")
        if response.status_code not in [404, 405]:
            print(f"    Response: {response.text[:300]}...")

def check_push_certificate_enrollments():
    """Check if push certificate based enrollments work"""
    
    print(f"\n🔐 Method 5: Push Certificate / DEP-style enrollments...")
    print("-" * 50)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Check push certificate status first
    push_cert_response = requests.get(f"{BASE_URL}/push_certificate", headers=headers)
    print(f"  GET /push_certificate: {push_cert_response.status_code}")
    
    if push_cert_response.status_code == 200:
        try:
            cert_data = push_cert_response.json()
            print(f"    Push Certificate Status: {cert_data}")
            
            # If we have push cert, try DEP-style enrollment
            dep_enrollment = {
                'enrollment_type': 'dep',
                'auto_assign_profile': 214139,
                'single_use': True
            }
            
            dep_response = requests.post(f"{BASE_URL}/dep_enrollments", headers=headers, json=dep_enrollment)
            print(f"  POST /dep_enrollments: {dep_response.status_code}")
            if dep_response.status_code not in [404, 405]:
                print(f"    Response: {dep_response.text[:300]}...")
                
        except Exception as e:
            print(f"    Error processing push cert: {e}")
    else:
        print(f"    No push certificate configured - explains enrollment issues")

def explore_all_api_endpoints():
    """Explore all available API endpoints to find enrollment options"""
    
    print(f"\n🔍 Method 6: Exploring all API endpoints...")
    print("-" * 50)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Get a list of all available endpoints by trying common ones
    potential_endpoints = [
        'account',
        'apps', 
        'assignment_groups',
        'custom_configuration_profiles',
        'devices',
        'enrollments',
        'installed_apps',
        'logs',
        'push_certificate',
        'users',
        'webhook_urls',
        'enrollment_tokens',
        'enrollment_profiles',
        'managed_app_configs',
        'device_groups'
    ]
    
    print("📋 Available API endpoints:")
    working_endpoints = []
    
    for endpoint in potential_endpoints:
        response = requests.get(f"{BASE_URL}/{endpoint}", headers=headers)
        status = "✅" if response.status_code == 200 else "❌" if response.status_code == 404 else "⚠️"
        print(f"  {status} /{endpoint}: {response.status_code}")
        
        if response.status_code == 200:
            working_endpoints.append(endpoint)
    
    print(f"\n📊 Found {len(working_endpoints)} working endpoints")
    
    # Check if any of these might support enrollment creation
    enrollment_related = ['enrollments', 'enrollment_tokens', 'enrollment_profiles']
    
    for endpoint in enrollment_related:
        if endpoint in working_endpoints:
            print(f"\n🔍 Exploring /{endpoint} for creation options...")
            
            # Try POST to see what parameters are expected
            test_response = requests.post(f"{BASE_URL}/{endpoint}", headers=headers, json={})
            print(f"  POST /{endpoint} (empty): {test_response.status_code}")
            
            if test_response.status_code in [422, 400]:  # Validation error might show required fields
                print(f"    Response: {test_response.text[:500]}...")

def provide_alternative_solutions():
    """Provide alternative solutions if API doesn't support single-use"""
    
    print(f"\n💡 ALTERNATIVE SOLUTIONS FOR SINGLE-USE ENROLLMENTS")
    print("=" * 70)
    
    print(f"🎯 Option 1: Pre-generated + Tracking")
    print(f"  • Create 100 regular enrollment URLs")
    print(f"  • Track usage in your database")
    print(f"  • Mark as 'used' after first enrollment")
    print(f"  • Delete enrollment after use via API")
    
    print(f"\n🎯 Option 2: Direct Profile Distribution")
    print(f"  • Generate profile dynamically per customer")
    print(f"  • Host on S3 with unique URLs")
    print(f"  • Delete S3 file after download")
    print(f"  • No SimpleMDM enrollment needed")
    
    print(f"\n🎯 Option 3: Email-based Distribution")
    print(f"  • Send profile as email attachment")
    print(f"  • Unique profile per customer")
    print(f"  • Customer installs directly")
    print(f"  • Track via SimpleMDM webhooks")
    
    print(f"\n🎯 Option 4: Webhook-based Cleanup")
    print(f"  • Create regular enrollment URLs")
    print(f"  • Set up SimpleMDM webhook for enrollment events")
    print(f"  • Auto-delete enrollment URL after first use")
    print(f"  • Prevents multiple enrollments")

def main():
    print("🔍 SimpleMDM Single-Use Enrollment Investigation")
    print("=" * 70)
    print("Checking if SimpleMDM supports single-use/one-time enrollment URLs...")
    print("")
    
    try:
        # Try all methods
        check_single_use_enrollment_methods()
        check_invitation_based_enrollments()
        check_device_specific_enrollments()
        check_push_certificate_enrollments()
        explore_all_api_endpoints()
        
        # Provide alternatives
        provide_alternative_solutions()
        
    except Exception as e:
        print(f"❌ Error during investigation: {e}")
        print(f"This might indicate API limitations or authentication issues")

if __name__ == "__main__":
    main()

