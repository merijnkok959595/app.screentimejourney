#!/bin/bash

# ========================================
# Enable DynamoDB Point-in-Time Recovery
# ========================================

set -e

REGION="eu-north-1"

echo "🛡️  Enabling Point-in-Time Recovery for DynamoDB tables..."

# ========================================
# 1. Enable PITR for stj_subscribers
# ========================================
echo "📊 Enabling PITR for stj_subscribers..."

aws dynamodb update-continuous-backups \
    --table-name stj_subscribers \
    --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
    --region "$REGION"

echo "✅ PITR enabled for stj_subscribers"

# ========================================
# 2. Enable PITR for stj_password
# ========================================
echo "🔐 Enabling PITR for stj_password..."

aws dynamodb update-continuous-backups \
    --table-name stj_password \
    --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
    --region "$REGION"

echo "✅ PITR enabled for stj_password"

# ========================================
# 3. Enable PITR for stj_system
# ========================================
echo "⚙️  Enabling PITR for stj_system..."

aws dynamodb update-continuous-backups \
    --table-name stj_system \
    --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
    --region "$REGION"

echo "✅ PITR enabled for stj_system"

# ========================================
# Verify PITR Status
# ========================================
echo ""
echo "🔍 Verifying PITR status..."
echo ""

for TABLE in stj_subscribers stj_password stj_system; do
    echo "📋 Table: $TABLE"
    aws dynamodb describe-continuous-backups \
        --table-name "$TABLE" \
        --region "$REGION" \
        --query 'ContinuousBackupsDescription.PointInTimeRecoveryDescription' \
        --output json
    echo ""
done

# ========================================
# Summary
# ========================================
echo "=========================================="
echo "✅ Point-in-Time Recovery Enabled!"
echo "=========================================="
echo ""
echo "✨ Benefits:"
echo "  • 35-day backup retention"
echo "  • Restore to any second in the last 35 days"
echo "  • Protection against accidental deletes"
echo "  • No performance impact"
echo ""
echo "💰 Cost: ~\$0.20 per GB-month"
echo ""
echo "🔍 View backups:"
echo "   https://console.aws.amazon.com/dynamodbv2/home?region=$REGION#tables"
echo ""













