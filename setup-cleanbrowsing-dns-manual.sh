#!/bin/bash

echo "🔧 SETTING UP CLEANBROWSING DNS MANUALLY"
echo "=========================================="
echo ""
echo "This will:"
echo "1. Set DNS servers to CleanBrowsing Adult Filter"
echo "2. Clear all DNS caches"
echo "3. Restart DNS services"
echo "4. Test that it works"
echo ""
read -p "Press Enter to continue..."

echo ""
echo "1️⃣ Setting CleanBrowsing DNS servers..."
echo "----------------------------------------"
sudo networksetup -setdnsservers Wi-Fi 185.228.168.168 185.228.169.169

echo ""
echo "✅ DNS servers set!"
echo ""
echo "2️⃣ Flushing DNS cache..."
echo "----------------------------------------"
sudo dscacheutil -flushcache

echo ""
echo "3️⃣ Killing mDNSResponder to force refresh..."
echo "----------------------------------------"
sudo killall -HUP mDNSResponder

echo ""
echo "4️⃣ Restarting network interface..."
echo "----------------------------------------"
sudo ifconfig en0 down
sleep 2
sudo ifconfig en0 up

echo ""
echo "⏳ Waiting for network to come back up..."
sleep 5

echo ""
echo "5️⃣ Testing DNS configuration..."
echo "----------------------------------------"
echo ""
echo "Current DNS servers:"
scutil --dns | grep 'nameserver\[0\]' | head -3

echo ""
echo "6️⃣ Testing pornhub.com resolution..."
echo "----------------------------------------"
dig pornhub.com | grep -A 2 "ANSWER SECTION"
dig pornhub.com | grep "SERVER:"

echo ""
echo "========================================"
echo "🎯 SETUP COMPLETE!"
echo "========================================"
echo ""
echo "✅ If you see 'SERVER: 185.228.168.168' above, it's working!"
echo ""
echo "🌐 Now test in Safari:"
echo "   Visit: pornhub.com"
echo "   Should be BLOCKED!"
echo ""
echo "========================================"


