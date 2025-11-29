# 🎬 Implement Video Generation - Step by Step

Your widget and API are ready! Now let's get video generation working.

## 🎯 What You Want

A 15-second video reel with:
- **0-5s**: Current level background color with user stats
- **5-10s**: Next level background color with motivation
- **10-15s**: King/Queen gold background with final goal

---

## ⚡ Quick Start (10 minutes) - Test with Static Video

### Step 1: Create a Sample Video

1. Go to [Canva](https://www.canva.com) or [Kapwing](https://www.kapwing.com)
2. Create a 1080x1920 (vertical) video with:
   - Slide 1 (5s): Dark background, text "Hi Champion"
   - Slide 2 (5s): Purple background, text "Next Level"
   - Slide 3 (5s): Gold background, text "Your Path to King"
3. Export as MP4

### Step 2: Upload to S3

```bash
aws s3 cp sample-milestone.mp4 s3://wati-files/milestone-videos/sample-milestone.mp4 \
  --acl public-read \
  --content-type video/mp4
```

### Step 3: Update Lambda

```python
# In lambda_handler.py, replace the placeholder URL:
video_url = "https://wati-files.s3.eu-north-1.amazonaws.com/milestone-videos/sample-milestone.mp4"
```

### Step 4: Test

```bash
curl -X POST https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws/generate_milestone_video \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"8885250982135","firstname":"Merijn","level":0,"days":0,"rank":100,"gender":"male"}'
```

Visit: `https://www.screentimejourney.com/pages/social-share?customer_id=8885250982135`

Click "Download Reel" → Should show the video!

---

## 🚀 Full Implementation (2-3 hours) - Dynamic Videos with FFmpeg

### Prerequisites

1. **FFmpeg Lambda Layer**
   ```bash
   # Use pre-built FFmpeg layer
   aws lambda update-function-configuration \
     --function-name mk_shopify_web_app \
     --layers arn:aws:lambda:eu-north-1:145266761615:layer:ffmpeg:4 \
     --region eu-north-1
   ```

2. **Increase Lambda Resources**
   ```bash
   aws lambda update-function-configuration \
     --function-name mk_shopify_web_app \
     --timeout 300 \
     --memory-size 2048 \
     --region eu-north-1
   ```

### Implementation Code

I've created the full implementation. Save this as `aws_lambda_api/video_generator.py`:

```python
import subprocess
import boto3
import os
from datetime import datetime

def generate_video_ffmpeg(user_data):
    """Generate milestone video with FFmpeg"""
    
    # Extract data
    firstname = user_data.get('firstname', 'Champion')
    current_title = user_data.get('current_title', 'Ground Zero')
    current_emoji = user_data.get('current_emoji', '🪨')
    days = user_data.get('days', 0)
    rank = user_data.get('rank', 100)
    next_title = user_data.get('next_title', 'Fighter')
    next_emoji = user_data.get('next_emoji', '🥊')
    color_code = user_data.get('color_code', '2e2e2e')
    next_color_code = user_data.get('next_color_code', '5b1b1b')
    gender = user_data.get('gender', 'male')
    customer_id = user_data.get('customer_id', 'unknown')
    
    king_queen = 'King' if gender == 'male' else 'Queen'
    
    # Output file
    timestamp = int(datetime.now().timestamp())
    output_file = f'/tmp/milestone-{customer_id}-{timestamp}.mp4'
    
    # Escape text
    firstname = firstname.replace("'", "\\\\'")
    current_title = current_title.replace("'", "\\\\'")
    next_title = next_title.replace("'", "\\\\'")
    
    # Build FFmpeg filter
    filter_complex = f"""
    color=c=0x{color_code}:s=1080x1920:d=15[bg1];
    color=c=0x{next_color_code}:s=1080x1920:d=15[bg2];
    color=c=0xffd700:s=1080x1920:d=15[bg3];
    [bg1][bg2]blend=all_expr='if(lt(T,5),A,B)':shortest=1[bg12];
    [bg12][bg3]blend=all_expr='if(lt(T,10),A,B)':shortest=1[bg];
    [bg]drawtext=text='Hi {firstname},':fontsize=80:fontcolor=white:x=(w-text_w)/2:y=300:enable='between(t,0,5)'[t1];
    [t1]drawtext=text='Right now you are':fontsize=56:fontcolor=white:x=(w-text_w)/2:y=450:enable='between(t,0,5)'[t2];
    [t2]drawtext=text='{current_title} {current_emoji}':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=580:enable='between(t,0,5)'[t3];
    [t3]drawtext=text='{days} days in focus':fontsize=56:fontcolor=white:x=(w-text_w)/2:y=750:enable='between(t,0,5)'[t4];
    [t4]drawtext=text='Top {rank}%% in the world':fontsize=56:fontcolor=white:x=(w-text_w)/2:y=900:enable='between(t,0,5)'[t5];
    [t5]drawtext=text='Reclaiming your dopamine':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=1100:enable='between(t,0,5)'[t6];
    [t6]drawtext=text='Next up:':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=400:enable='between(t,5,10)'[t7];
    [t7]drawtext=text='{next_title} {next_emoji}':fontsize=88:fontcolor=white:x=(w-text_w)/2:y=600:enable='between(t,5,10)'[t8];
    [t8]drawtext=text='Keep pushing forward!':fontsize=56:fontcolor=white:x=(w-text_w)/2:y=900:enable='between(t,5,10)'[t9];
    [t9]drawtext=text='Your path to {king_queen}':fontsize=88:fontcolor=black:x=(w-text_w)/2:y=500:enable='between(t,10,15)'[t10];
    [t10]drawtext=text='365 days of transformation':fontsize=56:fontcolor=black:x=(w-text_w)/2:y=700:enable='between(t,10,15)'[t11];
    [t11]drawtext=text='Every day counts':fontsize=64:fontcolor=black:x=(w-text_w)/2:y=900:enable='between(t,10,15)'[out]
    """.replace('\n', '').replace('    ', '')
    
    # FFmpeg command
    cmd = [
        '/opt/bin/ffmpeg',  # FFmpeg from layer
        '-f', 'lavfi',
        '-i', 'anullsrc=r=44100:cl=stereo',
        '-filter_complex', filter_complex,
        '-map', '[out]',
        '-t', '15',
        '-pix_fmt', 'yuv420p',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '28',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-y',
        output_file
    ]
    
    # Run FFmpeg
    print(f"🎥 Running FFmpeg...")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    
    if result.returncode != 0:
        raise Exception(f"FFmpeg failed: {result.stderr}")
    
    # Upload to S3
    s3 = boto3.client('s3')
    s3_key = f'milestone-videos/milestone-{customer_id}-{timestamp}.mp4'
    
    s3.upload_file(
        output_file,
        'wati-files',
        s3_key,
        ExtraArgs={'ContentType': 'video/mp4', 'ACL': 'public-read'}
    )
    
    # Clean up
    os.remove(output_file)
    
    # Return URL
    video_url = f"https://wati-files.s3.eu-north-1.amazonaws.com/{s3_key}"
    
    return video_url
```

### Update lambda_handler.py

Replace the TODO section in `generate_milestone_video`:

```python
# Replace lines 863-873 with:
from video_generator import generate_video_ffmpeg

video_url = generate_video_ffmpeg(payload)
```

### Deploy

```bash
cd /Users/merijnkok/Desktop/screen-time-journey-workspace/aws_lambda_api
bash deploy_main_lambda.sh
```

### Test

```bash
curl -X POST https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws/generate_milestone_video \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id":"8885250982135",
    "firstname":"Merijn",
    "level":0,
    "days":0,
    "rank":100,
    "current_title":"Ground Zero",
    "current_emoji":"🪨",
    "next_title":"Fighter",
    "next_emoji":"🥊",
    "color_code":"2e2e2e",
    "next_color_code":"5b1b1b",
    "gender":"male"
  }'
```

---

## 📊 Expected Results

### Timeline:
- **0-5 seconds**: Dark gray background (#2e2e2e)
  - "Hi Merijn,"
  - "Right now you are Ground Zero 🪨"
  - "0 days in focus"
  - "Top 100% in the world"
  - "Reclaiming your dopamine"

- **5-10 seconds**: Dark red background (#5b1b1b)
  - "Next up:"
  - "Fighter 🥊"
  - "Keep pushing forward!"

- **10-15 seconds**: Gold background (#ffd700)
  - "Your path to King"
  - "365 days of transformation"
  - "Every day counts"

---

## 🎬 Cost Estimate

Per video generation:
- Lambda execution (30s @ 2GB): ~$0.0003
- S3 storage (10MB): ~$0.0002/month
- Data transfer: ~$0.0009

**Total: ~$0.001 per video**

---

## 🐛 Troubleshooting

### FFmpeg not found
```bash
# Check layer is attached
aws lambda get-function-configuration --function-name mk_shopify_web_app | grep Layers
```

### Timeout errors
```bash
# Increase timeout
aws lambda update-function-configuration \
  --function-name mk_shopify_web_app \
  --timeout 300
```

### Out of memory
```bash
# Increase memory
aws lambda update-function-configuration \
  --function-name mk_shopify_web_app \
  --memory-size 3008
```

---

## ✅ Next Steps

1. Start with **Quick Start** to test the flow
2. Implement **Full Solution** for dynamic videos
3. Add background music (optional)
4. Add sliding text animations (optional)
5. Optimize video quality/size

Which approach do you want to start with?










