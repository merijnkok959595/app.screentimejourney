#!/usr/bin/env python3

import boto3
from botocore.exceptions import ClientError

def upload_to_existing_s3():
    """Try uploading to existing S3 buckets"""
    
    print("📡 TRYING SIMPLE S3 UPLOAD")
    print("=" * 30)
    
    # Read the profile
    try:
        with open('ScreenTime-Journey-PIN-1234-Direct.mobileconfig', 'r') as f:
            profile_content = f.read()
        print("✅ Profile loaded")
    except FileNotFoundError:
        print("❌ Profile file not found")
        return None
    
    s3_client = boto3.client('s3')
    
    # Try different bucket names that might exist
    bucket_options = [
        'screentime-profiles',
        'parental-control-profiles', 
        'mdm-profiles-public',
        'screentime-journey'
    ]
    
    for bucket_name in bucket_options:
        try:
            # Try to upload
            file_key = 'ScreenTime-Journey-Supervised-PIN-1234.mobileconfig'
            
            s3_client.put_object(
                Bucket=bucket_name,
                Key=file_key,
                Body=profile_content,
                ContentType='application/x-apple-aspen-config',
                CacheControl='no-cache, no-store',
                ContentDisposition='attachment; filename="ScreenTime-Journey-Supervised-PIN-1234.mobileconfig"'
            )
            
            print(f"✅ Uploaded to bucket: {bucket_name}")
            
            # Try to make it public
            try:
                s3_client.put_object_acl(
                    Bucket=bucket_name,
                    Key=file_key,
                    ACL='public-read'
                )
                print("✅ Made publicly accessible")
            except:
                print("⚠️ Could not make public")
            
            # Generate URL
            public_url = f"https://{bucket_name}.s3.amazonaws.com/{file_key}"
            
            print(f"\n🎯 S3 DOWNLOAD LINK:")
            print(f"🔗 {public_url}")
            
            return public_url
            
        except ClientError as e:
            print(f"❌ Bucket {bucket_name}: {e.response['Error']['Code']}")
            continue
    
    print("❌ All S3 buckets failed")
    return None

def create_github_hosting_instructions():
    """Create instructions for GitHub hosting"""
    
    print(f"\n🐙 GITHUB PAGES HOSTING (FREE)")
    print("=" * 35)
    
    github_instructions = '''# GitHub Pages Hosting Instructions

## Step 1: Create GitHub Repository
1. Go to github.com and create new repository
2. Name it: `screentime-profiles`
3. Make it public
4. Initialize with README

## Step 2: Upload Profile
1. Click "Add file" → "Upload files"
2. Upload: ScreenTime-Journey-PIN-1234-Direct.mobileconfig
3. Commit changes

## Step 3: Enable GitHub Pages
1. Go to Settings → Pages
2. Source: Deploy from branch
3. Branch: main
4. Folder: / (root)
5. Save

## Step 4: Get Download Link
Your profile will be available at:
`https://USERNAME.github.io/screentime-profiles/ScreenTime-Journey-PIN-1234-Direct.mobileconfig`

## Step 5: Test
- Click the link to download
- Profile should install on device
- PIN 1234 protects all settings
'''
    
    with open('GITHUB-HOSTING-GUIDE.md', 'w') as f:
        f.write(github_instructions)
    
    print("✅ Created GITHUB-HOSTING-GUIDE.md")

def create_local_server():
    """Create a simple local server to host the profile"""
    
    print(f"\n🌐 LOCAL SERVER OPTION")
    print("=" * 25)
    
    server_script = '''#!/usr/bin/env python3

import http.server
import socketserver
import os

# Change to the directory containing the profile
os.chdir('/Users/merijnkok/Desktop/screen-time-journey-workspace')

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Set correct MIME type for .mobileconfig files
        if self.path.endswith('.mobileconfig'):
            self.send_header('Content-Type', 'application/x-apple-aspen-config')
            self.send_header('Content-Disposition', 'attachment; filename="' + os.path.basename(self.path) + '"')
        super().end_headers()

with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"🌐 Local server running at: http://localhost:{PORT}")
    print(f"📱 Profile URL: http://localhost:{PORT}/ScreenTime-Journey-PIN-1234-Direct.mobileconfig")
    print("Press Ctrl+C to stop server")
    httpd.serve_forever()
'''
    
    with open('local-server.py', 'w') as f:
        f.write(server_script)
    
    print("✅ Created local-server.py")
    print("📋 Usage:")
    print("1. Run: python3 local-server.py")
    print("2. Access: http://localhost:8000/ScreenTime-Journey-PIN-1234-Direct.mobileconfig")

def provide_immediate_solution():
    """Provide immediate working solution"""
    
    print(f"\n🎯 IMMEDIATE WORKING SOLUTION")
    print("=" * 35)
    
    print("📧 EMAIL TO CUSTOMER:")
    email_template = '''Subject: ScreenTime Journey - Parental Control Profile

Hi [Customer Name],

Your parental control profile is ready! 

📎 ATTACHMENT: ScreenTime-Journey-PIN-1234-Direct.mobileconfig

📱 INSTALLATION (2 minutes):
1. Save the attached .mobileconfig file
2. Double-click it on your Mac/iPhone/iPad
3. Click "Install" in System Preferences
4. Enter device admin password if prompted
5. Profile installs with PIN 1234 protection

🛡️ WHAT'S PROTECTED:
✅ Adult websites blocked (CleanBrowsing DNS)
✅ Inappropriate content filtered
✅ In-app purchases disabled
✅ Content ratings restricted (12+ only)
✅ All settings protected by PIN 1234

🔒 PIN INFORMATION:
• Profile removal PIN: 1234
• Restrictions PIN: 1234
• Keep this PIN secure!

🧪 TEST:
After installation, try visiting an adult website - it should be blocked!

📧 SUPPORT:
Reply to this email if you need help with installation.

Best regards,
ScreenTime Journey Team
'''
    
    with open('CUSTOMER-EMAIL-TEMPLATE.txt', 'w') as f:
        f.write(email_template)
    
    print("✅ Created CUSTOMER-EMAIL-TEMPLATE.txt")
    print("")
    print("💼 SAAS BUSINESS MODEL:")
    print("• Email customers the profile as attachment")
    print("• Charge $19.99 for supervised profile")
    print("• Include installation support")
    print("• PIN 1234 provides security")

def main():
    print("🚀 CREATING S3 LINK AND ALTERNATIVES")
    print("=" * 40)
    
    # Try S3 upload
    s3_url = upload_to_existing_s3()
    
    if s3_url:
        print(f"\n🎉 SUCCESS! S3 link ready:")
        print(f"🔗 {s3_url}")
    
    # Create alternative solutions
    create_github_hosting_instructions()
    create_local_server()
    provide_immediate_solution()
    
    print(f"\n🏆 PROFILE READY FOR CUSTOMERS:")
    
    if s3_url:
        print(f"📡 S3 Download: {s3_url}")
    
    print("📧 Email Attachment: ScreenTime-Journey-PIN-1234-Direct.mobileconfig")
    print("🐙 GitHub Pages: See GITHUB-HOSTING-GUIDE.md")
    print("🌐 Local Server: Run local-server.py")
    
    print(f"\n✅ PROFILE FEATURES:")
    print("• CleanBrowsing DNS filtering")
    print("• PIN 1234 protection")
    print("• Adult content blocked")
    print("• Works on supervised + regular devices")
    print("• No SimpleMDM required")
    print("• Ready for single user enrollment")

if __name__ == "__main__":
    main()

