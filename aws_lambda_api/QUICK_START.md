# Quick Start - Consolidated Milestone Lambda

## 🚀 3-Step Migration

### Step 1: Deploy
```bash
cd aws_lambda_api
./deploy_milestone_notifications.sh
```

### Step 2: Test
```bash
# Test scheduled mode
./test_new_milestone_function.sh

# Test on-demand mode with your customer ID
./test_new_milestone_function.sh YOUR_CUSTOMER_ID
```

### Step 3: Cleanup
```bash
# After verifying it works
./CLEANUP_SCRIPT.sh
```

---

## ✨ What You Get

### One Lambda Function Instead of Two

**Old (Python 3.11):**
- ❌ `mk_shopify_web_app_milestones` (on-demand only)
- ❌ `mk_scheduled_milestone_notifications` (scheduled only)

**New (Python 3.13):**
- ✅ `mk_milestone_notifications` (both modes)

### Timezone Based on Shopify Country Code

Priority order:
1. Explicit timezone field (if set)
2. **Shopify country code** ← **PRIMARY** ✨
3. Phone number (fallback)
4. UTC (ultimate fallback)

### Both Modes in One Function

**Scheduled Mode:**
- Runs every hour via EventBridge
- Sends at 10 AM user's local time
- Day 1, then every 7 days

**On-Demand Mode:**
- API triggered for specific customer
- Sends immediately

---

## 📋 Files Created

### Essential Files
- ✅ `milestone_notifications.py` - New Lambda handler (Python 3.13)
- ✅ `deploy_milestone_notifications.sh` - Deploy script
- ✅ `test_new_milestone_function.sh` - Test script
- ✅ `CLEANUP_SCRIPT.sh` - Delete old functions

### Documentation
- ✅ `MIGRATION_SUMMARY.md` - Complete migration guide
- ✅ `DELETE_OLD_LAMBDAS.md` - Detailed deletion instructions
- ✅ `QUICK_START.md` - This file

---

## 🧪 Quick Test Commands

```bash
# Deploy new function
./deploy_milestone_notifications.sh

# Test scheduled mode (simulates hourly run)
./test_new_milestone_function.sh

# Test on-demand with customer ID
./test_new_milestone_function.sh 12345

# View logs in real-time
aws logs tail /aws/lambda/mk_milestone_notifications --follow --region eu-north-1

# After verification, cleanup
./CLEANUP_SCRIPT.sh
```

---

## 🌍 Timezone Examples

### Dutch Customer
```json
{
  "customer_id": "12345",
  "country": "NL",
  "phone": "+31612345678"
}
→ Timezone: "Europe/Amsterdam"
→ Notification at: 10:00 AM CET/CEST
```

### US Customer
```json
{
  "customer_id": "67890",
  "country": "US",
  "phone": "+12125551234"
}
→ Timezone: "America/New_York"
→ Notification at: 10:00 AM EST/EDT
```

### Australian Customer
```json
{
  "customer_id": "54321",
  "country": "AU",
  "phone": "+61412345678"
}
→ Timezone: "Australia/Sydney"
→ Notification at: 10:00 AM AEST/AEDT
```

---

## 📊 Monitoring

### Check Function Status
```bash
aws lambda get-function \
  --function-name mk_milestone_notifications \
  --region eu-north-1
```

### View Recent Logs
```bash
aws logs tail /aws/lambda/mk_milestone_notifications \
  --since 1h \
  --region eu-north-1
```

### Check EventBridge Schedule
```bash
aws events describe-rule \
  --name milestone-notifications-hourly \
  --region eu-north-1
```

---

## 🎯 Next Steps

1. [ ] Deploy new function: `./deploy_milestone_notifications.sh`
2. [ ] Test both modes work correctly
3. [ ] Monitor logs for 24 hours
4. [ ] Verify timezone detection is correct
5. [ ] Run cleanup: `./CLEANUP_SCRIPT.sh`

---

## 💡 Pro Tips

### Test Without Sending WhatsApp
```bash
./test_new_milestone_function.sh YOUR_CUSTOMER_ID
# Uses test_mode=true by default
```

### Force Scheduled Run Manually
```bash
aws lambda invoke \
  --function-name mk_milestone_notifications \
  --region eu-north-1 \
  --payload '{"source":"aws.events"}' \
  response.json
```

### Check Specific User's Timezone
```bash
aws dynamodb get-item \
  --table-name stj_subscribers \
  --key '{"customer_id":{"S":"YOUR_CUSTOMER_ID"}}' \
  --region eu-north-1 \
  --query 'Item.country.S'
```

---

## 🆘 Need Help?

Read the detailed guides:
- 📖 `MIGRATION_SUMMARY.md` - Complete overview
- 🗑️ `DELETE_OLD_LAMBDAS.md` - Deletion guide
- 📝 Logs: `aws logs tail /aws/lambda/mk_milestone_notifications --follow`

---

**Ready to deploy? Run:**
```bash
./deploy_milestone_notifications.sh
```

🎉 Enjoy your consolidated, timezone-aware milestone notifications!

