#!/bin/bash

echo "🎬 Testing Remotion Video Generation Locally..."
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "⚠️  Dependencies not installed. Installing now..."
    npm install
fi

echo "✅ Dependencies OK"
echo ""

# Test render locally
echo "📹 Rendering test video locally..."
echo "   This will take ~30-60 seconds..."
echo ""

npx remotion render src/index.ts MilestoneReel out/test-video.mp4 \
  --props='{"firstname":"Merijn","currentTitle":"Fighter","currentEmoji":"🥊","days":30,"rank":15,"nextTitle":"Warrior","nextEmoji":"⚔️","colorCode":"5b1b1b","nextColorCode":"8b4513","gender":"male"}'

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Video rendered successfully!"
    echo "📁 Location: out/test-video.mp4"
    echo ""
    echo "🎉 Open the video to preview:"
    echo "   open out/test-video.mp4"
    echo ""
else
    echo ""
    echo "❌ Render failed. Check errors above."
    exit 1
fi










