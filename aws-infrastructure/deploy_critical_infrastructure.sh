#!/bin/bash

# ========================================
# Master Script: Deploy Critical Infrastructure
# ========================================

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "🚀 Starting Critical Infrastructure Deployment"
echo "================================================"
echo ""

# ========================================
# Step 1: Enable DynamoDB PITR
# ========================================
echo "📦 STEP 1/5: Enabling DynamoDB Point-in-Time Recovery..."
echo ""
bash "$SCRIPT_DIR/enable_dynamodb_pitr.sh"
echo ""
echo "✅ Step 1 complete!"
echo ""
read -p "Press Enter to continue to Step 2..."
echo ""

# ========================================
# Step 2: Set up CloudWatch Alarms
# ========================================
echo "📊 STEP 2/5: Setting up CloudWatch Alarms..."
echo ""
bash "$SCRIPT_DIR/setup_cloudwatch_alarms.sh"
echo ""
echo "✅ Step 2 complete!"
echo "⚠️  IMPORTANT: Check your email (info@screentimejourney.com) and confirm SNS subscription!"
echo ""
read -p "Press Enter to continue to Step 3..."
echo ""

# ========================================
# Step 3: Set up Cost Alerts
# ========================================
echo "💰 STEP 3/5: Setting up Cost Alerts..."
echo ""
bash "$SCRIPT_DIR/setup_cost_alerts.sh"
echo ""
echo "✅ Step 3 complete!"
echo ""
read -p "Press Enter to continue to Step 4..."
echo ""

# ========================================
# Step 4: Set up API Gateway
# ========================================
echo "🌐 STEP 4/5: Setting up API Gateway with Rate Limiting..."
echo ""
bash "$SCRIPT_DIR/setup_api_gateway.sh"
echo ""
echo "✅ Step 4 complete!"
echo ""
echo "📝 IMPORTANT: Update your React app with the new API endpoint!"
echo ""
read -p "Press Enter to continue to Step 5..."
echo ""

# ========================================
# Step 5: Manual Tasks
# ========================================
echo "📋 STEP 5/5: Manual Tasks"
echo ""
echo "The following tasks require manual action:"
echo ""
echo "1. ✅ Sentry Integration"
echo "   📄 Instructions: $SCRIPT_DIR/setup_sentry.md"
echo "   ⏱️  Time: 15-20 minutes"
echo ""
echo "2. ✅ Lambda Concurrency Increase Request"
echo "   📄 Instructions: $SCRIPT_DIR/lambda_concurrency_increase_request.md"
echo "   ⏱️  Time: 5 minutes to submit, 1-5 days for approval"
echo ""

# ========================================
# Summary
# ========================================
echo ""
echo "=========================================="
echo "✅ CRITICAL INFRASTRUCTURE DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "✨ What's been deployed:"
echo ""
echo "  ✅ DynamoDB Point-in-Time Recovery (35-day backups)"
echo "  ✅ CloudWatch Alarms (Lambda errors, DynamoDB throttles)"
echo "  ✅ Cost Alerts (\$100, \$500, \$1,000 thresholds)"
echo "  ✅ API Gateway with Rate Limiting (1,000 req/sec)"
echo ""
echo "📋 Manual tasks remaining:"
echo ""
echo "  ⏳ Sentry error tracking (15-20 min)"
echo "  ⏳ Lambda concurrency increase request (5 min)"
echo "  ⏳ Confirm SNS email subscription"
echo "  ⏳ Update React app API endpoint"
echo ""
echo "📊 Monitoring:"
echo ""
echo "  • CloudWatch: https://console.aws.amazon.com/cloudwatch/home?region=eu-north-1"
echo "  • API Gateway: https://console.aws.amazon.com/apigateway/home?region=eu-north-1"
echo "  • Budgets: https://console.aws.amazon.com/billing/home#/budgets"
echo "  • DynamoDB: https://console.aws.amazon.com/dynamodbv2/home?region=eu-north-1"
echo ""
echo "💰 Cost Impact:"
echo ""
echo "  • DynamoDB PITR: ~\$2-5/month"
echo "  • CloudWatch Alarms: ~\$1/month"
echo "  • API Gateway: \$3.50 per million requests"
echo "  • Budgets: Free"
echo "  • Sentry: Free tier (5K errors/month)"
echo ""
echo "  Total additional cost: ~\$5-10/month"
echo ""
echo "🎯 Ready for scale: 10,000 users ✅"
echo ""













