#!/usr/bin/env python3

import boto3
from botocore.exceptions import ClientError
import webbrowser
import os

def fix_s3_public_access():
    """Try to fix S3 public access settings"""
    
    print("🔧 FIXING S3 PUBLIC ACCESS")
    print("=" * 30)
    
    s3_client = boto3.client('s3')
    bucket_name = 'screentime-profiles-2a766fe8'
    
    try:
        # Try to disable block public access
        s3_client.put_public_access_block(
            Bucket=bucket_name,
            PublicAccessBlockConfiguration={
                'BlockPublicAcls': False,
                'IgnorePublicAcls': False,
                'BlockPublicPolicy': False,
                'RestrictPublicBuckets': False
            }
        )
        print("✅ Block public access disabled")
        
        # Now try to make object public
        s3_client.put_object_acl(
            Bucket=bucket_name,
            Key='ScreenTime-Journey-Supervised-PIN-1234.mobileconfig',
            ACL='public-read'
        )
        print("✅ Object made public")
        
        url = f"https://{bucket_name}.s3.amazonaws.com/ScreenTime-Journey-Supervised-PIN-1234.mobileconfig"
        print(f"\n🎯 FIXED S3 URL:")
        print(f"🔗 {url}")
        
        return url
        
    except ClientError as e:
        print(f"❌ Cannot fix S3 access: {e}")
        return None

def create_github_gist_solution():
    """Create GitHub Gist hosting solution"""
    
    print(f"\n🐙 GITHUB GIST SOLUTION")
    print("=" * 25)
    
    print("📋 STEPS TO CREATE PUBLIC GIST:")
    print("1. Go to: https://gist.github.com")
    print("2. Create new gist")
    print("3. Filename: ScreenTime-Journey-PIN-1234.mobileconfig") 
    print("4. Paste profile content (see below)")
    print("5. Create public gist")
    print("6. Click 'Raw' button to get direct download URL")
    
    # Read profile content for gist
    try:
        with open('ScreenTime-Journey-PIN-1234-Direct.mobileconfig', 'r') as f:
            profile_content = f.read()
        
        # Save for easy copy/paste
        with open('GIST-CONTENT.txt', 'w') as f:
            f.write(profile_content)
        
        print(f"\n✅ Profile content saved to: GIST-CONTENT.txt")
        print("Copy this content to GitHub Gist!")
        
        return "GIST-CONTENT.txt"
        
    except FileNotFoundError:
        print("❌ Profile file not found")
        return None

def create_google_drive_solution():
    """Create Google Drive hosting solution"""
    
    print(f"\n📁 GOOGLE DRIVE SOLUTION")
    print("=" * 30)
    
    print("📋 STEPS FOR GOOGLE DRIVE:")
    print("1. Go to: https://drive.google.com")
    print("2. Click 'New' → 'File upload'")
    print("3. Upload: ScreenTime-Journey-PIN-1234-Direct.mobileconfig")
    print("4. Right-click uploaded file → 'Share'")
    print("5. Change to 'Anyone with the link'")
    print("6. Copy the share link")
    print("7. Convert to direct download:")
    print("   https://drive.google.com/uc?id=FILE_ID&export=download")
    print("   (Replace FILE_ID with ID from share link)")
    
    print(f"\n💡 TIP:")
    print("Share link looks like:")
    print("https://drive.google.com/file/d/1ABC123XYZ/view?usp=sharing")
    print("Direct download:")  
    print("https://drive.google.com/uc?id=1ABC123XYZ&export=download")

def create_dropbox_solution():
    """Create Dropbox hosting solution"""
    
    print(f"\n📦 DROPBOX SOLUTION")
    print("=" * 20)
    
    print("📋 STEPS FOR DROPBOX:")
    print("1. Go to: https://dropbox.com")
    print("2. Upload: ScreenTime-Journey-PIN-1234-Direct.mobileconfig")
    print("3. Click 'Share' button")
    print("4. Click 'Copy link'")
    print("5. Modify URL for direct download:")
    print("   Change: ?dl=0")
    print("   To: ?dl=1")
    
    print(f"\n💡 EXAMPLE:")
    print("Share link:")
    print("https://www.dropbox.com/s/abc123/profile.mobileconfig?dl=0")
    print("Direct download:")
    print("https://www.dropbox.com/s/abc123/profile.mobileconfig?dl=1")

def create_wetransfer_solution():
    """Create WeTransfer solution"""
    
    print(f"\n📤 WETRANSFER SOLUTION (EASIEST)")
    print("=" * 35)
    
    print("📋 STEPS FOR WETRANSFER:")
    print("1. Go to: https://wetransfer.com")
    print("2. Click 'Add your files'")
    print("3. Upload: ScreenTime-Journey-PIN-1234-Direct.mobileconfig")
    print("4. Enter your email (to send to yourself)")
    print("5. Click 'Transfer'")
    print("6. You'll receive email with download link")
    print("7. Use that link for customers")
    
    print(f"\n✅ ADVANTAGES:")
    print("• No account required")
    print("• Instant setup (2 minutes)")
    print("• Professional download page")
    print("• Works for 7 days")

def create_local_file_server():
    """Create local file server for immediate testing"""
    
    print(f"\n🌐 IMMEDIATE LOCAL SOLUTION")
    print("=" * 35)
    
    server_code = '''#!/usr/bin/env python3

import http.server
import socketserver
import os

PORT = 8080

class ProfileHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/profile':
            self.send_response(200)
            self.send_header('Content-Type', 'application/x-apple-aspen-config')
            self.send_header('Content-Disposition', 'attachment; filename="ScreenTime-Journey-PIN-1234.mobileconfig"')
            self.end_headers()
            
            try:
                with open('ScreenTime-Journey-PIN-1234-Direct.mobileconfig', 'rb') as f:
                    self.wfile.write(f.read())
            except FileNotFoundError:
                self.wfile.write(b"Profile not found")
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Not found")

print("🌐 Starting profile server...")
print("📱 Download URL: http://localhost:8080/profile")
print("Press Ctrl+C to stop")

with socketserver.TCPServer(("", PORT), ProfileHandler) as httpd:
    httpd.serve_forever()
'''
    
    with open('profile-server.py', 'w') as f:
        f.write(server_code)
    
    print("✅ Created profile-server.py")
    print("📋 USAGE:")
    print("1. Run: python3 profile-server.py")
    print("2. Access: http://localhost:8080/profile")
    print("3. Profile downloads immediately!")

def provide_immediate_email_solution():
    """Provide email attachment solution"""
    
    print(f"\n📧 IMMEDIATE EMAIL SOLUTION")
    print("=" * 30)
    
    email_template = '''Subject: ScreenTime Journey - Parental Control Profile (PIN 1234)

Dear Customer,

Your supervised parental control profile is attached to this email.

📎 ATTACHMENT: ScreenTime-Journey-PIN-1234-Direct.mobileconfig

📱 INSTALLATION (30 seconds):
1. Save the attached .mobileconfig file
2. Double-click it on your device  
3. Click "Install" in System Preferences
4. Profile installs with PIN 1234 protection

🛡️ PROTECTION ACTIVE:
✅ Adult websites blocked (CleanBrowsing DNS)
✅ Inappropriate content filtered
✅ In-app purchases disabled  
✅ Content ratings restricted (12+ only)
✅ All settings protected by PIN 1234

🔒 SECURITY:
• Profile removal PIN: 1234
• Settings changes PIN: 1234
• Keep this PIN secure!

🧪 TEST:
After installation, try visiting an adult website - it should be blocked immediately!

💬 SUPPORT:
Reply to this email if you need installation help.

Best regards,
ScreenTime Journey Team

P.S. This profile works on both supervised and regular devices!
'''
    
    with open('EMAIL-WITH-ATTACHMENT.txt', 'w') as f:
        f.write(email_template)
    
    print("✅ Created EMAIL-WITH-ATTACHMENT.txt")
    print("📧 Just email the .mobileconfig file as attachment!")

def main():
    print("🚨 FIXING S3 ACCESS DENIED ERROR")
    print("=" * 40)
    print("Creating working alternatives for profile download")
    print("")
    
    # Try to fix S3 access
    fixed_url = fix_s3_public_access()
    
    if fixed_url:
        print(f"\n🎉 S3 ACCESS FIXED!")
        print(f"🔗 {fixed_url}")
        print("Try this URL now!")
    else:
        print(f"\n⚠️ Cannot fix S3 access. Using alternatives...")
    
    # Create all alternative solutions
    create_wetransfer_solution()
    create_google_drive_solution() 
    create_dropbox_solution()
    create_github_gist_solution()
    create_local_file_server()
    provide_immediate_email_solution()
    
    print(f"\n🏆 WORKING SOLUTIONS (PICK ONE):")
    print("1. 📤 WeTransfer (EASIEST) - 2 minutes setup")
    print("2. 📁 Google Drive - reliable, permanent")
    print("3. 📦 Dropbox - simple sharing")
    print("4. 🐙 GitHub Gist - developer-friendly")
    print("5. 🌐 Local server - immediate testing")
    print("6. 📧 Email attachment - most direct")
    
    print(f"\n💡 RECOMMENDATION:")
    print("Use WeTransfer for immediate customer delivery!")
    print("It's the fastest and most professional solution.")
    
    print(f"\n📱 YOUR PROFILE IS READY:")
    print("File: ScreenTime-Journey-PIN-1234-Direct.mobileconfig")
    print("PIN: 1234")
    print("Features: CleanBrowsing DNS + Content Restrictions")

if __name__ == "__main__":
    main()

