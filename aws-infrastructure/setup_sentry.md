# Sentry Error Tracking Setup

## Overview
Sentry provides real-time error tracking for both frontend (React) and backend (Lambda).

---

## 1. Create Sentry Account

1. Go to https://sentry.io/signup/
2. Sign up with email: `info@screentimejourney.com`
3. Create organization: `screentimejourney`

---

## 2. Create Sentry Projects

### Frontend Project (React)
1. Click "Create Project"
2. Platform: **React**
3. Project name: `screentimejourney-react`
4. Alert frequency: **Alert me on every new issue**
5. Copy the DSN (Data Source Name)

### Backend Project (Lambda)
1. Click "Create Project"
2. Platform: **Python**
3. Project name: `screentimejourney-lambda`
4. Alert frequency: **Alert me on every new issue**
5. Copy the DSN (Data Source Name)

---

## 3. Frontend Integration (React)

### Install Sentry SDK

```bash
cd /Users/merijnkok/Desktop/screen-time-journey-workspace/app.screentimejourney
npm install --save @sentry/react @sentry/tracing
```

### Update `src/index.js`

Add Sentry initialization at the top of the file (before ReactDOM.render):

```javascript
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

// Initialize Sentry
Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN || "YOUR_REACT_DSN_HERE",
  integrations: [
    new BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions for performance
  
  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
  
  // Environment
  environment: process.env.NODE_ENV || "development",
  
  // Release tracking
  release: "screentimejourney@" + process.env.REACT_APP_VERSION,
  
  // Only send errors in production
  enabled: process.env.NODE_ENV === "production",
  
  // Ignore common non-critical errors
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
  ],
});
```

### Update `.env` file

Add to `/Users/merijnkok/Desktop/screen-time-journey-workspace/app.screentimejourney/.env`:

```bash
REACT_APP_SENTRY_DSN=your-react-dsn-here
REACT_APP_VERSION=1.0.0
```

### Wrap App with Sentry Error Boundary

Update `src/App.js` to add error boundary:

```javascript
import * as Sentry from "@sentry/react";

// At the top level of your component tree
function App() {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />} showDialog>
      {/* Your existing app code */}
    </Sentry.ErrorBoundary>
  );
}

// Error fallback component
function ErrorFallback() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Oops! Something went wrong</h2>
      <p>We've been notified and will fix this soon.</p>
      <button onClick={() => window.location.reload()}>
        Reload Page
      </button>
    </div>
  );
}
```

### Manual Error Tracking

For catching specific errors:

```javascript
try {
  // Your code
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      section: "device-setup",
      action: "generate-profile"
    },
    extra: {
      deviceType: deviceFormData.device_type,
      userId: customerData?.customerId
    }
  });
}
```

### Track User Context

Add user identification (in your authentication flow):

```javascript
Sentry.setUser({
  id: customerData.customerId,
  email: customerData.email,
  username: customerData.username
});
```

---

## 4. Backend Integration (Lambda)

### Install Sentry SDK

Add to `/Users/merijnkok/Desktop/screen-time-journey-workspace/aws_lambda_api/requirements.txt`:

```
sentry-sdk==1.40.0
```

### Update `lambda_handler.py`

Add Sentry initialization at the top:

```python
import sentry_sdk
from sentry_sdk.integrations.aws_lambda import AwsLambdaIntegration

# Initialize Sentry
sentry_sdk.init(
    dsn=os.environ.get('SENTRY_DSN', ''),
    integrations=[
        AwsLambdaIntegration(timeout_warning=True)
    ],
    traces_sample_rate=0.1,  # 10% of transactions
    environment=os.environ.get('ENVIRONMENT', 'production'),
    release="screentimejourney-lambda@1.0.0",
)

def lambda_handler(event, context):
    try:
        # Your existing handler code
        pass
    except Exception as e:
        # Sentry automatically captures unhandled exceptions
        # But you can add extra context:
        sentry_sdk.set_context("request", {
            "path": event.get('rawPath'),
            "method": event.get('requestContext', {}).get('http', {}).get('method'),
            "user_id": event.get('headers', {}).get('x-user-id')
        })
        sentry_sdk.capture_exception(e)
        raise
```

### Update Lambda Environment Variables

Add to Lambda configuration:

```bash
aws lambda update-function-configuration \
    --function-name mk_shopify_web_app \
    --environment "Variables={
        SENTRY_DSN=your-lambda-dsn-here,
        ENVIRONMENT=production
    }" \
    --region eu-north-1
```

### Redeploy Lambda

```bash
cd /Users/merijnkok/Desktop/screen-time-journey-workspace/aws_lambda_api
./deploy_main_lambda.sh
```

---

## 5. Configure Sentry Alerts

### Email Alerts
1. Go to **Settings** → **Projects** → Select project
2. Go to **Alerts** → **Create Alert Rule**
3. Trigger: **When an event is first seen**
4. Action: **Send a notification via Email**
5. Recipients: `info@screentimejourney.com`

### Slack Integration (Optional)
1. Install Slack integration from Sentry
2. Connect to your Slack workspace
3. Create alert rules to post to #alerts channel

---

## 6. Test Sentry Integration

### Frontend Test

Add a test button in your app (remove after testing):

```javascript
<button onClick={() => {
  throw new Error("Sentry frontend test error!");
}}>
  Test Sentry (Frontend)
</button>
```

### Backend Test

Call your API with an invalid payload or create a test endpoint:

```python
@app.route('/sentry-test')
def sentry_test():
    division_by_zero = 1 / 0  # This will trigger Sentry
```

---

## 7. Sentry Features to Enable

### Performance Monitoring
- Track slow API calls
- Identify bottlenecks
- Monitor transaction duration

### Session Replay
- See user interactions before error
- Understand user journey
- Debug issues faster

### Release Tracking
- Track errors by version
- See error trends after deployments
- Roll back problematic releases

### Breadcrumbs
- Automatic logging of:
  - Console logs
  - Network requests
  - User interactions
  - Navigation events

---

## 8. Cost Estimation

| Plan | Events/Month | Cost |
|------|--------------|------|
| **Developer** (Free) | 5,000 errors + 10,000 transactions | $0 |
| **Team** | 50,000 errors + 100,000 transactions | $26/month |
| **Business** | 100,000+ errors + custom transactions | $80/month |

**Recommendation**: Start with **Free Developer plan**, upgrade if you exceed limits.

---

## 9. Privacy & GDPR Compliance

### PII Scrubbing

Sentry automatically scrubs common PII patterns:
- Credit card numbers
- Social security numbers
- Passwords

### Additional Configuration

```javascript
Sentry.init({
  // ... other config
  
  beforeSend(event, hint) {
    // Remove sensitive data
    if (event.user) {
      delete event.user.ip_address;
      delete event.user.email; // If needed for privacy
    }
    
    // Scrub request data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers['Authorization'];
    }
    
    return event;
  },
});
```

---

## 10. Monitoring Checklist

After setup, verify:

- [ ] Frontend errors appear in Sentry dashboard
- [ ] Backend errors appear in Sentry dashboard
- [ ] Email notifications are received
- [ ] User context is captured (when applicable)
- [ ] Performance metrics are tracked
- [ ] No PII is being sent to Sentry
- [ ] Alerts are configured correctly

---

## Quick Commands

```bash
# Install frontend dependencies
cd /Users/merijnkok/Desktop/screen-time-journey-workspace/app.screentimejourney
npm install --save @sentry/react @sentry/tracing

# Update backend dependencies
cd /Users/merijnkok/Desktop/screen-time-journey-workspace/aws_lambda_api
echo "sentry-sdk==1.40.0" >> requirements.txt
./deploy_main_lambda.sh

# Set Lambda environment variable
aws lambda update-function-configuration \
    --function-name mk_shopify_web_app \
    --environment "Variables={SENTRY_DSN=YOUR_DSN_HERE,ENVIRONMENT=production}" \
    --region eu-north-1
```

---

## Support

- Sentry Documentation: https://docs.sentry.io/
- React Integration: https://docs.sentry.io/platforms/javascript/guides/react/
- Python Integration: https://docs.sentry.io/platforms/python/
- AWS Lambda: https://docs.sentry.io/platforms/python/guides/aws-lambda/













