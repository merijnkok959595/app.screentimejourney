#!/bin/bash

# Start only the Local Lambda Runner
# Use this in a separate terminal if you want more control

echo "🔧 Starting Local Lambda Runner Only"
echo "===================================="

# Check if we're in the right directory
if [ ! -f "local_lambda_runner.py" ]; then
    echo "❌ Error: local_lambda_runner.py not found"
    echo "💡 Make sure you're in the aws_amplify_app directory"
    exit 1
fi

echo "🧪 Starting Local Lambda Runner on port 5001..."
echo "🔗 Your Lambda handler will be available at: http://localhost:5001"
echo "📋 Available endpoints listed below..."
echo ""
echo "💡 In another terminal, run: npm start"
echo "💡 To stop: Press Ctrl+C"
echo "===================================="

python3 local_lambda_runner.py




