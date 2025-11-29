# Checkout Button Session Fix

## Problem Summary

When customers click "Continue to Dashboard" from the Shopify checkout/thank-you page, they see:

```
🔒 Access Denied
No active session. Please login through your store.
```

But when they go to the home page, the session works fine.

## Root Cause

The issue occurs because of the **Shopify checkout restrictions** and **domain mismatch**:

1. **Checkout Extension Button** (`extensions/account-dashboard/src/Checkout.tsx`)
   - Initially linked to: `https://app.screentimejourney.com`
   - **Problem**: Opens in a new context without Shopify session cookies

2. **App Proxy Flow** (Correct)
   - Button now links to: `https://STORE.myshopify.com/apps/screen-time-journey`
   - Lambda receives request with customer info
   - Lambda creates token and redirects to: `https://app.screentimejourney.com/?shop=...&cid=...&token=...`

3. **React App Authentication** (`aws_amplify_app/src/App.js`)
   - Expects URL parameters: `token`, `shop`, and `cid`
   - **Current check** (line 417):
     ```javascript
     const hasSSOnToken = urlParams.has('token') && urlParams.has('shop') && urlParams.has('cid');
     ```

## The Issue

The problem is **domain configuration**:

- **Lambda is configured** to redirect to: `https://app.screentimejourney.com`
- **React app is hosted** at: `https://d1603y70syq9xl.amplifyapp.com`
- **DNS for `app.screentimejourney.com`** might be pointing to the wrong place or not configured

## Solution

### Option 1: Fix DNS (Recommended)

Ensure `app.screentimejourney.com` points to your AWS Amplify app (`d1603y70syq9xl.amplifyapp.com`):

1. Go to your DNS provider (e.g., Cloudflare, Route53)
2. Add/update CNAME record:
   ```
   app.screentimejourney.com → d1603y70syq9xl.amplifyapp.com
   ```
3. In AWS Amplify Console:
   - Go to your app
   - Domain Management
   - Add custom domain: `app.screentimejourney.com`

### Option 2: Update Lambda to Use Amplify URL

Change the Lambda environment variable:

```bash
aws lambda update-function-configuration \
  --function-name mk_shopify_web_app \
  --environment Variables='{
    "APP_BASE_URL":"https://d1603y70syq9xl.amplifyapp.com",
    ...
  }' \
  --region eu-north-1
```

**Downside**: Customers will see the ugly Amplify URL instead of your branded domain.

## What Was Fixed

### 1. Checkout Extension Button ✅

**File**: `extensions/account-dashboard/src/Checkout.tsx`

**Before**:
```typescript
<Button to="https://app.screentimejourney.com" kind="primary" size="large">
  {translate("dashboardButton")}
</Button>
```

**After**:
```typescript
const shop = useShop();
const dashboardUrl = `https://${shop.myshopifyDomain}/apps/screen-time-journey`;

<Button to={dashboardUrl} kind="primary" size="large">
  {translate("dashboardButton")}
</Button>
```

**Deployed**: Version 316 ✅

### 2. App Proxy Handler (Not Used)

**File**: `aws_lambda_api/app_proxy_handler.py`

This file was updated but is **not currently integrated** into the main Lambda. The main Lambda already has app proxy handling built-in at `lambda_handler.py:3358`.

## Current Flow (After Fix)

1. Customer completes checkout
2. Clicks "Continue to Dashboard" button
3. Button redirects to: `https://STORE.myshopify.com/apps/screen-time-journey`
4. Shopify forwards request to Lambda with HMAC signature and customer info
5. Lambda verifies signature and customer entitlement
6. Lambda creates token and redirects to: `https://app.screentimejourney.com/?shop=...&cid=...&token=...`
7. **React app should detect SSO token** and authenticate

## Testing

1. Make a test purchase on your store
2. On thank-you page, click "Continue to Dashboard"
3. Check browser console for logs:
   ```
   🌐 App loaded: { hasSSOnToken: true, ... }
   🔑 SSO token detected in URL params, handling SSO flow
   ```
4. If you see "No active session", check:
   - Is `app.screentimejourney.com` resolving correctly?
   - Does the URL have `token`, `shop`, and `cid` parameters?
   - Check browser console for errors

## Next Steps

1. **Verify DNS**: Ensure `app.screentimejourney.com` points to your Amplify app
2. **Test the flow**: Make a test purchase and click the button
3. **Check logs**: Look at CloudWatch logs for the Lambda to see what's happening
4. **If still failing**: Share the browser console logs and Lambda logs

## Files Modified

- ✅ `shopify-leaderboard-app/commitment-widget/extensions/account-dashboard/src/Checkout.tsx`
- ✅ `aws_lambda_api/app_proxy_handler.py` (not integrated yet)
- ✅ `aws_lambda_api/deploy_main_lambda.sh` (added TOKEN_TTL_SECONDS)

## Deployment Status

- **Shopify Extension**: Deployed as version 316 ✅
- **Lambda Function**: Not deployed yet (no changes needed if DNS is correct)
- **React App**: No changes needed

---

**Summary**: The button now correctly uses the app proxy URL. The remaining issue is likely DNS configuration for `app.screentimejourney.com`. Verify that domain points to your Amplify app.


