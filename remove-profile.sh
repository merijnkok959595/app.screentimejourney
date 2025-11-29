#!/bin/bash

echo "🔓 Removing ScreentimeTransformation Profile"
echo "============================================"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script needs sudo privileges. Re-running with sudo..."
   sudo "$0" "$@"
   exit $?
fi

echo "📋 Currently installed profiles:"
profiles list | grep -i screentime || echo "   (none found with 'screentime' in name)"
echo ""

echo "🗑️  Attempting to remove profile..."
echo ""

# Try to remove the profile
profiles remove -identifier com.merijnkokbv.screentimetransformation.macos 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Profile removed successfully!"
    echo ""
    echo "🔍 Verifying removal..."
    profiles list | grep -i screentime
    
    if [ $? -ne 0 ]; then
        echo "✅ Confirmed: Profile is completely removed!"
    else
        echo "⚠️  Profile might still be present. Check System Settings."
    fi
else
    echo ""
    echo "❌ Failed to remove profile."
    echo ""
    echo "Possible reasons:"
    echo "1. System Integrity Protection (SIP) is blocking removal"
    echo "2. Profile doesn't exist with that identifier"
    echo ""
    echo "💡 Try these solutions:"
    echo ""
    echo "Solution 1 - List all profiles:"
    echo "  sudo profiles list"
    echo ""
    echo "Solution 2 - Check actual identifier:"
    echo "  sudo profiles list | grep -A 5 -i screentime"
    echo ""
    echo "Solution 3 - Disable SIP (advanced):"
    echo "  1. Restart Mac in Recovery Mode (Cmd + R)"
    echo "  2. Terminal → csrutil disable"
    echo "  3. Restart → Run this script again"
    echo "  4. Re-enable SIP in Recovery Mode"
    echo ""
fi

echo ""
echo "Done!"



