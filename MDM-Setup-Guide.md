# iPhone MDM Profile Setup Guide

## What You Get
This MDM profile provides:
- ✅ **CleanBrowsing DNS** - Blocks adult/porn content at DNS level
- ✅ **Social Media Blocking** - Blocks Instagram, Facebook, TikTok, Twitter, Snapchat, Reddit, etc.
- ✅ **App Installation Block** - Prevents installing blocked social media apps
- ✅ **Web Content Filter** - Blocks social media websites in Safari

---

## Option 1: Self-Enrollment (Free - No MDM Service Needed)

### Step 1: Install the Profile on iPhone

1. **Email or AirDrop** the `iPhone-ContentFilter-Profile.mobileconfig` file to your iPhone
2. Open the file on your iPhone
3. Go to **Settings** → **Profile Downloaded**
4. Tap **Install** (you'll need to enter your passcode)
5. Confirm installation

### Step 2: Verify Installation

1. Go to **Settings** → **General** → **VPN & Device Management**
2. You should see "Content Filter & Social Media Block" profile installed
3. Try accessing Facebook.com or Instagram.com - they should be blocked

### Step 3: Test the Blocks

- Try opening Safari and going to facebook.com → Should be blocked
- Try downloading Instagram from App Store → Should be blocked
- Adult websites should be filtered by CleanBrowsing DNS

---

## Option 2: Using SimpleMDM (Paid Service - Better Control)

If you want remote management capabilities, use SimpleMDM:

### Setup SimpleMDM

1. **Sign up** at [simplemdm.com](https://simplemdm.com)
2. Get your **API Key** from Account Settings
3. Use the API key: `SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx`

### Upload Profile via SimpleMDM

```bash
# Run the SimpleMDM setup script
python3 simplemdm-setup.py
```

Or manually:
1. Login to SimpleMDM dashboard
2. Go to **Custom Profiles** → **New Profile**
3. Upload the `iPhone-ContentFilter-Profile.mobileconfig` file
4. Assign to your device group

### Enroll iPhone in SimpleMDM

1. In SimpleMDM dashboard, click **Devices** → **Add Device**
2. Send enrollment link to your iPhone
3. Open the link on iPhone and follow enrollment steps
4. Profile will auto-install after enrollment

---

## What's Blocked

### Social Media Apps Blocked:
- Instagram
- Facebook
- Twitter (X)
- TikTok
- Snapchat
- Reddit
- Pinterest
- LinkedIn
- Discord
- Telegram
- WhatsApp

### Social Media Websites Blocked:
- facebook.com
- instagram.com
- twitter.com / x.com
- tiktok.com
- snapchat.com
- reddit.com
- And more...

### Content Filtering:
- Adult/porn content (via CleanBrowsing DNS)
- Explicit content in App Store
- Mature-rated apps

---

## Customization

### To Add More Blocked Apps:

Edit the `blacklistedAppBundleIDs` section and add:
```xml
<string>com.app.bundleid</string>
```

To find an app's bundle ID:
1. Search on [offcornerdev.com/bundleid.html](https://offcornerdev.com/bundleid.html)
2. Or use iTunes Search API

### To Add More Blocked Websites:

Edit the `DenyListURLs` section and add:
```xml
<string>example.com</string>
```

### To Change DNS Provider:

Replace CleanBrowsing DNS with alternatives:
- **CleanBrowsing Family Filter**: `https://doh.cleanbrowsing.org/doh/family-filter/`
- **Cloudflare Family**: `https://family.cloudflare-dns.com/dns-query`
- **OpenDNS FamilyShield**: Configure via VPN profile

---

## Removal Protection

The profile has `PayloadRemovalDisallowed` set to `true`, which means:
- ⚠️ The profile **cannot be easily removed** without a passcode
- This is intentional for accountability
- To remove: You'll need to factory reset or use MDM uninstall command

---

## Troubleshooting

### Profile Won't Install
- Make sure iPhone is running iOS 14 or later
- Check if another MDM profile is already installed (only 1 allowed)
- Try downloading directly instead of via email

### Social Media Apps Still Work
- The app blocking requires **Supervised mode** for full enforcement
- For unsupervised devices, use Screen Time restrictions instead
- Or use SimpleMDM which can enforce better

### DNS Filter Not Working
- Go to Settings → General → VPN & Device Management → DNS
- Verify CleanBrowsing DNS is active
- Try disabling/re-enabling WiFi

### Need to Temporarily Disable
- This profile is designed to be non-removable
- Consider using Screen Time instead if you need flexibility
- Or set up SimpleMDM for remote enable/disable

---

## Alternative: iOS Screen Time

For a less restrictive approach, use built-in Screen Time:

1. **Settings** → **Screen Time** → **Turn On Screen Time**
2. **App Limits** → Add social media apps with 1-minute limit
3. **Content & Privacy Restrictions**:
   - Enable restrictions
   - **Content Restrictions** → **Web Content** → **Limit Adult Websites**
   - Add social media sites to **Never Allow**
4. Set a Screen Time passcode (give to accountability partner)

---

## Support & API Key Storage

Your SimpleMDM API Key (keep this secure):
```
SVrbHu2nKhg8AWDfuUVTv0T4z4azWDhHxuAY7yM6wPRoHarYPR839rtQCgVY6Ikx
```

**⚠️ Never share this API key publicly - it gives full control over your MDM!**



