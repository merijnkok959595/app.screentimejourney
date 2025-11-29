#!/usr/bin/env python3

import requests
from base64 import b64encode
import json
from datetime import datetime

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def test_enrollment_sessions_api():
    """Test the newly discovered enrollment_sessions API endpoint"""
    
    print("🔥 TESTING SIMPLEMDM ENROLLMENT SESSIONS API")
    print("=" * 50)
    print("This changes EVERYTHING! We can do real-time enrollment!")
    print("")
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth_header}",
        "Content-Type": "application/json"
    }
    
    # Test 1: Try to create enrollment session
    print("📡 TEST 1: Creating enrollment session...")
    
    enrollment_data = {
        "label": f"ScreenTime Journey - Test User {datetime.now().strftime('%H%M%S')}",
        "tags": ["screen_time_blocker", "parental_control"]
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/enrollment_sessions", 
            headers=headers, 
            json=enrollment_data,
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 201:
            print("🎉 SUCCESS! Enrollment session created!")
            
            session_data = response.json()
            print(f"Response: {json.dumps(session_data, indent=2)}")
            
            if 'data' in session_data:
                session = session_data['data']['attributes']
                
                print(f"\n✅ ENROLLMENT SESSION DETAILS:")
                print(f"   ID: {session_data['data']['id']}")
                print(f"   Code: {session.get('code', 'N/A')}")
                print(f"   URL: {session.get('url', 'N/A')}")
                print(f"   Token: {session.get('token', 'N/A')}")
                print(f"   Account ID: {session.get('account_id', 'N/A')}")
                
                # Test the enrollment URL
                enrollment_url = session.get('url')
                if enrollment_url:
                    print(f"\n🧪 TESTING ENROLLMENT URL:")
                    print(f"📱 iPhone users can tap: {enrollment_url}")
                    
                    # Test if URL is accessible
                    try:
                        test_response = requests.get(enrollment_url, timeout=5)
                        if test_response.status_code == 200:
                            print(f"✅ URL is accessible and ready for iPhone!")
                        else:
                            print(f"⚠️ URL responded with: {test_response.status_code}")
                    except Exception as e:
                        print(f"❌ URL test failed: {e}")
                
                return session_data['data']['id'], enrollment_url
                
        elif response.status_code == 404:
            print("❌ 404 - Endpoint not found")
            print("Maybe it's /enrollments_sessions or different path?")
            
        elif response.status_code == 422:
            print("⚠️ 422 - Validation error")
            print(f"Response: {response.text}")
            print("This means endpoint exists but our data is wrong!")
            
        else:
            print(f"❌ Unexpected status: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"💥 Request failed: {e}")
    
    return None, None

def test_alternative_enrollment_endpoints():
    """Test alternative endpoint names in case /enrollment_sessions doesn't work"""
    
    print(f"\n🔍 TESTING ALTERNATIVE ENROLLMENT ENDPOINTS")
    print("-" * 45)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    alternative_endpoints = [
        "enrollment_sessions",
        "enrollments_sessions", 
        "device_enrollments",
        "enrollment_urls",
        "onetime_enrollments",
        "sessions"
    ]
    
    test_data = {
        "label": "Test Enrollment",
        "tags": ["test"]
    }
    
    for endpoint in alternative_endpoints:
        try:
            response = requests.post(f"{BASE_URL}/{endpoint}", headers=headers, json=test_data, timeout=5)
            
            if response.status_code != 404:
                print(f"✅ /{endpoint}: {response.status_code} - EXISTS!")
                if response.status_code in [200, 201]:
                    print(f"   Response: {response.text[:200]}...")
                elif response.status_code == 422:
                    print(f"   Validation error (endpoint exists): {response.text[:200]}...")
            else:
                print(f"❌ /{endpoint}: 404")
                
        except Exception as e:
            print(f"💥 /{endpoint}: Error - {str(e)[:50]}...")

def analyze_real_time_vs_hybrid():
    """Analyze the implications of real-time enrollment capability"""
    
    print(f"\n🚀 REAL-TIME ENROLLMENT VS HYBRID SYSTEM")
    print("=" * 45)
    
    print("🔥 IF ENROLLMENT_SESSIONS API WORKS:")
    print("✅ We can do REAL-TIME enrollment like Jamf/Intune!")
    print("✅ No more pre-created URL pools needed")
    print("✅ Perfect single-use enrollment URLs")
    print("✅ Instant customer onboarding")
    print("✅ Professional enterprise-grade experience")
    print("")
    
    print("📋 NEW IMPLEMENTATION FLOW:")
    new_flow = '''
1. Customer signs up on screentimejourney.com
   ↓
2. Backend immediately calls SimpleMDM API:
   POST /v1/enrollment_sessions
   ↓
3. Get fresh enrollment URL instantly
   ↓
4. Send URL to customer via email/WhatsApp
   ↓
5. Customer installs profile on iPhone
   ↓
6. SimpleMDM webhook: device enrolled
   ↓
7. Auto-assign our parental control profile
   ↓
8. Customer gets confirmation + dashboard access
'''
    print(new_flow)
    
    print("🎯 BUSINESS ADVANTAGES:")
    print("• ✅ Zero manual work (fully automated)")
    print("• ✅ Instant customer satisfaction") 
    print("• ✅ No inventory management needed")
    print("• ✅ Scales to 1000s customers automatically")
    print("• ✅ Professional enterprise appearance")
    print("• ✅ Perfect for SaaS business model")

def create_new_implementation_plan():
    """Create implementation plan if enrollment_sessions works"""
    
    print(f"\n📋 NEW IMPLEMENTATION PLAN")
    print("=" * 30)
    
    implementation_steps = {
        "Week 1": [
            "🧪 Verify enrollment_sessions API works completely",
            "📝 Build customer signup flow with real-time enrollment",
            "🔧 Create webhook handler for device.enrolled events",
            "📧 Set up email automation with enrollment URLs"
        ],
        
        "Week 2": [
            "🎛️ Build parent dashboard for device management",
            "📱 Create profile assignment automation",
            "🛡️ Integrate with our enhanced MDM profile (ID: 214139)",
            "🧪 Test end-to-end flow with test devices"
        ],
        
        "Week 3": [
            "💳 Integrate Stripe payment processing", 
            "📊 Set up customer analytics and monitoring",
            "🎭 Build landing pages with new messaging",
            "👥 Beta test with 10 families"
        ],
        
        "Week 4": [
            "🚀 Soft launch to first 50 customers",
            "📈 Marketing campaign launch",
            "🤝 Therapist partnership outreach",
            "📊 Monitor and optimize conversion funnel"
        ]
    }
    
    for week, tasks in implementation_steps.items():
        print(f"📅 {week}:")
        for task in tasks:
            print(f"   {task}")
        print("")

def main():
    print("🔥 SIMPLEMDM ENROLLMENT SESSIONS API TEST")
    print("=" * 50)
    print("Testing if SimpleMDM has the secret enrollment creation API!")
    print("")
    
    # Test the main endpoint
    session_id, enrollment_url = test_enrollment_sessions_api()
    
    # Test alternatives if main doesn't work
    test_alternative_enrollment_endpoints()
    
    # Analyze implications
    analyze_real_time_vs_hybrid()
    
    if session_id and enrollment_url:
        print(f"\n🎉 BREAKTHROUGH DISCOVERED!")
        print(f"✅ We can create real-time enrollment sessions!")
        print(f"✅ This changes our entire business model!")
        print(f"✅ No more hybrid pre-created system needed!")
        print(f"")
        print(f"📱 TEST THIS ENROLLMENT URL ON IPHONE:")
        print(f"{enrollment_url}")
        
        create_new_implementation_plan()
    else:
        print(f"\n📋 FALLBACK TO HYBRID SYSTEM")
        print(f"If enrollment_sessions doesn't work, our hybrid system is still solid!")

if __name__ == "__main__":
    main()

