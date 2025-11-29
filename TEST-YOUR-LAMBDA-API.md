# 🚀 TEST YOUR EXISTING LAMBDA API

## 🎯 **YOU ALREADY HAVE A WORKING ENDPOINT!**

Your Lambda function has a profile generation endpoint:

**`POST /generate_vpn_profile`**

This generates `.mobileconfig` files with:
- ✅ CleanBrowsing DNS (Adult Filter)
- ✅ Web Content Filter (Adult Content + Social Media)
- ✅ Screen Time Restrictions (Explicit Content Blocking)
- ✅ PIN protection for macOS profiles

---

## 📡 **FIND YOUR API URL**

### **Option 1: Check API Gateway**
1. Go to AWS Console → API Gateway
2. Find your API (might be named `screen-time-api` or similar)
3. Copy the "Invoke URL"
4. Should look like: `https://abc123.execute-api.eu-north-1.amazonaws.com/prod`

### **Option 2: Check Lambda Configuration**
1. Go to AWS Console → Lambda
2. Find your function (might be named `screen-time-handler`)
3. Click "Configuration" → "Triggers"
4. Look for API Gateway trigger → copy the API endpoint

### **Option 3: Check Previous Deployments**
- Was it deployed to `vpn-test.screentimejourney.com`?
- Or `api.screentimejourney.com`?
- Or another custom domain?

---

## 🧪 **TEST THE ENDPOINT**

### **Quick Test with curl:**

```bash
curl -X POST https://YOUR-API-URL.com/generate_vpn_profile \
  -H "Content-Type: application/json" \
  -d '{
    "device_type": "macOS",
    "device_name": "Merijn Mac",
    "customer_id": "test123",
    "pincode": "1234",
    "device_id": "test_device_001"
  }'
```

**Expected Response:**
```json
{
  "download_url": "https://wati-vpn-profiles.s3.eu-north-1.amazonaws.com/profiles/test123/xxx-xxx-xxx/ScreenTimeJourney-Merijn_Mac-xxx.mobileconfig",
  "filename": "ScreenTimeJourney-Merijn_Mac-xxx.mobileconfig",
  "device_type": "macOS",
  "device_name": "Merijn Mac",
  "pincode": "1234"
}
```

---

## 🐍 **OR USE THE PYTHON SCRIPT:**

### **1. Run with default URL:**
```bash
python3 get-working-profile-url.py
```

### **2. Run with custom API URL:**
```bash
python3 get-working-profile-url.py "https://your-api-url.com"
```

---

## 🎯 **WHY THIS WILL WORK:**

1. **Your Lambda already has the CleanBrowsing DNS code** ✅
2. **It generates valid mobileconfig files** ✅
3. **It uploads to S3 automatically** ✅
4. **It returns a download URL** ✅

This is THE SAME code that "worked before" - we just need to call it!

---

## 🔍 **IF THE ENDPOINT FAILS:**

### **Check Lambda Logs:**
```bash
aws logs tail /aws/lambda/your-lambda-function-name --follow
```

### **Common Issues:**
- ❌ **404 Not Found** → API Gateway route not configured
- ❌ **403 Forbidden** → CORS or auth issue
- ❌ **500 Internal Error** → Check Lambda logs
- ❌ **Connection refused** → Lambda not deployed or wrong URL

---

## 📱 **ONCE YOU GET THE DOWNLOAD URL:**

1. **Click the URL in Safari** (not Chrome!)
2. **Profile downloads** → System Preferences opens
3. **Click "Install"** → Enter admin password
4. **Verify installation:**
   ```bash
   # Check if profile is installed
   profiles -P | grep ScreenTime
   
   # Test DNS
   dig pornhub.com
   
   # Should show CleanBrowsing DNS:
   # ;; SERVER: 185.228.168.168
   ```

---

## 🎉 **THIS IS YOUR SOLUTION:**

You don't need SimpleMDM, S3 uploads, or manual file creation.

**Your Lambda API already does everything!**

Just find the API URL and call `/generate_vpn_profile` 🚀

---

## 📞 **NEXT STEPS:**

1. Find your API Gateway URL
2. Run `get-working-profile-url.py` with that URL
3. Get the download link
4. Install the profile
5. Test if pornhub.com is blocked

**This should work because it's the SAME code that worked before!** ✅


