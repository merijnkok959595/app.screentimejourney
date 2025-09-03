#!/bin/bash

# Script to start React dashboard locally while using real AWS Lambda endpoints
echo "🚀 Starting React Dashboard (Local) with Real AWS Lambda API..."
echo ""
echo "📋 Configuration:"
echo "  - Frontend: http://localhost:3000 (local React dev server)"
echo "  - Backend: https://lc5d0u74gd.execute-api.eu-north-1.amazonaws.com/default (real AWS Lambda)"
echo "  - CORS: Configured in Lambda to allow localhost requests"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Creating .env.local file..."
    cat > .env.local << EOF
# Local development environment configuration
REACT_APP_API_URL=https://lc5d0u74gd.execute-api.eu-north-1.amazonaws.com/default
REACT_APP_DEBUG=true
EOF
    echo "✅ Created .env.local with real Lambda URL"
else
    echo "✅ Using existing .env.local configuration"
fi

echo ""
echo "🌐 Starting React development server..."
echo "   Your dashboard will be available at: http://localhost:3000"
echo "   All API calls will go to: https://lc5d0u74gd.execute-api.eu-north-1.amazonaws.com/default"
echo ""
echo "💡 To test the connection:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Open browser dev tools (F12)"
echo "   3. Watch the Network tab for API calls to your Lambda"
echo ""

npm start
