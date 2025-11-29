#!/usr/bin/env python3

import boto3
import uuid
from botocore.exceptions import ClientError

def create_s3_download_url():
    """Create S3 bucket and get download URL"""
    
    print("📡 CREATING S3 DOWNLOAD URL")
    print("=" * 30)
    
    # Read the profile
    try:
        with open('ScreenTime-Journey-PIN-1234-Direct.mobileconfig', 'r') as f:
            profile_content = f.read()
        print("✅ Profile loaded")
    except FileNotFoundError:
        print("❌ Profile file not found")
        return None
    
    s3_client = boto3.client('s3', region_name='us-east-1')
    
    # Generate unique bucket name
    unique_id = str(uuid.uuid4())[:8]
    bucket_name = f'screentime-profiles-{unique_id}'
    
    try:
        # Create bucket in us-east-1 (no LocationConstraint needed)
        print(f"🪣 Creating bucket: {bucket_name}")
        s3_client.create_bucket(Bucket=bucket_name)
        print(f"✅ Bucket created successfully")
        
        # Upload profile
        file_key = 'ScreenTime-Journey-Supervised-PIN-1234.mobileconfig'
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=file_key,
            Body=profile_content,
            ContentType='application/x-apple-aspen-config',
            CacheControl='no-cache, no-store',
            ContentDisposition='attachment; filename="ScreenTime-Journey-Supervised-PIN-1234.mobileconfig"'
        )
        
        print(f"✅ Profile uploaded: {file_key}")
        
        # Make bucket and object public
        bucket_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "PublicReadGetObject",
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "s3:GetObject",
                    "Resource": f"arn:aws:s3:::{bucket_name}/*"
                }
            ]
        }
        
        try:
            s3_client.put_bucket_policy(
                Bucket=bucket_name,
                Policy=str(bucket_policy).replace("'", '"')
            )
            print("✅ Bucket made public")
        except ClientError as e:
            print(f"⚠️ Could not set bucket policy: {e}")
            # Try object ACL instead
            try:
                s3_client.put_object_acl(
                    Bucket=bucket_name,
                    Key=file_key,
                    ACL='public-read'
                )
                print("✅ Object made public via ACL")
            except ClientError as e2:
                print(f"⚠️ Could not set object ACL: {e2}")
        
        # Generate download URL
        download_url = f"https://{bucket_name}.s3.amazonaws.com/{file_key}"
        
        print(f"\n🎯 S3 DOWNLOAD URL:")
        print(f"🔗 {download_url}")
        
        return download_url
        
    except ClientError as e:
        print(f"❌ S3 operation failed: {e}")
        
        # Try with a different bucket name
        if 'BucketAlreadyExists' in str(e):
            print("🔄 Trying different bucket name...")
            bucket_name = f'mdm-profiles-{unique_id}'
            try:
                s3_client.create_bucket(Bucket=bucket_name)
                
                s3_client.put_object(
                    Bucket=bucket_name,
                    Key=file_key,
                    Body=profile_content,
                    ContentType='application/x-apple-aspen-config'
                )
                
                # Make public
                s3_client.put_object_acl(
                    Bucket=bucket_name,
                    Key=file_key,
                    ACL='public-read'
                )
                
                download_url = f"https://{bucket_name}.s3.amazonaws.com/{file_key}"
                print(f"\n🎯 S3 DOWNLOAD URL (ALTERNATIVE):")
                print(f"🔗 {download_url}")
                
                return download_url
                
            except ClientError as e2:
                print(f"❌ Alternative bucket also failed: {e2}")
        
        return None

def create_temporary_file_host():
    """Create temporary file hosting solution"""
    
    print(f"\n🌐 TEMPORARY FILE HOSTING")
    print("=" * 30)
    
    # Create a simple file server
    import http.server
    import socketserver
    import threading
    import time
    
    PORT = 8080
    
    class ProfileHandler(http.server.SimpleHTTPRequestHandler):
        def do_GET(self):
            if self.path == '/profile' or self.path == '/profile.mobileconfig':
                self.send_response(200)
                self.send_header('Content-Type', 'application/x-apple-aspen-config')
                self.send_header('Content-Disposition', 'attachment; filename="ScreenTime-Journey-PIN-1234.mobileconfig"')
                self.end_headers()
                
                # Send profile content
                try:
                    with open('ScreenTime-Journey-PIN-1234-Direct.mobileconfig', 'rb') as f:
                        self.wfile.write(f.read())
                except:
                    self.wfile.write(b"Profile not found")
            else:
                super().do_GET()
    
    def run_server():
        with socketserver.TCPServer(("", PORT), ProfileHandler) as httpd:
            httpd.serve_forever()
    
    # Start server in background
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    
    time.sleep(1)  # Give server time to start
    
    local_url = f"http://localhost:{PORT}/profile"
    print(f"✅ Local server started")
    print(f"🔗 {local_url}")
    
    return local_url

def provide_alternative_urls():
    """Provide alternative download methods"""
    
    print(f"\n📋 ALTERNATIVE DOWNLOAD METHODS")
    print("=" * 35)
    
    print("🎯 OPTION 1: WeTransfer (Easy)")
    print("1. Go to wetransfer.com")
    print("2. Upload: ScreenTime-Journey-PIN-1234-Direct.mobileconfig")
    print("3. Get shareable link")
    print("4. Send link to customer")
    print("")
    
    print("🎯 OPTION 2: Google Drive")
    print("1. Upload profile to Google Drive")
    print("2. Right-click → Share → Get link")
    print("3. Change sharing to 'Anyone with link'")
    print("4. Use direct download format:")
    print("   https://drive.google.com/uc?id=FILE_ID&export=download")
    print("")
    
    print("🎯 OPTION 3: Dropbox")
    print("1. Upload to Dropbox")
    print("2. Get share link")
    print("3. Change ?dl=0 to ?dl=1 for direct download")
    print("")
    
    print("🎯 OPTION 4: File.io (Temporary)")
    print("1. Go to file.io")
    print("2. Upload profile")
    print("3. Get download link (expires after first download)")

def main():
    print("🚀 CREATING S3 DOWNLOAD URL")
    print("=" * 30)
    print("Getting direct download link for supervised profile")
    print("")
    
    # Try S3 first
    s3_url = create_s3_download_url()
    
    if s3_url:
        print(f"\n🎉 SUCCESS! Your S3 download URL is ready:")
        print(f"🔗 {s3_url}")
        print(f"\n📱 INSTALLATION:")
        print("1. Click the URL above")
        print("2. Profile downloads automatically")
        print("3. Install with PIN 1234 protection")
        print("4. Adult content will be blocked!")
        
    else:
        print(f"\n⚠️ S3 upload failed. Creating alternatives...")
        
        # Provide local server option
        local_url = create_temporary_file_host()
        print(f"\n🌐 TEMPORARY LOCAL URL:")
        print(f"🔗 {local_url}")
        print("(Only works while this script is running)")
        
        # Provide other alternatives
        provide_alternative_urls()
        
        print(f"\n📧 IMMEDIATE SOLUTION:")
        print("Email the profile file as attachment to your customer")
        print("File: ScreenTime-Journey-PIN-1234-Direct.mobileconfig")
    
    print(f"\n🛡️ PROFILE FEATURES:")
    print("• CleanBrowsing DNS filtering")
    print("• PIN 1234 protection")
    print("• Adult websites blocked")
    print("• In-app purchases disabled")
    print("• Works immediately after install")

if __name__ == "__main__":
    main()

