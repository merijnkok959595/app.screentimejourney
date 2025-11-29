#!/usr/bin/env python3

import requests
from base64 import b64encode
import json

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def get_existing_enrollment_urls():
    """Get any existing enrollment URLs from SimpleMDM"""
    
    print("🔍 Zoeken naar bestaande enrollment URLs...")
    print("=" * 50)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Get existing enrollments
    response = requests.get(f"{BASE_URL}/enrollments", headers=headers)
    
    if response.status_code == 200:
        enrollments = response.json()['data']
        
        if enrollments:
            print(f"✅ Gevonden: {len(enrollments)} bestaande enrollment(s)")
            print("")
            
            working_urls = []
            
            for i, enrollment in enumerate(enrollments, 1):
                enrollment_id = enrollment['id']
                name = enrollment['attributes'].get('name', f'Enrollment {enrollment_id}')
                url = enrollment['attributes']['url']
                
                print(f"📋 #{i}: {name}")
                print(f"   ID: {enrollment_id}")
                print(f"   URL: {url}")
                
                # Test if URL is accessible
                try:
                    import urllib.request
                    test_request = urllib.request.Request(url)
                    test_request.add_header('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')
                    
                    with urllib.request.urlopen(test_request, timeout=10) as test_response:
                        if test_response.status == 200:
                            print(f"   Status: ✅ WERKEND - Ready voor iPhone!")
                            working_urls.append({
                                'name': name,
                                'id': enrollment_id,
                                'url': url
                            })
                        else:
                            print(f"   Status: ⚠️ Response: {test_response.status}")
                            
                except Exception as e:
                    print(f"   Status: ❌ Error: {str(e)[:50]}...")
                
                print("")
            
            return working_urls
            
        else:
            print("❌ Geen bestaande enrollments gevonden")
            return []
    else:
        print(f"❌ Fout bij ophalen enrollments: {response.status_code}")
        print(f"Response: {response.text}")
        return []

def provide_test_instructions(working_urls):
    """Provide instructions for testing enrollment URLs"""
    
    if working_urls:
        best_url = working_urls[0]
        
        print("🧪 TEST ENROLLMENT URL GEVONDEN!")
        print("=" * 40)
        print(f"📱 BESTE TEST URL:")
        print(f"Name: {best_url['name']}")
        print(f"URL:  {best_url['url']}")
        print("")
        
        print("📱 TESTEN OP IPHONE:")
        print("1. 📱 Open Safari op iPhone")
        print("2. 🔗 Ga naar deze URL:")
        print(f"   {best_url['url']}")
        print("3. 📥 Tik 'Install' om enrollment profile te installeren")
        print("4. ⚙️ Ga naar Settings > General > VPN & Device Management")
        print("5. ✅ Verify dat 'Enhanced MDM Protection' profile is geïnstalleerd")
        print("6. 🌐 Test DNS blocking: ga naar pornhub.com (moet geblokkeerd zijn)")
        print("7. 🔍 Test safe search: zoek op Google naar 'adult content'")
        print("")
        
        print("📊 SIMPLEMDM DASHBOARD:")
        print(f"Monitor device: https://a.simplemdm.com/enrollments/{best_url['id']}")
        print("Zie device status na enrollment")
        print("")
        
        return best_url['url']
    
    else:
        print("❌ GEEN WERKENDE ENROLLMENT URLs GEVONDEN")
        print("=" * 45)
        print("🛠️ NIEUWE ENROLLMENT URL MAKEN:")
        print("")
        print("1. 🌐 Ga naar: https://a.simplemdm.com/enrollments")
        print("2. ➕ Klik 'Create Enrollment'")
        print("3. 📝 Vul in:")
        print("     Name: Test Enrollment - Parental Control")
        print("     Auto-assign profile: Enhanced MDM Protection (ID: 214139)")
        print("4. 💾 Save")
        print("5. 📋 Kopieer de enrollment URL")
        print("6. 📱 Test op iPhone zoals hierboven beschreven")
        print("")
        
        return None

def create_quick_test_profile_url():
    """Als backup: geef S3 direct profile URL"""
    
    print("🔄 BACKUP OPTIE: DIRECT PROFILE URL")
    print("=" * 40)
    print("Als enrollment URLs niet werken, gebruik direct profile:")
    print("")
    print("📥 DIRECT PROFILE DOWNLOAD:")
    print("URL: https://screen-time-journey.s3.eu-west-1.amazonaws.com/ScreenTime-MDM-Enhanced.mobileconfig")
    print("")
    print("📱 INSTALLATIE:")
    print("1. 📱 Open bovenstaande URL in Safari op iPhone")
    print("2. 📥 Tik 'Allow' om profile te downloaden")
    print("3. ⚙️ Ga naar Settings > General > VPN & Device Management")
    print("4. 📋 Tik op 'ScreenTime Journey Enhanced MDM'")
    print("5. ✅ Tik 'Install' en voer passcode in")
    print("6. 🌐 Test DNS blocking")
    print("")
    print("⚠️ NADEEL: Geen remote management zonder SimpleMDM enrollment")

def main():
    print("🔍 SimpleMDM Test Enrollment URL Ophalen")
    print("=" * 50)
    
    # Get existing enrollment URLs
    working_urls = get_existing_enrollment_urls()
    
    # Provide test instructions
    test_url = provide_test_instructions(working_urls)
    
    # Backup option
    create_quick_test_profile_url()
    
    if test_url:
        print("✅ SAMENVATTING:")
        print(f"🔗 Test URL: {test_url}")
        print("📱 Installeer op iPhone via Safari")
        print("🛡️ Automatisch enhanced parental control actief")
        print("📊 Monitor via SimpleMDM dashboard")
    else:
        print("📋 ACTIE VEREIST:")
        print("Maak eerst enrollment URL in SimpleMDM dashboard")
        print("Dan heb je volledige remote management")

if __name__ == "__main__":
    main()

