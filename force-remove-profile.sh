#!/bin/bash

echo "🔓 Force Removing Profile Without PIN"
echo "======================================"
echo ""

# Backup the current profiles preference file
echo "📦 Backing up current configuration..."
cp ~/Library/Preferences/com.apple.configurationprofiles.user.plist ~/Library/Preferences/com.apple.configurationprofiles.user.plist.backup 2>/dev/null

# Try to kill the profiles daemon to reload
echo "🔄 Restarting profiles daemon..."
killall -9 cfprefsd 2>/dev/null

# Remove the profile using profiles command with force
echo "🗑️  Attempting to remove profile..."
profiles remove -identifier com.merijnkokbv.screentimetransformation.macos -forced 2>&1

echo ""
echo "✅ Checking if profile is removed..."
profiles list | grep -i screentime

if [ $? -ne 0 ]; then
    echo ""
    echo "✅ Success! Profile has been removed!"
else
    echo ""
    echo "⚠️  Profile might still be present."
    echo ""
    echo "📝 Manual removal steps:"
    echo ""
    echo "1. Open System Settings"
    echo "2. Go to Privacy & Security → Profiles"
    echo "3. Try these common PINs:"
    echo "   - 1234"
    echo "   - 0000"
    echo "   - 1111"
    echo "   - 4321"
    echo ""
    echo "OR"
    echo ""
    echo "Restart your Mac in Recovery Mode (Cmd+R) and run:"
    echo "  csrutil disable"
    echo "Then boot normally and run:"
    echo "  sudo rm -rf /var/db/ConfigurationProfiles/*"
    echo "  sudo reboot"
fi

echo ""
echo "Done!"



