# 🚀 Milestone Video System - Deployment Checklist

## Pre-Deployment Checklist

### AWS Prerequisites
- [ ] AWS CLI installed and configured
- [ ] AWS account with sufficient permissions (Lambda, S3, IAM)
- [ ] Chosen AWS region (e.g., eu-north-1)
- [ ] Billing alerts set up (optional but recommended)

### Local Prerequisites
- [ ] Python 3.11+ installed
- [ ] FFmpeg installed (for local testing)
- [ ] Git repository up to date
- [ ] Video editing software (for creating templates)

---

## Deployment Steps

### Phase 1: AWS Infrastructure (30 minutes)

#### Step 1.1: Deploy Lambda Function
```bash
cd aws_lambda_api
./deploy_video_lambda.sh
```

**Verify:**
- [ ] Lambda function created successfully
- [ ] Function URL generated
- [ ] IAM role created with correct permissions
- [ ] Environment variables set

**Copy for later:**
```
Function URL: _________________________________
```

#### Step 1.2: Create FFmpeg Layer
```bash
# Download layer
wget https://github.com/serverlesspub/ffmpeg-aws-lambda-layer/releases/download/v5.1/ffmpeg-lambda-layer.zip

# Publish
aws lambda publish-layer-version \
  --layer-name ffmpeg-lambda-layer \
  --zip-file fileb://ffmpeg-layer.zip \
  --compatible-runtimes python3.11 \
  --region eu-north-1
```

**Verify:**
- [ ] Layer published successfully
- [ ] Layer attached to Lambda function
- [ ] FFmpeg binary accessible at /opt/bin/ffmpeg

**Copy for later:**
```
Layer ARN: _________________________________
```

#### Step 1.3: Create S3 Buckets
```bash
# Create buckets
aws s3 mb s3://stj-milestone-videos --region eu-north-1
aws s3 mb s3://stj-video-templates --region eu-north-1

# Set public read policy
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

**Verify:**
- [ ] Both buckets created
- [ ] Public read policy applied to stj-milestone-videos
- [ ] Buckets in correct region
- [ ] CORS configured (if needed)

#### Step 1.4: (Optional) Set Up CloudFront
```bash
aws cloudfront create-distribution \
  --origin-domain-name stj-milestone-videos.s3.eu-north-1.amazonaws.com \
  --default-cache-behavior "ViewerProtocolPolicy=redirect-to-https,AllowedMethods={Quantity=2,Items=[GET,HEAD]}"
```

**Verify:**
- [ ] Distribution created
- [ ] Distribution deployed (takes 10-15 minutes)
- [ ] Custom domain configured (optional)

**Copy for later:**
```
CloudFront Domain: _________________________________
```

---

### Phase 2: Video Templates (45 minutes)

#### Step 2.1: Create Test Template (Quick)
```bash
cd aws_lambda_api
./create_test_template.sh
```

**Verify:**
- [ ] Test template generated
- [ ] File is MP4, 1080x1920, 15 seconds
- [ ] File size under 50MB

#### Step 2.2: Upload Test Template
```bash
aws s3 cp milestone_template_test.mp4 \
  s3://stj-video-templates/templates/default/milestone_template.mp4

aws s3 cp milestone_template_test.mp4 \
  s3://stj-video-templates/templates/male/milestone_template.mp4

aws s3 cp milestone_template_test.mp4 \
  s3://stj-video-templates/templates/female/milestone_template.mp4
```

**Verify:**
- [ ] Templates uploaded to all three paths
- [ ] Files accessible via S3 console
- [ ] Correct bucket and region

#### Step 2.3: Create Professional Templates (Later)
See `VIDEO_TEMPLATE_GUIDE.md` for detailed instructions.

**Tasks:**
- [ ] Create male journey template
- [ ] Create female journey template
- [ ] Create default/neutral template
- [ ] Test templates with FFmpeg locally
- [ ] Upload to S3

---

### Phase 3: Testing (20 minutes)

#### Step 3.1: Test Lambda Function
```bash
cd aws_lambda_api

# Update test_video_generation.py with your Lambda URL
# LAMBDA_URL = "your-function-url-here"

python test_video_generation.py
```

**Verify:**
- [ ] All tests pass
- [ ] Videos generated successfully
- [ ] Video URLs accessible
- [ ] Videos play correctly
- [ ] Text overlays visible and positioned correctly

#### Step 3.2: Test via curl
```bash
curl -X POST 'YOUR_FUNCTION_URL' \
  -H 'Content-Type: application/json' \
  -d '{
    "firstname": "TestUser",
    "level": 5,
    "days": 150,
    "rank": 6,
    "next_level": 6,
    "gender": "male"
  }'
```

**Verify:**
- [ ] Status code 200
- [ ] video_url returned
- [ ] Video accessible at URL
- [ ] Video quality acceptable

---

### Phase 4: Shopify Integration (15 minutes)

#### Step 4.1: Verify Widget Exists
```bash
ls shopify-leaderboard-app/commitment-widget/extensions/milestones/blocks/social_share_widget.liquid
```

**Verify:**
- [ ] File exists
- [ ] Widget code looks correct
- [ ] Styling matches .cursorrules

#### Step 4.2: Update API URL (if needed)

If you're using a separate Lambda function for video generation:

Edit `social_share_widget.liquid` line ~337:
```javascript
const apiUrl = 'YOUR_FUNCTION_URL_HERE';
```

Or keep using the main API endpoint and add video generation to the main Lambda handler.

#### Step 4.3: Deploy to Shopify
```bash
cd shopify-leaderboard-app
shopify app deploy
```

**Verify:**
- [ ] Theme extension deployed
- [ ] Widget appears in Shopify theme editor
- [ ] Widget can be added to pages

#### Step 4.4: Create Share Page

In Shopify admin:
1. Create new page: `milestone-share`
2. Add "Social Share Widget" block
3. Publish page

**Verify:**
- [ ] Page created
- [ ] Widget displays correctly
- [ ] Page accepts query parameters

---

### Phase 5: End-to-End Testing (30 minutes)

#### Step 5.1: Test Full Flow

Visit share page with test data:
```
https://your-store.com/pages/milestone-share?firstname=TestUser&level=5&days=150&rank=6&next_level=6&gender=male
```

**Test:**
- [ ] Page loads correctly
- [ ] User data displays properly
- [ ] Stats show correct values
- [ ] Milestone image/description loads
- [ ] "Generate Milestone Reel" button works
- [ ] Video generates (watch progress indicator)
- [ ] Video plays in preview
- [ ] Download button works
- [ ] Social share buttons work
  - [ ] WhatsApp
  - [ ] Twitter/X
  - [ ] Facebook
  - [ ] Copy link

#### Step 5.2: Test on Mobile

Test on actual devices:
- [ ] iPhone (Safari)
- [ ] Android (Chrome)

**Verify:**
- [ ] Page responsive
- [ ] Video generates
- [ ] Video plays
- [ ] Sharing works

#### Step 5.3: Test Different Scenarios

Test with various inputs:
- [ ] Different names (short, long, special characters)
- [ ] Different levels (0-10)
- [ ] Different genders (male, female)
- [ ] Edge cases (level 0, level 10, high rank, low rank)

---

### Phase 6: Integration with Existing System (30 minutes)

#### Step 6.1: Update Milestone Notifications

Edit `milestone_notifications.py` to include share link:

```python
share_url = f"https://screentimejourney.com/pages/milestone-share?" + \
    f"firstname={customer_firstname}&" + \
    f"level={milestone_reached}&" + \
    f"days={days_on_journey}&" + \
    f"rank={global_rank}&" + \
    f"next_level={milestone_reached + 1}&" + \
    f"gender={gender}"

message += f"\n\n🎬 View and share your achievement:\n{share_url}"
```

#### Step 6.2: Update Email Template

Add share button to `email_template.html`:

```html
<a href="{{share_url}}" style="...">
  🎬 View & Share Your Achievement
</a>
```

#### Step 6.3: Update Account Dashboard

Add "Share My Achievement" button in account dashboard that links to share page with current user data.

**Verify:**
- [ ] Links include all required parameters
- [ ] URLs are properly encoded
- [ ] Users receive share links in notifications
- [ ] Links work when clicked

---

### Phase 7: Monitoring Setup (20 minutes)

#### Step 7.1: Set Up CloudWatch Alarms

```bash
# Error alarm
aws cloudwatch put-metric-alarm \
  --alarm-name stj-video-generation-errors \
  --alarm-description "Alert on video generation errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1

# Duration alarm (videos taking too long)
aws cloudwatch put-metric-alarm \
  --alarm-name stj-video-generation-slow \
  --alarm-description "Alert on slow video generation" \
  --metric-name Duration \
  --namespace AWS/Lambda \
  --statistic Average \
  --period 300 \
  --threshold 60000 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

**Verify:**
- [ ] Alarms created
- [ ] SNS topics configured (for notifications)
- [ ] Test alarms work

#### Step 7.2: Set Up Cost Alerts

In AWS Console:
1. Go to Billing → Budgets
2. Create budget for Lambda/S3
3. Set threshold alerts

**Verify:**
- [ ] Budget created
- [ ] Email alerts configured
- [ ] Threshold appropriate for usage

#### Step 7.3: Enable S3 Access Logging (Optional)

```bash
aws s3api put-bucket-logging \
  --bucket stj-milestone-videos \
  --bucket-logging-status '{
    "LoggingEnabled": {
      "TargetBucket": "stj-access-logs",
      "TargetPrefix": "milestone-videos/"
    }
  }'
```

---

### Phase 8: Documentation & Handoff (15 minutes)

#### Step 8.1: Document Configuration

Create configuration document with:
- [ ] Lambda function URL
- [ ] S3 bucket names
- [ ] CloudFront domain (if used)
- [ ] IAM role ARN
- [ ] Layer ARN
- [ ] Region
- [ ] Shopify page URL

#### Step 8.2: Create Runbook

Document common tasks:
- [ ] How to update Lambda function
- [ ] How to upload new templates
- [ ] How to check logs
- [ ] How to troubleshoot common issues
- [ ] How to update text positions/styling

#### Step 8.3: Train Team

Brief team on:
- [ ] What the system does
- [ ] How to use share links
- [ ] How to monitor performance
- [ ] Where to find logs
- [ ] Who to contact for issues

---

## Post-Deployment Checklist

### Week 1: Monitor Closely

Daily checks:
- [ ] Check CloudWatch logs for errors
- [ ] Monitor video generation success rate
- [ ] Check S3 storage usage
- [ ] Review user feedback
- [ ] Test random generated videos

### Week 2-4: Optimize

Tasks:
- [ ] Replace test templates with professional ones
- [ ] A/B test different template styles
- [ ] Optimize Lambda timeout/memory
- [ ] Review costs and adjust as needed
- [ ] Implement any user-requested features

### Month 2+: Scale

Tasks:
- [ ] Add level-specific templates
- [ ] Implement multi-language support
- [ ] Add analytics tracking
- [ ] Create seasonal templates
- [ ] Optimize costs further

---

## Success Criteria

✅ **Functional:**
- [ ] Videos generate successfully (>95% success rate)
- [ ] Generation time < 60 seconds
- [ ] Videos are shareable on all platforms
- [ ] Text overlays clearly visible
- [ ] No broken links or errors

✅ **Performance:**
- [ ] Lambda cold starts < 5 seconds
- [ ] Average generation time < 45 seconds
- [ ] Video file size < 30MB
- [ ] Page load time < 3 seconds

✅ **Cost:**
- [ ] Cost per video < $0.002
- [ ] Monthly cost within budget
- [ ] No surprise charges

✅ **User Experience:**
- [ ] Share page loads quickly
- [ ] Videos look professional
- [ ] Social sharing works seamlessly
- [ ] Mobile experience excellent

---

## Rollback Plan

If issues arise:

### Immediate (< 5 minutes)
1. Disable widget in Shopify theme editor
2. Remove share links from notifications
3. Investigate issue via CloudWatch logs

### Short-term (< 1 hour)
1. Revert Lambda function to previous version
2. Restore previous template videos
3. Update API URL if needed

### Communication
1. Notify team of issue
2. Post status update for users
3. Provide ETA for resolution

---

## Support Contacts

**Primary:**
- AWS Console: https://console.aws.amazon.com
- CloudWatch Logs: /aws/lambda/stj-milestone-video-generator

**Documentation:**
- Setup Guide: `MILESTONE_VIDEO_SETUP.md`
- Template Guide: `VIDEO_TEMPLATE_GUIDE.md`
- Quick Start: `MILESTONE_VIDEO_QUICK_START.md`
- Overview: `MILESTONE_VIDEO_SYSTEM_OVERVIEW.md`

**Tools:**
- Deployment: `deploy_video_lambda.sh`
- Testing: `test_video_generation.py`
- Template Creation: `create_test_template.sh`

---

## Final Sign-off

Deployment completed by: _________________________________

Date: _________________________________

Verified by: _________________________________

Notes:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Status:** ☐ Ready for Production  ☐ Needs More Testing  ☐ Blocked

---

**Congratulations on deploying the Milestone Video System!** 🎉










