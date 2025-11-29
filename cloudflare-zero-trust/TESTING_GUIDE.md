# VPN Detection Testing Guide
## Step-by-Step Testing Instructions

This guide will help you test if your Cloudflare Zero Trust setup successfully detects and blocks VPNs.

---

## 🎯 Testing Overview

We'll test 4 layers of VPN blocking:
1. ✅ DNS-level blocking (VPN domain queries)
2. ✅ Application detection (VPN apps on device)
3. ✅ Protocol blocking (VPN traffic patterns)
4. ✅ WARP enforcement (always-on protection)

---

## 📱 Phase 1: iOS Device Setup

### Step 1: Install Mobile Config

1. Run the generator:
   ```bash
   python3 generate_mobileconfig.py
   ```

2. Transfer the `.mobileconfig` file to your iOS test device:
   - **Option A**: Email it to yourself
   - **Option B**: AirDrop it
   - **Option C**: Upload to iCloud and download

3. On iOS device:
   - Tap the `.mobileconfig` file
   - Go to **Settings > Profile Downloaded**
   - Tap **Install** (top right)
   - Enter your passcode
   - Tap **Install** again (confirmation)
   - Tap **Done**

✅ Profile is now installed!

### Step 2: Install WARP App

1. Open **App Store**
2. Search for **"Cloudflare WARP"** or **"1.1.1.1"**
3. Install the app (it's free)
4. Open the WARP app

### Step 3: Connect to Zero Trust

1. In WARP app, tap the menu (⚙️ gear icon)
2. Tap **Account**
3. Tap **Login with Cloudflare Zero Trust**
4. Enter your organization name: **`screentimejourney`**
5. Authenticate if prompted
6. Return to main screen
7. Toggle WARP **ON**

✅ You should see "Connected" with a green checkmark

### Step 4: Verify WARP Lock

1. Try to toggle WARP off
2. It should be **locked** (grayed out or warning appears)
3. This means the profile is working!

---

## 🧪 Phase 2: VPN Blocking Tests

### Test 1: DNS Blocking (Easiest)

**On your computer or test device:**

1. Open Safari on the iOS device with WARP connected
2. Try to visit these URLs:
   - `https://nordvpn.com` ❌ Should be blocked
   - `https://expressvpn.com` ❌ Should be blocked
   - `https://surfshark.com` ❌ Should be blocked
   - `https://protonvpn.com` ❌ Should be blocked

3. You should see:
   - Cloudflare block page, OR
   - Timeout/DNS error, OR
   - "Cannot connect to server"

4. Test that normal sites work:
   - `https://google.com` ✅ Should work
   - `https://apple.com` ✅ Should work

✅ If VPN sites are blocked but normal sites work = DNS blocking works!

### Test 2: App Store Blocking

1. Open **App Store** on iOS device
2. Search for **"NordVPN"**
3. Try to download/install it
4. The download should either:
   - Fail to start
   - Timeout during download
   - Install but fail to activate

✅ If VPN app won't download/activate = App-level blocking works!

### Test 3: IP Verification

1. On iOS device with WARP connected, open Safari
2. Go to: `https://1.1.1.1/cdn-cgi/trace`
3. Look for these lines in the output:
   ```
   warp=on
   gateway=on
   ```

4. Note the `ip=` line (your IP address)
5. Go to: `https://www.whatismyip.com`
6. The IP should be a Cloudflare IP, not your real IP

✅ If warp=on and gateway=on = Traffic is routing through Cloudflare!

### Test 4: WARP Enforcement

1. On iOS device, go to **Settings > General > VPN & Device Management**
2. Try to add a manual VPN configuration
3. Even if you add it, it should conflict with WARP
4. Try to enable the manual VPN
5. It should either:
   - Fail to connect
   - Disconnect WARP (then block all traffic)
   - Show an error

✅ If manual VPN can't work alongside WARP = Enforcement works!

---

## 🔍 Phase 3: Advanced Testing

### Test 5: Check Device in Dashboard

1. Go to: https://one.dash.cloudflare.com/
2. Navigate to **Zero Trust > My Team > Devices**
3. Find your test device in the list
4. Click on it to see:
   - Connection status (should be "Connected")
   - Last seen time (should be recent)
   - Posture checks (should pass "No VPN" check)

### Test 6: Check Gateway Logs

1. In Zero Trust dashboard, go to **Gateway > Analytics**
2. Look for:
   - DNS queries to VPN domains
   - Blocked requests
   - Device activity

3. Filter by:
   - Action: **Blocked**
   - Category: **VPN**

✅ You should see logged blocking attempts!

### Test 7: Protocol Testing (Advanced)

If you have access to a Mac/PC:

1. Install Wireshark or similar packet capture tool
2. Monitor traffic from the iOS device
3. All traffic should route through Cloudflare
4. Look for Cloudflare IP ranges: `104.16.0.0/12`, `172.64.0.0/13`
5. No VPN protocols should be present:
   - No OpenVPN (port 1194)
   - No WireGuard (port 51820)
   - No IPSec (ports 500, 4500)

---

## 📊 Phase 4: Monitoring & Validation

### Daily Monitoring Checklist

Run this command to check status:
```bash
python3 test_vpn_detection.py
```

This will show:
- ✅ Active policies
- ✅ Enrolled devices
- ✅ Recent blocks
- ✅ Analytics

### What to Look For:

**Good Signs** ✅:
- Devices show "Connected" status
- VPN domains appear in blocked logs
- No unauthorized VPN apps detected
- All traffic routes through WARP

**Bad Signs** ⚠️:
- Devices offline or disconnected
- No blocks in logs (policies not working)
- VPN apps successfully running
- Direct internet access (bypassing WARP)

---

## 🐛 Troubleshooting

### Problem: VPN sites are NOT blocked

**Solutions:**
1. Check if Gateway policies are enabled:
   ```bash
   python3 test_vpn_detection.py
   ```
2. Verify domain list exists in Zero Trust dashboard
3. Re-run setup: `python3 setup_zero_trust.py`
4. Check DNS settings on device (should use WARP DNS)

### Problem: WARP won't connect

**Solutions:**
1. Check if profile is installed correctly
2. Uninstall WARP app and reinstall
3. Check Zero Trust enrollment token
4. Verify organization name: `screentimejourney`

### Problem: Profile won't install

**Solutions:**
1. iOS must be version 14 or higher
2. Device must not have conflicting profiles
3. Try removing old VPN profiles first
4. Restart device and try again

### Problem: VPN app still works

**Solutions:**
1. VPN app might use different protocol
2. Add specific app bundle to device posture check
3. Block additional domains related to that VPN
4. Check if using supervised device mode

---

## 📈 Success Metrics

Your VPN blocking is working if:

| Test | Expected Result | Status |
|------|----------------|--------|
| DNS queries to VPN domains | Blocked | ✅ |
| VPN app downloads | Fail | ✅ |
| VPN app connections | Timeout | ✅ |
| WARP toggle | Locked | ✅ |
| Traffic routing | Via Cloudflare | ✅ |
| Manual VPN config | Fails to connect | ✅ |
| Device posture | Passes checks | ✅ |
| Gateway logs | Show blocks | ✅ |

**If all are ✅ = Your VPN blocking is fully operational!** 🎉

---

## 🔄 Ongoing Testing

### Weekly:
- Check device enrollment status
- Review blocked request logs
- Update VPN domain blocklist
- Test with new VPN services

### Monthly:
- Audit all policies
- Review analytics trends
- Update mobile config if needed
- Test edge cases

---

## 📞 Getting Help

If tests fail:
1. Review logs in Zero Trust dashboard
2. Run `python3 test_vpn_detection.py` for diagnostics
3. Check this guide's troubleshooting section
4. Contact: info@screentimejourney.com

---

## ✅ Testing Checklist

Print this and check off as you test:

- [ ] Mobile config installed on device
- [ ] WARP app installed and connected
- [ ] WARP toggle is locked
- [ ] VPN websites are blocked
- [ ] VPN apps won't download
- [ ] Traffic routes through Cloudflare
- [ ] Device shows in Zero Trust dashboard
- [ ] Gateway logs show blocks
- [ ] Manual VPN config fails
- [ ] All traffic uses WARP DNS

**When all checked** = System is fully tested! ✨

---

## 🎓 Understanding the Results

### What "Working" Means:
- VPNs are detected at multiple layers
- Users cannot easily bypass restrictions
- All traffic is monitored and logged
- Unauthorized apps are blocked

### What "Working" Doesn't Mean:
- 100% impossible to bypass (nothing is)
- All traffic is decrypted and inspected
- Device privacy is fully compromised

### Privacy Balance:
- WARP encrypts traffic (privacy maintained)
- Only DNS and metadata are inspected
- No content inspection by default
- Compliant with privacy regulations

---

Good luck with testing! 🚀














