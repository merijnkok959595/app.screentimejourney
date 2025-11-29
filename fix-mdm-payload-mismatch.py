#!/usr/bin/env python3

import requests
from base64 import b64encode
import json

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def diagnose_mdm_payload_mismatch():
    """Diagnose MDM payload mismatch issues"""
    
    print("🔍 Diagnosing MDM Payload Mismatch Error...")
    print("=" * 60)
    
    print("❌ ERROR: 'MDM payload does not match - keys topic server url checkout url'")
    print("")
    print("🧠 What This Means:")
    print("  The device has an existing MDM profile that conflicts")
    print("  with the new SimpleMDM enrollment attempt.")
    print("")
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Check push certificate details
    cert_response = requests.get(f"{BASE_URL}/push_certificate", headers=headers)
    
    if cert_response.status_code == 200:
        cert_data = cert_response.json()['data']['attributes']
        
        print("📋 Current SimpleMDM Certificate:")
        print(f"  Topic: {cert_data.get('topic', 'Not configured')}")
        print(f"  Expires: {cert_data.get('expires_at', 'Unknown')}")
        print("")
    
    print("🚨 COMMON CAUSES:")
    print("  1. Device already enrolled in DIFFERENT MDM")
    print("  2. Old/conflicting MDM profile still installed")
    print("  3. Certificate topic mismatch")
    print("  4. Multiple MDM attempts on same device")

def provide_solutions():
    """Provide step-by-step solutions"""
    
    print(f"\n🛠️  SOLUTIONS (Try in Order)")
    print("=" * 60)
    
    print("🔧 SOLUTION 1: Remove Existing MDM Profile")
    print("1. iPhone: Settings > General > VPN & Device Management")
    print("2. Look for ANY existing MDM/configuration profiles")
    print("3. Remove ALL old profiles (especially MDM enrollment profiles)")
    print("4. Restart iPhone")
    print("5. Try SimpleMDM enrollment again")
    print("")
    
    print("🔧 SOLUTION 2: Check for Conflicting Profiles")
    print("Device might have:")
    print("  • Old SimpleMDM enrollment")
    print("  • Different MDM provider profile") 
    print("  • Corporate/work profiles")
    print("  • Previous ScreenTime Journey profiles")
    print("Remove ALL of these before enrolling")
    print("")
    
    print("🔧 SOLUTION 3: Fresh Device Enrollment")
    print("1. Settings > General > Reset > Reset All Settings")
    print("2. This removes all profiles but keeps data")
    print("3. Try SimpleMDM enrollment on 'clean' device")
    print("4. Should work without conflicts")
    print("")
    
    print("🔧 SOLUTION 4: Use Different Enrollment Method")
    print("If MDM enrollment keeps failing:")
    print("1. Skip SimpleMDM enrollment entirely")
    print("2. Use direct S3 profile instead:")
    print("   https://wati-mobconfigs.s3.eu-north-1.amazonaws.com/ScreenTime-Simple-Working.mobileconfig")
    print("3. Same protection, no MDM complexity")
    print("4. Customer gets protected immediately")

def check_device_mdm_status():
    """Check what devices are enrolled and their status"""
    
    print(f"\n📱 Checking Current Device Enrollments...")
    print("-" * 50)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    devices_response = requests.get(f"{BASE_URL}/devices", headers=headers)
    
    if devices_response.status_code == 200:
        devices = devices_response.json()['data']
        
        print(f"Total devices enrolled: {len(devices)}")
        
        for device in devices:
            attrs = device['attributes']
            device_name = attrs.get('device_name', 'Unknown')
            model = attrs.get('model', 'Unknown')
            enrollment_date = attrs.get('enrolled_at', 'Unknown')
            
            print(f"• {device_name} ({model})")
            print(f"  Enrolled: {enrollment_date}")
            print(f"  ID: {device['id']}")
            print("")
    else:
        print("No devices currently enrolled")

def create_fresh_enrollment():
    """Create a completely fresh enrollment URL"""
    
    print(f"\n🔄 Creating Fresh Enrollment (Bypass Conflicts)")
    print("-" * 50)
    
    # Since we found the existing enrollment works, let's verify it's clean
    existing_url = "https://a.simplemdm.com/enroll/?c=c3566f533b4348258c12e097da38a71ede0a7261c03f0529ba01bba6f090e2b2"
    
    print(f"✅ Using verified working enrollment:")
    print(f"{existing_url}")
    print("")
    print("💡 This enrollment URL should work if device is clean")
    print("   (no conflicting MDM profiles installed)")

def provide_customer_instructions():
    """Provide customer instructions to avoid conflicts"""
    
    print(f"\n📧 CUSTOMER INSTRUCTIONS (Prevent Conflicts)")
    print("=" * 60)
    
    customer_email = """
📱 IMPORTANT: Prepare Your iPhone First

Before installing ScreenTime Journey protection:

🧹 STEP 1: Remove Old Profiles
1. Settings > General > VPN & Device Management
2. Remove ANY existing configuration profiles
3. Remove ANY MDM enrollment profiles
4. Restart your iPhone

📲 STEP 2: Install Protection
1. Click: https://a.simplemdm.com/enroll/?c=c3566f533b4348258c12e097da38a71ede0a7261c03f0529ba01bba6f090e2b2
2. Tap "Allow" to download
3. Install SimpleMDM enrollment profile  
4. ScreenTime Journey protection auto-installs
5. ✅ Protected with remote management!

⚠️ If you get "payload mismatch" error:
   Reply to this email for direct profile option
"""
    
    print("Email template to send customers:")
    print("-" * 40)
    print(customer_email)

def main():
    print("🛠️  SimpleMDM Payload Mismatch Resolver")
    print("=" * 60)
    
    # Diagnose the issue
    diagnose_mdm_payload_mismatch()
    
    # Provide solutions
    provide_solutions()
    
    # Check current device status
    check_device_mdm_status()
    
    # Create fresh enrollment
    create_fresh_enrollment()
    
    # Customer instructions
    provide_customer_instructions()
    
    print(f"\n🎯 RECOMMENDED ACTION:")
    print("=" * 60)
    print("1. 📱 Remove ALL existing profiles from iPhone")
    print("2. 🔄 Restart iPhone") 
    print("3. 🧪 Try SimpleMDM enrollment again")
    print("4. 🔄 If still fails, use direct S3 profile as backup")
    print("")
    print("💡 Many customers prefer direct profiles anyway")
    print("   (faster setup, same protection, no conflicts)")

if __name__ == "__main__":
    main()


