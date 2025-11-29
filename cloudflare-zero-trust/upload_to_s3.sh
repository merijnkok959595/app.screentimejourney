#!/bin/bash

# Upload Mobile Config to S3 and Make it Public
# For Screen Time Journey - WARP Setup

echo "======================================================================"
echo "📤 Uploading Mobile Config to S3"
echo "======================================================================"
echo ""

# Configuration
BUCKET_NAME="screentimejourney-public"  # Change this to your bucket name
FILE_NAME="ScreenTimeJourney_Enhanced_20251110.mobileconfig"
S3_KEY="warp/ScreenTimeJourney_Protection.mobileconfig"  # Path in S3
REGION="us-east-1"  # Change to your region

# Check if file exists
if [ ! -f "$FILE_NAME" ]; then
    echo "❌ Error: $FILE_NAME not found in current directory"
    exit 1
fi

echo "📁 File: $FILE_NAME"
echo "🪣 Bucket: $BUCKET_NAME"
echo "📍 S3 Key: $S3_KEY"
echo "🌎 Region: $REGION"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Install it first:"
    echo "   brew install awscli"
    echo "   OR"
    echo "   pip3 install awscli"
    exit 1
fi

echo "✅ AWS CLI found"
echo ""

# Check AWS credentials
echo "🔑 Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    echo ""
    echo "Run: aws configure"
    echo "Then enter:"
    echo "  - AWS Access Key ID"
    echo "  - AWS Secret Access Key"
    echo "  - Default region: $REGION"
    echo "  - Output format: json"
    exit 1
fi

echo "✅ AWS credentials valid"
echo ""

# Create bucket if it doesn't exist
echo "🪣 Checking if bucket exists..."
if ! aws s3 ls "s3://$BUCKET_NAME" 2>/dev/null; then
    echo "Creating bucket: $BUCKET_NAME"
    aws s3 mb "s3://$BUCKET_NAME" --region "$REGION"
    
    # Enable public access (remove block)
    aws s3api put-public-access-block \
        --bucket "$BUCKET_NAME" \
        --public-access-block-configuration \
        "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
else
    echo "✅ Bucket exists"
fi
echo ""

# Upload file with correct content type
echo "📤 Uploading file..."
aws s3 cp "$FILE_NAME" "s3://$BUCKET_NAME/$S3_KEY" \
    --content-type "application/x-apple-aspen-config" \
    --metadata-directive REPLACE \
    --acl public-read

if [ $? -eq 0 ]; then
    echo "✅ Upload successful!"
else
    echo "❌ Upload failed"
    exit 1
fi

echo ""

# Generate public URL
PUBLIC_URL="https://$BUCKET_NAME.s3.$REGION.amazonaws.com/$S3_KEY"
CLOUDFRONT_URL="https://$BUCKET_NAME.s3.amazonaws.com/$S3_KEY"

echo "======================================================================"
echo "✅ DONE! Your mobile config is now public"
echo "======================================================================"
echo ""
echo "📱 Download URL:"
echo "$PUBLIC_URL"
echo ""
echo "Alternative URL:"
echo "$CLOUDFRONT_URL"
echo ""
echo "🧪 Test it:"
echo "   1. Open this URL on your iPhone in Safari"
echo "   2. Tap 'Allow' to download"
echo "   3. Go to Settings > Profile Downloaded"
echo "   4. Install the profile"
echo ""
echo "💡 Use this URL in your landing page or emails!"
echo ""
echo "======================================================================"














