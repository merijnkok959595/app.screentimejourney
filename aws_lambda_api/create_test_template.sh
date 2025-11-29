#!/bin/bash

##############################################
# Create a Test Video Template
# Uses FFmpeg to generate a simple template
# for testing the milestone video system
##############################################

set -e

echo "🎬 Creating Test Video Template"
echo "================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${YELLOW}⚠️  FFmpeg is not installed${NC}"
    echo "Please install FFmpeg:"
    echo "  macOS: brew install ffmpeg"
    echo "  Linux: apt-get install ffmpeg"
    exit 1
fi

OUTPUT_FILE="milestone_template_test.mp4"
DURATION=15
WIDTH=1080
HEIGHT=1920

echo -e "${BLUE}📐 Specifications:${NC}"
echo "  Resolution: ${WIDTH}x${HEIGHT}"
echo "  Duration: ${DURATION}s"
echo "  Format: MP4 (H.264)"
echo ""

echo -e "${BLUE}🎨 Generating template...${NC}"

# Create a gradient background with animated colors
# This creates a purple-to-blue gradient that shifts over time
ffmpeg -f lavfi -i "color=c=#2E0456:s=${WIDTH}x${HEIGHT}:d=${DURATION}" \
  -f lavfi -i "color=c=#4a1875:s=${WIDTH}x${HEIGHT}:d=${DURATION}" \
  -filter_complex "\
    [0:v][1:v]blend=all_mode='overlay':all_opacity=0.5,\
    format=yuv420p,\
    geq='\
      lum(X,Y)*0.8+20*sin(2*PI*T/3)*cos(X/100)*cos(Y/100):\
      cb(X,Y):\
      cr(X,Y)\
    '\
  " \
  -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p \
  -r 30 \
  -y \
  "$OUTPUT_FILE"

echo -e "${GREEN}✅ Template created: $OUTPUT_FILE${NC}"

# Get file size
FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
echo "  File size: $FILE_SIZE"

# Test video properties
echo ""
echo -e "${BLUE}📊 Video Properties:${NC}"
ffprobe -v quiet -print_format json -show_streams "$OUTPUT_FILE" | \
  python3 -c "
import sys, json
data = json.load(sys.stdin)
video = next(s for s in data['streams'] if s['codec_type'] == 'video')
print(f\"  Codec: {video['codec_name']}\")
print(f\"  Resolution: {video['width']}x{video['height']}\")
print(f\"  Frame Rate: {video['r_frame_rate']}\")
print(f\"  Duration: {float(video.get('duration', 0)):.1f}s\")
"

echo ""
echo -e "${GREEN}🎉 Template ready for testing!${NC}"
echo ""
echo "Next steps:"
echo "1. Test with text overlay:"
echo "   ffmpeg -i $OUTPUT_FILE \\"
echo "     -vf \"drawtext=text='Hi Merijn!':x=(w-text_w)/2:y=200:fontsize=64:fontcolor=white:box=1:boxcolor=black@0.5\" \\"
echo "     -t $DURATION test_with_text.mp4"
echo ""
echo "2. Upload to S3:"
echo "   aws s3 cp $OUTPUT_FILE s3://stj-video-templates/templates/default/milestone_template.mp4"
echo ""
echo "3. Test Lambda function with this template"










