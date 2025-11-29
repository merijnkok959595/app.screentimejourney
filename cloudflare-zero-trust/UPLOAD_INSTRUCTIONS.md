# 📤 Upload Mobile Config to S3 - Quick Guide

## 🎯 Goal
Upload your `.mobileconfig` file to S3 and get a public download URL

---

## ⚡ Quick Method (Automated Script)

```bash
cd /Users/merijnkok/Desktop/screen-time-journey-workspace/cloudflare-zero-trust

# Make script executable
chmod +x upload_to_s3.sh

# Edit the script to set your bucket name (optional)
# nano upload_to_s3.sh
# Change: BUCKET_NAME="screentimejourney-public"

# Run the script
./upload_to_s3.sh
```

**The script will:**
1. ✅ Check if AWS CLI is installed
2. ✅ Verify your credentials
3. ✅ Create bucket if needed
4. ✅ Upload file with correct MIME type
5. ✅ Make it public
6. ✅ Give you the download URL

---

## 🔧 Manual Method (AWS Console)

### Step 1: Install AWS CLI (if not installed)

```bash
# macOS
brew install awscli

# Or using pip
pip3 install awscli
```

### Step 2: Configure AWS Credentials

```bash
aws configure
```

Enter:
- **AWS Access Key ID:** [Your access key]
- **AWS Secret Access Key:** [Your secret key]
- **Default region:** `us-east-1` (or your preferred region)
- **Output format:** `json`

### Step 3: Create S3 Bucket

```bash
# Create bucket
aws s3 mb s3://screentimejourney-public --region us-east-1

# Remove public access block
aws s3api put-public-access-block \
    --bucket screentimejourney-public \
    --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

### Step 4: Upload File

```bash
aws s3 cp ScreenTimeJourney_Enhanced_20251110.mobileconfig \
    s3://screentimejourney-public/warp/ScreenTimeJourney_Protection.mobileconfig \
    --content-type "application/x-apple-aspen-config" \
    --acl public-read
```

### Step 5: Get URL

Your file will be available at:
```
https://screentimejourney-public.s3.us-east-1.amazonaws.com/warp/ScreenTimeJourney_Protection.mobileconfig
```

---

## 🌐 Using AWS Console (Web Interface)

If you prefer the GUI:

1. **Go to AWS Console:** https://console.aws.amazon.com/s3/

2. **Create Bucket:**
   - Click "Create bucket"
   - Name: `screentimejourney-public`
   - Region: Choose closest to your users
   - **Uncheck** "Block all public access"
   - Acknowledge the warning
   - Create bucket

3. **Upload File:**
   - Click on your bucket
   - Click "Upload"
   - Add file: `ScreenTimeJourney_Enhanced_20251110.mobileconfig`
   - Click "Upload"

4. **Make it Public:**
   - Click on the uploaded file
   - Go to "Permissions" tab
   - Click "Edit" under "Access control list (ACL)"
   - Check "Read" for "Everyone (public access)"
   - Save changes

5. **Set Content Type:**
   - Click on the file
   - Go to "Properties" tab
   - Edit "Metadata"
   - Add: `Content-Type: application/x-apple-aspen-config`
   - Save

6. **Get URL:**
   - Click on the file
   - Copy the "Object URL"
   - Example: `https://screentimejourney-public.s3.amazonaws.com/warp/ScreenTimeJourney_Protection.mobileconfig`

---

## 🎨 Custom Domain (Optional but Recommended)

Instead of the long S3 URL, use:
```
https://warp.screentimejourney.com/ScreenTimeJourney_Protection.mobileconfig
```

### Using CloudFront:

1. **Create CloudFront Distribution:**
   - Origin: Your S3 bucket
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Custom SSL Certificate (use ACM)

2. **Add CNAME:**
   - CNAME: `warp.screentimejourney.com`
   - Target: Your CloudFront distribution URL

3. **Update DNS:**
   - Add CNAME record in your DNS:
   - Name: `warp`
   - Value: `d111111abcdef8.cloudfront.net` (your CloudFront URL)

---

## ✅ Verify Upload

### Test the URL:

```bash
# Check if file is accessible
curl -I https://screentimejourney-public.s3.us-east-1.amazonaws.com/warp/ScreenTimeJourney_Protection.mobileconfig

# Should return:
# HTTP/1.1 200 OK
# Content-Type: application/x-apple-aspen-config
```

### Test on iPhone:

1. Open Safari on iPhone
2. Paste your S3 URL
3. Should prompt to download profile
4. Go to Settings > Profile Downloaded
5. Install!

---

## 🔒 Security Notes

### Public Access:
- File is public (anyone with URL can download)
- This is OK for mobile configs (they require user approval to install)
- Profile is safe - user sees what it does before installing

### Better Security (Optional):

1. **Use Pre-Signed URLs:**
   ```bash
   # Generate temporary URL (expires in 1 hour)
   aws s3 presign s3://screentimejourney-public/warp/ScreenTimeJourney_Protection.mobileconfig \
       --expires-in 3600
   ```

2. **Use CloudFront Signed URLs:**
   - Only users with valid link can download
   - Links expire after set time
   - Better for production

3. **Authenticate Users:**
   - Check if user has active subscription
   - Generate unique download link per user
   - Track who downloaded what

---

## 💰 Cost Estimate

For S3 + CloudFront:

**S3 Storage:**
- $0.023 per GB/month
- Your file: ~10KB = $0.0002/month

**S3 Requests:**
- $0.0004 per 1000 GET requests
- 1000 downloads = $0.0004

**CloudFront:**
- First 1TB/month = $0.085/GB
- First 10,000,000 requests = Free

**Total for 1000 users/month: < $0.10** ✅

---

## 🐛 Troubleshooting

### Error: "Access Denied"
**Solution:** Check bucket policy allows public read
```bash
aws s3api put-bucket-policy --bucket screentimejourney-public --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicRead",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::screentimejourney-public/*"
  }]
}'
```

### Error: "Invalid Content-Type"
**Solution:** Re-upload with correct MIME type:
```bash
--content-type "application/x-apple-aspen-config"
```

### iPhone won't download
**Solution:**
- Must use Safari (not Chrome)
- Must be HTTPS (S3 is HTTPS by default)
- Check Content-Type is set correctly

---

## 📋 Quick Reference

### Your URLs:

**S3 Direct:**
```
https://BUCKET-NAME.s3.REGION.amazonaws.com/PATH/FILE.mobileconfig
```

**Example:**
```
https://screentimejourney-public.s3.us-east-1.amazonaws.com/warp/ScreenTimeJourney_Protection.mobileconfig
```

**CloudFront (if configured):**
```
https://warp.screentimejourney.com/ScreenTimeJourney_Protection.mobileconfig
```

---

## 🚀 Next Steps

After uploading:

1. ✅ Test URL on iPhone
2. ✅ Update landing page with URL
3. ✅ Send test email with link
4. ✅ Monitor downloads (CloudWatch)
5. ✅ Set up CloudFront for better performance (optional)

---

Need help with any step? Let me know! 🎯














