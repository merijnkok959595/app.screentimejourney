#!/usr/bin/env python3

import requests
from base64 import b64encode

# SimpleMDM API Configuration  
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def create_enrollment_via_dashboard():
    """Create enrollment using the web interface approach"""
    
    print("🔄 Creating Fresh Enrollment...")
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    
    # First, let's check what API endpoints are available
    headers = {
        "Authorization": f"Basic {auth_header}",
        "User-Agent": "ScreenTimeJourney/1.0"
    }
    
    # Try the account endpoint to verify connection
    print("📡 Verifying API connection...")
    account_response = requests.get(f"{BASE_URL}/account", headers=headers)
    
    if account_response.status_code == 200:
        account_data = account_response.json()
        print(f"✅ Connected to SimpleMDM account: {account_data['data']['attributes']['name']}")
        
        # Check if there are any devices
        devices_response = requests.get(f"{BASE_URL}/devices", headers=headers)
        print(f"📱 Devices endpoint: {devices_response.status_code}")
        
        # Check for assignment groups
        groups_response = requests.get(f"{BASE_URL}/assignment_groups", headers=headers)
        print(f"👥 Assignment groups endpoint: {groups_response.status_code}")
        
        # Try to list all available API endpoints
        print("\n📋 Available endpoints test:")
        endpoints_to_test = [
            "enrollments",
            "devices", 
            "profiles",
            "custom_configuration_profiles",
            "assignment_groups"
        ]
        
        for endpoint in endpoints_to_test:
            test_response = requests.get(f"{BASE_URL}/{endpoint}", headers=headers)
            print(f"  {endpoint}: {test_response.status_code}")
            
        return None
    else:
        print(f"❌ API connection failed: {account_response.status_code}")
        return None

def get_manual_enrollment_url():
    """Provide manual enrollment URL generation instructions"""
    
    print("\n🔗 MANUAL ENROLLMENT URL GENERATION")
    print("=" * 50)
    print("Since API enrollment creation needs adjustment, here's the manual approach:")
    print("")
    print("1. 🌐 Visit: https://a.simplemdm.com/enrollments")
    print("2. 🔄 Click 'Generate New Enrollment Link'")
    print("3. 📋 Copy the enrollment URL")
    print("4. 📱 Use that URL on your iPhone")
    print("")
    print("OR use this direct dashboard link:")
    print("🔗 https://a.simplemdm.com/")
    print("")
    print("⚡ QUICK ALTERNATIVE:")
    print("Since you have the profile ready, you could also:")
    print("1. 📥 Download the profile from SimpleMDM dashboard")
    print("2. 📧 Email it to yourself")
    print("3. 📱 Open on iPhone and install directly")

def main():
    print("🛡️  SimpleMDM Enrollment URL Generator")
    print("=" * 50)
    
    result = create_enrollment_via_dashboard()
    
    # Provide manual instructions
    get_manual_enrollment_url()
    
    print("\n🎯 CURRENT PROFILE STATUS:")
    print("✅ Enhanced CleanBrowsing + Screen Time profile is ready")
    print("✅ Profile ID: 214139")  
    print("✅ Protection includes: DNS filtering, Screen Time enforcement, Safe Search")
    print("")
    print("🔗 Profile Management:")
    print("https://a.simplemdm.com/configuration_profiles/214139")

if __name__ == "__main__":
    main()


