# Fix Seal Webhook to Capture Country Code

## ✅ Problem Identified

The Seal webhook **DOES** send country code, but the handler isn't storing it!

### Webhook Data Received (from logs):

```json
{
  "b_country": "Netherlands",
  "b_country_code": "NL",  ← THIS IS THE FIELD WE NEED!
  "customer_id": "8885250982135",
  "email": "merijn@risottini.com",
  ...
}
```

---

## 🔧 Fix Required

In your `mk_shopify_web_app` Lambda function, find the `/seal-webhook` handler and update it:

### Current Code (What It's Doing Now):

```python
# In the Seal webhook handler
webhook_data = json.loads(event['body'])

customer_id = webhook_data.get('customer_id')
email = webhook_data.get('email')
seal_subscription_id = webhook_data.get('id')

# Update subscriber
subscribers_table.update_item(
    Key={'customer_id': customer_id},
    UpdateExpression='SET seal_subscription_id = :id, subscription_status = :status',
    ExpressionAttributeValues={
        ':id': seal_subscription_id,
        ':status': 'active'
    }
)
```

### Updated Code (What It Should Do):

```python
# In the Seal webhook handler
webhook_data = json.loads(event['body'])

customer_id = webhook_data.get('customer_id')
email = webhook_data.get('email')
seal_subscription_id = webhook_data.get('id')

# ✨ ADD THIS: Extract country code from billing address
country_code = webhook_data.get('b_country_code', '')  # ← NEW!

# ✨ ADD THIS: Map country code to timezone
from milestone_notifications import get_timezone_from_country  # Use your existing function
timezone = get_timezone_from_country(country_code) if country_code else 'UTC'

print(f"📍 Country code: {country_code}, Timezone: {timezone}")  # ← Logging

# Update subscriber WITH country and timezone
subscribers_table.update_item(
    Key={'customer_id': customer_id},
    UpdateExpression='SET seal_subscription_id = :id, subscription_status = :status, country = :country, whatsapp_notifications = :whatsapp',
    ExpressionAttributeValues={
        ':id': seal_subscription_id,
        ':status': 'active',
        ':country': country_code,  # ← NEW!
        ':whatsapp': True  # ← NEW! Default to enabled
    }
)
```

---

## 📋 Step-by-Step Instructions

### 1. Locate the Lambda Function

The Lambda is named: **`mk_shopify_web_app`**

Find the Python file that handles the `/seal-webhook` endpoint.

### 2. Find the Webhook Handler

Look for code that:
- Checks for path `/seal-webhook`
- Parses `event['body']`
- Extracts `customer_id`, `email`, and `id` (seal_subscription_id)

### 3. Add Country Code Extraction

After extracting the basic fields, add:

```python
# Extract billing country code
country_code = webhook_data.get('b_country_code', '')
```

### 4. Add Timezone Mapping

You can either:

**Option A**: Copy the `get_timezone_from_country()` function from `milestone_notifications.py`

**Option B**: Use a simple inline mapping:

```python
def get_timezone_from_country(country_code):
    timezones = {
        'NL': 'Europe/Amsterdam', 'BE': 'Europe/Brussels', 'FR': 'Europe/Paris',
        'DE': 'Europe/Berlin', 'ES': 'Europe/Madrid', 'IT': 'Europe/Rome',
        'GB': 'Europe/London', 'US': 'America/New_York', 'CA': 'America/Toronto',
        'AU': 'Australia/Sydney', 'NZ': 'Pacific/Auckland', 'JP': 'Asia/Tokyo',
        # Add more as needed
    }
    return timezones.get(country_code.upper(), 'UTC')

timezone = get_timezone_from_country(country_code) if country_code else 'UTC'
```

### 5. Update the DynamoDB Write

Change the `UpdateExpression` to include `country` and `whatsapp_notifications`:

```python
UpdateExpression='SET seal_subscription_id = :id, subscription_status = :status, country = :country, whatsapp_notifications = :whatsapp'
```

And add the values:

```python
ExpressionAttributeValues={
    ':id': seal_subscription_id,
    ':status': 'active',
    ':country': country_code,
    ':whatsapp': True  # Default enabled
}
```

### 6. Add Logging

Add a log line so you can verify it's working:

```python
print(f"📍 Storing country: {country_code} ({webhook_data.get('b_country', 'Unknown')}) → Timezone: {timezone}")
```

---

## 🧪 Testing

After deploying the change:

1. Create a new test subscription (or cancel and recreate)
2. Check Lambda logs for: `📍 Storing country: NL (Netherlands) → Timezone: Europe/Amsterdam`
3. Verify in DynamoDB that the `country` field is populated

### Check DynamoDB:

```bash
aws dynamodb get-item \
  --table-name stj_subscribers \
  --key '{"customer_id":{"S":"8885250982135"}}' \
  --region eu-north-1 \
  --query 'Item.country.S'
```

Should return: `"NL"`

---

## 📊 Example: Complete Updated Handler

Here's a complete example of what the updated webhook handler should look like:

```python
def handle_seal_webhook(event, subscribers_table):
    """Handle Seal subscription webhooks"""
    
    # Parse webhook
    webhook_data = json.loads(event['body'])
    topic = event['headers'].get('x-seal-topic', '')
    
    print(f"🎯 Seal webhook topic: {topic}")
    
    # Extract data
    customer_id = webhook_data.get('customer_id')
    email = webhook_data.get('email')
    seal_subscription_id = webhook_data.get('id')
    status = webhook_data.get('status', 'ACTIVE')
    
    # ✨ NEW: Extract billing country code
    country_code = webhook_data.get('b_country_code', '')
    country_name = webhook_data.get('b_country', '')
    
    # ✨ NEW: Map to timezone
    timezone = get_timezone_from_country(country_code) if country_code else 'UTC'
    
    print(f"📧 Processing subscription for: {email}")
    print(f"📝 Seal subscription ID: {seal_subscription_id}")
    print(f"📍 Country: {country_code} ({country_name}) → Timezone: {timezone}")
    
    # Map status
    if status == 'ACTIVE':
        subscription_status = 'active'
    elif status == 'CANCELLED':
        subscription_status = 'cancelled'
    elif status == 'PAUSED':
        subscription_status = 'paused'
    else:
        subscription_status = 'unknown'
    
    # Update subscriber in DynamoDB
    try:
        subscribers_table.update_item(
            Key={'customer_id': customer_id},
            UpdateExpression='SET seal_subscription_id = :id, subscription_status = :status, country = :country, whatsapp_notifications = :whatsapp, subscription_created_at = :created',
            ExpressionAttributeValues={
                ':id': seal_subscription_id,
                ':status': subscription_status,
                ':country': country_code,  # ← NEW!
                ':whatsapp': True,  # ← NEW! Default to enabled
                ':created': datetime.now().isoformat()
            }
        )
        
        print(f"✅ Updated subscriber: {customer_id} - {subscription_status}")
        print(f"📅 Stored country: {country_code}, whatsapp_notifications: True")
        
        return {
            'statusCode': 200,
            'body': json.dumps({'success': True})
        }
        
    except Exception as e:
        print(f"❌ Error updating subscriber: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

---

## 🎯 Expected Result

After this fix:

### Before:
```json
{
  "customer_id": "8885250982135",
  "country": null,  ← NULL
  "whatsapp_notifications": null  ← NULL
}
```

### After:
```json
{
  "customer_id": "8885250982135",
  "country": "NL",  ← POPULATED! ✨
  "whatsapp_notifications": true  ← POPULATED! ✨
}
```

---

## 📝 Next Steps

1. **Find** the `mk_shopify_web_app` Lambda Python file
2. **Update** the `/seal-webhook` handler with the code above
3. **Deploy** the Lambda
4. **Test** by creating a new subscription
5. **Verify** the `country` field is populated in DynamoDB
6. **Celebrate** 🎉 - Your milestone notifications will now use correct timezones!

---

## 🔗 Related

- The milestone Lambda (`mk_milestone_notifications`) is already set up to use the `country` field
- Once this is fixed, timezones will work automatically
- Existing users will fall back to phone number inference (still works, just less accurate)

---

**This is the ONLY change needed to make timezone detection work!** 🚀

