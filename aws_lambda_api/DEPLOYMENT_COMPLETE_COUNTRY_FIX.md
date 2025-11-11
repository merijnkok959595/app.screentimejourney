# ✅ Country Code Fix Deployed!

**Date**: November 11, 2025  
**Lambda**: `mk_shopify_web_app`  
**Status**: LIVE IN PRODUCTION ✨

---

## 🎉 What Was Fixed

### Problem
The Seal webhook **was sending** country codes, but the Lambda handler wasn't capturing them!

### Solution Implemented

Updated the `mk_shopify_web_app` Lambda to:

1. ✅ Extract `b_country_code` from Seal webhook payload
2. ✅ Store country code in DynamoDB `country` field
3. ✅ Set `whatsapp_notifications = True` by default for new subscribers
4. ✅ Added logging to track country extraction

---

## 📝 Changes Made

### 1. Updated `update_subscriber()` Function

**Added parameter**:
```python
def update_subscriber(..., country: str = None):
```

**Added logic**:
```python
# Store country code if provided (from Seal billing address)
if country and country.strip():
    update_data['country'] = country.upper()
    print(f"📍 Updated country: {country.upper()}")

# Set whatsapp_notifications to True by default for new subscriptions
if 'whatsapp_notifications' not in existing_data:
    update_data['whatsapp_notifications'] = True
    print(f"📱 Set whatsapp_notifications: True (default)")
```

### 2. Updated `handle_seal_subscription_created()` Function

**Added extraction**:
```python
# Extract billing country code from Seal payload
country_code = payload.get('b_country_code', '')
country_name = payload.get('b_country', '')
if country_code:
    print(f"🌍 Billing country: {country_code} ({country_name})")
else:
    print(f"⚠️ No billing country code found in Seal webhook")
```

**Passed to update_subscriber**:
```python
success = update_subscriber(
    customer_id=customer_id,
    email=customer_email,
    status='active',
    event_type='subscription_created',
    data=payload,
    commitment_data=None,
    utm_data=utm_data,
    phone=None,
    seal_subscription_id=seal_subscription_id,
    country=country_code  # ← NEW!
)
```

---

## 🧪 Testing the Fix

### Option 1: Create a New Test Subscription

1. Go to your Shopify site
2. Create a test subscription (you can cancel it immediately after)
3. Check Lambda logs for: `🌍 Billing country: NL (Netherlands)`
4. Verify in DynamoDB

### Option 2: Update an Existing Subscription

Seal sends `subscription/updated` webhooks which also go through the same handler, so:
1. Make any change to an existing subscription in Seal dashboard
2. The webhook will trigger and populate the country code

### Option 3: Check Logs for Next Webhook

Wait for the next Seal webhook (subscription created/updated) and check the logs:

```bash
aws logs tail /aws/lambda/mk_shopify_web_app \
  --follow \
  --format short \
  --region eu-north-1 \
  --filter-pattern "country"
```

---

## ✅ Verification Commands

### Check if Country is Being Captured

```bash
cd /Users/merijnkok/Desktop/screen-time-journey-workspace/aws_lambda_api
./verify_country_populated.sh
```

### Check Specific Customer

```bash
aws dynamodb get-item \
  --table-name stj_subscribers \
  --key '{"customer_id":{"S":"8885250982135"}}' \
  --region eu-north-1 \
  --projection-expression "customer_id, email, country, whatsapp_notifications"
```

Expected after a new subscription:
```json
{
  "Item": {
    "customer_id": {"S": "8885250982135"},
    "email": {"S": "merijn@risottini.com"},
    "country": {"S": "NL"},
    "whatsapp_notifications": {"BOOL": true}
  }
}
```

### Monitor Lambda Logs

```bash
aws logs tail /aws/lambda/mk_shopify_web_app \
  --since 10m \
  --region eu-north-1 \
  --format short | grep -E "country|Country|🌍"
```

Look for:
```
🌍 Billing country: NL (Netherlands)
📍 Updated country: NL
📱 Set whatsapp_notifications: True (default)
```

---

## 🎯 Impact

### For New Subscribers (After This Fix)

✅ **Country code captured** from billing address  
✅ **Accurate timezone** for milestone notifications  
✅ **WhatsApp notifications** default to enabled  
✅ **Day 0 milestone** sent at correct local time (10:00 AM)  
✅ **Weekly milestones** (day 7, 14, 21...) at correct local time  

### For Existing Subscribers (Before This Fix)

⚠️ **No country code** (will remain NULL unless subscription is updated)  
✅ **Fallback timezone** from phone number inference (still works!)  
✅ **Milestone notifications** still work (using phone-based timezone)  

**Note**: Phone-based timezone is less accurate (e.g., USA +1 defaults to NY), but it's a working fallback.

---

## 📊 Seal Webhook Fields Reference

The Seal webhook sends these billing address fields:

```json
{
  "b_first_name": "Merijn",
  "b_last_name": "Kok",
  "b_address1": "Linnaeusstraat 35 F",
  "b_city": "Amsterdam",
  "b_zip": "1093 EE",
  "b_country": "Netherlands",      // Full name
  "b_country_code": "NL"           // ISO code ← We use this!
}
```

We extract `b_country_code` and store it in the `country` field.

---

## 🔗 Related Components

### Milestone Notification Lambda (`mk_milestone_notifications`)

Already configured to use the country code! No changes needed.

**Timezone Priority**:
1. ✅ Explicit `timezone` field (if manually set)
2. ✅ **`country` field** ← **Now being populated!** ⭐
3. ✅ Phone number inference (fallback)
4. ✅ UTC (ultimate fallback)

**Supported**: 80+ countries with primary timezones

---

## 📂 Files in This Deployment

| File | Purpose |
|------|---------|
| `shopify_web_app_updated.zip` | Updated Lambda code |
| `shopify_web_app_src/lambda_handler.py` | Modified source code |
| `verify_country_populated.sh` | Verification script |
| `DEPLOYMENT_COMPLETE_COUNTRY_FIX.md` | This document |

---

## 🎉 Success Criteria

The fix is working when you see:

1. ✅ In Lambda logs: `🌍 Billing country: XX (Country Name)`
2. ✅ In Lambda logs: `📍 Updated country: XX`
3. ✅ In DynamoDB: `country` field is populated
4. ✅ In DynamoDB: `whatsapp_notifications` is `true`
5. ✅ Milestone notifications use correct local time

---

## 🧪 Quick Test

**Easiest way to test**:

1. Create a test subscription on your Shopify site
2. Immediately check logs:
   ```bash
   aws logs tail /aws/lambda/mk_shopify_web_app --since 1m --region eu-north-1
   ```
3. Look for: `🌍 Billing country: NL (Netherlands)`
4. Verify in DynamoDB:
   ```bash
   aws dynamodb get-item \
     --table-name stj_subscribers \
     --key '{"customer_id":{"S":"YOUR_CUSTOMER_ID"}}' \
     --region eu-north-1 \
     --query 'Item.country.S'
   ```
5. Should return: `"NL"`

---

## 🚀 Next Steps

1. **Test** - Create a test subscription to verify
2. **Monitor** - Check logs for next few subscriptions
3. **Verify** - Run `./verify_country_populated.sh` periodically
4. **Enjoy** - All new subscribers will have accurate timezones! 🎉

---

## 📞 Troubleshooting

### If country is still NULL after new subscription:

1. **Check Lambda logs** - Is the webhook being received?
   ```bash
   aws logs tail /aws/lambda/mk_shopify_web_app --since 5m --region eu-north-1
   ```

2. **Look for errors** - Any errors during webhook processing?
   ```bash
   aws logs tail /aws/lambda/mk_shopify_web_app --since 10m --region eu-north-1 | grep -i error
   ```

3. **Check webhook payload** - Is `b_country_code` present?
   Look for: `🎉 Seal subscription created: {...}`

4. **Verify deployment** - Is the new code active?
   ```bash
   aws lambda get-function --function-name mk_shopify_web_app --region eu-north-1 --query 'Configuration.LastModified'
   ```
   Should show today's date: `2025-11-11`

---

**Fix deployed successfully!** 🎊  
**Ready to capture country codes from all new subscriptions!** 🌍

