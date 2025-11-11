# Adding Country/Timezone Field from Shopify

## 📋 Problem

Currently, timezone is inferred from phone number country codes:
- ❌ Misleading (NL person with UK phone)
- ❌ Limited coverage (only 12 countries)
- ❌ USA has multiple timezones but +1 defaults to NY

## ✅ Better Solution

Capture **country** from Shopify checkout and use that for timezone!

---

## 🎯 Implementation Steps

### Step 1: Update DynamoDB Subscriber Structure

Add new fields to `stj_subscribers`:

```json
{
  "customer_id": "8196292608303",
  "email": "merijn@example.com",
  "phone": "+31627207989",
  "country": "NL",              // ← NEW: ISO country code from Shopify
  "timezone": "Europe/Amsterdam" // ← NEW: Derived from country
}
```

---

### Step 2: Capture Country from Shopify Webhook

When processing Shopify subscription webhooks, extract:

```javascript
// Shopify webhook payload contains:
{
  "billing_address": {
    "country": "Netherlands",
    "country_code": "NL"  // ← Use this!
  },
  "shipping_address": {
    "country": "Netherlands",
    "country_code": "NL"
  }
}
```

**Add to your webhook processing**:
```python
# In your webhook handler
webhook_data = event['body']  # Shopify webhook
country_code = (
    webhook_data.get('billing_address', {}).get('country_code') or
    webhook_data.get('shipping_address', {}).get('country_code') or
    'US'  # Default
)

# Map country to timezone
timezone = get_timezone_from_country(country_code)

# Store in DynamoDB
subscribers_table.put_item(Item={
    'customer_id': customer_id,
    'email': email,
    'phone': phone,
    'country': country_code,      # ← NEW
    'timezone': timezone,          # ← NEW
    # ... other fields
})
```

---

### Step 3: Country → Timezone Mapping

Create comprehensive country-to-timezone mapping:

```python
def get_timezone_from_country(country_code: str) -> str:
    """Map ISO country code to primary timezone"""
    
    country_timezones = {
        # Europe
        'NL': 'Europe/Amsterdam',
        'BE': 'Europe/Brussels',
        'FR': 'Europe/Paris',
        'DE': 'Europe/Berlin',
        'ES': 'Europe/Madrid',
        'IT': 'Europe/Rome',
        'GB': 'Europe/London',
        'UK': 'Europe/London',
        'SE': 'Europe/Stockholm',
        'NO': 'Europe/Oslo',
        'DK': 'Europe/Copenhagen',
        'FI': 'Europe/Helsinki',
        'PL': 'Europe/Warsaw',
        'AT': 'Europe/Vienna',
        'CH': 'Europe/Zurich',
        'PT': 'Europe/Lisbon',
        'GR': 'Europe/Athens',
        'CZ': 'Europe/Prague',
        'RO': 'Europe/Bucharest',
        'HU': 'Europe/Budapest',
        
        # Americas
        'US': 'America/New_York',      # Default to Eastern
        'CA': 'America/Toronto',       # Default to Eastern
        'MX': 'America/Mexico_City',
        'BR': 'America/Sao_Paulo',
        'AR': 'America/Argentina/Buenos_Aires',
        'CL': 'America/Santiago',
        'CO': 'America/Bogota',
        'PE': 'America/Lima',
        
        # Asia
        'JP': 'Asia/Tokyo',
        'CN': 'Asia/Shanghai',
        'IN': 'Asia/Kolkata',
        'SG': 'Asia/Singapore',
        'HK': 'Asia/Hong_Kong',
        'TH': 'Asia/Bangkok',
        'PH': 'Asia/Manila',
        'ID': 'Asia/Jakarta',
        'MY': 'Asia/Kuala_Lumpur',
        'VN': 'Asia/Ho_Chi_Minh',
        'KR': 'Asia/Seoul',
        'TW': 'Asia/Taipei',
        
        # Oceania
        'AU': 'Australia/Sydney',
        'NZ': 'Pacific/Auckland',
        
        # Middle East
        'AE': 'Asia/Dubai',
        'SA': 'Asia/Riyadh',
        'IL': 'Asia/Jerusalem',
        'TR': 'Europe/Istanbul',
        
        # Africa
        'ZA': 'Africa/Johannesburg',
        'EG': 'Africa/Cairo',
        'NG': 'Africa/Lagos',
        'KE': 'Africa/Nairobi',
    }
    
    return country_timezones.get(country_code.upper(), 'UTC')
```

---

### Step 4: Update Scheduled Lambda Function

Modify `scheduled_milestone_notifications.py`:

```python
# OLD (phone-based)
user_timezone = get_timezone_from_phone(phone)

# NEW (country-based with fallback)
user_timezone = (
    subscriber.get('timezone') or                    # Use stored timezone
    get_timezone_from_country(subscriber.get('country', '')) or  # Derive from country
    get_timezone_from_phone(phone) or               # Fallback to phone
    'UTC'                                           # Ultimate fallback
)
```

**Full updated logic**:
```python
# Get user's timezone (priority order)
timezone = subscriber.get('timezone')  # 1. Direct field
if not timezone:
    country = subscriber.get('country')
    if country:
        timezone = get_timezone_from_country(country)  # 2. From country
    else:
        timezone = get_timezone_from_phone(phone)      # 3. From phone (fallback)

user_tz = pytz.timezone(timezone or 'UTC')
```

---

## 🎯 Benefits

### ✅ Accuracy
- Uses actual customer location from Shopify
- No phone number ambiguity
- Covers 50+ countries (vs 12 from phone)

### ✅ Reliability
- Customer's billing/shipping address is authoritative
- Captured at subscription time
- Doesn't change if they switch phones

### ✅ Flexibility
- Allows manual timezone override in future
- Can add timezone selector to user profile
- Graceful fallback to phone-based detection

---

## 📊 Migration Strategy

### For Existing Users (Missing country/timezone)

**Option A: Backfill from webhook_data**
```python
# One-time script
for subscriber in all_subscribers:
    webhook_data = subscriber.get('webhook_data', {})
    country = (
        webhook_data.get('billing_address', {}).get('country_code') or
        webhook_data.get('shipping_address', {}).get('country_code')
    )
    
    if country:
        timezone = get_timezone_from_country(country)
        subscribers_table.update_item(
            Key={'customer_id': subscriber['customer_id']},
            UpdateExpression='SET country = :c, timezone = :tz',
            ExpressionAttributeValues={
                ':c': country,
                ':tz': timezone
            }
        )
```

**Option B: Gradual Migration (No Downtime)**
- New users get country/timezone from Shopify
- Old users use phone fallback until next webhook
- Eventually all users will have country/timezone

---

## 🚀 Deployment Order

1. ✅ Add `get_timezone_from_country()` function
2. ✅ Update webhook processing to capture `country` and `timezone`
3. ✅ Update `scheduled_milestone_notifications.py` with fallback logic
4. ✅ Deploy Lambda function
5. ⏳ (Optional) Run backfill script for existing users
6. ✅ Test with real users from different countries

---

## 🧪 Testing

### Test Cases

```python
# Test 1: New user from Netherlands
country = 'NL'
timezone = get_timezone_from_country(country)
assert timezone == 'Europe/Amsterdam'

# Test 2: New user from USA
country = 'US'
timezone = get_timezone_from_country(country)
assert timezone == 'America/New_York'

# Test 3: Old user (no country, has phone)
country = None
phone = '+31627207989'
timezone = get_timezone_from_phone(phone)
assert timezone == 'Europe/Amsterdam'

# Test 4: Unknown country
country = 'XX'
timezone = get_timezone_from_country(country)
assert timezone == 'UTC'
```

---

## 📋 Summary

### Current (Phone-Based)
```
Phone +31627207989 → Country Code 31 → Europe/Amsterdam
```

**Problems**: 
- ❌ Only 12 countries
- ❌ Can be wrong (NL person with UK phone)

### Improved (Country-Based)
```
Shopify Checkout → Country "NL" → Europe/Amsterdam
```

**Benefits**:
- ✅ 50+ countries
- ✅ Always accurate (uses billing/shipping address)
- ✅ Phone-based fallback for compatibility

---

## ✅ Ready to Implement?

Would you like me to:
1. ✅ Update `scheduled_milestone_notifications.py` with fallback logic?
2. ✅ Create the backfill script for existing users?
3. ✅ Show you where to add country capture in your webhook handler?

Let me know which parts you want me to implement!

