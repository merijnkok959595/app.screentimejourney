# ✅ Lambda Profile Generator Updated!

## 📝 What Was Changed

Updated the mobile config generators in `aws_lambda_api/lambda_handler.py` to include **adult content filtering and Screen Time enforcement**.

---

## 🔧 Changes Made

### 1. iOS Profile Generator (`generate_ios_vpn_profile`)

**Before:**
- Only had Cloudflare Family DNS

**After:**
- ✅ **CleanBrowsing DNS** (stronger adult content filtering)
- ✅ **Web Content Filter** with `AutoFilterEnabled: true` (enforces Screen Time's "Limit Adult Websites")
- ✅ **Social Media Website Blocking** (facebook.com, instagram.com, twitter.com, tiktok.com, snapchat.com, reddit.com)
- ✅ **Explicit Content Blocking** (`allowExplicitContent: false` - blocks explicit music, movies, apps)
- ✅ **App Store Ratings** (12+ only, rating 600)

### 2. macOS Profile Generator (`generate_macos_vpn_profile`)

**Before:**
- Only had Cloudflare Family DNS + removal PIN

**After:**
- ✅ **Same enhancements as iOS** (CleanBrowsing, web filter, restrictions)
- ✅ **Keeps removal PIN protection** for macOS

---

## 🎯 What Users Now Get Automatically

When users download a profile from your app, they automatically get:

### ✅ Automatic Enforcement (No Manual Setup):

| Feature | iOS | macOS | How It Works |
|---------|-----|-------|-------------|
| **Porn Site Blocking** | ✅ | ✅ | CleanBrowsing DNS |
| **Adult Content Filter** | ✅ | ✅ | AutoFilter (= Screen Time "Limit Adult Websites") |
| **Social Media Websites Blocked** | ✅ | ✅ | DenyList in Safari |
| **Explicit Content Blocked** | ✅ | ✅ | App Store restrictions |
| **App Store 12+ Only** | ✅ | ✅ | Rating restrictions |

### ⚠️ Still Requires Manual Setup:

| Feature | Why Not Automatic? |
|---------|-------------------|
| **Downtime (22:00-09:00)** | MDM profiles cannot auto-configure Screen Time schedules on unsupervised devices |
| **Social Media Apps Blocked** | Requires supervised device or manual Screen Time App Limits |
| **Always Allowed Apps** | User preference - must be set manually |
| **Screen Time Passcode** | User/partner must set this |

---

## 📱 User Experience

### When Users Install the Profile:

**Settings → Screen Time → Content & Privacy Restrictions**

They will see these settings as **"This setting is managed"** (greyed out, enforced by MDM):

1. **iTunes & App Store Purchases:**
   - Explicit Content: ❌ **OFF** (enforced)
   
2. **Content Restrictions:**
   - Allowed Apps Rating: **12+** (enforced)
   - Web Content: **Limit Adult Websites** ✅ **ON** (enforced)

**They CANNOT change these!** Your MDM profile enforces them.

---

## 🔍 Technical Details

### DNS Change:
```
Old: https://family.cloudflare-dns.com/dns-query
New: https://doh.cleanbrowsing.org/doh/adult-filter/
```

**Why?** CleanBrowsing's adult filter is more aggressive and specifically designed for porn blocking.

### New Payloads Added:

1. **`com.apple.webcontent-filter`**
   - FilterType: BuiltIn
   - AutoFilterEnabled: true ← **This enforces Screen Time's "Limit Adult Websites"**
   - DenyListURLs: Social media sites

2. **`com.apple.applicationaccess`**
   - allowExplicitContent: false
   - ratingApps: 600 (12+ only)
   - ratingRegion: us

---

## 🚀 Deployment

### To Deploy This Update:

1. **Test locally** (already validated - no syntax errors ✅)

2. **Deploy to Lambda:**
```bash
cd /Users/merijnkok/Desktop/screen-time-journey-workspace/aws_lambda_api
# Package and deploy
zip -r function.zip . -x "*.git*" -x "*__pycache__*"
aws lambda update-function-code \
  --function-name lambda_handler \
  --zip-file fileb://function.zip \
  --region eu-north-1
```

3. **Test the endpoint:**
```bash
# Generate a profile
curl -X POST https://your-api-endpoint/generate-vpn-profile \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "test123",
    "device_id": "test_device",
    "device_type": "ios",
    "device_name": "iPhone"
  }'
```

4. **Verify the profile includes:**
   - CleanBrowsing DNS
   - Web content filter with AutoFilterEnabled
   - Application access restrictions
   - Social media DenyList

---

## 📊 Impact

### Old Profiles:
- ⚠️ Only blocked some adult content (Cloudflare Family)
- ❌ No Screen Time enforcement
- ❌ No social media blocking

### New Profiles:
- ✅ Strong porn blocking (CleanBrowsing)
- ✅ **Enforces Screen Time adult content settings** ← BIG WIN!
- ✅ Blocks social media websites
- ✅ Blocks explicit content in App Store
- ✅ 12+ app rating only

---

## 💡 User Communication

### What to Tell Users:

> "Our protection profiles now automatically enforce Screen Time's adult content filtering! 
>
> When you install the profile, you'll get:
> - Porn sites blocked (CleanBrowsing DNS)
> - Adult content filter enforced (same as Screen Time's "Limit Adult Websites")
> - Social media websites blocked
> - Explicit content blocked in App Store
> 
> These settings are locked by the profile and can't be changed.
>
> To also block social media APPS and set up downtime (22:00-09:00):
> 1. Go to Settings → Screen Time
> 2. Set up Downtime: 22:00 to 09:00
> 3. Add App Limits: Social Networking → 1 minute
> 4. Set a Screen Time passcode (give it to your accountability partner)"

---

## 🔒 Security Notes

### For iOS:
- Profile has `PayloadRemovalDisallowed: false` (can be removed with passcode)
- Users should give iPhone passcode to accountability partner

### For macOS:
- Profile has `PayloadRemovalDisallowed: true` + removal PIN
- PIN is stored in DynamoDB with tracking
- Much harder to bypass

---

## ✅ Summary

### Changes:
1. ✅ Updated `generate_ios_vpn_profile()` function
2. ✅ Updated `generate_macos_vpn_profile()` function
3. ✅ Added CleanBrowsing DNS
4. ✅ Added Web Content Filter (AutoFilter = Screen Time enforcement)
5. ✅ Added Content Restrictions (explicit content blocking)
6. ✅ Added social media website blocking
7. ✅ Syntax validated - no errors

### Result:
**Your Lambda function now generates profiles that automatically enforce Screen Time's adult content filtering!** 🎉

This is a **huge improvement** - users get automatic protection without manually configuring Screen Time restrictions.

### Deploy Status:
- ✅ Code updated
- ⏳ **Ready to deploy to Lambda**
- ⏳ Test after deployment

---

## 📋 Next Steps

1. Deploy to Lambda (see deployment commands above)
2. Test with a real device
3. Update user documentation
4. Consider updating existing users' profiles (send new download links)

**The code is ready to go!** 🚀



