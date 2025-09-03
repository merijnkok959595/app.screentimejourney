#!/bin/bash

# Start Local Development Environment
# Runs both Lambda runner and React app for complete local testing

echo "🚀 Starting Local Development Environment"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "local_lambda_runner.py" ]; then
    echo "❌ Error: local_lambda_runner.py not found"
    echo "💡 Make sure you're in the aws_amplify_app directory"
    exit 1
fi

# Check if React app is configured for local API
echo "🔍 Checking API configuration..."
node switch_to_local_api.js status

echo ""
echo "🔄 Making sure we're using local API..."
node switch_to_local_api.js local

echo ""
echo "🧪 Starting Local Lambda Runner (port 5001)..."
python3 local_lambda_runner.py &
LAMBDA_PID=$!

# Wait for Lambda runner to start
echo "⏳ Waiting for Lambda runner to start..."
sleep 3

# Test if Lambda runner is working
echo "🩺 Testing Lambda runner health..."
if curl -s http://localhost:5001/health > /dev/null; then
    echo "✅ Lambda runner is healthy!"
else
    echo "❌ Lambda runner failed to start"
    kill $LAMBDA_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎯 Starting React Dashboard (port 3000)..."
echo "📱 Dashboard will be available at: http://localhost:3000"
echo "🔗 API requests will go to: http://localhost:5001"
echo ""
echo "💡 Press Ctrl+C to stop both services"
echo "========================================"

# Start React app (this will block)
npm start

# Clean up when React app exits
echo ""
echo "🧹 Cleaning up..."
kill $LAMBDA_PID 2>/dev/null
echo "👋 Local development environment stopped"


