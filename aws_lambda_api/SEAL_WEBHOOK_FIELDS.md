# Seal Webhook Field Reference

Based on actual webhook data captured from your production system.

---

## 📨 Webhook Headers

```json
{
  "x-seal-hmac-sha256": "kMa74CaAl3g7bPmWnLA9fUE3JvtbXD2afpThEaiPvGY=",
  "x-seal-topic": "subscription/created",
  "content-type": "application/json; charset=utf-8"
}
```

**Topics observed**:
- `subscription/created`
- `subscription/updated`
- `subscription/cancelled`

---

## 📦 Webhook Body Fields

### Core Subscription Fields

```json
{
  "id": 8458680,                    // ← Seal subscription ID
  "customer_id": "8885250982135",   // ← Shopify customer ID
  "email": "merijn@risottini.com",
  "status": "ACTIVE",               // ACTIVE | CANCELLED | PAUSED
  "order_placed": "2025-11-11T16:52:28+01:00",
  "order_id": "7092928086263",      // Shopify order ID
  "total_value": 0,
  "currency": "EUR"
}
```

### Customer Name Fields

```json
{
  "first_name": "Merijn",
  "last_name": "Kok"
}
```

### 🌍 Billing Address (The Fields You Need!)

```json
{
  "b_first_name": "Merijn",
  "b_last_name": "Kok",
  "b_address1": "Linnaeusstraat 35 F",
  "b_city": "Amsterdam",
  "b_zip": "1093 EE",
  "b_country": "Netherlands",       // Full country name
  "b_country_code": "NL"            // ← USE THIS FOR TIMEZONE! ✨
}
```

### 📦 Shipping Address

```json
{
  "s_first_name": "",
  "s_last_name": "",
  "s_address1": "",
  "s_address2": "",
  "s_phone": "",
  "s_city": "",
  "s_zip": "",
  "s_province": "",
  "s_country": "",
  "s_company": "",
  "s_country_code": "",
  "s_province_code": ""
}
```

**Note**: Shipping fields are often empty for digital products!

### Subscription Details

```json
{
  "delivery_interval": "1 month",
  "billing_interval": "1 month",
  "subscription_type": 2,
  "internal_id": 1001,
  "shopify_graphql_subscription_contract_id": "25708429559"
}
```

### Payment Details

```json
{
  "payment_method_id": "249fd52db7f1db56e743bf523cb88d0a",
  "card_brand": "visa",
  "card_expiry_month": "12",
  "card_expiry_year": "2029",
  "card_last_digits": "0820"
}
```

### Product Items

```json
{
  "items": [
    {
      "id": 19811013,
      "product_id": "9661070835959",
      "variant_id": "49692077785335",
      "title": "Screentime Journey - Monthly",
      "variant_sku": "MK10001",
      "quantity": 1,
      "price": "0.0",
      "final_price": "0.0",
      "final_amount": 0,
      "selling_plan_id": "3311436023",
      "selling_plan_name": "SCREENTIMEJOURNEY"
    }
  ]
}
```

### Billing Attempts

```json
{
  "billing_attempts": [
    {
      "id": 79779410,
      "date": "2025-12-11T15:00:00+00:00",
      "status": "",
      "order_id": "",
      "error_code": "",
      "error_message": ""
    }
  ]
}
```

### Admin Fields

```json
{
  "admin_note": "",
  "note": "",
  "note_attributes": [],
  "cancellation_reason": "",
  "cancelled_on": "",
  "paused_on": "",
  "tags": [],
  "log": [
    {
      "content": "The \"New Subscription\" e-mail was sent to the customer.",
      "created": "2025-11-11 15:52:43"
    }
  ]
}
```

### Edit URL

```json
{
  "edit_url": "https://www.screentimejourney.com/a/subscriptions/manage/51arc/authenticate/?sealkeyx=..."
}
```

---

## 🎯 Fields to Extract and Store

For your milestone notifications, you should extract:

| Field | Purpose | Store As |
|-------|---------|----------|
| `id` | Seal subscription ID | `seal_subscription_id` |
| `customer_id` | Shopify customer ID | Primary key |
| `email` | Customer email | `email` |
| `status` | Subscription status | `subscription_status` |
| `b_country_code` | Billing country code | `country` ⭐ **NEW** |
| `first_name` | Customer name | (optional) |
| `last_name` | Customer name | (optional) |

---

## 🔑 Key Insight

**Always use `b_country_code` (billing address), NOT `s_country_code` (shipping address)**

Why?
- Billing address is **always populated** (required for payment)
- Shipping address is **often empty** for digital products
- Billing address represents the customer's actual location

---

## 📋 Example: Complete Extraction Logic

```python
def extract_subscription_data(webhook_body):
    """Extract relevant fields from Seal webhook"""
    
    return {
        'seal_subscription_id': webhook_body.get('id'),
        'customer_id': webhook_body.get('customer_id'),
        'email': webhook_body.get('email'),
        'first_name': webhook_body.get('first_name', ''),
        'last_name': webhook_body.get('last_name', ''),
        'country': webhook_body.get('b_country_code', ''),  # ← Billing country
        'subscription_status': map_status(webhook_body.get('status', 'ACTIVE')),
        'order_id': webhook_body.get('order_id'),
        'currency': webhook_body.get('currency', 'USD'),
        'total_value': webhook_body.get('total_value', 0)
    }

def map_status(seal_status):
    """Map Seal status to your internal status"""
    mapping = {
        'ACTIVE': 'active',
        'CANCELLED': 'cancelled',
        'PAUSED': 'paused'
    }
    return mapping.get(seal_status, 'unknown')
```

---

## 🧪 Testing Different Webhook Topics

### `subscription/created`
- Sent when customer first subscribes
- `status` = `ACTIVE`
- All fields populated

### `subscription/updated`
- Sent when subscription is modified
- e.g., billing cycle updated, price changed
- Check for changes in `billing_interval`, `total_value`

### `subscription/cancelled`
- Sent when subscription is cancelled
- `status` = `CANCELLED`
- `cancelled_on` contains timestamp

---

## 📊 Field Availability by Topic

| Field | created | updated | cancelled |
|-------|---------|---------|-----------|
| `id` | ✅ | ✅ | ✅ |
| `customer_id` | ✅ | ✅ | ✅ |
| `email` | ✅ | ✅ | ✅ |
| `b_country_code` | ✅ | ✅ | ✅ |
| `status` | `ACTIVE` | Varies | `CANCELLED` |
| `cancelled_on` | Empty | Empty | ✅ |
| `billing_attempts` | Empty | ✅ | Empty |

---

**This data was captured from your production Seal webhooks on 2025-11-11** 📅

