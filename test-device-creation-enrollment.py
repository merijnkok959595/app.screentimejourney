#!/usr/bin/env python3

import requests
from base64 import b64encode
import json
import qrcode
from io import BytesIO
import base64
from datetime import datetime

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def test_device_creation_enrollment():
    """Test creating devices to get enrollment URLs directly"""
    
    print("🚀 TESTING DEVICE CREATION FOR ENROLLMENT URLS")
    print("=" * 50)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Create device with unique name
    device_name = f"ScreenTime-Customer-{datetime.now().strftime('%H%M%S')}"
    
    device_data = {
        "name": device_name
    }
    
    try:
        print("📡 POST /api/v1/devices")
        print(f"Data: {json.dumps(device_data, indent=2)}")
        
        response = requests.post(
            f"{BASE_URL}/devices",
            headers=headers,
            data=device_data,  # Using form data as shown in docs
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 201:
            print("🎉 SUCCESS! Device created with enrollment URL!")
            
            device_response = response.json()
            print(f"Response: {json.dumps(device_response, indent=2)}")
            
            if 'data' in device_response:
                device_id = device_response['data']['id']
                attrs = device_response['data']['attributes']
                
                device_name = attrs.get('name')
                enrollment_url = attrs.get('enrollment_url')
                status = attrs.get('status')
                
                print(f"\n✅ NEW DEVICE CREATED:")
                print(f"   ID: {device_id}")
                print(f"   Name: {device_name}")
                print(f"   Status: {status}")
                print(f"   Enrollment URL: {enrollment_url}")
                
                if enrollment_url:
                    # Generate QR code for the URL
                    qr_code = generate_qr_code(enrollment_url)
                    save_qr_code_image(qr_code, f"device_{device_id}")
                    
                    return {
                        "device_id": device_id,
                        "enrollment_url": enrollment_url,
                        "qr_code": qr_code,
                        "status": status
                    }
                else:
                    print("❌ No enrollment URL in response")
                
        elif response.status_code == 404:
            print("❌ 404 - Devices endpoint not found")
            
        elif response.status_code == 422:
            print("⚠️ 422 - Validation error")
            print(f"Response: {response.text}")
            
        else:
            print(f"❌ Status {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"💥 Request failed: {e}")
    
    return None

def generate_qr_code(url):
    """Generate QR code from URL"""
    
    try:
        # Create QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64 for web display
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        qr_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{qr_base64}"
        
    except Exception as e:
        print(f"❌ QR generation failed: {e}")
        return None

def save_qr_code_image(qr_base64, filename):
    """Save QR code image to file"""
    
    if not qr_base64:
        return None
        
    try:
        # Remove data URL prefix
        if qr_base64.startswith('data:image/png;base64,'):
            qr_base64 = qr_base64.replace('data:image/png;base64,', '')
        
        # Decode base64
        qr_binary = base64.b64decode(qr_base64)
        
        # Save to file
        qr_filename = f"{filename}_qr.png"
        with open(qr_filename, 'wb') as f:
            f.write(qr_binary)
        
        print(f"   💾 QR code saved: {qr_filename}")
        return qr_filename
        
    except Exception as e:
        print(f"   ❌ QR save failed: {e}")
        return None

def test_multiple_device_creation():
    """Test creating multiple devices to see if it scales"""
    
    print(f"\n🧪 TESTING MULTIPLE DEVICE CREATION")
    print("=" * 40)
    
    results = []
    
    for i in range(3):
        print(f"\n📱 Creating device {i+1}/3...")
        
        result = test_device_creation_enrollment()
        
        if result:
            print(f"✅ Device {i+1} created successfully!")
            results.append(result)
        else:
            print(f"❌ Device {i+1} creation failed")
            break
    
    if results:
        print(f"\n🎉 BATCH CREATION SUCCESS!")
        print(f"✅ Created {len(results)} devices with enrollment URLs")
        
        for i, result in enumerate(results, 1):
            print(f"   Device {i}: {result['device_id']} → {result['enrollment_url']}")
    
    return results

def analyze_device_creation_workflow():
    """Analyze the device creation workflow for business use"""
    
    print(f"\n🎯 DEVICE CREATION WORKFLOW ANALYSIS")
    print("=" * 40)
    
    print("🔥 HOW IT WORKS:")
    workflow = '''
1. Customer signs up on screentimejourney.com
   ↓
2. Backend calls SimpleMDM API:
   POST /v1/devices {"name": "Customer-John-iPhone"}
   ↓
3. SimpleMDM returns device with enrollment_url
   ↓
4. Backend generates QR code from URL
   ↓
5. Customer sees QR code in our app/email
   ↓
6. Customer scans QR code with iPhone
   ↓
7. Profile installs → Device enrolled
   ↓
8. SimpleMDM webhook: device enrolled
   ↓
9. Auto-assign parental control profile
'''
    print(workflow)
    
    print("✅ ADVANTAGES:")
    print("• 🚀 Real-time device creation")
    print("• 📱 Instant enrollment URLs")
    print("• 🎯 One API call per customer")
    print("• 📊 Perfect tracking (device ID)")
    print("• 🔧 Simpler than deployments/invitations")
    print("• ✅ Works with existing SimpleMDM setup")
    print("")
    
    print("⚠️ CONSIDERATIONS:")
    print("• 📱 Creates 'virtual' device before real device enrolls")
    print("• 📋 Need to clean up unused devices periodically")
    print("• 🔄 Device shows 'awaiting enrollment' until used")
    print("• 💾 Need database to track device_id → customer mapping")

def create_production_implementation():
    """Create production implementation for device-based enrollment"""
    
    print(f"\n💻 PRODUCTION IMPLEMENTATION")
    print("=" * 30)
    
    implementation = '''
class ScreenTimeDeviceEnrollment:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://a.simplemdm.com/api/v1"
        self.headers = {"Authorization": f"Basic {api_key}"}
    
    def create_customer_enrollment(self, customer_email, customer_name):
        # Step 1: Create device in SimpleMDM
        device_name = f"ScreenTime-{customer_name}-{datetime.now().strftime('%Y%m%d')}"
        
        response = requests.post(
            f"{self.base_url}/devices",
            headers=self.headers,
            data={"name": device_name}
        )
        
        if response.status_code == 201:
            device_data = response.json()['data']
            device_id = device_data['id']
            enrollment_url = device_data['attributes']['enrollment_url']
            
            # Step 2: Generate QR code
            qr_code = self.generate_qr_code(enrollment_url)
            
            # Step 3: Store in database
            self.store_device_mapping(customer_email, device_id, enrollment_url)
            
            # Step 4: Return enrollment data
            return {
                "device_id": device_id,
                "enrollment_url": enrollment_url,
                "qr_code": qr_code
            }
        
        return None
    
    def handle_device_enrolled_webhook(self, device_id):
        # Auto-assign parental control profile when device enrolls
        customer_email = self.get_customer_by_device_id(device_id)
        
        if customer_email:
            # Assign profile ID 214139 (our enhanced profile)
            self.assign_parental_control_profile(device_id)
            
            # Send success email to customer
            self.send_enrollment_success_email(customer_email)
'''
    
    print(implementation)
    
    print("🎯 NEXT STEPS:")
    print("1. 🧪 Test device creation with our API key")
    print("2. 📱 Build QR code generation system")
    print("3. 💾 Database schema for device → customer mapping")
    print("4. 🔔 Webhook handlers for device enrollment events")
    print("5. 🎛️ Auto-assign parental control profiles")

def main():
    print("🚀 SIMPLEMDM DEVICE CREATION ENROLLMENT TEST")
    print("=" * 50)
    print("Testing device creation for direct enrollment URLs!")
    print("")
    
    # Test single device creation
    result = test_device_creation_enrollment()
    
    if result:
        print(f"\n🎉 DEVICE CREATION SUCCESS!")
        print("✅ We can create devices with enrollment URLs!")
        print("✅ QR codes generated successfully!")
        print("✅ This is the simplest automation approach!")
        
        # Test multiple devices
        # test_multiple_device_creation()
        
        analyze_device_creation_workflow()
        create_production_implementation()
        
    else:
        print(f"\n📋 DEVICE CREATION ISSUES")
        print("Need to investigate API permissions or try other approaches")

if __name__ == "__main__":
    main()

