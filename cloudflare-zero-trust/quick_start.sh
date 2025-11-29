#!/bin/bash

echo "=========================================="
echo "🚀 Cloudflare Zero Trust Quick Start"
echo "   Screen Time Journey - VPN Blocker"
echo "=========================================="
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install it first."
    exit 1
fi

echo "✓ Python 3 found"

# Install requirements
echo ""
echo "📦 Installing dependencies..."
pip3 install -q -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✓ Dependencies installed"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check if config exists
if [ ! -f "config.json" ]; then
    echo ""
    echo "❌ config.json not found!"
    echo "   Please ensure your credentials are in config.json"
    exit 1
fi

echo "✓ Configuration file found"
echo ""
echo "=========================================="
echo "Choose an action:"
echo "=========================================="
echo "1. Setup Zero Trust (run first)"
echo "2. Generate iOS Mobile Config"
echo "3. Test VPN Detection"
echo "4. Run All (Setup + Generate + Test)"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🔧 Running Zero Trust setup..."
        python3 setup_zero_trust.py
        ;;
    2)
        echo ""
        echo "📱 Generating mobile config..."
        python3 generate_mobileconfig.py
        ;;
    3)
        echo ""
        echo "🧪 Testing VPN detection..."
        python3 test_vpn_detection.py
        ;;
    4)
        echo ""
        echo "🚀 Running complete setup..."
        echo ""
        python3 setup_zero_trust.py
        echo ""
        echo "---"
        echo ""
        python3 generate_mobileconfig.py
        echo ""
        echo "---"
        echo ""
        python3 test_vpn_detection.py
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "✅ Done!"
echo "=========================================="
echo ""
echo "📋 Next Steps:"
echo "   1. Review generated files"
echo "   2. Deploy mobile config to test device"
echo "   3. Monitor Zero Trust dashboard"
echo ""
echo "🔗 Dashboard: https://one.dash.cloudflare.com/"
echo ""














