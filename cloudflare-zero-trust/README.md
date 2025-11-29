# Cloudflare Zero Trust VPN Detection & Blocking
## For Screen Time Journey

This setup configures Cloudflare Zero Trust to detect and block VPN usage, preventing users from bypassing screen time restrictions.

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip3 install requests plistlib
```

### 2. Configure Zero Trust

```bash
python3 setup_zero_trust.py
```

This will:
- ✅ Test API connection
- ✅ Create VPN domain blocklist
- ✅ Set up Gateway policies
- ✅ Configure device posture checks
- ✅ Enable WARP enforcement

### 3. Generate Mobile Config

```bash
python3 generate_mobileconfig.py
```

This creates an iOS `.mobileconfig` file that:
- Enforces always-on WARP connection
- Locks the VPN toggle (users can't disable it)
- Routes all traffic through Cloudflare
- Enables DNS and firewall filtering

### 4. Test VPN Detection

```bash
python3 test_vpn_detection.py
```

This verifies:
- Gateway policies are active
- Devices are enrolled
- VPN blocking is working
- Analytics are capturing data

---

## 📱 Deploying to iOS Devices

### Method 1: Email
1. Email the `.mobileconfig` file to users
2. Open on iOS device
3. Go to Settings > Profile Downloaded
4. Tap Install

### Method 2: MDM (Recommended for Scale)
1. Upload profile to your MDM solution
2. Push to enrolled devices
3. Monitor compliance via MDM dashboard

### Method 3: Web Download
1. Host the `.mobileconfig` on your website
2. Users download and install
3. HTTPS required for security

---

## 🛡️ How VPN Blocking Works

### Layer 1: DNS Filtering
- Blocks DNS queries to known VPN services
- Domains like `nordvpn.com`, `expressvpn.com`, etc.
- Prevents VPN app downloads and updates

### Layer 2: Application Detection
- Device posture checks detect VPN apps
- Scans for known VPN app bundles
- Blocks access if unauthorized VPN detected

### Layer 3: Traffic Analysis
- Gateway inspects traffic patterns
- Detects OpenVPN, WireGuard, IPSec protocols
- Blocks suspicious encrypted tunnels

### Layer 4: WARP Enforcement
- All traffic must route through WARP
- Users cannot disable WARP client
- Fallback to unprotected mode disabled

---

## 🧪 Testing VPN Blocking

### On Test Device:

1. **Test DNS Blocking**
   ```bash
   # These should fail or be blocked:
   nslookup nordvpn.com
   nslookup expressvpn.com
   ```

2. **Test App Store**
   - Try to download NordVPN app
   - Should be blocked or fail to connect

3. **Test WARP Lock**
   - Try to disable WARP in settings
   - Should be grayed out/locked

4. **Test Traffic Routing**
   - Check IP: https://1.1.1.1/cdn-cgi/trace
   - Should show Cloudflare WARP IP
   - Verify `warp=on` in response

5. **Test VPN Bypass Attempts**
   - Try to enable iOS VPN manually
   - Should conflict with WARP
   - Connection should fail

---

## 📊 Monitoring & Analytics

### Cloudflare Dashboard:
- **Zero Trust > Gateway > Analytics**
  - View blocked VPN attempts
  - See DNS query logs
  - Monitor device connections

- **Zero Trust > Devices**
  - See enrolled devices
  - Check device posture status
  - Review compliance

- **Zero Trust > Logs**
  - Real-time activity logs
  - Filter by "vpn" or "block"
  - Export for analysis

### API Monitoring:
```bash
# Run continuous monitoring
python3 test_vpn_detection.py
```

---

## ⚙️ Configuration Options

### Edit `config.json` to customize:

```json
{
  "vpn_blocking": {
    "enabled": true,
    "detection_methods": [
      "device_posture_check",
      "gateway_policy",
      "warp_enforcement"
    ],
    "blocked_vpn_services": [
      "NordVPN",
      "ExpressVPN",
      ...
    ]
  }
}
```

### Add More VPN Services:
Simply add to the `blocked_vpn_services` array and re-run setup.

---

## 🔒 Security Considerations

### Strengths:
✅ Multi-layer detection (DNS, app, traffic, device)
✅ Always-on protection (users can't disable)
✅ Real-time monitoring and logging
✅ Blocks both known VPNs and protocols
✅ Integrated with Zero Trust architecture

### Limitations:
⚠️ Sophisticated users might still bypass (e.g., HTTPS tunnels)
⚠️ Requires WARP app to be installed
⚠️ Profile can be removed if device is not supervised
⚠️ Some legitimate apps might be affected

### Recommendations:
1. Use with supervised devices (MDM)
2. Combine with other restrictions (Screen Time API)
3. Monitor logs regularly
4. Update VPN blocklist frequently
5. Consider adding IP-based blocking too

---

## 🐛 Troubleshooting

### "API connection failed"
- Check API key in `config.json`
- Verify email is correct
- Ensure account has Zero Trust enabled

### "Profile won't install"
- Device must be iOS 14+
- Profile must be signed (production)
- User must approve installation

### "WARP not enforcing"
- Check device enrollment status
- Verify Gateway policies are enabled
- Ensure device posture checks are active

### "VPNs not being blocked"
- Check Gateway rule order
- Verify domain list is up to date
- Review Gateway logs for hits
- May need to add more detection rules

---

## 📚 Additional Resources

- [Cloudflare Zero Trust Docs](https://developers.cloudflare.com/cloudflare-one/)
- [WARP Client Guide](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/warp/)
- [Gateway Policies](https://developers.cloudflare.com/cloudflare-one/policies/filtering/)
- [Device Posture](https://developers.cloudflare.com/cloudflare-one/identity/devices/)

---

## 🆘 Support

For issues or questions:
- Email: info@screentimejourney.com
- Dashboard: https://dash.cloudflare.com/f9a4686c874f4d5be8af2f08610e5ec2

---

## 🔄 Updating Configuration

To update policies after changes:

```bash
# 1. Edit config.json
# 2. Re-run setup
python3 setup_zero_trust.py

# 3. Regenerate mobile config if needed
python3 generate_mobileconfig.py

# 4. Test changes
python3 test_vpn_detection.py
```

---

## ⚖️ Legal & Compliance

**Important**: 
- Inform users that VPN blocking is active
- Include in Terms of Service
- Provide clear privacy policy
- Consider regional regulations (GDPR, etc.)
- For minors, ensure parental consent

This is a security measure to ensure the integrity of your screen time management service.

---

## 📝 License

Proprietary - Screen Time Journey
© 2025 All Rights Reserved














