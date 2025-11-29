# Scheduled Milestone WhatsApp Notifications

## 🎯 Overview

Automated WhatsApp milestone notifications sent to users at **10:00 AM in their local timezone** based on their phone number country code.

---

## 📅 Notification Schedule

### **Ground Zero (Day 1)**
- Sent at the first 10:00 AM **after device registration**
- Template: `m0` (male) or `f0` (female)
- Example: Device added Nov 10 at 3:00 PM → Message sent Nov 11 at 10:00 AM

### **Subsequent Milestones**
- Every **7 days** after Day 1
- Day 8, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 92+
- Templates: `m1`, `m2`, `m3`... (male) or `f1`, `f2`, `f3`... (female)

---

## 🏗️ Architecture

### **Lambda Function**
- **Name**: `mk_scheduled_milestone_notifications`
- **Runtime**: Python 3.11
- **Timeout**: 300 seconds (5 minutes)
- **Memory**: 512 MB
- **Trigger**: EventBridge (runs every hour)

### **Process Flow**

```
Every Hour:
  1. EventBridge triggers Lambda
  2. Lambda fetches all subscribers from DynamoDB
  3. For each subscriber:
     a. Check if they have devices
     b. Get latest device registration date
     c. Calculate days since registration
     d. Check if it's a milestone day (1, 8, 15, 22...)
     e. Get user's timezone from phone country code
     f. Check if it's 10:00 AM in their timezone
     g. If YES → Send WhatsApp with appropriate template
     h. If NO → Skip to next user
  4. Return summary report
```

---

## 🌍 Timezone Detection

The system automatically detects timezone based on phone country code:

| Country Code | Timezone | Example |
|--------------|----------|---------|
| +31 | Europe/Amsterdam | Netherlands |
| +32 | Europe/Brussels | Belgium |
| +33 | Europe/Paris | France |
| +44 | Europe/London | UK |
| +1 | America/New_York | USA/Canada |
| +61 | Australia/Sydney | Australia |
| ... | ... | ... |

**Default**: UTC (if country code unknown)

---

## 📨 WhatsApp Template Structure

### **Template Names**
- **Male**: `m0`, `m1`, `m2`, `m3`, `m4`, `m5`, `m6`, `m7`, `m8`, `m9`, `m10`
- **Female**: `f0`, `f1`, `f2`, `f3`, `f4`, `f5`, `f6`, `f7`, `f8`, `f9`, `f10`

### **Template Parameters**
Each template receives these dynamic parameters:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `first_name` | User's username or email prefix | `theking` |
| `percentage` | Top percentile ranking | `14` |
| `currnet_lvl` | Current milestone with emoji | `Fighter 🥊` |
| `focus_days` | Days in focus (since device added) | `15` |
| `next_lvl` | Next milestone with emoji | `Resister 🛡️` |
| `next_lvl_days` | Days until next milestone | `7` |
| `king_queen` | Final goal (King/Queen) | `King` |
| `king_queen_days` | Days to reach King/Queen | `350` |

### **Example Message**

```
Hi theking,

You are among the top 14% in the world 🌍.

Right now, you are Fighter 🥊 with 15 days in focus.

Next up: Resister 🛡️ in 7 days.

You're on your path to King 👑 in 350 days.
```

---

## 🎨 WATI Template Setup

### **Required Templates** (Total: 22)

#### Male Templates (11)
1. **m0** - Ground Zero 🪨 (Day 1)
2. **m1** - Fighter 🥊 (Day 8)
3. **m2** - Resister 🛡️ (Day 15)
4. **m3** - Scout 🦅 (Day 22)
5. **m4** - Mindsmith 🧠 (Day 29)
6. **m5** - Lone Wolf 🐺 (Day 36)
7. **m6** - Lightning ⚡ (Day 43)
8. **m7** - The Dragon 🐉 (Day 50)
9. **m8** - Commander 👔 (Day 57)
10. **m9** - Wizard 🧙 (Day 64)
11. **m10** - The King 👑 (Day 71+)

#### Female Templates (11)
1. **f0** - Awakening 🌸 (Day 1)
2. **f1** - Blossoming 🌺 (Day 8)
3. **f2** - Protector 🛡️ (Day 15)
4. **f3** - Seeker 🔍 (Day 22)
5. **f4** - Reflectress 💎 (Day 29)
6. **f5** - Lightweaver ✨ (Day 36)
7. **f6** - Ascendant 🦋 (Day 43)
8. **f7** - The Swan 🦢 (Day 50)
9. **f8** - Priestess 🔮 (Day 57)
10. **f9** - Empress 👸 (Day 64)
11. **f10** - The Queen 👑 (Day 71+)

### **Creating Templates in WATI**

For each template:
1. Go to WATI Dashboard → Templates
2. Create new template
3. **Name**: Exactly as shown above (e.g., `m0`, `f1`)
4. **Category**: Marketing or Utility
5. **Header**: Image/Media (upload milestone-specific image)
6. **Body**: Use the text template with variables
7. **Variables**: `{{first_name}}`, `{{percentage}}`, etc.
8. Submit for WhatsApp approval

---

## 🗂️ DynamoDB Structure

### **stj_subscribers Table**

Required fields for notifications:
```json
{
  "customer_id": "8885250982135",
  "email": "user@example.com",
  "username": "theking",
  "phone": "+31627207989",
  "gender": "male",
  "devices": [
    {
      "device_id": "device_123",
      "added_at": "2025-11-10T15:30:00Z",
      "device_type": "iOS"
    }
  ]
}
```

### **stj_system Table**

Milestone configuration:
```json
{
  "config_key": "milestones",
  "data": [
    {
      "level": 0,
      "gene": "male",
      "title": "Ground Zero",
      "emoji": "🪨",
      "level_template": "m0",
      "milestone_day": 0,
      "media_url": "https://..."
    }
  ]
}
```

---

## 🧪 Testing

### **Manual Test**
```bash
aws lambda invoke \
  --function-name mk_scheduled_milestone_notifications \
  --region eu-north-1 \
  response.json

cat response.json | python3 -m json.tool
```

### **Test for Specific User**
1. Add a test device to a user with `added_at` = yesterday
2. Set user's phone to your number
3. Wait for next hour at 10:00 AM your timezone
4. Or manually invoke Lambda

### **View Logs**
```bash
aws logs tail /aws/lambda/mk_scheduled_milestone_notifications --follow
```

---

## 📊 Monitoring

### **CloudWatch Metrics**
- Invocations
- Duration
- Errors
- Throttles

### **Custom Metrics in Response**
```json
{
  "success": true,
  "timestamp": "2025-11-11T10:00:00Z",
  "total_subscribers": 150,
  "notifications_sent": 12,
  "notifications_skipped": 138,
  "errors": 0
}
```

---

## 🔧 Configuration

### **Environment Variables**

| Variable | Value | Description |
|----------|-------|-------------|
| `SUBSCRIBERS_TABLE` | `stj_subscribers` | DynamoDB table with users |
| `SYSTEM_TABLE` | `stj_system` | DynamoDB table with milestones |
| `WATI_API_TOKEN` | `eyJhbGc...` | WATI API authentication token |
| `WATI_ENDPOINT` | `https://live-mt-server.wati.io/443368` | WATI API base URL |

### **Schedule Configuration**

To change schedule frequency, update EventBridge rule:

```bash
# Current: Every hour
schedule-expression: "rate(1 hour)"

# Alternative options:
# Every 30 minutes: "rate(30 minutes)"
# Every 2 hours: "rate(2 hours)"
# Daily at 9 AM UTC: "cron(0 9 * * ? *)"
```

---

## 🚀 Deployment

### **Deploy/Update Function**
```bash
cd aws_lambda_api
./deploy_scheduled_milestones.sh
```

### **What Gets Deployed**
1. Lambda function code
2. Dependencies (requests, pytz)
3. Environment variables
4. EventBridge hourly trigger
5. Lambda permissions

---

## 📝 Example Scenarios

### **Scenario 1: New User**
- **Nov 10, 3:00 PM**: User registers device
- **Nov 11, 10:00 AM**: Receives Ground Zero (m0/f0)
- **Nov 18, 10:00 AM**: Receives Fighter (m1/f1)
- **Nov 25, 10:00 AM**: Receives Resister (m2/f2)
- ... every 7 days

### **Scenario 2: Multiple Timezones**
- **User A** (Netherlands, +31): Gets message at 10:00 AM CET
- **User B** (USA, +1): Gets message at 10:00 AM EST
- **User C** (Australia, +61): Gets message at 10:00 AM AEDT

### **Scenario 3: Skipped Days**
If system is down, no worries:
- Lambda runs every hour
- On next run, checks if TODAY is a milestone day
- Sends message at next 10:00 AM window
- No duplicate messages (checks exact day match)

---

## ⚠️ Important Notes

1. **WATI Templates Must Be Approved**: WhatsApp takes 1-2 days to approve templates
2. **Phone Number Format**: Must include country code (e.g., +31627207989)
3. **Timezone Auto-Detection**: Based on phone country code
4. **One Message Per Day**: Even if Lambda runs multiple times during the 10:00 hour
5. **Cost**: ~$0.01 per 1000 Lambda invocations (very cheap)

---

## 🎯 Next Steps

1. **✅ Lambda Function Deployed**
2. **✅ EventBridge Schedule Configured**
3. **⏳ Create 22 WATI Templates** (m0-m10, f0-f10)
4. **⏳ Upload Milestone Images** to each template
5. **⏳ Submit Templates for WhatsApp Approval**
6. **⏳ Test with Real User**

---

## 📞 Support

For issues:
1. Check CloudWatch logs
2. Verify WATI templates exist and are approved
3. Confirm user has valid phone number
4. Check EventBridge rule is enabled

---

**🎉 System is now running automatically!**

Users will receive milestone WhatsApp notifications at 10:00 AM their local time on Day 1, then every 7 days after that.











