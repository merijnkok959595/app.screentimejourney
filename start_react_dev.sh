#!/bin/bash

# Start React Development Server
# Make sure Lambda runner is already running on port 5001

echo "🚀 Starting React Development Server"
echo "===================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "💡 Make sure you're in the aws_amplify_app directory"
    exit 1
fi

# Check if Lambda runner is running
echo "🔍 Checking if Local Lambda runner is available..."
if curl -s http://localhost:5001/health > /dev/null; then
    echo "✅ Lambda runner is running on port 5001"
else
    echo "⚠️  Lambda runner not detected on port 5001"
    echo "💡 Start it in another terminal with: python3 local_lambda_runner.py"
    echo "🔄 Continuing anyway..."
fi

# Check API configuration
echo ""
echo "🔍 Checking API configuration..."
node switch_to_local_api.js status

echo ""
echo "🌐 Starting React Dashboard..."
echo "📱 Dashboard will be available at: http://localhost:3000"
echo "🔗 API requests will go to: http://localhost:5001"
echo ""
echo "💡 Press Ctrl+C to stop the React app"
echo "===================================="

# Set environment variable to automatically open browser
export BROWSER=none

# Start React app
npm start










