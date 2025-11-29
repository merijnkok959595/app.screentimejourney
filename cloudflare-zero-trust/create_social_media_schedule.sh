#!/bin/bash

# Cloudflare credentials
EMAIL="info@screentimejourney.com"
API_KEY="ce63b47aa3a8810afa9bdb163fb02766620e6"
ACCOUNT_ID="f9a4686c874f4d5be8af2f08610e5ec2"

echo "🚀 Creating Social Media Schedule Policy (Block 22:00-09:00)"
echo "============================================================"

# Create policy to block social media using content category
# Social Networking category ID: 25

curl -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/gateway/rules" \
  -H "X-Auth-Email: $EMAIL" \
  -H "X-Auth-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  --data '{
    "name": "Block Social Media - Sleep Hours (22:00-09:00)",
    "description": "Blocks social media apps and websites during sleep hours using Cloudflare category",
    "enabled": true,
    "action": "block",
    "filters": ["dns"],
    "traffic": "any(dns.content_category[*] in {25})",
    "precedence": 100,
    "rule_settings": {
      "block_page_enabled": true,
      "block_reason": "Social media is blocked during sleep hours (22:00-09:00). Available again at 09:00.",
      "block_page_footer_text": "This restriction helps you maintain healthy digital habits."
    },
    "schedule": {
      "time_zone": "Europe/Amsterdam",
      "mon": "00:00-09:00,22:00-23:59",
      "tue": "00:00-09:00,22:00-23:59",
      "wed": "00:00-09:00,22:00-23:59",
      "thu": "00:00-09:00,22:00-23:59",
      "fri": "00:00-09:00,22:00-23:59",
      "sat": "00:00-09:00,22:00-23:59",
      "sun": "00:00-09:00,22:00-23:59"
    }
  }' | python3 -m json.tool

echo ""
echo "============================================================"
echo "✅ Policy creation attempt complete!"
echo ""
echo "📊 View in dashboard:"
echo "https://one.dash.cloudflare.com/$ACCOUNT_ID/gateway/policies"
echo ""
echo "🔍 To verify it's working:"
echo "1. Install Cloudflare WARP on device"
echo "2. Connect to your organization"  
echo "3. Wait until 22:00 (10 PM)"
echo "4. Try accessing Instagram/Facebook"
echo "5. Should see Cloudflare block page"

