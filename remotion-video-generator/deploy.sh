#!/bin/bash

echo "🚀 Deploying Remotion Lambda for Milestone Videos..."
echo ""

# Step 1: Deploy Remotion site
echo "📦 Step 1: Deploying Remotion site to S3..."
npx remotion lambda sites create src/index.ts --site-name=milestone-reels-stj

# Step 2: Deploy Lambda function
echo ""
echo "⚡ Step 2: Deploying Lambda function..."
npx remotion lambda functions deploy --region eu-north-1 --memory 2048 --timeout 120

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Copy the Lambda function ARN from above"
echo "   2. Copy the site URL from above"
echo "   3. Update aws_lambda_api/lambda_handler.py with these values"
echo ""










