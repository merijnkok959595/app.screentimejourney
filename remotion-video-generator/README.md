# 🎬 Milestone Video Generator (Remotion Lambda)

Beautiful animated milestone reels for Screen Time Journey, powered by **Remotion**.

---

## 🚀 **Quick Start**

### **1. Install Dependencies**

```bash
npm install
```

### **2. Preview Locally**

```bash
npm start
```

This opens the Remotion Studio where you can:
- ✅ Preview your video in real-time
- ✅ Adjust props (name, days, colors, etc.)
- ✅ See animations frame-by-frame
- ✅ Export test videos

---

## 📦 **Deploy to Lambda**

### **Prerequisites:**
1. **AWS Account** with credentials configured
2. **Remotion License** (free for first 30 renders/month)

### **Step 1: Configure AWS Credentials**

```bash
# Install AWS CLI if not already installed
brew install awscli  # macOS
# OR
pip install awscli   # Python

# Configure AWS credentials
aws configure
```

Enter:
- AWS Access Key ID
- AWS Secret Access Key
- Default region: `eu-north-1` (or your preferred region)
- Output format: `json`

### **Step 2: Deploy Remotion Lambda**

```bash
# Deploy everything (site + function)
npm run deploy
```

This command:
1. ✅ Creates a Remotion site on AWS S3
2. ✅ Deploys a Lambda function for rendering
3. ✅ Sets up all necessary permissions
4. ✅ Returns a Lambda function URL

**After deployment, you'll get:**
```
✅ Function deployed: arn:aws:lambda:eu-north-1:xxxx:function:remotion-render-xxxxx
✅ Site deployed: https://remotion-render-xxxxx.s3.amazonaws.com
✅ Render URL: https://xxxxx.lambda-url.eu-north-1.on.aws/
```

**Save the Render URL!** You'll need it for your main Lambda.

---

## 🎯 **How to Call from Your Main Lambda**

### **Update your `aws_lambda_api/lambda_handler.py`:**

```python
import boto3
import json

# Remotion Lambda configuration
REMOTION_LAMBDA_FUNCTION = "remotion-render-xxxxx"  # From deployment output
REMOTION_REGION = "eu-north-1"

def generate_milestone_video(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Generate milestone video using Remotion Lambda"""
    try:
        # Prepare video props
        video_props = {
            "composition": "MilestoneReel",
            "serveUrl": "https://remotion-render-xxxxx.s3.amazonaws.com",  # From deployment
            "inputProps": {
                "firstname": payload.get('firstname', 'Champion'),
                "currentTitle": payload.get('current_title', 'Ground Zero'),
                "currentEmoji": payload.get('current_emoji', '🪨'),
                "days": payload.get('days', 0),
                "rank": payload.get('rank', 100),
                "nextTitle": payload.get('next_title', 'Fighter'),
                "nextEmoji": payload.get('next_emoji', '🥊'),
                "colorCode": payload.get('color_code', '2e2e2e'),
                "nextColorCode": payload.get('next_color_code', '5b1b1b'),
                "gender": payload.get('gender', 'male')
            },
            "codec": "h264",
            "outName": f"milestone_{payload.get('customer_id', 'test')}.mp4"
        }
        
        # Invoke Remotion Lambda
        lambda_client = boto3.client('lambda', region_name=REMOTION_REGION)
        response = lambda_client.invoke(
            FunctionName=REMOTION_LAMBDA_FUNCTION,
            InvocationType='RequestResponse',
            Payload=json.dumps(video_props)
        )
        
        # Parse response
        result = json.loads(response['Payload'].read())
        video_url = result.get('videoUrl') or result.get('url')
        
        return json_resp({
            'success': True,
            'video_url': video_url,
            'message': 'Video generated successfully'
        })
    
    except Exception as e:
        print(f"❌ Error generating video: {str(e)}")
        return json_resp({'error': f'Video generation failed: {str(e)}'}, 500)
```

---

## 💵 **Cost Breakdown**

### **Per Video:**
- AWS Lambda execution: ~$0.03-0.05
- S3 storage: ~$0.0002/month
- Data transfer: ~$0.001
- **Total: ~$0.03-0.08 per video**

### **Remotion License:**
- First 30 renders/month: **FREE**
- Additional renders: **$0.05 each**
- Unlimited plan: **$50/month** (recommended if >1000 videos/month)

**No monthly minimum!** You only pay for what you render.

---

## 🎨 **Customization**

### **Edit Video Content:**

Edit `src/MilestoneReel.tsx` to change:
- Colors and gradients
- Text content and positioning
- Animation timing and effects
- Slide transitions
- Font styles

After editing:
```bash
# Preview changes
npm start

# Redeploy
npm run deploy
```

### **Video Settings:**

Edit `src/Root.tsx` to change:
- Duration: `durationInFrames={450}` (450 frames = 15s at 30fps)
- FPS: `fps={30}`
- Resolution: `width={1080} height={1920}` (portrait for Instagram/TikTok)

---

## 🔧 **Useful Commands**

```bash
# Preview locally
npm start

# Build video (export locally)
npm run build

# Deploy to Lambda
npm run deploy

# Update Remotion
npm run upgrade

# Test render locally
npx remotion render src/index.ts MilestoneReel out/test.mp4
```

---

## 🐛 **Troubleshooting**

### **Issue: "AWS credentials not found"**
**Solution:**
```bash
aws configure
# Enter your AWS credentials
```

### **Issue: "Remotion Lambda not found"**
**Solution:**
```bash
# Redeploy the function
npx remotion lambda functions deploy
```

### **Issue: "Video render failed"**
**Solution:**
1. Check CloudWatch logs for errors
2. Verify all props are correct
3. Test locally with `npm start`

---

## 📚 **Resources**

- [Remotion Documentation](https://www.remotion.dev/docs)
- [Remotion Lambda Guide](https://www.remotion.dev/docs/lambda)
- [AWS Lambda Pricing](https://aws.amazon.com/lambda/pricing/)
- [Remotion License Info](https://www.remotion.dev/license)

---

## ✅ **Next Steps:**

1. ✅ Install dependencies: `npm install`
2. ✅ Preview locally: `npm start`
3. ✅ Deploy to Lambda: `npm run deploy`
4. ✅ Update your main Lambda with the Remotion function URL
5. ✅ Test video generation from your widget!

**Happy rendering! 🎬**










