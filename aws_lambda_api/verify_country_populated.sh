#!/bin/bash
#
# Verify Country Code is Being Populated from Seal Webhooks
#

set -e

AWS_REGION="eu-north-1"
TABLE_NAME="stj_subscribers"

echo "🔍 Checking if country codes are being populated in DynamoDB..."
echo ""

# Get a sample of recent subscribers
echo "📊 Sampling recent subscribers..."
aws dynamodb scan \
  --table-name "$TABLE_NAME" \
  --region "$AWS_REGION" \
  --max-items 10 \
  --projection-expression "customer_id, email, country, whatsapp_notifications, subscription_created_at" \
  --output table

echo ""
echo "---"
echo ""

# Count subscribers with/without country
echo "📈 Statistics:"
echo ""

TOTAL=$(aws dynamodb scan --table-name "$TABLE_NAME" --region "$AWS_REGION" --select COUNT --output text --query 'Count')
echo "Total subscribers: $TOTAL"

WITH_COUNTRY=$(aws dynamodb scan \
  --table-name "$TABLE_NAME" \
  --region "$AWS_REGION" \
  --filter-expression "attribute_exists(country) AND country <> :empty" \
  --expression-attribute-values '{":empty":{"S":""}}' \
  --select COUNT \
  --output text \
  --query 'Count' 2>/dev/null || echo "0")

echo "Subscribers with country: $WITH_COUNTRY"
echo "Subscribers without country: $((TOTAL - WITH_COUNTRY))"

if [ "$WITH_COUNTRY" -eq 0 ]; then
    echo ""
    echo "⚠️  NO SUBSCRIBERS HAVE COUNTRY CODE SET"
    echo "   This means the Seal webhook handler hasn't been updated yet."
    echo "   See: FIX_SEAL_WEBHOOK_COUNTRY.md"
else
    echo ""
    echo "✅ Some subscribers have country codes!"
    PERCENTAGE=$((WITH_COUNTRY * 100 / TOTAL))
    echo "   Coverage: $PERCENTAGE%"
    
    if [ "$PERCENTAGE" -lt 100 ]; then
        echo ""
        echo "💡 Older subscribers don't have country codes (expected)"
        echo "   They will use phone number inference as fallback"
    fi
fi

echo ""
echo "---"
echo ""
echo "🧪 Test: Create a new subscription to verify the fix works"
echo "   1. Go to your Shopify site"
echo "   2. Create a test subscription"
echo "   3. Run this script again to check if country is populated"
echo ""
echo "Or check a specific customer:"
echo "   aws dynamodb get-item \\"
echo "     --table-name $TABLE_NAME \\"
echo "     --key '{\"customer_id\":{\"S\":\"YOUR_CUSTOMER_ID\"}}' \\"
echo "     --region $AWS_REGION \\"
echo "     --projection-expression \"customer_id, country, whatsapp_notifications\""

