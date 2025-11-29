# Video Reel Generation Implementation Guide

## Current Status
✅ Widget UI ready with "Download Reel" button
✅ API endpoint `/generate_milestone_video` exists (placeholder)
✅ Data flow from widget to Lambda working
❌ Actual video generation not implemented yet

---

## Implementation Options

### Option 1: AWS Lambda + FFmpeg (Best for Custom Reels)

**Architecture:**
```
Widget → Lambda → FFmpeg → S3 → Return URL → Widget displays video
```

**What You Need:**

1. **FFmpeg Lambda Layer**
   - Pre-compiled FFmpeg binary for Lambda
   - Download: https://github.com/serverlesspub/ffmpeg-aws-lambda-layer
   - Or use: `arn:aws:lambda:eu-north-1:145266761615:layer:ffmpeg:4`

2. **Base Video Template**
   - Create a 15-second MP4 template (1080x1920 for mobile)
   - Upload to S3: `s3://wati-files/video-templates/base-template.mp4`
   - Can include background music/animation

3. **Font Files for Text**
   - Upload fonts to S3 or include in Lambda
   - Inter or Roboto recommended

4. **Update Lambda Function**
   ```python
   import subprocess
   import boto3
   import os
   from datetime import datetime
   
   def generate_milestone_video(payload):
       """Generate personalized milestone video using FFmpeg"""
       
       # Extract user data
       firstname = payload.get('firstname', 'Champion')
       level = payload.get('level', 0)
       days = payload.get('days', 0)
       rank = payload.get('rank', 100)
       current_title = payload.get('current_title', 'Ground Zero')
       current_emoji = payload.get('current_emoji', '🪨')
       next_title = payload.get('next_title', 'Fighter')
       next_emoji = payload.get('next_emoji', '🥊')
       color_code = payload.get('color_code', '2e2e2e')
       next_color_code = payload.get('next_color_code', '5b1b1b')
       
       # Generate unique filename
       timestamp = int(datetime.now().timestamp())
       output_filename = f"milestone-{customer_id}-{timestamp}.mp4"
       
       # Download base template from S3
       s3 = boto3.client('s3')
       template_path = '/tmp/template.mp4'
       s3.download_file('wati-files', 'video-templates/base-template.mp4', template_path)
       
       # Output path
       output_path = f'/tmp/{output_filename}'
       
       # Build FFmpeg command
       ffmpeg_cmd = [
           '/opt/bin/ffmpeg',  # FFmpeg layer path
           '-i', template_path,
           '-vf',
           f"drawtext=text='{firstname}':x=(w-text_w)/2:y=200:fontsize=72:fontcolor=white:fontfile=/opt/fonts/Inter-Bold.ttf,"
           f"drawtext=text='Top {rank}% in the world 🌍':x=(w-text_w)/2:y=400:fontsize=48:fontcolor=white:fontfile=/opt/fonts/Inter-Regular.ttf,"
           f"drawtext=text='{current_title} {current_emoji}':x=(w-text_w)/2:y=600:fontsize=64:fontcolor=#{color_code}:fontfile=/opt/fonts/Inter-Bold.ttf,"
           f"drawtext=text='{days} days in focus':x=(w-text_w)/2:y=800:fontsize=48:fontcolor=white:fontfile=/opt/fonts/Inter-Regular.ttf,"
           f"drawtext=text='Next: {next_title} {next_emoji}':x=(w-text_w)/2:y=1000:fontsize=48:fontcolor=#{next_color_code}:fontfile=/opt/fonts/Inter-Regular.ttf",
           '-codec:a', 'copy',  # Keep original audio
           '-y',  # Overwrite output
           output_path
       ]
       
       # Run FFmpeg
       result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
       
       if result.returncode != 0:
           raise Exception(f"FFmpeg failed: {result.stderr}")
       
       # Upload to S3
       s3.upload_file(
           output_path,
           'wati-files',
           f'milestone-videos/{output_filename}',
           ExtraArgs={'ContentType': 'video/mp4', 'ACL': 'public-read'}
       )
       
       # Generate URL
       video_url = f"https://wati-files.s3.eu-north-1.amazonaws.com/milestone-videos/{output_filename}"
       
       # Clean up
       os.remove(template_path)
       os.remove(output_path)
       
       return {
           'statusCode': 200,
           'body': json.dumps({
               'success': True,
               'video_url': video_url,
               'message': 'Video generated successfully'
           })
       }
   ```

5. **Deploy Steps:**
   ```bash
   # Add FFmpeg layer to Lambda
   aws lambda update-function-configuration \
     --function-name mk_shopify_web_app \
     --layers arn:aws:lambda:eu-north-1:145266761615:layer:ffmpeg:4
   
   # Increase timeout (video generation takes time)
   aws lambda update-function-configuration \
     --function-name mk_shopify_web_app \
     --timeout 300 \
     --memory-size 1024
   
   # Update Lambda code
   cd aws_lambda_api
   bash deploy_main_lambda.sh
   ```

**Pros:**
- ✅ Fully customizable
- ✅ No external dependencies
- ✅ Fast (15-30 seconds per video)
- ✅ Cost-effective (~$0.001 per video)

**Cons:**
- ❌ Requires FFmpeg setup
- ❌ Need to create base template
- ❌ Lambda timeout limits (15 min max)

---

### Option 2: Use External Video API (Easiest to Start)

**Services to Consider:**
- **Bannerbear** - Template-based video generation
- **Shotstack** - Video editing API
- **Creatomate** - Automated video production

**Example with Bannerbear:**
```python
import requests

def generate_milestone_video(payload):
    # Call Bannerbear API
    response = requests.post(
        'https://api.bannerbear.com/v2/videos',
        headers={'Authorization': f'Bearer {BANNERBEAR_API_KEY}'},
        json={
            'template': 'milestone_template_id',
            'modifications': [
                {'name': 'firstname', 'text': payload['firstname']},
                {'name': 'rank', 'text': f"Top {payload['rank']}%"},
                {'name': 'level', 'text': payload['current_title']},
                {'name': 'emoji', 'text': payload['current_emoji']},
                {'name': 'days', 'text': f"{payload['days']} days"}
            ]
        }
    )
    
    video_url = response.json()['video_url']
    return {'video_url': video_url}
```

**Pros:**
- ✅ Quick to implement (1 hour)
- ✅ Professional templates
- ✅ No infrastructure management

**Cons:**
- ❌ Monthly cost ($29-99/month)
- ❌ Less customization
- ❌ External dependency

---

### Option 3: Client-Side Video Generation (Modern)

Use **Canvas API + FFmpeg.wasm** in the browser:

**Pros:**
- ✅ No server costs
- ✅ Instant preview
- ✅ User keeps control

**Cons:**
- ❌ Slower on mobile
- ❌ Browser compatibility
- ❌ Large JavaScript bundle

---

## Recommended Approach

### **Phase 1: Quick Start (1-2 hours)**
Use a simple API service like Bannerbear or Shotstack to get video generation working immediately.

### **Phase 2: Custom Solution (1-2 days)**
Implement Lambda + FFmpeg for full control and cost optimization.

---

## Next Steps

1. **Choose an approach** based on timeline and budget
2. **Create base video template** (if using Option 1)
3. **Update Lambda function** with actual video generation
4. **Test with your customer_id**
5. **Monitor performance** and costs

---

## Cost Estimates

### Lambda + FFmpeg (Option 1):
- Lambda execution: ~$0.0001 per video
- S3 storage: ~$0.023 per GB/month
- Data transfer: ~$0.09 per GB
- **Total: ~$0.001 per video**

### External API (Option 2):
- Bannerbear: $29/month (500 videos)
- Shotstack: $29/month (20 min render time)
- **Total: ~$0.06 per video**

---

## Test Video Generation

Once implemented, test with:
```
https://www.screentimejourney.com/pages/social-share?customer_id=8885250982135
```

Click "Download Reel" → Should generate and display video within 30 seconds.










