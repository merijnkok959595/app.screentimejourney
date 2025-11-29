#!/bin/bash

# Enhance Cloudflare Gateway adult content blocking
EMAIL="info@screentimejourney.com"
API_KEY="ce63b47aa3a8810afa9bdb163fb02766620e6"
ACCOUNT_ID="f9a4686c874f4d5be8af2f08610e5ec2"

echo "🚀 Enhancing Cloudflare Adult Content Blocking"
echo "============================================================"

# Create STRONGER adult content blocking policy
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/gateway/rules" \
  -H "X-Auth-Email: $EMAIL" \
  -H "X-Auth-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  --data '{
    "name": "Block Adult Content - ENHANCED (All Categories)",
    "description": "Blocks ALL adult content categories - stronger than CleanBrowsing",
    "enabled": true,
    "action": "block",
    "filters": ["dns"],
    "traffic": "any(dns.content_category[*] in {68 83 93 95 15 16 17 18 19 20 21 22 23 24})",
    "precedence": 10,
    "rule_settings": {
      "block_page_enabled": true,
      "block_reason": "Adult content is blocked by enhanced filtering",
      "block_page_footer_text": "Protected by ScreenTime Journey enhanced filtering"
    }
  }' | python3 -m json.tool

echo ""
echo "============================================================"

# Also create explicit site blocking for major porn sites
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/gateway/rules" \
  -H "X-Auth-Email: $EMAIL" \
  -H "X-Auth-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  --data '{
    "name": "Block Top Adult Sites - EXPLICIT",
    "description": "Explicitly blocks top adult sites by domain name",
    "enabled": true,
    "action": "block", 
    "filters": ["dns"],
    "traffic": "any(dns.domains[*] in {\"pornhub.com\" \"xvideos.com\" \"xnxx.com\" \"redtube.com\" \"tube8.com\" \"youporn.com\" \"xtube.com\" \"spankbang.com\" \"eporner.com\" \"tnaflix.com\" \"vporn.com\" \"drtuber.com\" \"nuvid.com\" \"sunporno.com\" \"alphaporno.com\"})",
    "precedence": 5,
    "rule_settings": {
      "block_page_enabled": true,
      "block_reason": "Adult site blocked - explicit domain filtering",
      "block_page_footer_text": "This site is blocked by ScreenTime Journey protection"
    }
  }' | python3 -m json.tool

echo ""
echo "============================================================"
echo "✅ Enhanced adult content blocking policies created!"
echo ""
echo "📊 Dashboard:"
echo "https://one.dash.cloudflare.com/$ACCOUNT_ID/gateway/policies"
echo ""
echo "🔍 Test in 2-3 minutes:"
echo "dig pornhub.com - should be blocked now!"


