# 🎬 Milestone Video Generation System

## Overview

This system generates personalized milestone achievement videos for Screen Time Journey users using AWS Lambda + FFmpeg + S3.

## Architecture

```
User Request → Shopify Widget → Lambda Function → FFmpeg Processing → S3 Upload → CloudFront → User
```

### Components

1. **Social Share Widget** (Liquid) - Displays achievement and triggers video generation
2. **Lambda Function** (Python) - Processes video generation requests
3. **FFmpeg Layer** - Video processing binary and fonts
4. **S3 Buckets** - Template storage and generated video hosting
5. **CloudFront** (Optional) - Fast global video delivery

## 📋 Prerequisites

- AWS CLI configured
- Python 3.11+
- Access to AWS account with Lambda, S3, and IAM permissions
- Template video file (MP4, 15-30 seconds, with background music)

## 🚀 Quick Start

### Step 1: Deploy Lambda Function

```bash
cd aws_lambda_api
chmod +x deploy_video_lambda.sh
./deploy_video_lambda.sh
```

This will:
- Create IAM role with S3 permissions
- Package and deploy Lambda function
- Create function URL for API access
- Configure CORS for browser requests

### Step 2: Create FFmpeg Lambda Layer

FFmpeg is needed for video processing but is not included by default.

**Option A: Use Pre-built Layer**

```bash
# Download pre-built FFmpeg layer for AWS Lambda
wget https://github.com/serverlesspub/ffmpeg-aws-lambda-layer/releases/download/v5.1/ffmpeg-lambda-layer.zip

# Publish layer
aws lambda publish-layer-version \
  --layer-name ffmpeg-lambda-layer \
  --zip-file fileb://ffmpeg-layer.zip \
  --compatible-runtimes python3.11 \
  --region eu-north-1
```

**Option B: Build Your Own**

```bash
# Create layer structure
mkdir -p ffmpeg-layer/bin ffmpeg-layer/fonts

# Add FFmpeg binary (compiled for Amazon Linux 2)
# Download from: https://johnvansickle.com/ffmpeg/
cp ffmpeg ffmpeg-layer/bin/

# Add fonts (Inter font family)
# Download from: https://fonts.google.com/specimen/Inter
cp Inter-*.ttf ffmpeg-layer/fonts/

# Create zip
cd ffmpeg-layer
zip -r ../ffmpeg-layer.zip .

# Publish
aws lambda publish-layer-version \
  --layer-name ffmpeg-lambda-layer \
  --zip-file fileb://ffmpeg-layer.zip \
  --compatible-runtimes python3.11 \
  --region eu-north-1
```

### Step 3: Create S3 Buckets

```bash
# Bucket for generated videos
aws s3 mb s3://stj-milestone-videos --region eu-north-1

# Bucket for template videos
aws s3 mb s3://stj-video-templates --region eu-north-1

# Enable public read for generated videos
aws s3api put-bucket-policy \
  --bucket stj-milestone-videos \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::stj-milestone-videos/*"
    }]
  }'
```

### Step 4: Upload Template Videos

Create your template video:
- Duration: 15-30 seconds
- Resolution: 1080x1920 (vertical/portrait for mobile)
- Format: MP4
- Include background music
- Keep text areas clear for overlays

```bash
# Upload male template
aws s3 cp milestone_template_male.mp4 \
  s3://stj-video-templates/templates/male/milestone_template.mp4

# Upload female template
aws s3 cp milestone_template_female.mp4 \
  s3://stj-video-templates/templates/female/milestone_template.mp4

# Upload default template
aws s3 cp milestone_template_default.mp4 \
  s3://stj-video-templates/templates/default/milestone_template.mp4
```

### Step 5: Update Social Share Widget

Update the API URL in the social share widget:

```javascript
// In social_share_widget.liquid, update:
const videoApiUrl = 'YOUR_LAMBDA_FUNCTION_URL_HERE';
```

### Step 6: (Optional) Set Up CloudFront

For faster global delivery and custom domain:

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name stj-milestone-videos.s3.eu-north-1.amazonaws.com \
  --default-root-object index.html

# Get distribution domain name
aws cloudfront list-distributions \
  --query "DistributionList.Items[0].DomainName" \
  --output text
```

Update Lambda environment variable:

```bash
aws lambda update-function-configuration \
  --function-name stj-milestone-video-generator \
  --environment "Variables={
    VIDEO_BUCKET_NAME=stj-milestone-videos,
    TEMPLATE_BUCKET_NAME=stj-video-templates,
    CLOUDFRONT_DOMAIN=d123456789abcd.cloudfront.net
  }" \
  --region eu-north-1
```

## 🎨 Customizing Video Overlays

### Text Overlay Configuration

Edit `generate_milestone_video_handler.py` to customize text positions, fonts, and timing:

```python
# Text positions (x, y coordinates)
positions = {
    'firstname': {'x': '(w-text_w)/2', 'y': 200},      # Top center
    'level': {'x': '(w-text_w)/2', 'y': 400},          # Center
    'days': {'x': 100, 'y': 650},                      # Bottom left
    'rank': {'x': 'w-text_w-100', 'y': 650},          # Bottom right
    'next_level': {'x': '(w-text_w)/2', 'y': 800}     # Bottom center
}

# Font sizes
font_size_large = 64
font_size_medium = 48
font_size_small = 36

# Timing (in seconds)
# Firstname: 0-3 seconds
# Level: 3-6 seconds
# Days: 6-9 seconds
# Rank: 9-12 seconds
# Next level: 12-15 seconds
```

### Adding More Text Fields

To add additional text overlays:

```python
# Add to overlays list
overlays.append(
    f"drawtext=text='Your Custom Text':"
    f"x=100:"
    f"y=900:"
    f"fontfile={font_path}:"
    f"fontsize=48:"
    f"fontcolor=white:"
    f"box=1:boxcolor=black@0.5:boxborderw=10:"
    f"enable='between(t,15,18)'"  # Show from 15-18 seconds
)
```

### Adding Emojis

FFmpeg has limited emoji support. Options:

1. **Use emoji in text** (may not render correctly)
2. **Use emoji images as overlays**:

```python
# Add emoji overlay
ffmpeg_cmd.extend([
    '-i', 'trophy_emoji.png',  # Emoji image
    '-filter_complex',
    '[0:v][1:v]overlay=x=100:y=100:enable=\'between(t,3,6)\''
])
```

3. **Use emoji font** (NotoColorEmoji.ttf in Lambda layer)

## 🧪 Testing

### Test Locally

```python
# Run test in generate_milestone_video_handler.py
python generate_milestone_video_handler.py
```

### Test Lambda Function

```bash
# Create test event
cat > test_video_event.json <<EOF
{
  "firstname": "Merijn",
  "level": 5,
  "days": 150,
  "rank": 6,
  "next_level": 6,
  "gender": "male"
}
EOF

# Invoke function
aws lambda invoke \
  --function-name stj-milestone-video-generator \
  --payload file://test_video_event.json \
  --region eu-north-1 \
  response.json

# Check response
cat response.json
```

### Test via HTTP

```bash
curl -X POST 'YOUR_LAMBDA_FUNCTION_URL' \
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

## 📊 Monitoring

### CloudWatch Logs

```bash
# View logs
aws logs tail /aws/lambda/stj-milestone-video-generator --follow
```

### Metrics to Monitor

- **Invocations**: Number of video generation requests
- **Duration**: Time to generate video (should be < 60s)
- **Errors**: Failed generations
- **Throttles**: Rate limit issues
- **Memory Usage**: Should stay under 3GB

## 💰 Cost Estimation

Based on AWS pricing (eu-north-1):

- **Lambda**: ~$0.20 per 1000 videos (3GB memory, 60s duration)
- **S3 Storage**: ~$0.023 per GB per month
- **S3 Transfer**: ~$0.09 per GB
- **CloudFront**: ~$0.085 per GB (optional)

**Example**: 1000 videos/month × 10MB each
- Lambda: $0.20
- S3 Storage: $0.23
- S3 Transfer: $0.90
- **Total**: ~$1.33/month

## 🔧 Troubleshooting

### Video Generation Fails

1. **Check FFmpeg layer**: Ensure layer is attached and binary exists at `/opt/bin/ffmpeg`
2. **Check template**: Verify template video exists in S3
3. **Check permissions**: Ensure Lambda role has S3 read/write access
4. **Check logs**: View CloudWatch logs for FFmpeg errors
5. **Check timeout**: Increase Lambda timeout if video is large

### Text Not Appearing

1. **Check font path**: Ensure font file exists at `/opt/fonts/Inter-Bold.ttf`
2. **Check positions**: Adjust x/y coordinates based on video resolution
3. **Check timing**: Verify enable='between(t,start,end)' ranges
4. **Check font color**: Ensure contrast with background

### Video Quality Issues

1. **Increase CRF**: Lower CRF value = higher quality (try 18-23)
2. **Change preset**: Use 'slow' or 'medium' instead of 'fast'
3. **Increase resolution**: Use higher resolution template

## 🚀 Advanced Features

### Multi-Language Support

Add language parameter and localized text:

```python
translations = {
    'en': {
        'hi': 'Hi',
        'level': 'Level',
        'days_strong': 'Days Strong',
        'globally': 'Globally'
    },
    'nl': {
        'hi': 'Hoi',
        'level': 'Niveau',
        'days_strong': 'Dagen Sterk',
        'globally': 'Wereldwijd'
    }
}
```

### Custom Animations

Add fade-in/fade-out effects:

```python
overlays.append(
    f"drawtext=text='Hi {firstname}':"
    f"x=(w-text_w)/2:y=200:"
    f"fontfile={font_path}:fontsize=64:fontcolor=white:"
    f"alpha='if(lt(t,1),t,if(lt(t,2.5),1,(3-t)*2))'"  # Fade in/out
)
```

### Video Analytics

Track video views using S3 access logs or CloudFront logs.

## 📚 Resources

- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [FFmpeg Text Filter](https://ffmpeg.org/ffmpeg-filters.html#drawtext)
- [AWS Lambda Layers](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html)
- [Pre-built FFmpeg Layer](https://github.com/serverlesspub/ffmpeg-aws-lambda-layer)

## 🆘 Support

If you encounter issues:

1. Check CloudWatch logs
2. Verify all AWS resources are in same region
3. Test FFmpeg command locally first
4. Ensure template video is valid MP4

## 📝 License

This implementation is part of Screen Time Journey system.










