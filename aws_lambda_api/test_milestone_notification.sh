#!/bin/bash

echo "🧪 Testing Milestone Notification Lambda Function"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FUNCTION_NAME="mk_shopify_web_app_milestones"
REGION="eu-north-1"

# Get customer_id from command line argument
CUSTOMER_ID="$1"
TEST_MODE="${2:-false}"

if [ -z "$CUSTOMER_ID" ]; then
    echo "❌ Error: customer_id required"
    echo ""
    echo "Usage: $0 <customer_id> [test_mode]"
    echo ""
    echo "Examples:"
    echo "  $0 8196292608303                    # Send actual WhatsApp message"
    echo "  $0 8196292608303 true               # Test mode (no WhatsApp sent)"
    echo ""
    exit 1
fi

echo "📋 Parameters:"
echo "   Customer ID: $CUSTOMER_ID"
echo "   Test Mode: $TEST_MODE"
echo ""

# Create test payload
TEST_PAYLOAD=$(cat <<EOF
{
  "customer_id": "$CUSTOMER_ID",
  "test_mode": $TEST_MODE
}
EOF
)

echo "📤 Invoking Lambda function..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

aws lambda invoke \
    --function-name "$FUNCTION_NAME" \
    --region "$REGION" \
    --payload "$TEST_PAYLOAD" \
    --cli-binary-format raw-in-base64-out \
    response.json

echo ""
echo "📨 Response:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat response.json | python3 -m json.tool
echo ""

# Clean up
rm -f response.json

echo ""
echo "✅ Test complete!"
echo ""

if [ "$TEST_MODE" = "false" ]; then
    echo "📱 Check WhatsApp for the message!"
else
    echo "🧪 Test mode - no WhatsApp message was sent"
fi
echo ""

