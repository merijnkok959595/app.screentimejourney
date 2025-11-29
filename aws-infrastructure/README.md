# AWS Infrastructure - Critical Scaling Setup

This directory contains scripts and documentation for deploying critical infrastructure needed to scale Screen Time Journey to 100K users.

---

## 🚀 Quick Start

Run the master deployment script:

```bash
cd /Users/merijnkok/Desktop/screen-time-journey-workspace/aws-infrastructure
chmod +x *.sh
./deploy_critical_infrastructure.sh
```

This will deploy all critical infrastructure in the correct order.

---

## 📋 What Gets Deployed

### ✅ Automated (via scripts)

1. **DynamoDB Point-in-Time Recovery** (`enable_dynamodb_pitr.sh`)
   - 35-day backup retention
   - Restore to any second
   - Protection against data loss
   - Cost: ~$2-5/month

2. **CloudWatch Alarms** (`setup_cloudwatch_alarms.sh`)
   - Lambda error rate monitoring
   - Lambda duration alerts
   - Lambda throttle detection
   - DynamoDB throttle alerts
   - Concurrent execution warnings
   - Cost: ~$1/month

3. **Cost Alerts** (`setup_cost_alerts.sh`)
   - $100/month budget (warning)
   - $500/month budget (critical)
   - $1,000/month budget (emergency)
   - Cost: Free

4. **API Gateway with Rate Limiting** (`setup_api_gateway.sh`)
   - Replaces Lambda Function URL
   - 1,000 requests/second rate limit
   - 2,000 burst capacity
   - CORS configuration
   - CloudWatch logging
   - Cost: $3.50 per million requests

### ⏳ Manual (follow documentation)

5. **Sentry Error Tracking** (`setup_sentry.md`)
   - Frontend (React) error tracking
   - Backend (Lambda) error tracking
   - Real-time alerts
   - Session replay
   - Time: 15-20 minutes
   - Cost: Free tier (5K errors/month)

6. **Lambda Concurrency Increase** (`lambda_concurrency_increase_request.md`)
   - Request increase from 1,000 to 5,000
   - Time: 5 minutes to submit
   - Approval: 1-5 business days
   - Cost: Free

---

## 📁 Files in This Directory

| File | Purpose | Type |
|------|---------|------|
| `deploy_critical_infrastructure.sh` | Master deployment script | Script |
| `enable_dynamodb_pitr.sh` | Enable DynamoDB backups | Script |
| `setup_cloudwatch_alarms.sh` | Create monitoring alarms | Script |
| `setup_cost_alerts.sh` | Create AWS budget alerts | Script |
| `setup_api_gateway.sh` | Deploy API Gateway with rate limiting | Script |
| `setup_sentry.md` | Sentry integration guide | Documentation |
| `lambda_concurrency_increase_request.md` | Lambda limit increase guide | Documentation |
| `README.md` | This file | Documentation |

---

## 🎯 Priority Matrix

These deployments implement the **CRITICAL** items from the scaling checklist:

- ✅ **#1**: DynamoDB GSI optimization (DONE)
- ✅ **#2**: Enable CloudWatch alarms
- ✅ **#3**: Add API Gateway with rate limiting
- ✅ **#4**: Enable DynamoDB Point-in-Time Recovery
- ✅ **#5**: Set up cost alerts
- ⏳ **#6**: Add error tracking (Sentry) - Manual
- ⏳ **#7**: Request Lambda concurrency increase - Manual

---

## 🔍 Prerequisites

Before running the scripts, ensure:

1. **AWS CLI installed and configured**
   ```bash
   aws --version
   aws sts get-caller-identity
   ```

2. **Correct AWS region** (`eu-north-1`)
   ```bash
   export AWS_DEFAULT_REGION=eu-north-1
   ```

3. **IAM permissions** for:
   - DynamoDB (update tables)
   - CloudWatch (create alarms)
   - SNS (create topics, subscribe)
   - API Gateway (create/deploy APIs)
   - Lambda (update configuration)
   - Budgets (create budgets)

4. **Email access** to `info@screentimejourney.com` (for SNS confirmation)

---

## 📊 Step-by-Step Deployment

### Option 1: Run Master Script (Recommended)

```bash
cd /Users/merijnkok/Desktop/screen-time-journey-workspace/aws-infrastructure
chmod +x *.sh
./deploy_critical_infrastructure.sh
```

The script will:
- Run each setup script in order
- Pause between steps for review
- Display progress and confirmations
- Provide next steps at the end

### Option 2: Run Individual Scripts

```bash
# 1. Enable DynamoDB PITR
./enable_dynamodb_pitr.sh

# 2. Set up CloudWatch alarms
./setup_cloudwatch_alarms.sh

# 3. Set up cost alerts
./setup_cost_alerts.sh

# 4. Set up API Gateway
./setup_api_gateway.sh

# 5. Follow Sentry setup guide
cat setup_sentry.md

# 6. Follow Lambda concurrency guide
cat lambda_concurrency_increase_request.md
```

---

## ⚠️ Important Post-Deployment Steps

### 1. Confirm SNS Email Subscription

After running `setup_cloudwatch_alarms.sh`:
- Check email: `info@screentimejourney.com`
- Click "Confirm subscription" link
- Without this, you won't receive alarm notifications!

### 2. Update React App API Endpoint

After running `setup_api_gateway.sh`:
- Copy the new API Gateway endpoint
- Update `.env` file:
  ```bash
  REACT_APP_API_URL=https://YOUR_API_ID.execute-api.eu-north-1.amazonaws.com/prod
  ```
- Rebuild and deploy React app

### 3. Test API Gateway

```bash
# Get API endpoint from script output
API_ENDPOINT="https://YOUR_API_ID.execute-api.eu-north-1.amazonaws.com/prod"

# Test health endpoint
curl $API_ENDPOINT/health

# Expected response: 200 OK
```

### 4. Disable Lambda Function URL (Optional)

After verifying API Gateway works:
```bash
aws lambda delete-function-url-config \
    --function-name mk_shopify_web_app \
    --region eu-north-1
```

### 5. Set Up Sentry

Follow the detailed guide in `setup_sentry.md`:
```bash
less setup_sentry.md
```

### 6. Request Lambda Concurrency Increase

Follow the guide in `lambda_concurrency_increase_request.md`:
```bash
less lambda_concurrency_increase_request.md
```

Or quick start:
```bash
open "https://console.aws.amazon.com/servicequotas/home/services/lambda/quotas"
```

---

## 🧪 Testing & Verification

### Verify DynamoDB PITR

```bash
aws dynamodb describe-continuous-backups \
    --table-name stj_subscribers \
    --region eu-north-1 \
    --query 'ContinuousBackupsDescription.PointInTimeRecoveryDescription.PointInTimeRecoveryStatus'
```

Expected: `"ENABLED"`

### Verify CloudWatch Alarms

```bash
aws cloudwatch describe-alarms \
    --region eu-north-1 \
    --query 'MetricAlarms[*].[AlarmName,StateValue]' \
    --output table
```

Expected: List of alarms in `OK` or `INSUFFICIENT_DATA` state

### Verify Cost Alerts

```bash
aws budgets describe-budgets \
    --account-id $(aws sts get-caller-identity --query Account --output text) \
    --region us-east-1 \
    --query 'Budgets[*].[BudgetName,BudgetLimit.Amount]' \
    --output table
```

Expected: 3 budgets ($100, $500, $1,000)

### Verify API Gateway

```bash
aws apigateway get-rest-apis \
    --region eu-north-1 \
    --query 'items[?name==`screentimejourney-api`].[id,name,createdDate]' \
    --output table
```

Expected: API with name `screentimejourney-api`

### Test API Endpoint

```bash
# Get API endpoint
API_ID=$(aws apigateway get-rest-apis --region eu-north-1 --query 'items[?name==`screentimejourney-api`].id | [0]' --output text)
API_ENDPOINT="https://${API_ID}.execute-api.eu-north-1.amazonaws.com/prod"

# Test endpoint
curl -X GET "$API_ENDPOINT/health" \
    -H "Content-Type: application/json"
```

---

## 🚨 Troubleshooting

### Script fails with "Access Denied"
**Solution**: Verify IAM permissions for your AWS user/role

### SNS subscription not received
**Solution**: Check spam folder, verify email address is correct

### API Gateway returns 403 Forbidden
**Solution**: Verify Lambda permission was added correctly:
```bash
aws lambda get-policy \
    --function-name mk_shopify_web_app \
    --region eu-north-1
```

### Budget creation fails
**Solution**: Budgets API requires `us-east-1` region (script handles this)

### CloudWatch alarms in INSUFFICIENT_DATA state
**Solution**: This is normal for new alarms. Wait for metric data to flow in.

---

## 💰 Cost Breakdown

| Service | Component | Monthly Cost |
|---------|-----------|--------------|
| **DynamoDB** | PITR backups | $2-5 |
| **CloudWatch** | Alarms (10 alarms) | $1.00 |
| **CloudWatch** | Logs retention | $0.50 |
| **API Gateway** | Requests (100K requests) | $0.35 |
| **SNS** | Notifications | $0.00 |
| **Budgets** | 3 budgets | $0.00 |
| **Sentry** | Free tier | $0.00 |
| **TOTAL** | | **~$4-7/month** |

**At 100K users (1M+ requests/month):**
- DynamoDB PITR: $10-20
- CloudWatch: $5-10
- API Gateway: $3.50-7
- Sentry: $0-26 (free tier may suffice)
- **Total: $20-60/month**

---

## 📈 Monitoring Dashboards

### CloudWatch Console
```bash
open "https://console.aws.amazon.com/cloudwatch/home?region=eu-north-1#home:"
```

### API Gateway Console
```bash
open "https://console.aws.amazon.com/apigateway/home?region=eu-north-1"
```

### Budgets Console
```bash
open "https://console.aws.amazon.com/billing/home#/budgets"
```

### DynamoDB Console
```bash
open "https://console.aws.amazon.com/dynamodbv2/home?region=eu-north-1#tables"
```

---

## 🎓 Learn More

- [AWS Lambda Limits](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html)
- [API Gateway Throttling](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-request-throttling.html)
- [DynamoDB Point-in-Time Recovery](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/PointInTimeRecovery.html)
- [CloudWatch Alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html)
- [Sentry Documentation](https://docs.sentry.io/)

---

## 📞 Support

- **Email**: info@screentimejourney.com
- **Documentation**: This repository
- **AWS Support**: https://console.aws.amazon.com/support/

---

## ✅ Deployment Checklist

Use this checklist to track your progress:

- [ ] Prerequisites verified (AWS CLI, permissions, region)
- [ ] Master script executed successfully
- [ ] DynamoDB PITR enabled and verified
- [ ] CloudWatch alarms created (10 alarms)
- [ ] SNS email subscription confirmed
- [ ] Cost alerts configured ($100, $500, $1,000)
- [ ] API Gateway deployed with rate limiting
- [ ] React app updated with new API endpoint
- [ ] API Gateway tested and working
- [ ] Lambda Function URL disabled (optional)
- [ ] Sentry integration completed (React + Lambda)
- [ ] Lambda concurrency increase requested
- [ ] All alarms tested and verified
- [ ] Documentation reviewed and understood
- [ ] Team notified of new monitoring

---

**Last Updated**: November 10, 2025
**Version**: 1.0.0
**Region**: eu-north-1 (Stockholm)













