
# Production SaaS Enrollment API
import requests
from base64 import b64encode

class ScreenTimeJourneyMDM:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://a.simplemdm.com/api/v1"
        self.headers = {"Authorization": f"Basic {b64encode(f'{api_key}:'.encode()).decode()}"}
    
    def create_customer_enrollment(self, customer_email, customer_name):
        """Create enrollment for new customer"""
        
        # Create device
        device_data = {"name": f"ScreenTime-{customer_name.replace(' ', '-')}"}
        response = requests.post(f"{self.base_url}/devices", 
                               headers=self.headers, data=device_data)
        
        if response.status_code == 201:
            device = response.json()['data']
            device_id = device['id']
            enrollment_url = device['attributes']['enrollment_url']
            
            # Assign parental profile
            requests.post(f"{self.base_url}/custom_configuration_profiles/214139/devices/{device_id}",
                         headers=self.headers)
            
            return {
                "enrollment_url": enrollment_url,
                "device_id": device_id,
                "customer_email": customer_email
            }
        
        return None
    
    def send_enrollment_email(self, customer_email, enrollment_url):
        """Send enrollment email to customer"""
        
        email_content = f"""
        Welcome to ScreenTime Journey! 
        
        Click this link to protect your device:
        {enrollment_url}
        
        It will install parental controls automatically.
        """
        
        # Send via your email service (SendGrid, Mailgun, etc.)
        return send_email(customer_email, "Protect Your Device", email_content)

# Usage in your SaaS application:
mdm = ScreenTimeJourneyMDM("your-api-key")
enrollment = mdm.create_customer_enrollment("parent@example.com", "John Smith")
mdm.send_enrollment_email("parent@example.com", enrollment["enrollment_url"])
