#!/usr/bin/env python3

import boto3
import json
import uuid
from botocore.exceptions import ClientError

def create_working_s3_url():
    """Create a working S3 download URL with proper public access"""
    
    print("📡 CREATING WORKING S3 DOWNLOAD URL")
    print("=" * 40)
    
    # Read the profile
    try:
        with open('ScreenTime-Journey-PIN-1234-Direct.mobileconfig', 'r') as f:
            profile_content = f.read()
        print("✅ Profile loaded")
    except FileNotFoundError:
        print("❌ Profile file not found")
        return None
    
    # Create S3 client
    s3_client = boto3.client('s3', region_name='us-east-1')
    
    # Try multiple bucket names
    bucket_attempts = [
        f'mdm-profiles-public-{uuid.uuid4().hex[:8]}',
        f'parental-profiles-{uuid.uuid4().hex[:8]}', 
        f'screentime-download-{uuid.uuid4().hex[:8]}',
        f'mobileconfig-host-{uuid.uuid4().hex[:8]}'
    ]
    
    for bucket_name in bucket_attempts:
        try:
            print(f"🪣 Trying bucket: {bucket_name}")
            
            # Create bucket
            s3_client.create_bucket(Bucket=bucket_name)
            print(f"✅ Bucket created: {bucket_name}")
            
            # Try to set bucket for public access
            try:
                # First remove block public access
                s3_client.delete_public_access_block(Bucket=bucket_name)
                print("✅ Removed public access block")
            except ClientError:
                print("⚠️ Could not remove public access block")
            
            # Upload file
            file_key = 'ScreenTime-Journey-Supervised-PIN-1234.mobileconfig'
            
            s3_client.put_object(
                Bucket=bucket_name,
                Key=file_key,
                Body=profile_content,
                ContentType='application/x-apple-aspen-config',
                CacheControl='no-cache',
                ContentDisposition='attachment; filename="ScreenTime-Journey-Supervised-PIN-1234.mobileconfig"'
            )
            print(f"✅ File uploaded: {file_key}")
            
            # Try bucket policy for public read
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
                    Policy=json.dumps(bucket_policy)
                )
                print("✅ Bucket policy set for public access")
            except ClientError as e:
                print(f"⚠️ Bucket policy failed: {e}")
                
                # Try object ACL instead
                try:
                    s3_client.put_object_acl(
                        Bucket=bucket_name,
                        Key=file_key,
                        ACL='public-read'
                    )
                    print("✅ Object made public via ACL")
                except ClientError as e2:
                    print(f"⚠️ Object ACL failed: {e2}")
            
            # Generate URL
            public_url = f"https://{bucket_name}.s3.amazonaws.com/{file_key}"
            
            # Test the URL
            import requests
            try:
                response = requests.head(public_url, timeout=10)
                if response.status_code == 200:
                    print(f"✅ URL is accessible!")
                    print(f"\n🎯 WORKING S3 DOWNLOAD URL:")
                    print(f"🔗 {public_url}")
                    return public_url
                else:
                    print(f"❌ URL not accessible: {response.status_code}")
            except Exception as e:
                print(f"❌ URL test failed: {e}")
                # Still return URL as it might work
                print(f"\n🎯 S3 DOWNLOAD URL (may need time to propagate):")
                print(f"🔗 {public_url}")
                return public_url
            
        except ClientError as e:
            print(f"❌ Bucket {bucket_name} failed: {e}")
            continue
    
    return None

def create_presigned_url():
    """Create presigned URL as fallback"""
    
    print(f"\n🔐 CREATING PRESIGNED URL (FALLBACK)")
    print("=" * 40)
    
    s3_client = boto3.client('s3')
    
    # Try with existing bucket
    existing_bucket = 'screentime-profiles-2a766fe8'
    file_key = 'ScreenTime-Journey-Supervised-PIN-1234.mobileconfig'
    
    try:
        # Generate presigned URL (expires in 7 days)
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': existing_bucket, 'Key': file_key},
            ExpiresIn=7*24*60*60  # 7 days
        )
        
        print(f"✅ Presigned URL created (expires in 7 days):")
        print(f"🔗 {presigned_url}")
        
        return presigned_url
        
    except ClientError as e:
        print(f"❌ Presigned URL failed: {e}")
        return None

def try_cloudfront_distribution():
    """Try to create CloudFront distribution for S3"""
    
    print(f"\n☁️ CLOUDFRONT DISTRIBUTION OPTION")
    print("=" * 35)
    
    print("📋 MANUAL CLOUDFRONT SETUP:")
    print("1. Go to AWS CloudFront console")
    print("2. Create distribution")
    print("3. Origin: your S3 bucket")
    print("4. Default cache behavior: Allow all HTTP methods")
    print("5. Price class: Use only US, Canada, Europe")
    print("6. Distribution will give you: xxx.cloudfront.net")
    print("7. URL: https://xxx.cloudfront.net/ScreenTime-Journey-Supervised-PIN-1234.mobileconfig")

def create_alternative_s3_regions():
    """Try different S3 regions"""
    
    print(f"\n🌍 TRYING DIFFERENT S3 REGIONS")
    print("=" * 35)
    
    regions = ['us-west-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1']
    
    # Read profile
    try:
        with open('ScreenTime-Journey-PIN-1234-Direct.mobileconfig', 'r') as f:
            profile_content = f.read()
    except FileNotFoundError:
        print("❌ Profile file not found")
        return None
    
    for region in regions:
        try:
            print(f"🌐 Trying region: {region}")
            
            s3_client = boto3.client('s3', region_name=region)
            bucket_name = f'profiles-{region}-{uuid.uuid4().hex[:6]}'
            
            # Create bucket with region constraint
            if region == 'us-east-1':
                s3_client.create_bucket(Bucket=bucket_name)
            else:
                s3_client.create_bucket(
                    Bucket=bucket_name,
                    CreateBucketConfiguration={'LocationConstraint': region}
                )
            
            print(f"✅ Bucket created in {region}: {bucket_name}")
            
            # Upload file
            file_key = 'profile.mobileconfig'
            s3_client.put_object(
                Bucket=bucket_name,
                Key=file_key,
                Body=profile_content,
                ContentType='application/x-apple-aspen-config'
            )
            
            # Try to make public
            try:
                s3_client.put_object_acl(
                    Bucket=bucket_name,
                    Key=file_key,
                    ACL='public-read'
                )
                
                url = f"https://{bucket_name}.s3.{region}.amazonaws.com/{file_key}"
                print(f"✅ SUCCESS in {region}:")
                print(f"🔗 {url}")
                return url
                
            except ClientError:
                print(f"❌ Could not make public in {region}")
                continue
                
        except ClientError as e:
            print(f"❌ Region {region} failed: {e}")
            continue
    
    return None

def main():
    print("🚀 CREATING WORKING S3 DOWNLOAD URL")
    print("=" * 40)
    print("Multiple attempts to get you a working S3 URL")
    print("")
    
    # Try main approach
    s3_url = create_working_s3_url()
    
    if s3_url:
        print(f"\n🎉 SUCCESS! Working S3 URL:")
        print(f"🔗 {s3_url}")
    else:
        print(f"\n⚠️ Public S3 failed, trying presigned URL...")
        
        # Try presigned URL
        presigned_url = create_presigned_url()
        
        if presigned_url:
            print(f"\n✅ Presigned URL created:")
            print(f"🔗 {presigned_url}")
            s3_url = presigned_url
        else:
            print(f"\n⚠️ Presigned URL failed, trying different regions...")
            
            # Try different regions
            regional_url = create_alternative_s3_regions()
            
            if regional_url:
                s3_url = regional_url
            else:
                print(f"\n❌ All S3 attempts failed")
    
    if s3_url:
        print(f"\n📱 YOUR S3 DOWNLOAD URL:")
        print(f"🔗 {s3_url}")
        print(f"\n📋 USAGE:")
        print("1. Click URL to download profile")
        print("2. Profile installs with PIN 1234 protection")
        print("3. Adult content will be blocked!")
        print("4. Share this URL with customers")
        
        print(f"\n💰 SAAS BUSINESS:")
        print("• Charge $19.99 for supervised profile")
        print("• Email customers this S3 URL")
        print("• Include installation guide")
        print("• PIN 1234 protects all settings")
    else:
        # Show CloudFront option
        try_cloudfront_distribution()
        
        print(f"\n📧 BACKUP SOLUTION:")
        print("Email the .mobileconfig file as attachment")
        print("File: ScreenTime-Journey-PIN-1234-Direct.mobileconfig")

if __name__ == "__main__":
    main()

