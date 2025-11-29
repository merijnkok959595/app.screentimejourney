# 🔓 Remove macOS Profile Without PIN

## Profile to Remove:
**MK#ScreentimeTransformation_a393c718-6c9b-4bc1-a7a0-f7aed87fa1cc**

Since the PIN was stored in a deleted DynamoDB table, here are your options to remove it:

---

## Option 1: Remove via Terminal (EASIEST)

### Step 1: List Installed Profiles
```bash
sudo profiles list
```

Look for the profile with identifier:
- `com.merijnkokbv.screentimetransformation.macos`

### Step 2: Remove the Profile
```bash
sudo profiles remove -identifier com.merijnkokbv.screentimetransformation.macos
```

Enter your Mac admin password when prompted.

This bypasses the PIN requirement! ✅

---

## Option 2: Remove Configuration Profile Files Directly

### Step 1: Navigate to Profiles Directory
```bash
cd /var/db/ConfigurationProfiles
```

### Step 2: List Profiles
```bash
sudo ls -la
```

### Step 3: Find and Remove
Look for files related to your profile UUID or identifier, then:
```bash
sudo rm -rf /var/db/ConfigurationProfiles/[profile-file]
```

### Step 4: Restart
```bash
sudo reboot
```

---

## Option 3: Remove via System Settings (If Profile Shows)

1. **System Settings** → **Privacy & Security** → **Profiles**
2. Select the **MK#ScreentimeTransformation** profile
3. Click the **-** (minus) button
4. If it asks for PIN and you don't know it, use Option 1 instead

---

## Option 4: Recovery Mode (Last Resort)

If terminal methods don't work:

1. **Restart Mac** and hold **Cmd + R** during boot
2. **Utilities** → **Terminal**
3. Run:
```bash
csrutil disable
```
4. Restart normally
5. Remove profile using Option 1
6. Reboot to Recovery Mode again
7. Re-enable SIP:
```bash
csrutil enable
```

---

## ⚡ Quick Fix Script

Run this one-liner:

```bash
sudo profiles remove -identifier com.merijnkokbv.screentimetransformation.macos && echo "✅ Profile removed successfully!"
```

---

## 🔍 Verify Removal

After removal, verify it's gone:

```bash
sudo profiles list | grep -i screentime
```

Should return nothing if successfully removed.

---

## 💡 Common PINs (Try These First)

Before using terminal, try these common PINs in System Settings:
- `1234`
- `0000`
- `1111`
- Your birthday (MMDD)
- `4321`
- `1212`

---

## 📝 Notes

- The `sudo profiles remove` command bypasses the PIN requirement
- You need Mac admin privileges
- The profile will be completely removed
- DNS settings will revert to default
- You can reinstall a new profile anytime

---

## ⚠️ If You Get "Operation not permitted"

This means System Integrity Protection (SIP) is blocking the removal:

### Disable SIP Temporarily:
1. Restart in Recovery Mode (Cmd + R)
2. Terminal → `csrutil disable`
3. Restart normally
4. Remove profile with sudo command
5. Re-enable SIP in Recovery Mode: `csrutil enable`

---

## ✅ Recommended: Use Option 1

Just run:
```bash
sudo profiles remove -identifier com.merijnkokbv.screentimetransformation.macos
```

This is the cleanest and fastest method! 🎯



