#!/bin/bash

echo "🚀 Deploying Social Share Video System..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Deploy Remotion Site
echo -e "${YELLOW}📦 Step 1: Deploying Remotion site with SocialShareReel...${NC}"
cd remotion-video-generator
npx remotion lambda sites create src/index.ts --site-name=milestone-reels-stj --region eu-north-1

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to deploy Remotion site${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Remotion site deployed${NC}"
echo ""

# Step 2: Deploy Remotion Lambda Function (if needed)
echo -e "${YELLOW}⚡ Step 2: Checking Remotion Lambda function...${NC}"
echo "Using existing function: remotion-render-4-0-373-mem2048mb-disk2048mb-120sec"
echo ""

# Step 3: Deploy Bridge Lambda
echo -e "${YELLOW}🌉 Step 3: Deploying Bridge Lambda...${NC}"
cd ../remotion-bridge-lambda

# Check if function.zip exists and is recent, if not create it
if [ ! -f function.zip ] || [ $(find function.zip -mmin +60 2>/dev/null) ]; then
    echo "Creating deployment package..."
    zip -r function.zip index.js node_modules/ package.json
fi

aws lambda update-function-code \
    --function-name remotion-bridge \
    --zip-file fileb://function.zip \
    --region eu-north-1

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to deploy bridge Lambda${NC}"
    echo "Creating new bridge Lambda function..."
    
    aws lambda create-function \
        --function-name remotion-bridge \
        --runtime nodejs18.x \
        --role arn:aws:iam::YOUR_ACCOUNT_ID:role/remotion-lambda-role \
        --handler index.handler \
        --zip-file fileb://function.zip \
        --timeout 300 \
        --memory-size 512 \
        --region eu-north-1
fi

echo -e "${GREEN}✅ Bridge Lambda deployed${NC}"
echo ""

# Step 4: Deploy Main Lambda Handler
echo -e "${YELLOW}🔧 Step 4: Deploying Main Lambda Handler...${NC}"
cd ../aws_lambda_api

# Create deployment package (if needed)
echo "Packaging main Lambda..."
zip -r lambda_deployment.zip lambda_handler.py

aws lambda update-function-code \
    --function-name stj-main-handler \
    --zip-file fileb://lambda_deployment.zip \
    --region eu-north-1

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Could not update main Lambda (might need manual deployment)${NC}"
else
    echo -e "${GREEN}✅ Main Lambda deployed${NC}"
fi

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📝 System components:"
echo "   1. ✅ Remotion Site: https://remotionlambda-eunorth1-04wuwe9kfm.s3.eu-north-1.amazonaws.com/sites/milestone-reels-stj/index.html"
echo "   2. ✅ Remotion Lambda: remotion-render-4-0-373-mem2048mb-disk2048mb-120sec"
echo "   3. ✅ Bridge Lambda: remotion-bridge"
echo "   4. ✅ Main Lambda: stj-main-handler"
echo ""
echo "🧪 Test the video generation:"
echo "   cd remotion-video-generator"
echo "   node test-social-share.js 8885250982135"
echo ""
echo "🌐 Social Share Page:"
echo "   https://www.screentimejourney.com/pages/social-share?customer_id=8885250982135"
echo ""








