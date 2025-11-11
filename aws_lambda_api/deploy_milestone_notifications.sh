#!/bin/bash

echo "📦 Deploying Consolidated Milestone Notifications Lambda (Python 3.13)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ This Lambda handles BOTH:"
echo "   1. Scheduled notifications (every hour, sends at 10 AM user local time)"
echo "   2. On-demand notifications (API triggered for specific customer)"
echo ""
echo "🌍 Timezone priority (based on Shopify country code):"
echo "   1. Explicit timezone field (if manually set)"
echo "   2. Shopify subscription country code (PRIMARY)"
echo "   3. Phone number inference (fallback)"
echo "   4. UTC (ultimate fallback)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$(dirname "$0")"

# Configuration
FUNCTION_NAME="mk_milestone_notifications"
REGION="eu-north-1"
HANDLER="milestone_notifications.lambda_handler"
RUNTIME="python3.13"
ROLE_NAME="Merijn_Services"
TIMEOUT=300  # 5 minutes (needs time to process all users in scheduled mode)
MEMORY=512

# Environment variables
WATI_API_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3N2VlMjAzNC1mZmM5LTQ0NTEtOTA5Ny1mZDdmNDU2YTBkMTMiLCJ1bmlxdWVfbmFtZSI6Im1lcmlqbkByaXNvdHRpbmkuY29tIiwibmFtZWlkIjoibWVyaWpuQHJpc290dGluaS5jb20iLCJlbWFpbCI6Im1lcmlqbkByaXNvdHRpbmkuY29tIiwiYXV0aF90aW1lIjoiMTEvMTEvMjAyNSAxNDoxNzoxOSIsInRlbmFudF9pZCI6IjQ0MzM2OCIsImRiX25hbWUiOiJtdC1wcm9kLVRlbmFudHMiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBRE1JTklTVFJBVE9SIiwiZXhwIjoyNTM0MDIzMDA4MDAsImlzcyI6IkNsYXJlX0FJIiwiYXVkIjoiQ2xhcmVfQUkifQ.hsPk9HqX72Y494tFpFGZ8BWG3326ABzyIGIm9yBDJG0"
WATI_ENDPOINT="https://live-mt-server.wati.io/443368"

echo ""
echo "1️⃣  Creating deployment package..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create temp directory for packaging
rm -rf milestone_notifications_package
mkdir milestone_notifications_package

# Copy handler
cp milestone_notifications.py milestone_notifications_package/

# Install dependencies (requests, pytz)
echo "📦 Installing dependencies (requests, pytz)..."
pip3 install requests pytz -t milestone_notifications_package/ --quiet --upgrade

# Create deployment zip
cd milestone_notifications_package
zip -r ../milestone_notifications.zip . -q
cd ..

echo "✅ Deployment package created: milestone_notifications.zip"
echo "   Size: $(du -h milestone_notifications.zip | cut -f1)"

echo ""
echo "2️⃣  Getting IAM Role ARN..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text 2>/dev/null)

if [ -z "$ROLE_ARN" ]; then
    echo "❌ Role $ROLE_NAME not found!"
    echo "   Please create the role first or update ROLE_NAME in this script"
    exit 1
fi

echo "✅ Using IAM Role: $ROLE_ARN"

echo ""
echo "3️⃣  Deploying Lambda function..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FUNCTION_EXISTS=$(aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" 2>&1)

if echo "$FUNCTION_EXISTS" | grep -q "ResourceNotFoundException"; then
    echo "📝 Creating new function..."
    
    aws lambda create-function \
        --function-name "$FUNCTION_NAME" \
        --runtime "$RUNTIME" \
        --role "$ROLE_ARN" \
        --handler "$HANDLER" \
        --timeout "$TIMEOUT" \
        --memory-size "$MEMORY" \
        --region "$REGION" \
        --zip-file fileb://milestone_notifications.zip \
        --environment "Variables={
            SUBSCRIBERS_TABLE=stj_subscribers,
            SYSTEM_TABLE=stj_system,
            WATI_API_TOKEN=$WATI_API_TOKEN,
            WATI_ENDPOINT=$WATI_ENDPOINT
        }" \
        --output json | python3 -m json.tool
    
    echo "✅ Lambda function created!"
else
    echo "📝 Updating existing function..."
    
    # Update code
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --region "$REGION" \
        --zip-file fileb://milestone_notifications.zip \
        --output json > /dev/null
    
    echo "⏳ Waiting for code update to complete..."
    sleep 5
    
    # Update configuration
    aws lambda update-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --region "$REGION" \
        --runtime "$RUNTIME" \
        --timeout "$TIMEOUT" \
        --memory-size "$MEMORY" \
        --environment "Variables={
            SUBSCRIBERS_TABLE=stj_subscribers,
            SYSTEM_TABLE=stj_system,
            WATI_API_TOKEN=$WATI_API_TOKEN,
            WATI_ENDPOINT=$WATI_ENDPOINT
        }" \
        --output json > /dev/null
    
    echo "✅ Lambda function updated!"
fi

echo ""
echo "4️⃣  Setting up EventBridge Schedule..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get Lambda function ARN
FUNCTION_ARN=$(aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" --query 'Configuration.FunctionArn' --output text)

# Create EventBridge rule (runs every hour)
RULE_NAME="milestone-notifications-hourly"

echo "📅 Creating EventBridge rule: $RULE_NAME (runs every hour)"

aws events put-rule \
    --name "$RULE_NAME" \
    --schedule-expression "rate(1 hour)" \
    --state ENABLED \
    --description "Triggers milestone notifications every hour" \
    --region "$REGION" > /dev/null

echo "✅ EventBridge rule created"

# Add permission for EventBridge to invoke Lambda
echo "🔐 Adding Lambda permission for EventBridge..."

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

aws lambda add-permission \
    --function-name "$FUNCTION_NAME" \
    --statement-id "EventBridgeInvoke" \
    --action "lambda:InvokeFunction" \
    --principal events.amazonaws.com \
    --source-arn "arn:aws:events:${REGION}:${ACCOUNT_ID}:rule/${RULE_NAME}" \
    --region "$REGION" 2>/dev/null || echo "⚠️  Permission already exists"

# Add Lambda as target to EventBridge rule
echo "🎯 Adding Lambda as target to EventBridge rule..."

aws events put-targets \
    --rule "$RULE_NAME" \
    --targets "Id=1,Arn=$FUNCTION_ARN" \
    --region "$REGION" > /dev/null

echo "✅ EventBridge trigger configured"

echo ""
echo "5️⃣  Cleanup..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
rm -rf milestone_notifications_package
echo "✅ Temp files cleaned up"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Function Name: $FUNCTION_NAME"
echo "🌍 Region: $REGION"
echo "🐍 Runtime: $RUNTIME"
echo "⚙️  Handler: $HANDLER"
echo "⏱️  Timeout: ${TIMEOUT}s (5 minutes)"
echo "💾 Memory: ${MEMORY}MB"
echo "⏰ Schedule: Every hour"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 HOW IT WORKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📅 SCHEDULED MODE (automatic):"
echo "   • Runs every hour via EventBridge"
echo "   • Checks all subscribers"
echo "   • Sends WhatsApp at 10:00 AM in user's local timezone"
echo "   • Timezone based on Shopify country code (primary)"
echo "   • Ground Zero sent on day 1, then every 7 days"
echo ""
echo "🔔 ON-DEMAND MODE (API triggered):"
echo "   • Triggered via API Gateway or direct invoke"
echo "   • Send notification to specific customer_id"
echo "   • Useful for manual triggers or testing"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 TESTING"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Test scheduled run (simulates EventBridge trigger):"
echo "   aws lambda invoke \\"
echo "     --function-name $FUNCTION_NAME \\"
echo "     --region $REGION \\"
echo "     --payload '{}' \\"
echo "     response.json"
echo ""
echo "Test on-demand for specific customer:"
echo "   aws lambda invoke \\"
echo "     --function-name $FUNCTION_NAME \\"
echo "     --region $REGION \\"
echo "     --payload '{\"customer_id\":\"YOUR_CUSTOMER_ID\",\"test_mode\":true}' \\"
echo "     response.json"
echo ""
echo "View logs:"
echo "   aws logs tail /aws/lambda/$FUNCTION_NAME --follow --region $REGION"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗑️  NEXT STEPS: Delete old Lambda functions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "After verifying this works, delete the old functions:"
echo ""
echo "   aws lambda delete-function \\"
echo "     --function-name mk_shopify_web_app_milestones \\"
echo "     --region $REGION"
echo ""
echo "   aws lambda delete-function \\"
echo "     --function-name mk_scheduled_milestone_notifications \\"
echo "     --region $REGION"
echo ""
echo "Also remove old EventBridge rule:"
echo "   aws events remove-targets --rule milestone-notifications-hourly --ids 1 --region $REGION"
echo "   aws events delete-rule --name milestone-notifications-hourly --region $REGION"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

