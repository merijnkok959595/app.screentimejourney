# 🚀 Quick Start: iPhone Content Filter Setup

## ⚡ Fastest Way (3 Minutes - Free)

### For Self-Enrollment (No MDM service needed):

1. **Transfer the profile** to your iPhone:
   ```bash
   # Email yourself the profile
   # Or use AirDrop
   ```
   File: `iPhone-ContentFilter-Profile.mobileconfig`

2. **Install on iPhone**:
   - Open the file on your iPhone
   - Go to **Settings** → **Profile Downloaded**
   - Tap **Install** and enter your passcode
   - Done! ✅

3. **Test it**:
   - Try opening instagram.com in Safari → Should be blocked
   - Try downloading TikTok from App Store → Should be blocked
   - Adult websites filtered automatically

---

## 🎯 Using SimpleMDM (Remote Management)

### If you have a SimpleMDM account:

1. **Run the setup script**:
   ```bash
   cd /Users/merijnkok/Desktop/screen-time-journey-workspace
   python3 simplemdm-setup.py
   ```

2. **Choose option 4** (Do All):
   - Uploads the profile
   - Lists your devices
   - Creates enrollment link

3. **Enroll your iPhone**:
   - Open the enrollment link on your iPhone
   - Follow the prompts
   - Profile auto-installs after enrollment

---

## 🛡️ What Gets Blocked

### Apps:
- Instagram, Facebook, Twitter/X, TikTok
- Snapchat, Reddit, Pinterest, LinkedIn
- Discord, Telegram, WhatsApp

### Websites:
- All social media sites (facebook.com, instagram.com, etc.)
- Adult/porn content (via CleanBrowsing DNS)

### App Store:
- Can't install blocked social media apps
- Explicit content blocked

---

## 📁 Files Created

1. **iPhone-ContentFilter-Profile.mobileconfig** - The MDM profile to install
2. **MDM-Setup-Guide.md** - Complete setup instructions
3. **simplemdm-setup.py** - SimpleMDM API automation script
4. **QUICK-START-MDM.md** - This quick start guide

---

## 🔑 Your API Key

SimpleMDM API Key (keep secure):
```
SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx
```

⚠️ **Don't share this - it controls your MDM!**

---

## ❓ Need Help?

### Profile won't install?
- Check if another MDM profile is already installed
- iPhone must be iOS 14+
- Try downloading directly instead of via email

### Apps still work?
- Full app blocking requires "Supervised mode"
- For unsupervised, use Screen Time + this profile
- SimpleMDM can enforce better controls

### Want to remove the profile?
- Profile is designed to be non-removable
- This is intentional for accountability
- Factory reset or MDM uninstall required

### Want to customize?
- Edit the `.mobileconfig` file
- Add more apps to `blacklistedAppBundleIDs`
- Add more sites to `DenyListURLs`
- See full guide in `MDM-Setup-Guide.md`

---

## 🎛️ Alternative: Built-in Screen Time

If MDM is too restrictive:

1. **Settings** → **Screen Time**
2. **App Limits** → Add social apps (1 min limit)
3. **Content Restrictions** → **Limit Adult Websites**
4. Set passcode → Give to accountability partner

---

## 📞 Support

For SimpleMDM support: support@simplemdm.com
For profile customization: Edit the `.mobileconfig` file

---

**That's it! You're protected.** 🛡️



