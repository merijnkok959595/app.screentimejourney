# 🚀 Remotion Lambda Deployment Guide

Complete step-by-step guide to deploy your Milestone Video Generator.

---

## 📋 **Prerequisites**

### **1. AWS Credentials**
```bash
# Check if AWS is configured
aws sts get-caller-identity

# If not configured:
aws configure
```

Enter:
- **AWS Access Key ID**: Your AWS key
- **AWS Secret Access Key**: Your secret key
- **Default region**: `eu-north-1`
- **Output format**: `json`

### **2. Remotion Account**
1. Go to https://www.remotion.dev/
2. Sign up for free (30 renders/month free)
3. Get your API key (if needed for custom deployments)

---

## 🎬 **Deployment Steps**

### **Step 1: Test Locally (Recommended)**

```bash
cd remotion-video-generator

# Start preview
npm start
```

This opens **Remotion Studio** in your browser:
- ✅ See your video in real-time
- ✅ Adjust props (name, days, colors)
- ✅ Test animations
- ✅ Export sample videos

**Preview URL**: http://localhost:3000

---

### **Step 2: Deploy to AWS Lambda**

```bash
# Make sure you're in the remotion-video-generator directory
cd /Users/merijnkok/Desktop/screen-time-journey-workspace/remotion-video-generator

# Run deployment
./deploy.sh
```

**What this does:**
1. ✅ Bundles your Remotion project
2. ✅ Uploads to S3 as a "site"
3. ✅ Creates a Lambda function for rendering
4. ✅ Configures permissions and memory (2GB)
5. ✅ Returns ARN and Site URL

**Expected output:**
```
📦 Deploying Remotion site...
✅ Site deployed: https://remotion-stj-12345.s3.eu-north-1.amazonaws.com

⚡ Deploying Lambda function...
✅ Function deployed: arn:aws:lambda:eu-north-1:xxxx:function:remotion-render-12345

🎉 Deployment complete!
```

**⚠️ IMPORTANT: Copy these values!**
- **Site URL**: `https://remotion-stj-xxxxx.s3...`
- **Function ARN**: `arn:aws:lambda:eu-north-1:...:function:remotion-render-xxxxx`

---

### **Step 3: Update Main Lambda Environment Variables**

Go to your **AWS Lambda Console** for your main Lambda (`stj-main-lambda` or similar):

1. **Configuration** → **Environment variables** → **Edit**
2. Add these three variables:

| Key | Value |
|-----|-------|
| `REMOTION_LAMBDA_FUNCTION` | `remotion-render-xxxxx` (function name from ARN) |
| `REMOTION_SITE_URL` | `https://remotion-stj-xxxxx.s3.eu-north-1.amazonaws.com` |
| `REMOTION_REGION` | `eu-north-1` |

3. Click **Save**

---

### **Step 4: Update Lambda Permissions**

Your main Lambda needs permission to invoke the Remotion Lambda:

```bash
# Add invoke permission
aws lambda add-permission \
  --function-name remotion-render-xxxxx \
  --statement-id AllowMainLambdaInvoke \
  --action lambda:InvokeFunction \
  --principal lambda.amazonaws.com \
  --source-arn arn:aws:lambda:eu-north-1:YOUR_ACCOUNT:function:YOUR_MAIN_LAMBDA_NAME
```

**OR** add via AWS Console:
1. Go to Remotion Lambda → **Configuration** → **Permissions**
2. Click **Resource-based policy statements** → **Add permissions**
3. Allow invoke from your main Lambda

---

### **Step 5: Test Video Generation**

#### **Option A: Test via Shopify Widget**
1. Go to your social share page
2. Click "Download Reel"
3. Wait ~30-60 seconds
4. Video should download automatically

#### **Option B: Test Directly (Lambda Console)**
1. Go to AWS Lambda console
2. Open your **main Lambda** (not Remotion Lambda)
3. Create a test event:

```json
{
  "rawPath": "/generate_milestone_video",
  "body": "{\"customer_id\": \"test123\", \"firstname\": \"Merijn\", \"days\": 30, \"rank\": 15, \"gender\": \"male\", \"color_code\": \"2e2e2e\", \"next_color_code\": \"5b1b1b\"}"
}
```

4. Click **Test**
5. Check response for `video_url`

---

## 🔧 **Troubleshooting**

### **Issue: "Cannot find module 'remotion'"**
**Solution:**
```bash
cd remotion-video-generator
npm install
```

### **Issue: "AWS credentials not configured"**
**Solution:**
```bash
aws configure
# Enter your credentials
```

### **Issue: "Permission denied" when deploying**
**Solution:**
```bash
chmod +x deploy.sh
./deploy.sh
```

### **Issue: Video generation times out**
**Solution:**
1. Go to Remotion Lambda in AWS Console
2. **Configuration** → **General configuration** → **Edit**
3. Increase:
   - **Memory**: 3008 MB (from 2048 MB)
   - **Timeout**: 180 seconds (from 120 seconds)
4. Save and redeploy

### **Issue: "Function returned error"**
**Solution:**
1. Check CloudWatch Logs for Remotion Lambda
2. Look for errors in:
   - FFmpeg encoding
   - S3 upload
   - Missing fonts
3. Most common: increase memory/timeout

### **Issue: Video quality is low**
**Solution:**
Edit `remotion.config.ts`:
```typescript
Config.setVideoImageFormat('png');  // Higher quality
Config.setCrf(18);  // Lower CRF = higher quality (default: 23)
```

Then redeploy:
```bash
./deploy.sh
```

---

## 💰 **Cost Monitoring**

### **Track Costs:**
1. Go to AWS Cost Explorer
2. Filter by service: "Lambda" and "S3"
3. Look for:
   - `remotion-render-*` function invocations
   - S3 storage for videos

### **Expected Costs:**
- **Lambda**: $0.03-0.05 per video
- **S3 Storage**: $0.023/GB/month
- **Remotion License**: 
  - First 30 renders: FREE
  - Additional: $0.05/render
  - Unlimited (if >1000/month): $50/month

### **Cost-Saving Tips:**
1. **Delete old videos**: Set S3 lifecycle policy to delete videos after 7 days
2. **Cache videos**: If same user requests multiple times, check if video exists first
3. **Optimize duration**: Shorter videos = faster renders = lower cost

---

## 🔄 **Updating Your Video**

### **To Change Design/Animations:**
1. Edit `src/MilestoneReel.tsx`
2. Test locally: `npm start`
3. Redeploy: `./deploy.sh`

### **To Change Video Settings:**
Edit `src/Root.tsx`:
- Duration: Change `durationInFrames`
- FPS: Change `fps`
- Resolution: Change `width` and `height`

Then redeploy.

---

## 📊 **Monitoring**

### **View Logs:**
```bash
# Remotion Lambda logs
aws logs tail /aws/lambda/remotion-render-xxxxx --follow

# Main Lambda logs
aws logs tail /aws/lambda/YOUR_MAIN_LAMBDA_NAME --follow
```

### **Check Recent Renders:**
```bash
# List recent videos in S3
aws s3 ls s3://YOUR_BUCKET/milestone_videos/ --recursive --human-readable
```

---

## ✅ **Next Steps**

After deployment:
1. ✅ Test video generation from widget
2. ✅ Monitor CloudWatch logs for errors
3. ✅ Check AWS billing for costs
4. ✅ Set up S3 lifecycle policy to auto-delete old videos
5. ✅ (Optional) Add CDN (CloudFront) for faster video delivery

---

## 🎉 **Success Checklist**

- [ ] AWS credentials configured
- [ ] Remotion dependencies installed (`npm install`)
- [ ] Local preview works (`npm start`)
- [ ] Remotion Lambda deployed (`./deploy.sh`)
- [ ] Environment variables set in main Lambda
- [ ] Lambda permissions configured
- [ ] Test video generated successfully
- [ ] Widget "Download Reel" button works

**🚀 You're ready to generate stunning milestone videos!**










