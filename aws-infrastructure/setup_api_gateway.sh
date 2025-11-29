#!/bin/bash

# ========================================
# API Gateway Setup with Rate Limiting
# ========================================

set -e

REGION="eu-north-1"
LAMBDA_FUNCTION_NAME="mk_shopify_web_app"
API_NAME="screentimejourney-api"
STAGE_NAME="prod"

echo "🌐 Setting up API Gateway with rate limiting..."

# Get Lambda ARN
LAMBDA_ARN=$(aws lambda get-function \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --region "$REGION" \
    --query 'Configuration.FunctionArn' \
    --output text)

echo "✅ Lambda ARN: $LAMBDA_ARN"

# ========================================
# 1. Create REST API
# ========================================
echo ""
echo "🔧 Creating REST API..."

API_ID=$(aws apigateway create-rest-api \
    --name "$API_NAME" \
    --description "Screen Time Journey API with rate limiting" \
    --endpoint-configuration types=REGIONAL \
    --region "$REGION" \
    --output text \
    --query 'id' 2>/dev/null) || \
    API_ID=$(aws apigateway get-rest-apis \
        --region "$REGION" \
        --query "items[?name=='$API_NAME'].id | [0]" \
        --output text)

echo "✅ API ID: $API_ID"

# Get root resource ID
ROOT_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id "$API_ID" \
    --region "$REGION" \
    --query 'items[?path==`/`].id | [0]' \
    --output text)

echo "✅ Root Resource ID: $ROOT_RESOURCE_ID"

# ========================================
# 2. Create /{proxy+} resource (catch-all)
# ========================================
echo ""
echo "🔧 Creating proxy resource..."

PROXY_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id "$API_ID" \
    --parent-id "$ROOT_RESOURCE_ID" \
    --path-part "{proxy+}" \
    --region "$REGION" \
    --output text \
    --query 'id' 2>/dev/null) || \
    PROXY_RESOURCE_ID=$(aws apigateway get-resources \
        --rest-api-id "$API_ID" \
        --region "$REGION" \
        --query "items[?pathPart=='\\{proxy+\\}'].id | [0]" \
        --output text)

echo "✅ Proxy Resource ID: $PROXY_RESOURCE_ID"

# ========================================
# 3. Create ANY method for /{proxy+}
# ========================================
echo ""
echo "🔧 Creating ANY method..."

aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$PROXY_RESOURCE_ID" \
    --http-method ANY \
    --authorization-type NONE \
    --request-parameters method.request.path.proxy=true \
    --region "$REGION" 2>/dev/null || echo "⚠️  Method already exists"

echo "✅ ANY method created"

# ========================================
# 4. Set up Lambda integration
# ========================================
echo ""
echo "🔧 Setting up Lambda integration..."

aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$PROXY_RESOURCE_ID" \
    --http-method ANY \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations" \
    --region "$REGION" 2>/dev/null || echo "⚠️  Integration already exists"

echo "✅ Lambda integration configured"

# ========================================
# 5. Add Lambda permission for API Gateway
# ========================================
echo ""
echo "🔧 Granting API Gateway permission to invoke Lambda..."

aws lambda add-permission \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --statement-id apigateway-invoke-permission \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:*:${API_ID}/*/*" \
    --region "$REGION" 2>/dev/null || echo "⚠️  Permission already exists"

echo "✅ Lambda permission granted"

# ========================================
# 6. Enable CORS for OPTIONS method
# ========================================
echo ""
echo "🔧 Configuring CORS..."

# Create OPTIONS method
aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$PROXY_RESOURCE_ID" \
    --http-method OPTIONS \
    --authorization-type NONE \
    --region "$REGION" 2>/dev/null || echo "⚠️  OPTIONS method already exists"

# Mock integration for OPTIONS
aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$PROXY_RESOURCE_ID" \
    --http-method OPTIONS \
    --type MOCK \
    --request-templates '{"application/json": "{\"statusCode\": 200}"}' \
    --region "$REGION" 2>/dev/null || echo "⚠️  OPTIONS integration already exists"

# Integration response
aws apigateway put-integration-response \
    --rest-api-id "$API_ID" \
    --resource-id "$PROXY_RESOURCE_ID" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{
        "method.response.header.Access-Control-Allow-Headers": "'\''Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\''",
        "method.response.header.Access-Control-Allow-Methods": "'\''DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'\''",
        "method.response.header.Access-Control-Allow-Origin": "'\''https://app.screentimejourney.com'\''"
    }' \
    --region "$REGION" 2>/dev/null || echo "⚠️  OPTIONS integration response already exists"

# Method response
aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$PROXY_RESOURCE_ID" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{
        "method.response.header.Access-Control-Allow-Headers": true,
        "method.response.header.Access-Control-Allow-Methods": true,
        "method.response.header.Access-Control-Allow-Origin": true
    }' \
    --region "$REGION" 2>/dev/null || echo "⚠️  OPTIONS method response already exists"

echo "✅ CORS configured"

# ========================================
# 7. Deploy API to prod stage
# ========================================
echo ""
echo "🚀 Deploying API to $STAGE_NAME stage..."

aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "$STAGE_NAME" \
    --stage-description "Production stage with rate limiting" \
    --description "Initial deployment with rate limiting" \
    --region "$REGION"

echo "✅ API deployed to $STAGE_NAME stage"

# ========================================
# 8. Configure rate limiting (throttling)
# ========================================
echo ""
echo "🚫 Configuring rate limiting..."

# Update stage settings with throttling
aws apigateway update-stage \
    --rest-api-id "$API_ID" \
    --stage-name "$STAGE_NAME" \
    --patch-operations \
        op=replace,path=/*/*/throttling/rateLimit,value=1000 \
        op=replace,path=/*/*/throttling/burstLimit,value=2000 \
    --region "$REGION"

echo "✅ Rate limiting configured:"
echo "   • Rate limit: 1,000 requests/second"
echo "   • Burst limit: 2,000 requests"

# ========================================
# 9. Enable CloudWatch logging
# ========================================
echo ""
echo "📊 Enabling CloudWatch logging..."

# Create CloudWatch role for API Gateway (if not exists)
ROLE_ARN=$(aws iam get-role --role-name APIGatewayCloudWatchRole --query 'Role.Arn' --output text 2>/dev/null || echo "")

if [ -z "$ROLE_ARN" ]; then
    echo "Creating IAM role for API Gateway logging..."
    
    cat > /tmp/apigateway-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "apigateway.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    ROLE_ARN=$(aws iam create-role \
        --role-name APIGatewayCloudWatchRole \
        --assume-role-policy-document file:///tmp/apigateway-trust-policy.json \
        --query 'Role.Arn' \
        --output text)
    
    aws iam attach-role-policy \
        --role-name APIGatewayCloudWatchRole \
        --policy-arn arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs
    
    rm /tmp/apigateway-trust-policy.json
    
    echo "✅ IAM role created: $ROLE_ARN"
    
    # Wait for role to propagate
    sleep 10
fi

# Set account-level CloudWatch role
aws apigateway update-account \
    --patch-operations op=replace,path=/cloudwatchRoleArn,value="$ROLE_ARN" \
    --region "$REGION" 2>/dev/null || echo "⚠️  CloudWatch role already set"

# Enable detailed CloudWatch metrics and logging for stage
aws apigateway update-stage \
    --rest-api-id "$API_ID" \
    --stage-name "$STAGE_NAME" \
    --patch-operations \
        op=replace,path=/\*/\*/logging/loglevel,value=INFO \
        op=replace,path=/\*/\*/logging/dataTrace,value=false \
        op=replace,path=/\*/\*/metrics/enabled,value=true \
    --region "$REGION"

echo "✅ CloudWatch logging enabled"

# ========================================
# Get API endpoint
# ========================================
API_ENDPOINT="https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE_NAME}"

echo ""
echo "=========================================="
echo "✅ API Gateway Setup Complete!"
echo "=========================================="
echo ""
echo "🌐 API Endpoint:"
echo "   $API_ENDPOINT"
echo ""
echo "📊 Rate Limits:"
echo "   • 1,000 requests/second (steady state)"
echo "   • 2,000 requests (burst capacity)"
echo ""
echo "🔐 Features Enabled:"
echo "   ✅ CORS for https://app.screentimejourney.com"
echo "   ✅ CloudWatch logging (INFO level)"
echo "   ✅ CloudWatch metrics"
echo "   ✅ Rate limiting/throttling"
echo ""
echo "🔍 View API Gateway:"
echo "   https://console.aws.amazon.com/apigateway/home?region=$REGION#/apis/$API_ID/resources"
echo ""
echo "📝 Next Steps:"
echo "   1. Update React app environment variable:"
echo "      REACT_APP_API_URL=$API_ENDPOINT"
echo ""
echo "   2. Test the endpoint:"
echo "      curl $API_ENDPOINT/health"
echo ""
echo "   3. After verifying, disable Lambda Function URL"
echo ""













