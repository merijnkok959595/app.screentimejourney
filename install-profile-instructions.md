# 📱 INSTALL THE PROFILE - STEP BY STEP

## 🔗 YOUR S3 DOWNLOAD URL:

**https://mdm-profiles-public-f3b79494.s3.amazonaws.com/ScreenTime-Journey-Supervised-PIN-1234.mobileconfig**

---

## 📋 INSTALLATION STEPS:

### **1. Click the URL above**
   - Copy the URL
   - Paste in Safari (NOT Chrome - use Safari!)
   - Press Enter

### **2. Profile downloads**
   - Safari shows download
   - May say "This website is trying to download a configuration profile"
   - Click "Allow"

### **3. System Preferences opens automatically**
   - Shows profile details
   - Profile name: "ScreenTime Journey - PIN Protected"
   - Should show DNS settings and Restrictions

### **4. Click "Install" button**
   - Enter your Mac admin password
   - Click "Install" again to confirm
   - May ask for password again

### **5. Installation completes**
   - Profile now shows in Profiles section
   - System Preferences > Profiles should list it

---

## ✅ VERIFY INSTALLATION:

After installing, check:
- **System Preferences > Profiles**
- Should see: "ScreenTime Journey - PIN Protected"
- Click on it to see details
- Should show DNS and Restrictions sections

---

## 🧪 TEST AFTER INSTALLATION:

Run these in Terminal:
```bash
# Clear DNS cache
sudo dscacheutil -flushcache

# Test DNS
dig pornhub.com

# Should now use CleanBrowsing DNS (185.228.168.168)
```

---

## 🎯 IF DOWNLOAD DOESN'T WORK:

Try these alternatives:
1. **Use curl to download:**
   ```bash
   cd ~/Downloads
   curl -O "https://mdm-profiles-public-f3b79494.s3.amazonaws.com/ScreenTime-Journey-Supervised-PIN-1234.mobileconfig"
   open ScreenTime-Journey-Supervised-PIN-1234.mobileconfig
   ```

2. **Download to Desktop:**
   ```bash
   cd ~/Desktop
   curl -O "https://mdm-profiles-public-f3b79494.s3.amazonaws.com/ScreenTime-Journey-Supervised-PIN-1234.mobileconfig"
   open ScreenTime-Journey-Supervised-PIN-1234.mobileconfig
   ```

---

## 🔒 PROFILE PIN:

- **PIN: 1234**
- Used for removing profile
- Used for changing restrictions

---

## 🚨 IF INSTALLATION FAILS:

Common issues:
- **"Invalid Profile"** → Download may be corrupted, try curl method
- **"Cannot Verify"** → Normal for unsigned profiles, click "Install Anyway"  
- **"Not Trusted"** → Click "Install" to proceed anyway
- **Nothing happens** → Try double-clicking the downloaded .mobileconfig file

---

## 📞 NEXT STEPS:

After successful installation:
1. ✅ Verify profile shows in System Preferences
2. 🧪 Test: `dig pornhub.com`  
3. 🌐 Visit pornhub.com in Safari
4. 📧 Report back if it's blocked or not!

This will tell us definitively if DNS profiles work on your macOS version!


