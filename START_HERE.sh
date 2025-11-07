#!/bin/bash

# 🚀 FOOLPROOF LOCAL DEVELOPMENT STARTUP
# Just run: bash START_HERE.sh

echo "🎯 Starting Local Development Environment"
echo "========================================"

# Make sure we're in the right directory
cd /Users/merijnkok/Desktop/screen-time-journey-workspace/aws_amplify_app

echo "📁 Current directory: $(pwd)"
echo "✅ Files found:"
ls -la | grep -E "(local_lambda_runner|package.json)" | head -5

echo ""
echo "🔧 Step 1: Starting Lambda Runner (port 5001)..."
python3 local_lambda_runner.py &
LAMBDA_PID=$!

echo "⏳ Waiting for Lambda to start..."
sleep 5

# Test Lambda
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    echo "✅ Lambda Runner is working!"
else
    echo "❌ Lambda Runner failed"
    exit 1
fi

echo ""
echo "🔧 Step 2: Starting React App (port 3000)..."
echo "🌐 Your dashboard will open at: http://localhost:3000"
echo ""
echo "💡 To stop everything: Press Ctrl+C"
echo "========================================"

# Start React (this will block)
npm start

# Cleanup when React stops
echo ""
echo "🧹 Stopping Lambda Runner..."
kill $LAMBDA_PID 2>/dev/null
echo "👋 Development environment stopped"











