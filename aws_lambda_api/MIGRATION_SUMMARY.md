# Milestone Lambda Migration Summary

## 🎯 What Changed

You now have **ONE** consolidated Lambda function instead of two separate ones.

### Before (Python 3.11)
```
❌ mk_shopify_web_app_milestones          → On-demand notifications only
❌ mk_scheduled_milestone_notifications   → Scheduled notifications only
```

### After (Python 3.13)
```
✅ mk_milestone_notifications             → Both scheduled & on-demand
```

---

## 🌍 Timezone Based on Shopify Country Code

The new function uses this priority order for timezone:

1. **Explicit timezone field** (if user manually set it)
2. **Shopify country code** ← **PRIMARY SOURCE** ✨
3. **Phone number inference** (fallback)
4. **UTC** (ultimate fallback)

### Example

```python
# Subscriber from DynamoDB:
{
  "customer_id": "12345",
  "email": "user@example.com",
  "country": "NL",           # From Shopify subscription
  "phone": "+31612345678",
  "devices": [...]
}

# Timezone detection:
get_user_timezone(subscriber)
→ "Europe/Amsterdam"  (from country code "NL")
```

### Supported Countries

80+ countries including:
- **Europe**: All EU countries + UK, Norway, Switzerland, etc.
- **Americas**: US, Canada, Mexico, Brazil, Argentina, etc.
- **Asia-Pacific**: Japan, China, India, Singapore, Australia, etc.
- **Middle East**: UAE, Saudi Arabia, Israel, Turkey, etc.
- **Africa**: South Africa, Egypt, Nigeria, Kenya, etc.

---

## 📋 Quick Start Guide

### Step 1: Deploy New Function

```bash
cd aws_lambda_api
./deploy_milestone_notifications.sh
```

This will:
- Create `mk_milestone_notifications` Lambda (Python 3.13)
- Set up EventBridge hourly trigger
- Configure environment variables

### Step 2: Test

```bash
# Test scheduled mode (simulates EventBridge)
./test_new_milestone_function.sh

# Test on-demand mode (specific customer, test mode)
./test_new_milestone_function.sh YOUR_CUSTOMER_ID
```

### Step 3: Verify

Check logs:
```bash
aws logs tail /aws/lambda/mk_milestone_notifications --follow --region eu-north-1
```

Look for:
- ✅ Timezone being detected from country code
- ✅ Notifications sent at 10 AM local time
- ✅ No errors

### Step 4: Delete Old Functions

Once verified, run the cleanup:
```bash
./CLEANUP_SCRIPT.sh
```

This will:
1. Delete old Lambda functions
2. Remove old EventBridge rules (if any)
3. Clean up old files

---

## 🔄 How It Works

### Scheduled Mode (Automatic)

**Trigger**: EventBridge every hour

**Logic**:
1. Runs every hour
2. Scans all subscribers
3. For each user:
   - Get timezone from country code (Shopify)
   - Convert UTC to user's local time
   - If it's 10:00 AM locally → check if notification day
   - Day 1 (Ground Zero) or every 7 days → send WhatsApp

**Example Timeline**:
```
Day 1  → Ground Zero notification
Day 8  → Week 1 notification
Day 15 → Week 2 notification
Day 22 → Week 3 notification
...
```

### On-Demand Mode (Manual)

**Trigger**: API Gateway or direct invoke

**Payload**:
```json
{
  "customer_id": "12345",
  "test_mode": false
}
```

**Logic**:
1. Get specific customer
2. Calculate days in focus
3. Get current milestone
4. Send WhatsApp notification immediately

---

## 🛠️ Files Created

### New Files
- `milestone_notifications.py` - Consolidated Lambda handler (Python 3.13)
- `deploy_milestone_notifications.sh` - Deployment script
- `test_new_milestone_function.sh` - Testing script
- `CLEANUP_SCRIPT.sh` - Cleanup old functions
- `DELETE_OLD_LAMBDAS.md` - Detailed deletion guide
- `MIGRATION_SUMMARY.md` - This file

### Old Files (to be deleted)
- ~~`milestone_notification_handler.py`~~ (old on-demand)
- ~~`scheduled_milestone_notifications.py`~~ (old scheduled)
- ~~`deploy_milestone_notification.sh`~~ (old deploy)
- ~~`deploy_scheduled_milestones.sh`~~ (old deploy)
- ~~`milestone_notification.zip`~~ (old package)
- ~~`scheduled_milestone_notifications.zip`~~ (old package)

---

## 🧪 Testing Scenarios

### Scenario 1: Scheduled Run (No Notifications)

**Time**: 14:00 UTC (2 PM)  
**Result**: All users skipped (not 10 AM in any timezone yet)

```bash
./test_new_milestone_function.sh
```

Expected output:
```json
{
  "notifications_sent": 0,
  "notifications_skipped": 50,
  "total_subscribers": 50
}
```

### Scenario 2: Scheduled Run (Some Notifications)

**Time**: 09:00 UTC (10 AM in Amsterdam/Brussels)  
**Result**: Dutch/Belgian users at day 1, 8, 15, etc. get notifications

```bash
./test_new_milestone_function.sh
```

Expected output:
```json
{
  "notifications_sent": 5,
  "notifications_skipped": 45,
  "total_subscribers": 50
}
```

### Scenario 3: On-Demand (Test Mode)

**Test**: Send notification to specific customer (without WhatsApp)

```bash
./test_new_milestone_function.sh YOUR_CUSTOMER_ID
```

Expected output:
```json
{
  "success": true,
  "customer_id": "YOUR_CUSTOMER_ID",
  "days_in_focus": 15,
  "percentile": 85.2,
  "current_level": "Warrior",
  "template_name": "m2",
  "test_mode": true
}
```

### Scenario 4: On-Demand (Live)

**Live**: Actually send WhatsApp to customer

```bash
./test_new_milestone_function.sh YOUR_CUSTOMER_ID
# Choose 'y' when prompted for live send
```

Expected output:
```json
{
  "success": true,
  "message_sent": true,
  "wati_response": { "result": true }
}
```

---

## 🐛 Troubleshooting

### Issue: "Milestones not found"

**Cause**: `stj_system` table doesn't have milestones

**Fix**:
```bash
cd aws_lambda_api
python3 update_milestone_templates.py
```

### Issue: "Customer not found"

**Cause**: Invalid customer_id or not in `stj_subscribers`

**Fix**: Use a valid customer_id from DynamoDB

### Issue: "No notifications sent"

**Causes**:
1. Not 10 AM in any user's timezone
2. No users on day 1, 8, 15, etc.
3. Users missing phone numbers or devices

**Check Logs**:
```bash
aws logs tail /aws/lambda/mk_milestone_notifications --follow --region eu-north-1
```

### Issue: "Timezone showing UTC for all users"

**Cause**: Country code not stored in subscriber records

**Fix**: Update Shopify integration to capture country code from subscription:
```python
# When processing Shopify webhook:
subscriber_data = {
    'customer_id': order['customer']['id'],
    'email': order['email'],
    'country': order['billing_address']['country_code'],  # ← Add this
    'phone': order['customer']['phone'],
    ...
}
```

---

## 📊 Monitoring

### CloudWatch Metrics

```bash
# View invocation count
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=mk_milestone_notifications \
  --statistics Sum \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-12-31T23:59:59Z \
  --period 3600 \
  --region eu-north-1

# View error rate
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=mk_milestone_notifications \
  --statistics Sum \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-12-31T23:59:59Z \
  --period 3600 \
  --region eu-north-1
```

### Log Insights Queries

```sql
-- Count notifications by hour
fields @timestamp, @message
| filter @message like /notifications_sent/
| stats count() by bin(@timestamp, 1h)

-- Find timezone detection
fields @timestamp, @message
| filter @message like /TZ:/
| parse @message /TZ: (?<timezone>[\w\/]+)/
| stats count() by timezone

-- Find errors
fields @timestamp, @message
| filter @message like /ERROR/ or @message like /❌/
| sort @timestamp desc
```

---

## 🚀 Performance

### Cold Start
- **First invocation**: ~1-2 seconds
- **Warm invocation**: ~100-300ms

### Execution Time
- **Scheduled mode**: 30-60 seconds (processes all users)
- **On-demand mode**: 1-3 seconds (single user)

### Cost (Estimated)
- **Hourly runs**: 24 × 30 = 720 invocations/month
- **Duration**: ~30s average
- **Memory**: 512 MB
- **Cost**: ~$0.10-0.20/month (within free tier for small user base)

---

## 🎉 Benefits

### Before
❌ Two separate functions to maintain  
❌ Python 3.11 (older)  
❌ Timezone from phone only  
❌ Duplicate code  
❌ More complex deployment  

### After
✅ Single consolidated function  
✅ Python 3.13 (latest)  
✅ Timezone from Shopify country code  
✅ Cleaner codebase  
✅ Simpler deployment  
✅ Better maintainability  

---

## 📞 Support

If you need help:

1. **Check logs first**:
   ```bash
   aws logs tail /aws/lambda/mk_milestone_notifications --follow --region eu-north-1
   ```

2. **Test with known customer**:
   ```bash
   ./test_new_milestone_function.sh KNOWN_CUSTOMER_ID
   ```

3. **Verify EventBridge trigger**:
   ```bash
   aws events list-rules --region eu-north-1
   aws events list-targets-by-rule --rule milestone-notifications-hourly --region eu-north-1
   ```

4. **Check function exists**:
   ```bash
   aws lambda get-function --function-name mk_milestone_notifications --region eu-north-1
   ```

---

## 🎯 Next Steps

1. ✅ Deploy new function: `./deploy_milestone_notifications.sh`
2. ✅ Test both modes: `./test_new_milestone_function.sh`
3. ✅ Monitor for 24-48 hours
4. ✅ Verify timezones are correct
5. ✅ Run cleanup: `./CLEANUP_SCRIPT.sh`
6. ✅ Celebrate! 🎉

---

**Migration Complete!** You now have a modern, consolidated Lambda function with timezone support based on Shopify country codes. 🚀

