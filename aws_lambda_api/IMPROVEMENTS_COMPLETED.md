# Milestone Notifications - Improvements Completed ✅

## 🎯 All Issues Fixed

### ✅ 1. Day 0 Notification (Registration Day)
**Before**: Sent on day 1  
**After**: Sent on day 0 (registration day at first 10:00 AM local time)

**Schedule**:
- **Day 0**: Ground Zero notification at 10:00 AM
- **Day 7**: Week 1 notification at 10:00 AM
- **Day 14**: Week 2 notification at 10:00 AM
- **Day 21**: Week 3 notification at 10:00 AM
- And so on every 7 days...

### ✅ 2. WhatsApp Notification Preference
**Check**: `subscriber.whatsapp_notifications` field  
**Behavior**: If `false` or disabled → **NEVER send WhatsApp**

```python
# CHECK 1: WhatsApp notifications enabled?
whatsapp_enabled = subscriber.get('whatsapp_notifications', True)
if whatsapp_enabled == False or whatsapp_enabled == 'false':
    whatsapp_disabled_count += 1
    notifications_skipped += 1
    continue
```

### ✅ 3. Device Registration Date Fix
**Before**: Used `added_at` (didn't exist in DB)  
**After**: Uses `addedDate` and `created_at` (actual fields in DynamoDB)

**Logic**:
- Gets the **FIRST device** registration date (earliest device)
- If no devices → **NO notification**
- If new device added later → **IGNORED** (only first device counts)

```python
def get_device_registration_date(devices: List[Dict]) -> Optional[datetime]:
    """
    Get the FIRST device registration date (earliest device)
    Returns None if no devices
    """
    if not devices:
        return None
    
    # Finds earliest device by addedDate or created_at
    # Returns the first device registration date
```

### ✅ 4. Batch Sending for Efficiency
**Before**: Individual API call for each user (slow, expensive)  
**After**: Groups users by template, sends in batches

**Example**:
```
Instead of:
  API call 1: User A with template 'm0'
  API call 2: User B with template 'm0'
  API call 3: User C with template 'm1'
  
Now:
  API call 1: Users A + B with template 'm0' (batch)
  API call 2: User C with template 'm1'
```

**Benefits**:
- Faster execution
- Fewer API calls
- Lower costs
- Better rate limit handling

```python
# Group users by template
batch_by_template = defaultdict(list)

# Add users to batches
batch_by_template[template_name].append(receiver_data)

# Send batched notifications
for template_name, receivers in batch_by_template.items():
    result = send_whatsapp_batch(
        template_name=template_name,
        receivers=receivers
    )
```

### ✅ 5. Timezone from Shopify Country Code
**Priority Order**:
1. Explicit timezone field (if manually set)
2. **Shopify country code** ← **PRIMARY SOURCE** ✨
3. Phone number inference (fallback)
4. UTC (ultimate fallback)

**80+ countries supported** including all EU countries, Americas, Asia-Pacific, Middle East, Africa

---

## ⚠️ Important: Country Code Must Be Populated

### Current Status
The `country` field in DynamoDB is currently **NULL** for all users:

```json
{
  "customer_id": "8885250982135",
  "country": null,  ← NOT BEING POPULATED
  "phone": "31627207989"
}
```

### What Needs to Be Done

**In your Shopify webhook handler** (when subscription is created), you need to capture the country code:

```python
# When processing Shopify order/subscription webhook:
subscriber_data = {
    'customer_id': order['customer']['id'],
    'email': order['email'],
    'phone': order['customer']['phone'],
    'country': order['billing_address']['country_code'],  # ← ADD THIS
    'whatsapp_notifications': True,  # ← ADD THIS (default to true)
    ...
}

# Save to DynamoDB
subscribers_table.put_item(Item=subscriber_data)
```

**Shopify Webhook Fields**:
```json
{
  "billing_address": {
    "country_code": "NL",  ← Use this
    "country": "Netherlands"
  }
}
```

### Fallback for Existing Users

For users where country is NULL, the Lambda will:
1. Try phone number inference (e.g., +31 → Netherlands → Europe/Amsterdam)
2. Fallback to UTC

But this is less accurate! Better to have the actual country code from Shopify.

---

## 📊 New Response Fields

The scheduled run now returns additional metrics:

```json
{
  "success": true,
  "mode": "scheduled",
  "timestamp": "2025-11-11T16:00:00+00:00",
  "total_subscribers": 100,
  "notifications_sent": 15,
  "notifications_skipped": 83,
  "whatsapp_disabled": 2,  ← NEW: Users who disabled WhatsApp
  "errors": 0,
  "batch_count": 3  ← NEW: Number of batch API calls made
}
```

---

## 🧪 Testing

Test the updated function:

```bash
cd aws_lambda_api

# Test scheduled run
echo '{}' > test_payload.json
aws lambda invoke \
  --function-name mk_milestone_notifications \
  --region eu-north-1 \
  --payload file://test_payload.json \
  response.json

# View result
cat response.json | python3 -m json.tool
```

**Expected output**:
```json
{
  "notifications_sent": 0,
  "notifications_skipped": 2,
  "whatsapp_disabled": 0,
  "batch_count": 0
}
```

(0 sent because it's not 10 AM in users' timezones or not the right day)

---

## 📋 Summary of Checks

The Lambda now performs these checks **in order**:

1. ✅ Is WhatsApp enabled for this user?
2. ✅ Does user have a phone number?
3. ✅ Does user have at least one device?
4. ✅ Can we get device registration date?
5. ✅ Is it 10:00 AM in user's local timezone?
6. ✅ Is today a notification day (day 0, 7, 14, 21, ...)?
7. ✅ Can we find the milestone template?

**If ANY check fails → Skip this user (no notification)**

---

## 🎯 Action Items

### ✅ Completed
- [x] Fixed day 0 notification logic
- [x] Added WhatsApp preference check
- [x] Fixed device date field handling
- [x] Implemented batch sending
- [x] Timezone from country code support
- [x] Deployed updated Lambda

### ⚠️ Requires Your Action
- [ ] **Update Shopify webhook handler** to populate `country` field
- [ ] **Update Shopify webhook handler** to populate `whatsapp_notifications` field (default: true)
- [ ] Add UI toggle for users to enable/disable WhatsApp notifications
- [ ] Backfill `country` for existing users (if possible from Shopify API)

---

## 📝 Code Changes Needed in Shopify Integration

### File: `mk_shopify_web_app` Lambda (or wherever you process orders)

**Find this code**:
```python
subscriber_data = {
    'customer_id': customer_id,
    'email': email,
    'phone': phone,
    ...
}
```

**Update to**:
```python
subscriber_data = {
    'customer_id': customer_id,
    'email': email,
    'phone': phone,
    'country': billing_address.get('country_code', ''),  # ← ADD
    'whatsapp_notifications': True,  # ← ADD (default enabled)
    ...
}
```

**Where to get country_code**:
- From Shopify order: `order['billing_address']['country_code']`
- From Shopify customer: `customer['default_address']['country_code']`

---

## 🎉 Benefits

**Before**:
- ❌ Day 1 notifications (missed registration day)
- ❌ No WhatsApp preference check
- ❌ Wrong device date field
- ❌ Individual API calls (slow)
- ❌ No timezone from country code

**After**:
- ✅ Day 0 notifications (registration day!)
- ✅ Respects WhatsApp preferences
- ✅ Correct device date handling
- ✅ Batch API calls (efficient)
- ✅ Timezone from Shopify country code
- ✅ Only counts FIRST device registration
- ✅ Never sends if no devices

---

## 🆘 Troubleshooting

### No notifications being sent?

Check logs:
```bash
aws logs tail /aws/lambda/mk_milestone_notifications --follow --region eu-north-1
```

Look for:
- `WhatsApp disabled` count
- `notifications_skipped` reasons
- Timezone detection: should show country code → timezone mapping

### Still using phone timezone instead of country?

The `country` field is NULL in DynamoDB. Update your Shopify webhook handler to populate it.

### Want to test with a specific user?

```bash
# Check user's data
aws dynamodb get-item \
  --table-name stj_subscribers \
  --key '{"customer_id":{"S":"YOUR_CUSTOMER_ID"}}' \
  --region eu-north-1
```

---

**All improvements deployed and ready! 🚀**

Next step: Update Shopify webhook to populate `country` and `whatsapp_notifications` fields.

