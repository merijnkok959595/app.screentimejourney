#!/bin/bash

# ========================================
# AWS Budget Cost Alerts Setup
# ========================================

set -e

REGION="eu-north-1"
EMAIL_ALERT="info@screentimejourney.com"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "💰 Setting up AWS Budget Cost Alerts..."
echo "📧 Alerts will be sent to: $EMAIL_ALERT"
echo "🆔 AWS Account ID: $ACCOUNT_ID"

# ========================================
# 1. Create $100 Budget Alert
# ========================================
echo ""
echo "💵 Creating $100 monthly budget alert (WARNING)..."

cat > /tmp/budget-100.json <<EOF
{
  "BudgetName": "ScreenTimeJourney-Monthly-100-Warning",
  "BudgetLimit": {
    "Amount": "100",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST",
  "CostFilters": {},
  "CostTypes": {
    "IncludeTax": true,
    "IncludeSubscription": true,
    "UseBlended": false,
    "IncludeRefund": false,
    "IncludeCredit": false,
    "IncludeUpfront": true,
    "IncludeRecurring": true,
    "IncludeOtherSubscription": true,
    "IncludeSupport": true,
    "IncludeDiscount": true,
    "UseAmortized": false
  }
}
EOF

cat > /tmp/notifications-100.json <<EOF
[
  {
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 80.0,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [
      {
        "SubscriptionType": "EMAIL",
        "Address": "$EMAIL_ALERT"
      }
    ]
  },
  {
    "Notification": {
      "NotificationType": "FORECASTED",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 100.0,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [
      {
        "SubscriptionType": "EMAIL",
        "Address": "$EMAIL_ALERT"
      }
    ]
  }
]
EOF

aws budgets create-budget \
    --account-id "$ACCOUNT_ID" \
    --budget file:///tmp/budget-100.json \
    --notifications-with-subscribers file:///tmp/notifications-100.json \
    --region us-east-1 2>/dev/null || echo "⚠️  Budget already exists, skipping..."

echo "✅ $100 budget alert created (triggers at 80% and forecasted 100%)"

# ========================================
# 2. Create $500 Budget Alert
# ========================================
echo ""
echo "💵 Creating $500 monthly budget alert (CRITICAL)..."

cat > /tmp/budget-500.json <<EOF
{
  "BudgetName": "ScreenTimeJourney-Monthly-500-Critical",
  "BudgetLimit": {
    "Amount": "500",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST",
  "CostFilters": {},
  "CostTypes": {
    "IncludeTax": true,
    "IncludeSubscription": true,
    "UseBlended": false,
    "IncludeRefund": false,
    "IncludeCredit": false,
    "IncludeUpfront": true,
    "IncludeRecurring": true,
    "IncludeOtherSubscription": true,
    "IncludeSupport": true,
    "IncludeDiscount": true,
    "UseAmortized": false
  }
}
EOF

cat > /tmp/notifications-500.json <<EOF
[
  {
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 80.0,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [
      {
        "SubscriptionType": "EMAIL",
        "Address": "$EMAIL_ALERT"
      }
    ]
  },
  {
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 100.0,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [
      {
        "SubscriptionType": "EMAIL",
        "Address": "$EMAIL_ALERT"
      }
    ]
  }
]
EOF

aws budgets create-budget \
    --account-id "$ACCOUNT_ID" \
    --budget file:///tmp/budget-500.json \
    --notifications-with-subscribers file:///tmp/notifications-500.json \
    --region us-east-1 2>/dev/null || echo "⚠️  Budget already exists, skipping..."

echo "✅ $500 budget alert created (triggers at 80% and 100%)"

# ========================================
# 3. Create $1,000 Budget Alert
# ========================================
echo ""
echo "💵 Creating $1,000 monthly budget alert (EMERGENCY)..."

cat > /tmp/budget-1000.json <<EOF
{
  "BudgetName": "ScreenTimeJourney-Monthly-1000-Emergency",
  "BudgetLimit": {
    "Amount": "1000",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST",
  "CostFilters": {},
  "CostTypes": {
    "IncludeTax": true,
    "IncludeSubscription": true,
    "UseBlended": false,
    "IncludeRefund": false,
    "IncludeCredit": false,
    "IncludeUpfront": true,
    "IncludeRecurring": true,
    "IncludeOtherSubscription": true,
    "IncludeSupport": true,
    "IncludeDiscount": true,
    "UseAmortized": false
  }
}
EOF

cat > /tmp/notifications-1000.json <<EOF
[
  {
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 90.0,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [
      {
        "SubscriptionType": "EMAIL",
        "Address": "$EMAIL_ALERT"
      }
    ]
  },
  {
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 100.0,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [
      {
        "SubscriptionType": "EMAIL",
        "Address": "$EMAIL_ALERT"
      }
    ]
  }
]
EOF

aws budgets create-budget \
    --account-id "$ACCOUNT_ID" \
    --budget file:///tmp/budget-1000.json \
    --notifications-with-subscribers file:///tmp/notifications-1000.json \
    --region us-east-1 2>/dev/null || echo "⚠️  Budget already exists, skipping..."

echo "✅ $1,000 budget alert created (triggers at 90% and 100%)"

# ========================================
# Cleanup temp files
# ========================================
rm -f /tmp/budget-*.json /tmp/notifications-*.json

# ========================================
# Summary
# ========================================
echo ""
echo "=========================================="
echo "✅ AWS Budget Alerts Setup Complete!"
echo "=========================================="
echo ""
echo "💰 Budgets Created:"
echo "  1. \$100/month - WARNING (80% actual + 100% forecast)"
echo "  2. \$500/month - CRITICAL (80% + 100% actual)"
echo "  3. \$1,000/month - EMERGENCY (90% + 100% actual)"
echo ""
echo "📧 Alerts will be sent to: $EMAIL_ALERT"
echo ""
echo "📊 View budgets:"
echo "   https://console.aws.amazon.com/billing/home#/budgets"
echo ""
echo "⚠️  NOTE: Budget alerts may take 24 hours to activate"
echo ""













