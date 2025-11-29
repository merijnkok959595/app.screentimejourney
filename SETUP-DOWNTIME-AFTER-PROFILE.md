# ⏰ Set Up Downtime After Installing Profile

## Why Downtime Isn't Automatic

**MDM profiles on unsupervised iPhones CANNOT automatically configure Screen Time downtime.**

The profile you installed does:
- ✅ Blocks porn sites (CleanBrowsing DNS)
- ✅ Blocks social media websites (Safari)
- ✅ Enforces safe search
- ❌ **Cannot set downtime schedule** (must be manual)

---

## 📱 Manually Set Up Downtime (22:00-09:00)

### Step 1: Enable Screen Time

1. Open **Settings** on iPhone
2. Scroll down → **Screen Time**
3. If not enabled, tap **Turn On Screen Time**
4. Tap **This is My iPhone** (or **This is My Child's iPhone**)

---

### Step 2: Set Up Downtime

1. In Screen Time, tap **Downtime**
2. Toggle **Downtime** to **ON** (green)
3. Tap **Every Day** (or customize by day)
4. Set **From:** **22:00** (10:00 PM)
5. Set **To:** **09:00** (9:00 AM)
6. Toggle **Block at Downtime** to **ON**

---

### Step 3: Set Always Allowed Apps

During downtime, ONLY these apps will work:

1. In Screen Time, tap **Always Allowed**
2. You'll see two sections:
   - **Allowed Apps** (apps that work during downtime)
   - **Choose Apps** (all other apps)

3. **Add these to Allowed Apps** (tap the + button):
   - Phone ☎️
   - Messages 💬
   - FaceTime 📞
   - Clock ⏰
   - Calendar 📅
   - Health ❤️
   - Maps 🗺️
   - Notes 📝
   - Weather ☁️
   - Camera 📷
   - Photos 🖼️

4. **Remove everything else** (tap the - button on apps you don't need during sleep)

---

### Step 4: Block Social Media Apps

1. In Screen Time, tap **App Limits**
2. Tap **Add Limit**
3. Tap **Social Networking** (select the entire category)
4. Or tap **Add Websites & Apps** to select specific apps:
   - Instagram
   - Facebook
   - TikTok
   - Twitter/X
   - Snapchat
   - Reddit
   - Discord

5. Set time limit: **1 minute** (effectively blocks them)
6. Tap **Add**

---

### Step 5: Set Screen Time Passcode 🔐

**This is CRITICAL for enforcement!**

1. In Screen Time, scroll down
2. Tap **Use Screen Time Passcode**
3. Enter a 4-digit passcode
4. Re-enter to confirm

**⚠️ IMPORTANT:**
- **Option A (Recommended):** Have an **accountability partner** set this passcode
- **Option B:** Set a random passcode, write it down, give it to a trusted friend
- **DON'T memorize it yourself!**

This prevents you from:
- Turning off Screen Time
- Changing downtime schedule
- Removing app limits
- Bypassing restrictions

---

### Step 6: Enable Content Restrictions

1. In Screen Time, tap **Content & Privacy Restrictions**
2. Toggle **ON** at the top
3. Tap **Content Restrictions**
4. **Web Content** → Select **Limit Adult Websites**
5. Under **NEVER ALLOW**, add:
   - `facebook.com`
   - `instagram.com`
   - `twitter.com`
   - `tiktok.com`
   - `reddit.com`
   - `snapchat.com`

(These are already blocked by the MDM profile DNS, but this adds extra layer)

---

## ✅ Verification

### Test Downtime:

**At 22:00 (10 PM):**
- You should see a notification: **"Downtime started"**
- Most apps will show an hourglass icon ⏳
- Tapping blocked apps shows: **"App not available during Downtime"**
- Only allowed apps work

**At 09:00 (9 AM):**
- Notification: **"Downtime ended"**
- All apps work again (except social media which is blocked 24/7)

### Test Social Media Blocking:

**Try opening:**
- Instagram app → Should show time limit (1 minute)
- Facebook.com in Safari → Should be blocked (DNS filter)
- TikTok → Should show time limit

---

## 🔒 Complete Protection System

```
MDM Profile (Automatic):
├─ CleanBrowsing DNS ✅
├─ Social media websites blocked ✅
└─ Safe search enforced ✅

Screen Time (Manual Setup):
├─ Downtime 22:00-09:00 ✅
├─ Social media apps limited to 1 min ✅
├─ Always Allowed apps configured ✅
└─ Passcode protection ✅
```

**Together = Maximum Protection!** 🛡️

---

## 💡 Pro Tips

### For Maximum Accountability:

1. **Give passcode to partner BEFORE you know it**
   - Have them set the Screen Time passcode while you look away
   - They write it down and keep it

2. **Use "Ask to Buy" feature**
   - Settings → Screen Time → Family
   - Requires approval for app downloads

3. **Disable Siri during Downtime**
   - Settings → Screen Time → Always Allowed → Siri & Dictation (toggle OFF)

4. **Check Screen Time reports**
   - Your partner can check if you tried to bypass
   - Settings → Screen Time shows usage history

---

## 🔍 Troubleshooting

### Downtime doesn't block apps?
- Make sure **"Block at Downtime"** is ON
- Remove apps from "Always Allowed" if they shouldn't work
- Check that Screen Time passcode is set

### Apps still work after time limit?
- Check if "Ignore Limit" is being tapped
- Make sure passcode is set
- Apps might be in "Always Allowed" - remove them

### Social media websites still load?
- Wait 2-3 minutes after installing profile
- Toggle WiFi off/on
- Restart iPhone
- DNS filter should block them

### Can still bypass restrictions?
- **Without passcode:** Screen Time can be disabled
- **Solution:** Give passcode to accountability partner

---

## ⚠️ Limitations on Unsupervised iPhones

**What the MDM profile CANNOT do on unsupervised devices:**

- ❌ Auto-configure downtime schedule
- ❌ Truly block social media apps (can be overridden)
- ❌ Prevent profile removal (user can remove with iPhone passcode)
- ❌ Prevent VPN installation completely
- ❌ Block app installation completely

**What Screen Time CANNOT prevent:**

- ❌ User turning off Screen Time (without passcode)
- ❌ User removing MDM profile
- ❌ User factory resetting iPhone

**For maximum enforcement:** 
- Use **Supervised mode** (requires Mac + Apple Configurator)
- Or use **SimpleMDM** service ($4-8/month)
- Or rely on **accountability partner** holding passcode

---

## 🎯 Quick Setup Checklist

- [ ] Profile installed (DNS + website blocking)
- [ ] Screen Time enabled
- [ ] Downtime set: 22:00 to 09:00
- [ ] Block at Downtime: ON
- [ ] Always Allowed apps configured (Phone, Messages, Clock, etc.)
- [ ] App Limits: Social Networking → 1 minute
- [ ] Content restrictions: Limit Adult Websites
- [ ] Screen Time passcode set
- [ ] Passcode given to accountability partner
- [ ] Tested at 22:00 to verify downtime works

---

## 📊 Expected Behavior

### During Day (09:00-22:00):
- ✅ Phone, Messages, productivity apps work
- ❌ Social media apps: 1 minute limit
- ❌ Social media websites: Blocked (DNS)
- ❌ Porn sites: Blocked (DNS)

### During Night (22:00-09:00):
- ✅ Phone, Messages, Clock, Calendar work
- ❌ **ALL other apps blocked** (downtime)
- ❌ Social media sites still blocked
- ❌ Porn sites still blocked

---

## ✅ Summary

**The MDM profile blocks websites and porn, but YOU must manually set up:**

1. Screen Time Downtime (22:00-09:00)
2. Always Allowed apps
3. App Limits for social media
4. Screen Time passcode (give to partner!)

**This combo gives you complete protection!** 🎯

Follow the steps above and you'll have everything working! 💪



