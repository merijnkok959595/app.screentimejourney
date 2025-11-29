# Lambda Function Versions - Rollback Guide

**Last Updated:** November 11, 2025  
**Status:** ✅ All systems operational

---

## Published Versions

### 1. **mk_shopify_web_app** (Main API Lambda)
- **Version:** `1`
- **Code Size:** 46,920 bytes (46 KB)
- **Description:** Working version - restored from backup with video generation
- **Last Modified:** 2025-11-11T23:31:23.000+0000
- **ARN:** `arn:aws:lambda:eu-north-1:218638337917:function:mk_shopify_web_app:1`
- **Function URL:** `https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws/`
- **Features:**
  - ✅ Dashboard API endpoints (`get_system_config`, `get_leaderboard`, `get_devices`, etc.)
  - ✅ Social share data endpoint (`get_social_share_data`)
  - ✅ Video generation endpoint (`generate_milestone_video`)
  - ✅ Shopify webhooks & app proxy
  - ✅ WATI WhatsApp integration
  - ✅ All milestone & percentile calculations

---

### 2. **remotion-bridge** (Video Generation Bridge)
- **Version:** `1`
- **Code Size:** 48,518,845 bytes (46 MB)
- **Description:** Working video generation bridge with Apple emojis
- **ARN:** `arn:aws:lambda:eu-north-1:218638337917:function:remotion-bridge:1`
- **Features:**
  - ✅ Calls Remotion Render Lambda correctly
  - ✅ Apple-style emojis (Twemoji)
  - ✅ Constructs proper S3 video URLs
  - ✅ Handles all video rendering parameters

---

### 3. **mk_milestone_notifications** (Email & WhatsApp Notifications)
- **Version:** `1`
- **Code Size:** 1,204,728 bytes (1.2 MB)
- **Description:** Working milestone notifications with customer_id
- **ARN:** `arn:aws:lambda:eu-north-1:218638337917:function:mk_milestone_notifications:1`
- **Features:**
  - ✅ Milestone achievement emails
  - ✅ WhatsApp notifications via WATI
  - ✅ Social share links with customer_id
  - ✅ DynamoDB integration

---

## How to Rollback

If $LATEST breaks, rollback to a working version:

### Method 1: Update Alias (Recommended)
```bash
# Create 'prod' alias pointing to version 1
aws lambda create-alias \
  --function-name mk_shopify_web_app \
  --name prod \
  --function-version 1 \
  --region eu-north-1

# Update Function URL to use alias
aws lambda update-function-url-config \
  --function-name mk_shopify_web_app \
  --qualifier prod \
  --region eu-north-1
```

### Method 2: Promote Version to $LATEST
```bash
# Get version 1 code
aws lambda get-function \
  --function-name mk_shopify_web_app:1 \
  --region eu-north-1 \
  --query 'Code.Location' \
  --output text > /tmp/lambda_url.txt

# Download and redeploy
wget -O /tmp/lambda.zip $(cat /tmp/lambda_url.txt)

aws lambda update-function-code \
  --function-name mk_shopify_web_app \
  --zip-file fileb:///tmp/lambda.zip \
  --region eu-north-1
```

### Method 3: Point to Specific Version (Testing)
```bash
# Invoke specific version directly
aws lambda invoke \
  --function-name mk_shopify_web_app:1 \
  --payload '{"httpMethod":"POST","path":"/get_system_config","body":"{}"}' \
  --region eu-north-1 \
  response.json
```

---

## Version History

| Date | Version | Lambda | Change Description |
|------|---------|--------|-------------------|
| 2025-11-11 | v1 | mk_shopify_web_app | Restored from backup + video generation |
| 2025-11-11 | v1 | remotion-bridge | Apple emoji support (Twemoji) |
| 2025-11-11 | v1 | mk_milestone_notifications | customer_id in social links |

---

## Critical Files Backup

Backup copies saved locally:

```
aws_lambda_api/
├── lambda_handler.py                    (5,091 lines - CURRENT)
├── lambda_handler_broken_backup.py      (2,622 lines - BROKEN, do not use)
└── shopify_web_app_download/
    └── lambda_handler.py                (5,091 lines - WORKING BACKUP)
```

---

## Emergency Contact

If everything breaks:
1. Check CloudWatch Logs: `/aws/lambda/mk_shopify_web_app`
2. Rollback to Version 1 (see commands above)
3. Redeploy from `shopify_web_app_download/lambda_handler.py`

---

## Next Steps

✅ Versions published successfully  
✅ Rollback procedures documented  
✅ All systems operational  

**Recommendation:** Test thoroughly before making new changes!









