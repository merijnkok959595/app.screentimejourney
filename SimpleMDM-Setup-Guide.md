# SimpleMDM Test Profile Setup Guide

## 🏢 SimpleMDM Account Setup

### Step 1: Create SimpleMDM Account
1. Go to **https://simplemdm.com**
2. Sign up for **free trial** (30 days, up to 3 devices)
3. Choose **Business** plan for testing
4. Verify email and complete setup

### Step 2: Access Dashboard
- Login to: **https://a.simplemdm.com**
- Your organization dashboard will be available

---

## 📱 Create Test MDM Profile

### Step 1: Create New Configuration Profile
1. **Dashboard** → **Device Management** → **Configuration Profiles**
2. Click **"+ Add Configuration Profile"**
3. Choose **"Custom Configuration"**
4. Name: `ScreenTime Journey Test Profile`

### Step 2: Add DNS Payload
1. Click **"+ Add Payload"**
2. Select **"DNS Settings"**
3. Configure:
   ```
   DNS Protocol: HTTPS
   Server URL: https://doh.cleanbrowsing.org/doh/adult-filter/
   Server Name: doh.cleanbrowsing.org
   ```

### Step 3: Add Web Content Filter
1. Click **"+ Add Payload"** 
2. Select **"Web Content Filter"**
3. Configure:
   ```
   Filter Type: Built-in
   Auto Filter Enabled: ✅ Yes
   
   Denied URLs:
   - facebook.com
   - *.facebook.com  
   - instagram.com
   - *.instagram.com
   - twitter.com
   - *.twitter.com
   - tiktok.com
   - *.tiktok.com
   - snapchat.com
   - *.snapchat.com
   - reddit.com
   - *.reddit.com
   ```

### Step 4: Add Restrictions
1. Click **"+ Add Payload"**
2. Select **"Restrictions"**
3. Configure:
   ```
   Explicit Content: ❌ Disabled
   App Store Rating: 12+ (600)
   Rating Region: United States
   ```

### Step 5: Save and Deploy
1. Click **"Save"**
2. Set deployment to **"Available"** (self-service install)
3. Note the **enrollment URL**

---

## 📲 Device Enrollment

### For iPhone:
1. **Settings** → **General** → **VPN & Device Management**
2. **Download & Install Configuration Profile**
3. Go to SimpleMDM enrollment URL
4. Follow enrollment steps
5. Install the test profile

### For Mac:
1. **System Settings** → **Privacy & Security** → **Profiles**
2. Go to SimpleMDM enrollment URL  
3. Download and install enrollment profile
4. Install the test configuration profile

---

## 🎯 SimpleMDM vs Manual Profiles

| Feature | Manual .mobileconfig | SimpleMDM Platform |
|---------|---------------------|-------------------|
| **Cost** | Free | $4/device/month |
| **Management** | Manual file sharing | Web dashboard |
| **Updates** | Recreate + redistribute | Push updates remotely |
| **Monitoring** | No visibility | Device compliance reports |
| **Support** | DIY | Professional support |
| **Scalability** | Limited | Enterprise-ready |

---

## 🛡️ SimpleMDM Profile Template

Here's what to configure in SimpleMDM for maximum protection:

### 1. DNS Settings Payload
```
DNS Protocol: HTTPS
Server URL: https://doh.cleanbrowsing.org/doh/adult-filter/
Supplemental Domains: (empty for all traffic)
```

### 2. Web Content Filter Payload  
```
Filter Type: Built-in
Auto Filter Enabled: Yes
Filter Browsers: Yes
Filter Sockets: Yes

Denied URLs:
facebook.com, *.facebook.com
instagram.com, *.instagram.com  
twitter.com, *.twitter.com, x.com, *.x.com
tiktok.com, *.tiktok.com
snapchat.com, *.snapchat.com
reddit.com, *.reddit.com
discord.com, *.discord.com
pornhub.com, *.pornhub.com
xvideos.com, *.xvideos.com
xnxx.com, *.xnxx.com
```

### 3. Restrictions Payload
```
Explicit Content: No
App Store Rating: 600 (12+)  
Movie Rating: 1000 (PG-13)
Rating Region: us
Force Google Safe Search: Yes
Force Bing Safe Search: Yes  
Force Yahoo Safe Search: Yes
```

### 4. Profile Settings
```
Profile Name: ScreenTime Journey Protection
Organization: ScreenTime Journey
Description: Porn blocking + social media restrictions
Removal: Require passcode (set 4-digit PIN)
Auto-removal: Never
```

---

## 🚀 Quick Start with SimpleMDM

### Option A: Free Trial (Recommended for Testing)
1. **Sign up:** https://simplemdm.com/trial
2. **Add 1-3 test devices** (iPhone, Mac)
3. **Create profile** using template above
4. **Test for 30 days** 
5. **Decide:** Keep SimpleMDM or export to manual profiles

### Option B: Manual Export
1. **Create profile in SimpleMDM**
2. **Download .mobileconfig** file from dashboard
3. **Upload to your S3** for self-distribution
4. **Cancel SimpleMDM** subscription

---

## 💡 Why Use SimpleMDM?

### ✅ Advantages:
- **Professional interface** - easier than XML editing
- **Remote management** - push updates instantly  
- **Device monitoring** - see compliance status
- **Support included** - help with configuration
- **Backup/restore** - profile version control

### ❌ Considerations:
- **Monthly cost** - $4/device ongoing
- **Vendor dependency** - locked into platform
- **Internet required** - for management features

---

## 🎯 Recommendation:

**For Testing:** Use SimpleMDM free trial ✅
**For Personal Use:** Export to manual profiles after testing ✅  
**For Business:** Keep SimpleMDM for ongoing management ✅

**Start your SimpleMDM trial now and create a test profile in 10 minutes!** 🚀


