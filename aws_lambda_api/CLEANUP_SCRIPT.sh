#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗑️  Cleanup Old Milestone Lambda Functions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  WARNING: This will delete the old Lambda functions!"
echo ""
echo "Old functions to be deleted:"
echo "  1. mk_shopify_web_app_milestones (Python 3.11)"
echo "  2. mk_scheduled_milestone_notifications (Python 3.11)"
echo ""
echo "New consolidated function:"
echo "  ✅ mk_milestone_notifications (Python 3.13)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

REGION="eu-north-1"

# Safety check
read -p "Have you tested the new function and verified it works? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted. Please test first:"
    echo "   ./test_new_milestone_function.sh"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Deleting old Lambda functions..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Delete mk_shopify_web_app_milestones
echo "Deleting mk_shopify_web_app_milestones..."
aws lambda delete-function \
    --function-name mk_shopify_web_app_milestones \
    --region "$REGION" 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Deleted mk_shopify_web_app_milestones"
else
    echo "⚠️  Function may not exist or already deleted"
fi

echo ""

# Delete mk_scheduled_milestone_notifications
echo "Deleting mk_scheduled_milestone_notifications..."
aws lambda delete-function \
    --function-name mk_scheduled_milestone_notifications \
    --region "$REGION" 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Deleted mk_scheduled_milestone_notifications"
else
    echo "⚠️  Function may not exist or already deleted"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Checking EventBridge rules..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# List all EventBridge rules
echo "Current EventBridge rules:"
aws events list-rules --region "$REGION" --query 'Rules[*].[Name,State,ScheduleExpression]' --output table

echo ""
echo "The new function uses: milestone-notifications-hourly"
echo ""

read -p "Do you see any OLD milestone rules that should be deleted? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter the rule name to delete: " OLD_RULE_NAME
    
    if [ -n "$OLD_RULE_NAME" ]; then
        echo "Removing targets from $OLD_RULE_NAME..."
        aws events remove-targets \
            --rule "$OLD_RULE_NAME" \
            --ids 1 \
            --region "$REGION" 2>&1
        
        echo "Deleting rule $OLD_RULE_NAME..."
        aws events delete-rule \
            --name "$OLD_RULE_NAME" \
            --region "$REGION" 2>&1
        
        echo "✅ Deleted EventBridge rule: $OLD_RULE_NAME"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Cleaning up old files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$(dirname "$0")"

FILES_TO_DELETE=(
    "milestone_notification_handler.py"
    "scheduled_milestone_notifications.py"
    "deploy_milestone_notification.sh"
    "deploy_scheduled_milestones.sh"
    "milestone_notification.zip"
    "scheduled_milestone_notifications.zip"
)

echo "Files to be deleted:"
for file in "${FILES_TO_DELETE[@]}"; do
    if [ -f "$file" ]; then
        echo "  ❌ $file"
    fi
done

echo ""
read -p "Delete these old files? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    for file in "${FILES_TO_DELETE[@]}"; do
        if [ -f "$file" ]; then
            rm -f "$file"
            echo "✅ Deleted: $file"
        fi
    done
else
    echo "⏭️  Skipped file cleanup"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ CLEANUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 What's left:"
echo "   ✅ mk_milestone_notifications (Python 3.13)"
echo "   ✅ deploy_milestone_notifications.sh"
echo "   ✅ test_new_milestone_function.sh"
echo "   ✅ milestone_notifications.py"
echo ""
echo "🎯 New function handles:"
echo "   • Scheduled notifications (every hour, 10 AM local time)"
echo "   • On-demand notifications (API triggered)"
echo "   • Timezone based on Shopify country code"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

