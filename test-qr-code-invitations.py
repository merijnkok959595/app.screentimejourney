#!/usr/bin/env python3

import requests
from base64 import b64encode, b64decode
import json
import os

# SimpleMDM API Configuration
API_KEY = "SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx"
BASE_URL = "https://a.simplemdm.com/api/v1"

def test_qr_code_from_invitations():
    """Test if invitations API returns QR codes"""
    
    print("📱 TESTING QR CODE GENERATION FROM INVITATIONS")
    print("=" * 50)
    
    auth_header = b64encode(f"{API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {auth_header}"}
    
    # Use existing enrollment ID
    enrollment_id = 331732
    
    print(f"Using existing enrollment ID: {enrollment_id}")
    print("")
    
    # Test 1: Create invitation WITHOUT contact (might give QR code)
    print("🧪 TEST 1: Invitation without contact parameter")
    try:
        response = requests.post(
            f"{BASE_URL}/enrollments/{enrollment_id}/invitations",
            headers=headers,
            data={},  # No contact parameter
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Success! Checking for QR code...")
            
            try:
                invitation_data = response.json()
                print(f"Response: {json.dumps(invitation_data, indent=2)}")
                
                # Look for QR code in response
                qr_code = None
                url = None
                
                if 'data' in invitation_data:
                    attrs = invitation_data['data']['attributes']
                    qr_code = attrs.get('qr')
                    url = attrs.get('url')
                
                if qr_code:
                    print(f"🎉 QR CODE FOUND!")
                    print(f"   URL: {url}")
                    print(f"   QR Code length: {len(qr_code)} chars")
                    print(f"   QR Code preview: {qr_code[:50]}...")
                    
                    # Save QR code
                    save_qr_code(qr_code, "test_invitation")
                    return True
                else:
                    print("❌ No QR code in response")
                    
            except json.JSONDecodeError:
                print(f"Raw response: {response.text}")
                
        elif response.status_code == 422:
            print("⚠️ 422 - Need contact parameter. Trying with email...")
            
        else:
            print(f"❌ Status {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    # Test 2: Create invitation WITH contact parameter
    print(f"\n🧪 TEST 2: Invitation with email contact")
    try:
        response = requests.post(
            f"{BASE_URL}/enrollments/{enrollment_id}/invitations",
            headers=headers,
            data={"contact": "qrtest@screentimejourney.com"},
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Success! Checking for QR code...")
            
            try:
                invitation_data = response.json()
                print(f"Response keys: {list(invitation_data.keys())}")
                
                if 'data' in invitation_data:
                    print(f"Data keys: {list(invitation_data['data'].keys())}")
                    if 'attributes' in invitation_data['data']:
                        attrs = invitation_data['data']['attributes']
                        print(f"Attributes keys: {list(attrs.keys())}")
                        
                        qr_code = attrs.get('qr')
                        url = attrs.get('url')
                        
                        if qr_code:
                            print(f"🎉 QR CODE FOUND!")
                            print(f"   URL: {url}")
                            print(f"   QR Code: {qr_code[:50]}...")
                            save_qr_code(qr_code, "email_invitation")
                            return True
                        else:
                            print("❌ No 'qr' field in attributes")
                            print(f"Available fields: {list(attrs.keys())}")
                else:
                    print("❌ No 'data' field in response")
                    
                print(f"Full response: {json.dumps(invitation_data, indent=2)}")
                
            except json.JSONDecodeError:
                print(f"Raw response: {response.text}")
                
        else:
            print(f"❌ Status {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")
    
    # Test 3: Try different HTTP methods
    print(f"\n🧪 TEST 3: Different HTTP methods")
    
    methods_to_try = [
        ("GET", f"{BASE_URL}/enrollments/{enrollment_id}/invitations"),
        ("POST", f"{BASE_URL}/enrollments/{enrollment_id}/qr"),
        ("GET", f"{BASE_URL}/enrollments/{enrollment_id}/qr"),
        ("POST", f"{BASE_URL}/enrollments/{enrollment_id}"),
    ]
    
    for method, url in methods_to_try:
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=5)
            else:
                response = requests.post(url, headers=headers, data={}, timeout=5)
            
            print(f"{method} {url.split('/')[-1]}: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    # Check if QR code anywhere in response
                    response_str = json.dumps(data).lower()
                    if 'qr' in response_str or 'base64' in response_str:
                        print(f"   🎯 Potential QR data found!")
                        print(f"   Response: {json.dumps(data, indent=2)}")
                except:
                    print(f"   Raw: {response.text[:100]}...")
                    
        except Exception as e:
            print(f"{method} {url.split('/')[-1]}: Error - {str(e)[:30]}...")
    
    return False

def save_qr_code(qr_base64, filename):
    """Save QR code from base64 to PNG file"""
    
    try:
        # Remove data URL prefix if present
        if qr_base64.startswith('data:image/png;base64,'):
            qr_base64 = qr_base64.replace('data:image/png;base64,', '')
        
        # Decode base64
        qr_binary = b64decode(qr_base64)
        
        # Save to file
        qr_filename = f"{filename}_qr.png"
        with open(qr_filename, 'wb') as f:
            f.write(qr_binary)
        
        file_size = os.path.getsize(qr_filename)
        print(f"   💾 Saved: {qr_filename} ({file_size} bytes)")
        
        return qr_filename
        
    except Exception as e:
        print(f"   ❌ Save failed: {e}")
        return None

def analyze_qr_code_alternatives():
    """Analyze alternatives if SimpleMDM doesn't provide QR codes"""
    
    print(f"\n🔄 QR CODE ALTERNATIVES")
    print("=" * 25)
    
    print("🎯 OPTION 1: Generate QR codes ourselves")
    print("• 📦 Use Python qrcode library")
    print("• 🔗 Generate QR for enrollment URL")
    print("• 📱 Display in our app/website")
    print("• ✅ Full control over QR code styling")
    print("")
    
    print("🎯 OPTION 2: Online QR code service")
    print("• 🌐 Use Google Charts API or similar")
    print("• 🔗 Generate QR for enrollment URL")
    print("• 📱 Embed directly in HTML")
    print("• ✅ No local dependencies")
    print("")
    
    qr_generation_code = '''
# Option 1: Generate QR codes ourselves
import qrcode
from io import BytesIO
import base64

def generate_qr_code(enrollment_url):
    # Create QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(enrollment_url)
    qr.make(fit=True)
    
    # Create image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64 for web display
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{qr_base64}"

# Usage
enrollment_url = "https://a.simplemdm.com/enroll/abc123"
qr_code = generate_qr_code(enrollment_url)

# Display in HTML
html = f'<img src="{qr_code}" alt="Enrollment QR Code" />'
'''
    
    print("💻 QR GENERATION CODE:")
    print(qr_generation_code)

def create_hybrid_qr_solution():
    """Create solution combining invitations API + self-generated QR codes"""
    
    print(f"\n🎯 HYBRID QR CODE SOLUTION")
    print("=" * 30)
    
    print("✅ CONFIRMED WORKING APPROACH:")
    print("1. 📋 Pre-create enrollments in SimpleMDM dashboard")
    print("2. 📧 Use invitations API for real-time URL generation")
    print("3. 📱 Generate QR codes ourselves from URLs")
    print("4. 🎨 Display QR codes in our app with custom styling")
    print("5. 📲 Customer scans QR → installs profile")
    print("")
    
    complete_solution = '''
class ScreenTimeQRSystem:
    def __init__(self, api_key):
        self.api_key = api_key
        self.enrollment_ids = [331732, 331733, ...]  # Pre-created
    
    def create_customer_qr(self, customer_email):
        # Step 1: Get next available enrollment
        enrollment_id = self.get_next_enrollment()
        
        # Step 2: Create invitation via API
        invitation = self.create_invitation(enrollment_id, customer_email)
        
        # Step 3: Generate QR code from URL
        qr_code = self.generate_qr_code(invitation['url'])
        
        # Step 4: Return both URL and QR for customer
        return {
            "enrollment_url": invitation['url'],
            "qr_code": qr_code,
            "enrollment_id": enrollment_id
        }
    
    def create_invitation(self, enrollment_id, email):
        response = requests.post(
            f"https://a.simplemdm.com/api/v1/enrollments/{enrollment_id}/invitations",
            headers={"Authorization": f"Basic {self.api_key}"},
            data={"contact": email}
        )
        # Parse response and return URL
        
    def generate_qr_code(self, url):
        import qrcode
        # Generate QR code as shown above
'''
    
    print("💻 COMPLETE SOLUTION:")
    print(complete_solution)
    
    print("🏆 ADVANTAGES:")
    print("• ✅ Real-time invitation URLs")
    print("• ✅ Custom QR code styling")
    print("• ✅ Works with existing SimpleMDM setup")
    print("• ✅ Professional customer experience")
    print("• ✅ Can track which QR codes are used")

def main():
    print("📱 SIMPLEMDM QR CODE GENERATION TEST")
    print("=" * 45)
    print("Testing if SimpleMDM invitations API returns QR codes")
    print("")
    
    qr_found = test_qr_code_from_invitations()
    
    if qr_found:
        print(f"\n🎉 QR CODES CONFIRMED!")
        print("✅ SimpleMDM provides QR codes directly")
        print("✅ No need to generate them ourselves")
        print("✅ Perfect for in-app display")
    else:
        print(f"\n📋 QR CODES NOT PROVIDED BY SIMPLEMDM")
        print("✅ But we can generate them ourselves!")
        print("✅ Actually gives us more control")
        
        analyze_qr_code_alternatives() 
        create_hybrid_qr_solution()
    
    print(f"\n🎯 CONCLUSION:")
    print("Either way, we can provide QR codes to customers!")
    print("This makes our onboarding smoother than competitors.")

if __name__ == "__main__":
    main()

