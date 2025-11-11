# Delete Old Lambda Functions

## Overview

You now have a **consolidated** milestone notification Lambda function that handles both scheduled and on-demand notifications:

**New Function:**
- `mk_milestone_notifications` (Python 3.13)
  - Handles scheduled notifications (runs every hour, sends at 10 AM local time)
  - Handles on-demand notifications (API triggered)
  - Timezone based on Shopify country code (primary source)

**Old Functions to Delete:**
1. `mk_shopify_web_app_milestones` (Python 3.11) - On-demand only
2. `mk_scheduled_milestone_notifications` (Python 3.11) - Scheduled only

---

## Step 1: Deploy New Function

First, deploy the new consolidated function:

```bash
cd aws_lambda_api
./deploy_milestone_notifications.sh
```

This will:
- Create `mk_milestone_notifications` Lambda
- Set up EventBridge hourly trigger
- Use Python 3.13 runtime
- Configure timezone based on Shopify country code

---

## Step 2: Test New Function

### Test Scheduled Mode

Simulate an EventBridge trigger:

```bash
aws lambda invoke \
  --function-name mk_milestone_notifications \
  --region eu-north-1 \
  --payload '{}' \
  response.json

cat response.json | jq
```

### Test On-Demand Mode

Test with a specific customer (test mode):

```bash
aws lambda invoke \
  --function-name mk_milestone_notifications \
  --region eu-north-1 \
  --payload '{"customer_id":"YOUR_CUSTOMER_ID","test_mode":true}' \
  response.json

cat response.json | jq
```

### View Logs

```bash
aws logs tail /aws/lambda/mk_milestone_notifications --follow --region eu-north-1
```

---

## Step 3: Delete Old Functions

Once you've verified the new function works correctly:

### 3a. Delete Old Lambda Functions

```bash
# Delete old on-demand function
aws lambda delete-function \
  --function-name mk_shopify_web_app_milestones \
  --region eu-north-1

# Delete old scheduled function
aws lambda delete-function \
  --function-name mk_scheduled_milestone_notifications \
  --region eu-north-1
```

### 3b. Remove Old EventBridge Rule (if different)

Check if there's a separate EventBridge rule for the old function:

```bash
# List EventBridge rules
aws events list-rules --region eu-north-1 --query 'Rules[*].[Name,ScheduleExpression]' --output table

# If you see an old rule, remove it:
aws events remove-targets --rule OLD_RULE_NAME --ids 1 --region eu-north-1
aws events delete-rule --name OLD_RULE_NAME --region eu-north-1
```

---

## Step 4: Clean Up Old Files

Remove old deployment scripts and handlers:

```bash
cd aws_lambda_api

# Remove old handlers
rm -f milestone_notification_handler.py
rm -f scheduled_milestone_notifications.py

# Remove old deployment scripts
rm -f deploy_milestone_notification.sh
rm -f deploy_scheduled_milestones.sh

# Remove old zip files
rm -f milestone_notification.zip
rm -f scheduled_milestone_notifications.zip

# Remove test script (if you want to recreate it for the new function)
# rm -f test_milestone_notification.sh
```

---

## Verification Checklist

Before deleting the old functions, verify:

- [ ] New function deployed successfully
- [ ] EventBridge trigger is set up (runs every hour)
- [ ] Scheduled mode test shows no errors
- [ ] On-demand mode test works with test_mode=true
- [ ] Logs show timezone is being derived from country code
- [ ] Notifications are sent at correct times (10 AM local)

---

## Key Improvements in New Function

### 1. **Timezone Priority (Based on Shopify Country Code)**

```python
def get_user_timezone(subscriber: Dict[str, Any]) -> str:
    """
    Priority order:
    1. Explicit timezone field (if manually set)
    2. Country code from Shopify subscription (PRIMARY) ✨
    3. Phone number inference (fallback)
    4. UTC (ultimate fallback)
    """
```

### 2. **Consolidated Logic**

One function handles both:
- Scheduled notifications (EventBridge trigger)
- On-demand notifications (API Gateway trigger)

The handler automatically detects which mode to use.

### 3. **Python 3.13**

Uses the latest Python runtime for better performance and security.

### 4. **Expanded Country Coverage**

Supports 80+ countries with proper timezone mapping, including all EU countries, Americas, Asia-Pacific, Middle East, and Africa.

---

## Rollback Plan

If something goes wrong, you can quickly recreate the old functions:

```bash
# Redeploy old scheduled function
./deploy_scheduled_milestones.sh

# Redeploy old on-demand function
./deploy_milestone_notification.sh
```

But don't delete these scripts until you're 100% confident!

---

## Support

If you encounter issues:

1. Check CloudWatch logs:
   ```bash
   aws logs tail /aws/lambda/mk_milestone_notifications --follow --region eu-north-1
   ```

2. Verify EventBridge trigger:
   ```bash
   aws events list-rules --region eu-north-1
   aws events list-targets-by-rule --rule milestone-notifications-hourly --region eu-north-1
   ```

3. Test with a known customer ID:
   ```bash
   aws lambda invoke \
     --function-name mk_milestone_notifications \
     --region eu-north-1 \
     --payload '{"customer_id":"KNOWN_CUSTOMER_ID","test_mode":true}' \
     response.json
   ```

---

## Migration Complete! 🎉

Once you've completed all steps and deleted the old functions, you'll have:

✅ Single consolidated Lambda function  
✅ Python 3.13 runtime  
✅ Timezone based on Shopify country code  
✅ Both scheduled and on-demand capabilities  
✅ Cleaner, more maintainable codebase  

