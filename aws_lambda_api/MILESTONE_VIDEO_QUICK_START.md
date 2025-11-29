# 🚀 Milestone Video Generation - Quick Start

## 1️⃣ One-Time Setup (30 minutes)

### A. Deploy Lambda Function

```bash
cd aws_lambda_api
./deploy_video_lambda.sh
```

**Copy the Function URL** from the output - you'll need it later.

### B. Create FFmpeg Layer

```bash
# Download pre-built layer
wget https://github.com/serverlesspub/ffmpeg-aws-lambda-layer/releases/download/v5.1/ffmpeg-lambda-layer.zip

# Publish to AWS
aws lambda publish-layer-version \
  --layer-name ffmpeg-lambda-layer \
  --zip-file fileb://ffmpeg-layer.zip \
  --compatible-runtimes python3.11 \
  --region eu-north-1
```

### C. Create S3 Buckets

```bash
# Create buckets
aws s3 mb s3://stj-milestone-videos --region eu-north-1
aws s3 mb s3://stj-video-templates --region eu-north-1

# Make videos publicly accessible
aws s3api put-bucket-policy --bucket stj-milestone-videos --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::stj-milestone-videos/*"
  }]
}'
```

### D. Create Test Template

```bash
# Generate a simple test template
./create_test_template.sh

# Upload to S3
aws s3 cp milestone_template_test.mp4 \
  s3://stj-video-templates/templates/default/milestone_template.mp4

# Also for male/female
aws s3 cp milestone_template_test.mp4 \
  s3://stj-video-templates/templates/male/milestone_template.mp4
aws s3 cp milestone_template_test.mp4 \
  s3://stj-video-templates/templates/female/milestone_template.mp4
```

### E. Update Widget

Edit `shopify-leaderboard-app/commitment-widget/extensions/milestones/blocks/social_share_widget.liquid`

Find this line:
```javascript
const apiUrl = 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws';
```

Update the Lambda endpoint to point to your video generation function URL, or add it to the existing Lambda router.

---

## 2️⃣ Test It

### Test Lambda Directly

```bash
curl -X POST 'YOUR_FUNCTION_URL' \
  -H 'Content-Type: application/json' \
  -d '{
    "firstname": "Merijn",
    "level": 5,
    "days": 150,
    "rank": 6,
    "next_level": 6,
    "gender": "male"
  }'
```

Expected response:
```json
{
  "success": true,
  "video_url": "https://s3.eu-north-1.amazonaws.com/stj-milestone-videos/...",
  "video_id": "Merijn_5_a1b2c3d4",
  "message": "Video generated successfully"
}
```

### Test Widget

1. Create a test page on Shopify
2. Add the "Social Share Widget" block
3. Visit the page with URL params:
   ```
   https://your-store.com/pages/share?firstname=Merijn&level=5&days=150&rank=6&next_level=6&gender=male
   ```
4. Click "Generate Milestone Reel"
5. Video should generate and display

---

## 3️⃣ Usage

### From Shopify

When a user reaches a milestone, redirect them to:

```
https://screentimejourney.com/pages/milestone-share?firstname=John&level=3&days=90&rank=12&next_level=4&gender=male
```

### From Email/WhatsApp

Include personalized link in milestone notifications:

```
🎉 Congratulations! You've reached Level 3!

View and share your achievement:
https://screentimejourney.com/pages/milestone-share?firstname=John&level=3&...
```

---

## 4️⃣ Customization

### Update Text Positions

Edit `generate_milestone_video_handler.py`:

```python
positions = {
    'firstname': {'x': '(w-text_w)/2', 'y': 200},  # Top center
    'level': {'x': '(w-text_w)/2', 'y': 400},      # Center
    # ... adjust as needed
}
```

Redeploy:
```bash
./deploy_video_lambda.sh
```

### Create Better Templates

See `VIDEO_TEMPLATE_GUIDE.md` for detailed instructions.

Upload to S3:
```bash
aws s3 cp your_template.mp4 \
  s3://stj-video-templates/templates/male/milestone_template.mp4
```

---

## 5️⃣ Monitoring

### View Logs

```bash
aws logs tail /aws/lambda/stj-milestone-video-generator --follow
```

### Check S3 Usage

```bash
# List generated videos
aws s3 ls s3://stj-milestone-videos/generated/ --recursive --human-readable

# Get total size
aws s3 ls s3://stj-milestone-videos/ --recursive --summarize
```

### CloudWatch Metrics

View in AWS Console:
- Lambda > Functions > stj-milestone-video-generator > Monitor

Key metrics:
- Invocations
- Duration (should be < 60s)
- Errors
- Throttles

---

## 🔧 Troubleshooting

### "Video generation failed"

1. **Check logs:**
   ```bash
   aws logs tail /aws/lambda/stj-milestone-video-generator
   ```

2. **Common issues:**
   - FFmpeg layer not attached → Redeploy with layer
   - Template not found → Check S3 bucket and path
   - Timeout → Increase Lambda timeout
   - Permission denied → Check IAM role

### "Text not visible"

1. **Test FFmpeg locally:**
   ```bash
   ffmpeg -i template.mp4 \
     -vf "drawtext=text='Test':x=100:y=100:fontsize=64:fontcolor=white:box=1:boxcolor=black@0.5" \
     test.mp4
   ```

2. **Check:**
   - Font file exists in layer
   - Text coordinates within video bounds
   - Font color contrasts with background

### "Video quality is poor"

Edit Lambda handler:
```python
# Change CRF (lower = better quality)
'-crf', '18',  # Instead of '23'

# Change preset (slower = better quality)
'-preset', 'medium',  # Instead of 'fast'
```

---

## 💰 Cost Estimate

**Monthly cost for 1,000 videos:**

| Service | Cost |
|---------|------|
| Lambda (60s, 3GB) | $0.20 |
| S3 Storage (10GB) | $0.23 |
| S3 Data Transfer | $0.90 |
| **Total** | **~$1.33** |

---

## 📚 Full Documentation

- **Setup Guide**: `MILESTONE_VIDEO_SETUP.md`
- **Template Creation**: `VIDEO_TEMPLATE_GUIDE.md`
- **Lambda Code**: `generate_milestone_video_handler.py`

---

## 🆘 Need Help?

1. Check CloudWatch logs
2. Review `MILESTONE_VIDEO_SETUP.md`
3. Test FFmpeg command locally
4. Verify S3 bucket permissions
5. Ensure all resources in same AWS region

---

## ✅ Checklist

- [ ] Lambda function deployed
- [ ] FFmpeg layer attached
- [ ] S3 buckets created
- [ ] Template video uploaded
- [ ] Widget updated with function URL
- [ ] Test video generated successfully
- [ ] Monitoring set up

**Setup complete!** 🎉

Now users can generate and share personalized milestone videos automatically.










