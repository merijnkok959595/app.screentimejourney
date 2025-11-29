#!/bin/bash

##############################################
# Deploy Milestone Video Generation Lambda
# Includes FFmpeg layer for video processing
##############################################

set -e

FUNCTION_NAME="stj-milestone-video-generator"
REGION="eu-north-1"
ROLE_NAME="stj-video-lambda-role"
RUNTIME="python3.11"
TIMEOUT=300  # 5 minutes for video generation
MEMORY=3008  # Maximum memory for faster processing

echo "🎬 Deploying STJ Milestone Video Generation Lambda"
echo "================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Step 1: Creating deployment package${NC}"

# Create temporary directory
TEMP_DIR=$(mktemp -d)
mkdir -p $TEMP_DIR/package

# Copy Lambda handler
cp generate_milestone_video_handler.py $TEMP_DIR/lambda_handler.py

# Install dependencies
if [ -f video_requirements.txt ]; then
    pip install -r video_requirements.txt -t $TEMP_DIR/package/ --quiet
fi

# Create zip
cd $TEMP_DIR
if [ -d package ] && [ "$(ls -A package)" ]; then
    cd package
    zip -r ../function.zip . -q
    cd ..
fi
zip -g function.zip lambda_handler.py

echo -e "${GREEN}✅ Deployment package created${NC}"

# Check if FFmpeg layer exists, if not, provide instructions
echo -e "${BLUE}📦 Step 2: Checking for FFmpeg Lambda Layer${NC}"

FFMPEG_LAYER_ARN=$(aws lambda list-layers \
    --region $REGION \
    --query "Layers[?LayerName=='ffmpeg-lambda-layer'].LatestMatchingVersion.LayerVersionArn" \
    --output text 2>/dev/null || echo "")

if [ -z "$FFMPEG_LAYER_ARN" ]; then
    echo -e "${YELLOW}⚠️  FFmpeg layer not found. You need to create it first.${NC}"
    echo ""
    echo "To create FFmpeg layer:"
    echo "1. Download pre-built FFmpeg layer: https://github.com/serverlesspub/ffmpeg-aws-lambda-layer"
    echo "2. Or build your own with:"
    echo "   - FFmpeg binary compiled for Amazon Linux 2"
    echo "   - Inter font files (Inter-Bold.ttf, etc.)"
    echo "3. Publish layer with:"
    echo "   aws lambda publish-layer-version \\"
    echo "     --layer-name ffmpeg-lambda-layer \\"
    echo "     --zip-file fileb://ffmpeg-layer.zip \\"
    echo "     --compatible-runtimes python3.11 \\"
    echo "     --region $REGION"
    echo ""
    read -p "Press enter to continue without FFmpeg layer (deployment will succeed but video generation will fail)..."
    LAYERS_ARG=""
else
    echo -e "${GREEN}✅ FFmpeg layer found: $FFMPEG_LAYER_ARN${NC}"
    LAYERS_ARG="--layers $FFMPEG_LAYER_ARN"
fi

# Create IAM role if it doesn't exist
echo -e "${BLUE}🔐 Step 3: Setting up IAM role${NC}"

ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text 2>/dev/null || echo "")

if [ -z "$ROLE_ARN" ]; then
    echo "Creating IAM role..."
    
    # Trust policy
    cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
    
    # Create role
    ROLE_ARN=$(aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document file:///tmp/trust-policy.json \
        --query 'Role.Arn' \
        --output text)
    
    # Attach basic Lambda execution policy
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
    
    # Create and attach S3 access policy
    cat > /tmp/s3-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::stj-milestone-videos/*",
        "arn:aws:s3:::stj-milestone-videos",
        "arn:aws:s3:::stj-video-templates/*",
        "arn:aws:s3:::stj-video-templates"
      ]
    }
  ]
}
EOF
    
    aws iam put-role-policy \
        --role-name $ROLE_NAME \
        --policy-name STJVideoS3Access \
        --policy-document file:///tmp/s3-policy.json
    
    echo "Waiting 10 seconds for role to propagate..."
    sleep 10
    
    echo -e "${GREEN}✅ IAM role created${NC}"
else
    echo -e "${GREEN}✅ IAM role already exists${NC}"
fi

# Check if function exists
FUNCTION_EXISTS=$(aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>/dev/null || echo "")

if [ -z "$FUNCTION_EXISTS" ]; then
    echo -e "${BLUE}🚀 Step 4: Creating Lambda function${NC}"
    
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --role $ROLE_ARN \
        --handler lambda_handler.lambda_handler \
        --zip-file fileb://$TEMP_DIR/function.zip \
        --timeout $TIMEOUT \
        --memory-size $MEMORY \
        --region $REGION \
        --environment "Variables={
            VIDEO_BUCKET_NAME=stj-milestone-videos,
            TEMPLATE_BUCKET_NAME=stj-video-templates,
            CLOUDFRONT_DOMAIN=
        }" \
        $LAYERS_ARG
    
    echo -e "${GREEN}✅ Lambda function created${NC}"
else
    echo -e "${BLUE}🔄 Step 4: Updating Lambda function${NC}"
    
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://$TEMP_DIR/function.zip \
        --region $REGION
    
    # Update configuration
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --timeout $TIMEOUT \
        --memory-size $MEMORY \
        --environment "Variables={
            VIDEO_BUCKET_NAME=stj-milestone-videos,
            TEMPLATE_BUCKET_NAME=stj-video-templates,
            CLOUDFRONT_DOMAIN=
        }" \
        --region $REGION \
        $LAYERS_ARG
    
    echo -e "${GREEN}✅ Lambda function updated${NC}"
fi

# Create function URL
echo -e "${BLUE}🌐 Step 5: Creating function URL${NC}"

FUNCTION_URL=$(aws lambda create-function-url-config \
    --function-name $FUNCTION_NAME \
    --auth-type NONE \
    --cors "AllowOrigins=*,AllowMethods=POST,AllowHeaders=Content-Type" \
    --region $REGION \
    --query 'FunctionUrl' \
    --output text 2>/dev/null || \
    aws lambda get-function-url-config \
    --function-name $FUNCTION_NAME \
    --region $REGION \
    --query 'FunctionUrl' \
    --output text)

# Add resource-based policy for function URL
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id FunctionURLAllowPublicAccess \
    --action lambda:InvokeFunctionUrl \
    --principal "*" \
    --function-url-auth-type NONE \
    --region $REGION 2>/dev/null || echo "Permission already exists"

echo -e "${GREEN}✅ Function URL configured${NC}"

# Cleanup
rm -rf $TEMP_DIR
rm -f /tmp/trust-policy.json /tmp/s3-policy.json

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "================================================="
echo -e "${YELLOW}📋 Configuration Details${NC}"
echo "================================================="
echo "Function Name: $FUNCTION_NAME"
echo "Region: $REGION"
echo "Runtime: $RUNTIME"
echo "Timeout: ${TIMEOUT}s"
echo "Memory: ${MEMORY}MB"
echo ""
echo -e "${YELLOW}🔗 Function URL:${NC}"
echo "$FUNCTION_URL"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Create S3 buckets:"
echo "   - stj-milestone-videos (for generated videos)"
echo "   - stj-video-templates (for template videos)"
echo ""
echo "2. Upload template video(s) to stj-video-templates:"
echo "   templates/male/milestone_template.mp4"
echo "   templates/female/milestone_template.mp4"
echo "   templates/default/milestone_template.mp4"
echo ""
echo "3. (Optional) Set up CloudFront distribution for video delivery"
echo ""
echo "4. Update the social share widget with the function URL"
echo ""
echo "5. Test the endpoint:"
echo "   curl -X POST '$FUNCTION_URL' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"firstname\":\"Merijn\",\"level\":5,\"days\":150,\"rank\":6,\"next_level\":6,\"gender\":\"male\"}'"
echo ""
echo "================================================="










