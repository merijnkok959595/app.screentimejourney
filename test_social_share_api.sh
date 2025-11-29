#!/bin/bash
# Test the social share API endpoint

echo "🧪 Testing /get_social_share_data endpoint..."
echo ""

curl -X POST \
  https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws/get_social_share_data \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"8885250982135"}' \
  | jq .

echo ""
echo "✅ Test complete"










