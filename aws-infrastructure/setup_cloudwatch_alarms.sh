#!/bin/bash

# ========================================
# CloudWatch Alarms Setup for Screen Time Journey
# ========================================

set -e

REGION="eu-north-1"
LAMBDA_FUNCTION_NAME="mk_shopify_web_app"
SNS_TOPIC_NAME="screentimejourney-alerts"
EMAIL_ALERT="info@screentimejourney.com"

echo "🚨 Setting up CloudWatch Alarms..."

# ========================================
# 1. Create SNS Topic for Alerts
# ========================================
echo "📧 Creating SNS topic for alerts..."

TOPIC_ARN=$(aws sns create-topic \
    --name "$SNS_TOPIC_NAME" \
    --region "$REGION" \
    --output text \
    --query 'TopicArn' 2>/dev/null || \
    aws sns list-topics --region "$REGION" --output text --query "Topics[?contains(TopicArn, '$SNS_TOPIC_NAME')].TopicArn | [0]")

echo "✅ SNS Topic ARN: $TOPIC_ARN"

# Subscribe email to SNS topic
echo "📬 Subscribing $EMAIL_ALERT to alerts..."
aws sns subscribe \
    --topic-arn "$TOPIC_ARN" \
    --protocol email \
    --notification-endpoint "$EMAIL_ALERT" \
    --region "$REGION" \
    --output text >/dev/null 2>&1 || echo "⚠️  Email already subscribed"

echo "⚠️  IMPORTANT: Check your email and CONFIRM the subscription!"

# ========================================
# 2. Lambda Error Rate Alarm
# ========================================
echo ""
echo "🔴 Creating Lambda Error Rate alarm..."

aws cloudwatch put-metric-alarm \
    --alarm-name "Lambda-ErrorRate-${LAMBDA_FUNCTION_NAME}" \
    --alarm-description "Alert when Lambda error rate exceeds 1% for 5 minutes" \
    --metric-name Errors \
    --namespace AWS/Lambda \
    --statistic Sum \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 5 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=FunctionName,Value="$LAMBDA_FUNCTION_NAME" \
    --alarm-actions "$TOPIC_ARN" \
    --treat-missing-data notBreaching \
    --region "$REGION"

echo "✅ Lambda Error Rate alarm created"

# ========================================
# 3. Lambda Duration Alarm
# ========================================
echo "⏱️  Creating Lambda Duration alarm..."

aws cloudwatch put-metric-alarm \
    --alarm-name "Lambda-Duration-${LAMBDA_FUNCTION_NAME}" \
    --alarm-description "Alert when Lambda duration exceeds 10 seconds" \
    --metric-name Duration \
    --namespace AWS/Lambda \
    --statistic Average \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 10000 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=FunctionName,Value="$LAMBDA_FUNCTION_NAME" \
    --alarm-actions "$TOPIC_ARN" \
    --treat-missing-data notBreaching \
    --region "$REGION"

echo "✅ Lambda Duration alarm created"

# ========================================
# 4. Lambda Throttles Alarm
# ========================================
echo "🚫 Creating Lambda Throttles alarm..."

aws cloudwatch put-metric-alarm \
    --alarm-name "Lambda-Throttles-${LAMBDA_FUNCTION_NAME}" \
    --alarm-description "Alert when Lambda function is throttled" \
    --metric-name Throttles \
    --namespace AWS/Lambda \
    --statistic Sum \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 1 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --dimensions Name=FunctionName,Value="$LAMBDA_FUNCTION_NAME" \
    --alarm-actions "$TOPIC_ARN" \
    --treat-missing-data notBreaching \
    --region "$REGION"

echo "✅ Lambda Throttles alarm created"

# ========================================
# 5. Lambda Concurrent Executions Alarm
# ========================================
echo "📊 Creating Lambda Concurrent Executions alarm (80% of limit)..."

aws cloudwatch put-metric-alarm \
    --alarm-name "Lambda-ConcurrentExecutions-${LAMBDA_FUNCTION_NAME}" \
    --alarm-description "Alert when concurrent executions exceed 80% of account limit (800 of 1000)" \
    --metric-name ConcurrentExecutions \
    --namespace AWS/Lambda \
    --statistic Maximum \
    --period 60 \
    --evaluation-periods 2 \
    --threshold 800 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=FunctionName,Value="$LAMBDA_FUNCTION_NAME" \
    --alarm-actions "$TOPIC_ARN" \
    --treat-missing-data notBreaching \
    --region "$REGION"

echo "✅ Lambda Concurrent Executions alarm created"

# ========================================
# 6. DynamoDB Read Throttle Alarm (stj_subscribers)
# ========================================
echo "📖 Creating DynamoDB Read Throttle alarm for stj_subscribers..."

aws cloudwatch put-metric-alarm \
    --alarm-name "DynamoDB-ReadThrottle-stj_subscribers" \
    --alarm-description "Alert when DynamoDB read throttles occur on stj_subscribers" \
    --metric-name ReadThrottleEvents \
    --namespace AWS/DynamoDB \
    --statistic Sum \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 1 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --dimensions Name=TableName,Value=stj_subscribers \
    --alarm-actions "$TOPIC_ARN" \
    --treat-missing-data notBreaching \
    --region "$REGION"

echo "✅ DynamoDB Read Throttle alarm created"

# ========================================
# 7. DynamoDB Write Throttle Alarm (stj_subscribers)
# ========================================
echo "✍️  Creating DynamoDB Write Throttle alarm for stj_subscribers..."

aws cloudwatch put-metric-alarm \
    --alarm-name "DynamoDB-WriteThrottle-stj_subscribers" \
    --alarm-description "Alert when DynamoDB write throttles occur on stj_subscribers" \
    --metric-name WriteThrottleEvents \
    --namespace AWS/DynamoDB \
    --statistic Sum \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 1 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --dimensions Name=TableName,Value=stj_subscribers \
    --alarm-actions "$TOPIC_ARN" \
    --treat-missing-data notBreaching \
    --region "$REGION"

echo "✅ DynamoDB Write Throttle alarm created"

# ========================================
# 8. DynamoDB Read Throttle Alarm (stj_password)
# ========================================
echo "📖 Creating DynamoDB Read Throttle alarm for stj_password..."

aws cloudwatch put-metric-alarm \
    --alarm-name "DynamoDB-ReadThrottle-stj_password" \
    --alarm-description "Alert when DynamoDB read throttles occur on stj_password" \
    --metric-name ReadThrottleEvents \
    --namespace AWS/DynamoDB \
    --statistic Sum \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 1 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --dimensions Name=TableName,Value=stj_password \
    --alarm-actions "$TOPIC_ARN" \
    --treat-missing-data notBreaching \
    --region "$REGION"

echo "✅ DynamoDB Read Throttle alarm created"

# ========================================
# 9. DynamoDB Write Throttle Alarm (stj_password)
# ========================================
echo "✍️  Creating DynamoDB Write Throttle alarm for stj_password..."

aws cloudwatch put-metric-alarm \
    --alarm-name "DynamoDB-WriteThrottle-stj_password" \
    --alarm-description "Alert when DynamoDB write throttles occur on stj_password" \
    --metric-name WriteThrottleEvents \
    --namespace AWS/DynamoDB \
    --statistic Sum \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 1 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --dimensions Name=TableName,Value=stj_password \
    --alarm-actions "$TOPIC_ARN" \
    --treat-missing-data notBreaching \
    --region "$REGION"

echo "✅ DynamoDB Write Throttle alarm created"

# ========================================
# 10. DynamoDB System Errors Alarm
# ========================================
echo "❌ Creating DynamoDB System Errors alarm..."

aws cloudwatch put-metric-alarm \
    --alarm-name "DynamoDB-SystemErrors-stj_subscribers" \
    --alarm-description "Alert when DynamoDB system errors occur" \
    --metric-name SystemErrors \
    --namespace AWS/DynamoDB \
    --statistic Sum \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 1 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --dimensions Name=TableName,Value=stj_subscribers \
    --alarm-actions "$TOPIC_ARN" \
    --treat-missing-data notBreaching \
    --region "$REGION"

echo "✅ DynamoDB System Errors alarm created"

# ========================================
# Summary
# ========================================
echo ""
echo "=========================================="
echo "✅ CloudWatch Alarms Setup Complete!"
echo "=========================================="
echo ""
echo "📊 Alarms Created:"
echo "  1. Lambda Error Rate (> 5 errors in 5 min)"
echo "  2. Lambda Duration (> 10 seconds)"
echo "  3. Lambda Throttles (any throttling)"
echo "  4. Lambda Concurrent Executions (> 800)"
echo "  5. DynamoDB Read Throttles (stj_subscribers)"
echo "  6. DynamoDB Write Throttles (stj_subscribers)"
echo "  7. DynamoDB Read Throttles (stj_password)"
echo "  8. DynamoDB Write Throttles (stj_password)"
echo "  9. DynamoDB System Errors"
echo ""
echo "📧 Alerts will be sent to: $EMAIL_ALERT"
echo "⚠️  IMPORTANT: Check your email and confirm the SNS subscription!"
echo ""
echo "🔍 View alarms:"
echo "   https://console.aws.amazon.com/cloudwatch/home?region=$REGION#alarmsV2:"
echo ""













