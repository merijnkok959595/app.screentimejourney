#!/bin/bash
# Check recent Lambda logs for WhatsApp verification errors

FUNCTION_NAME="shopify-app-backend-lambda-function"

echo "🔍 CHECKING LAMBDA LOGS FOR WHATSAPP VERIFICATION"
echo "============================================================"
echo "Function: $FUNCTION_NAME"
echo ""

# Get the log group
LOG_GROUP="/aws/lambda/$FUNCTION_NAME"

# Get the most recent log stream
echo "📋 Fetching most recent log streams..."
RECENT_STREAM=$(aws logs describe-log-streams \
    --log-group-name "$LOG_GROUP" \
    --order-by LastEventTime \
    --descending \
    --max-items 1 \
    --query 'logStreams[0].logStreamName' \
    --output text \
    --region eu-north-1 2>/dev/null)

if [ -z "$RECENT_STREAM" ] || [ "$RECENT_STREAM" = "None" ]; then
    echo "❌ No log streams found"
    exit 1
fi

echo "✅ Found recent log stream: $RECENT_STREAM"
echo ""

# Get recent log events
echo "📄 Recent log events:"
echo "============================================================"
aws logs get-log-events \
    --log-group-name "$LOG_GROUP" \
    --log-stream-name "$RECENT_STREAM" \
    --limit 50 \
    --region eu-north-1 \
    --query 'events[*].[timestamp,message]' \
    --output text 2>/dev/null | tail -20

echo ""
echo "============================================================"
echo "💡 Look for WhatsApp or WATI related errors above"







