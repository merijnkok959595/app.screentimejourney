#!/bin/bash

# Test script for new consolidated milestone notification Lambda
# Usage: ./test_new_milestone_function.sh [customer_id]

FUNCTION_NAME="mk_milestone_notifications"
REGION="eu-north-1"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Testing Consolidated Milestone Notification Lambda"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if function exists
echo "1️⃣  Checking if Lambda function exists..."
FUNCTION_EXISTS=$(aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" 2>&1)

if echo "$FUNCTION_EXISTS" | grep -q "ResourceNotFoundException"; then
    echo "❌ Function $FUNCTION_NAME not found!"
    echo ""
    echo "Please deploy first:"
    echo "   ./deploy_milestone_notifications.sh"
    exit 1
fi

echo "✅ Function found!"
echo ""

# Test Mode 1: Scheduled (no customer_id)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📅 TEST 1: Scheduled Mode (simulates EventBridge trigger)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This simulates the hourly EventBridge trigger..."
echo ""

aws lambda invoke \
    --function-name "$FUNCTION_NAME" \
    --region "$REGION" \
    --payload '{"source":"aws.events","detail-type":"Scheduled Event"}' \
    response_scheduled.json

echo ""
echo "📊 Response:"
cat response_scheduled.json | python3 -c "import sys, json; data = json.load(sys.stdin); body = json.loads(data.get('body', '{}')); print(json.dumps(body, indent=2))"
echo ""

# Test Mode 2: On-demand (with customer_id)
if [ -n "$1" ]; then
    CUSTOMER_ID="$1"
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔔 TEST 2: On-Demand Mode (specific customer)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Customer ID: $CUSTOMER_ID"
    echo "Test Mode: true (won't actually send WhatsApp)"
    echo ""
    
    aws lambda invoke \
        --function-name "$FUNCTION_NAME" \
        --region "$REGION" \
        --payload "{\"customer_id\":\"$CUSTOMER_ID\",\"test_mode\":true}" \
        response_ondemand.json
    
    echo ""
    echo "📊 Response:"
    cat response_ondemand.json | python3 -c "import sys, json; data = json.load(sys.stdin); body = json.loads(data.get('body', '{}')); print(json.dumps(body, indent=2))"
    echo ""
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔔 TEST 3: On-Demand Mode (LIVE - will send WhatsApp!)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "⚠️  WARNING: This will send an actual WhatsApp message!"
    echo ""
    read -p "Continue? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        aws lambda invoke \
            --function-name "$FUNCTION_NAME" \
            --region "$REGION" \
            --payload "{\"customer_id\":\"$CUSTOMER_ID\",\"test_mode\":false}" \
            response_live.json
        
        echo ""
        echo "📊 Response:"
        cat response_live.json | python3 -c "import sys, json; data = json.load(sys.stdin); body = json.loads(data.get('body', '{}')); print(json.dumps(body, indent=2))"
        echo ""
    else
        echo "Skipped live test."
    fi
else
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "ℹ️  To test on-demand mode, provide a customer_id:"
    echo "   ./test_new_milestone_function.sh <customer_id>"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 View Live Logs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To watch logs in real-time:"
echo "   aws logs tail /aws/lambda/$FUNCTION_NAME --follow --region $REGION"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Cleanup
rm -f response_scheduled.json response_ondemand.json response_live.json

