# 🚀 Simple Local Development Setup

## Step-by-Step Instructions

### 1️⃣ **Open Terminal 1 (Lambda Runner)**
```bash
cd /Users/merijnkok/Desktop/screen-time-journey-workspace/aws_amplify_app
python3 local_lambda_runner.py
```
**Keep this terminal open** - you should see:
```
🚀 Local Lambda Runner Started!
📍 Server: http://localhost:5001
```

### 2️⃣ **Open Terminal 2 (React App)**
```bash
cd /Users/merijnkok/Desktop/screen-time-journey-workspace/aws_amplify_app
npm start
```
**This will open your dashboard at:** `http://localhost:3000`

### 3️⃣ **Test Everything**
- Lambda API: http://localhost:5001/health
- Dashboard: http://localhost:3000

---

## 🔧 Quick Troubleshooting

**If Lambda Runner fails:**
```bash
# Kill existing processes
killall python3
# Try again
python3 local_lambda_runner.py
```

**If React fails:**
```bash
# Kill existing processes  
killall node
# Try again
npm start
```

**If port 3000 is busy:**
```bash
# React will ask to use port 3001 - say yes!
```

---

## ✅ What Should Work

1. **Dashboard loads** at http://localhost:3000
2. **Username check** works when you type a username
3. **WhatsApp verification** connects to your local Lambda
4. **All API calls** go to localhost:5001 instead of AWS

---

## 🎯 When It's Working

- Terminal 1: Shows Lambda requests as you use the dashboard
- Terminal 2: Shows React development server
- Browser: Dashboard loads and functions work

**That's it! Simple as that! 🎉**


