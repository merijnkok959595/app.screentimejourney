# 🎬 Milestone Video Generation System

> **Automatically generate personalized milestone achievement videos for Screen Time Journey users**

## What is This?

This system automatically creates personalized videos when users reach milestones, showing their achievements with dynamic text overlays. Users can then share these videos on social media (Instagram, TikTok, WhatsApp, etc.) to celebrate their progress.

## Features

✅ **Personalized Videos** - Each video includes user's name, level, days, global rank  
✅ **Professional Quality** - 1080x1920 HD videos optimized for social media  
✅ **Fast Generation** - Videos ready in < 60 seconds  
✅ **Social Sharing** - One-click sharing to WhatsApp, Twitter, Facebook  
✅ **Scalable** - Handles thousands of videos per month  
✅ **Cost-Effective** - ~$0.002 per video, $1-15/month total  
✅ **Customizable** - Easy to customize templates, text, timing  

## Quick Start

### 1. Deploy (15 minutes)

```bash
# Deploy Lambda function
cd aws_lambda_api
./deploy_video_lambda.sh

# Create test template
./create_test_template.sh

# Upload template
aws s3 cp milestone_template_test.mp4 \
  s3://stj-video-templates/templates/default/milestone_template.mp4

# Test
python test_video_generation.py
```

### 2. Use

Visit share page with user data:
```
https://screentimejourney.com/pages/milestone-share?
  firstname=John&level=5&days=150&rank=6&next_level=6&gender=male
```

Click "Generate Milestone Reel" → Video generated → Share on social media 🎉

## How It Works

```
User Reaches Milestone
        ↓
Redirect to Share Page (with query params)
        ↓
User Clicks "Generate Milestone Reel"
        ↓
Lambda Function Called
        ↓
FFmpeg Generates Video with Text Overlays
        ↓
Video Uploaded to S3
        ↓
User Downloads/Shares Video
```

## Project Structure

```
aws_lambda_api/
├── generate_milestone_video_handler.py  ← Lambda function
├── deploy_video_lambda.sh               ← Deployment script
├── create_test_template.sh              ← Create test template
├── test_video_generation.py             ← Test suite
├── MILESTONE_VIDEO_SETUP.md             ← Full setup guide
├── MILESTONE_VIDEO_QUICK_START.md       ← 15-min quick start
└── VIDEO_TEMPLATE_GUIDE.md              ← Template creation

shopify-leaderboard-app/commitment-widget/extensions/milestones/blocks/
└── social_share_widget.liquid           ← Shopify widget

MILESTONE_VIDEO_SYSTEM_OVERVIEW.md       ← Complete overview
MILESTONE_VIDEO_DEPLOYMENT_CHECKLIST.md  ← Deployment checklist
```

## Documentation

| Document | Purpose | Duration |
|----------|---------|----------|
| [Quick Start](aws_lambda_api/MILESTONE_VIDEO_QUICK_START.md) | Get started in 15 minutes | 15 min |
| [Setup Guide](aws_lambda_api/MILESTONE_VIDEO_SETUP.md) | Complete setup instructions | 30 min |
| [Template Guide](aws_lambda_api/VIDEO_TEMPLATE_GUIDE.md) | Create custom templates | 45 min |
| [System Overview](MILESTONE_VIDEO_SYSTEM_OVERVIEW.md) | Architecture & features | 10 min |
| [Deployment Checklist](MILESTONE_VIDEO_DEPLOYMENT_CHECKLIST.md) | Step-by-step deployment | 90 min |

## Example Video

Generated video includes:
- **0-3s**: "Hi [Name]!" greeting
- **3-6s**: "Level X 🏆" achievement
- **6-9s**: "[X] Days Strong 💪" persistence
- **9-12s**: "Top X% Globally 🌍" ranking  
- **12-15s**: "Next: Level X 🎯" motivation

All overlaid on a beautiful animated background with music.

## Requirements

### AWS Resources
- Lambda function (Python 3.11)
- S3 buckets (2x: templates + generated videos)
- FFmpeg Lambda layer
- IAM role with S3 permissions

### Local Development
- Python 3.11+
- FFmpeg (for testing)
- AWS CLI configured

## Cost

Based on AWS pricing (eu-north-1):

| Usage | Monthly Cost |
|-------|--------------|
| 100 videos | $0.13 |
| 1,000 videos | $1.33 |
| 10,000 videos | $13.30 |

**Components:**
- Lambda: $0.0002 per video
- S3 Storage: $0.023 per GB/month
- S3 Transfer: $0.09 per GB

## Customization

### Change Text Positions

Edit `generate_milestone_video_handler.py`:
```python
positions = {
    'firstname': {'x': '(w-text_w)/2', 'y': 200},
    'level': {'x': '(w-text_w)/2', 'y': 400},
    # ... adjust as needed
}
```

### Change Text Timing

```python
# Show text from 0-3 seconds
enable='between(t,0,3)'

# Show text from 6-9 seconds
enable='between(t,6,9)'
```

### Create Custom Templates

See [Template Guide](aws_lambda_api/VIDEO_TEMPLATE_GUIDE.md) for:
- Video specs (1080x1920, 15s, MP4)
- Design guidelines
- Export settings
- Tool recommendations

## Monitoring

### View Logs
```bash
aws logs tail /aws/lambda/stj-milestone-video-generator --follow
```

### Check Metrics
- AWS Console → Lambda → stj-milestone-video-generator → Monitor
- Track: Invocations, Duration, Errors, Cost

### Storage Usage
```bash
aws s3 ls s3://stj-milestone-videos/ --recursive --summarize
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Video generation failed" | Check CloudWatch logs, verify template exists |
| Text not visible | Adjust positions in handler, check font contrast |
| Timeout error | Increase Lambda timeout (max 300s) |
| Poor quality | Lower CRF value (18-23) in handler |

## Integration

### WhatsApp Notifications
```python
share_url = f"https://screentimejourney.com/pages/milestone-share?" + \
    f"firstname={name}&level={level}&days={days}&rank={rank}&..."
message += f"\n\n🎬 Share your achievement: {share_url}"
```

### Email Templates
```html
<a href="{{share_url}}">🎬 View & Share Your Achievement</a>
```

### Account Dashboard
Add "Share My Achievement" button with current user stats.

## Testing

```bash
# Run full test suite
cd aws_lambda_api
python test_video_generation.py

# Test single video
curl -X POST 'YOUR_LAMBDA_URL' \
  -H 'Content-Type: application/json' \
  -d '{"firstname":"Test","level":5,"days":150,"rank":6,"next_level":6,"gender":"male"}'
```

## Support

**Documentation:**
- [Quick Start Guide](aws_lambda_api/MILESTONE_VIDEO_QUICK_START.md)
- [Complete Setup](aws_lambda_api/MILESTONE_VIDEO_SETUP.md)
- [Template Creation](aws_lambda_api/VIDEO_TEMPLATE_GUIDE.md)
- [System Overview](MILESTONE_VIDEO_SYSTEM_OVERVIEW.md)

**Tools:**
- `deploy_video_lambda.sh` - Deploy/update Lambda
- `create_test_template.sh` - Generate test template
- `test_video_generation.py` - Test video generation

**AWS Resources:**
- CloudWatch Logs: View errors and debug
- S3 Console: View generated videos
- Lambda Console: Update configuration

## Contributing

To add features:
1. Update `generate_milestone_video_handler.py`
2. Test locally with `test_video_generation.py`
3. Deploy with `./deploy_video_lambda.sh`
4. Update documentation

## License

Part of Screen Time Journey system.

---

## Quick Links

- 📘 [System Overview](MILESTONE_VIDEO_SYSTEM_OVERVIEW.md)
- 🚀 [Quick Start (15 min)](aws_lambda_api/MILESTONE_VIDEO_QUICK_START.md)
- 📖 [Complete Setup (30 min)](aws_lambda_api/MILESTONE_VIDEO_SETUP.md)
- 🎨 [Template Guide](aws_lambda_api/VIDEO_TEMPLATE_GUIDE.md)
- ✅ [Deployment Checklist](MILESTONE_VIDEO_DEPLOYMENT_CHECKLIST.md)

---

**Ready to launch!** Deploy in 15 minutes and start generating personalized milestone videos for your users. 🎉










