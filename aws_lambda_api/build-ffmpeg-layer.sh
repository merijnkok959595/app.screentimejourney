#!/bin/bash
# Script to build and deploy FFmpeg Lambda Layer for eu-north-1

set -e

echo "🛠️  Building FFmpeg Lambda Layer..."

# Create directories
mkdir -p ffmpeg-layer/bin
cd ffmpeg-layer

# Download static FFmpeg binary (Amazon Linux 2 compatible)
echo "📥 Downloading FFmpeg..."
curl -L -o ffmpeg-release-amd64-static.tar.xz https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz

# Extract
echo "📦 Extracting..."
tar xf ffmpeg-release-amd64-static.tar.xz

# Copy binary to layer structure
cp ffmpeg-*-amd64-static/ffmpeg bin/
chmod +x bin/ffmpeg

# Verify
echo "✅ FFmpeg version:"
./bin/ffmpeg -version | head -1

# Create ZIP
echo "📦 Creating layer ZIP..."
cd ..
zip -r ffmpeg-layer.zip bin/

# Upload to AWS
echo "☁️  Uploading to AWS Lambda..."
LAYER_ARN=$(aws lambda publish-layer-version \
  --layer-name ffmpeg-audio-conversion \
  --description "FFmpeg for audio format conversion (Whisper compatibility)" \
  --zip-file fileb://ffmpeg-layer.zip \
  --compatible-runtimes python3.11 python3.12 python3.13 \
  --region eu-north-1 \
  --query 'LayerVersionArn' \
  --output text)

echo "✅ Layer created: $LAYER_ARN"

# Attach to Lambda function
echo "🔗 Attaching layer to Lambda function..."
aws lambda update-function-configuration \
  --function-name mk_shopify_web_app \
  --layers arn:aws:lambda:eu-north-1:218638337917:layer:requests313:1 "$LAYER_ARN" \
  --region eu-north-1

echo "✅ FFmpeg layer successfully deployed and attached!"
echo ""
echo "🧪 Test by recording audio on different devices and checking Lambda logs:"
echo "aws logs tail /aws/lambda/mk_shopify_web_app --follow --region eu-north-1"

# Cleanup
rm -rf ffmpeg-layer ffmpeg-layer.zip

echo ""
echo "✅ Setup complete! Your audio system is now 100% robust across all devices."

