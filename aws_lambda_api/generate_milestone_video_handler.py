"""
AWS Lambda Handler for Generating Personalized Milestone Videos
Uses FFmpeg to overlay text on a template video with user data

Query Params Expected:
- firstname: User's first name
- level: Current milestone level
- days: Days on journey
- rank: Global rank percentage
- next_level: Next milestone level
- gender: 'male' or 'female'
"""

import json
import os
import boto3
import subprocess
import tempfile
import uuid
from datetime import datetime
from urllib.parse import parse_qs

# AWS Clients
s3_client = boto3.client('s3')

# Configuration
BUCKET_NAME = os.environ.get('VIDEO_BUCKET_NAME', 'stj-milestone-videos')
TEMPLATE_BUCKET = os.environ.get('TEMPLATE_BUCKET_NAME', 'stj-video-templates')
CLOUDFRONT_DOMAIN = os.environ.get('CLOUDFRONT_DOMAIN', '')
VIDEO_EXPIRY_DAYS = 7  # Videos expire after 7 days

# FFmpeg path in Lambda layer
FFMPEG_PATH = '/opt/bin/ffmpeg'

def lambda_handler(event, context):
    """Main Lambda handler"""
    
    print("📹 Milestone Video Generation Lambda started")
    print(f"Event: {json.dumps(event)}")
    
    try:
        # Parse input data
        user_data = parse_input(event)
        print(f"📊 User data: {user_data}")
        
        # Validate required fields
        if not validate_user_data(user_data):
            return error_response(400, "Missing required fields")
        
        # Generate unique video ID
        video_id = f"{user_data['firstname']}_{user_data['level']}_{uuid.uuid4().hex[:8]}"
        
        # Generate video
        video_url = generate_video(user_data, video_id)
        
        # Success response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({
                'success': True,
                'video_url': video_url,
                'video_id': video_id,
                'message': 'Video generated successfully',
                'expires_in_days': VIDEO_EXPIRY_DAYS
            })
        }
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return error_response(500, f"Video generation failed: {str(e)}")


def parse_input(event):
    """Parse input from API Gateway event"""
    
    # Handle different input formats
    if event.get('body'):
        body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
    else:
        body = event
    
    # Extract user data
    return {
        'firstname': body.get('firstname', 'Champion'),
        'level': int(body.get('level', 0)),
        'days': int(body.get('days', 0)),
        'rank': float(body.get('rank', 0)),
        'next_level': int(body.get('next_level', 1)),
        'gender': body.get('gender', 'male'),
        'color_code': body.get('color_code', '2e2e2e'),
        'next_color_code': body.get('next_color_code', '5b1b1b')
    }


def validate_user_data(data):
    """Validate required fields"""
    required = ['firstname', 'level', 'days', 'rank', 'next_level', 'gender']
    return all(key in data for key in required)


def generate_video(user_data, video_id):
    """Generate personalized milestone video using FFmpeg"""
    
    print(f"🎬 Starting video generation for {user_data['firstname']}")
    
    # Create temporary directories
    with tempfile.TemporaryDirectory() as temp_dir:
        
        # Paths
        template_path = os.path.join(temp_dir, 'template.mp4')
        output_path = os.path.join(temp_dir, f'{video_id}.mp4')
        
        # Download template video from S3
        template_key = f"templates/{user_data['gender']}/milestone_template.mp4"
        print(f"📥 Downloading template: {template_key}")
        
        try:
            s3_client.download_file(TEMPLATE_BUCKET, template_key, template_path)
        except Exception as e:
            print(f"⚠️  Template not found, using default")
            template_key = "templates/default/milestone_template.mp4"
            s3_client.download_file(TEMPLATE_BUCKET, template_key, template_path)
        
        # Build FFmpeg command with text overlays
        ffmpeg_cmd = build_ffmpeg_command(
            template_path,
            output_path,
            user_data
        )
        
        print(f"🎥 Running FFmpeg command")
        print(f"Command: {' '.join(ffmpeg_cmd)}")
        
        # Execute FFmpeg
        result = subprocess.run(
            ffmpeg_cmd,
            capture_output=True,
            text=True,
            timeout=60  # 60 second timeout
        )
        
        if result.returncode != 0:
            print(f"❌ FFmpeg error: {result.stderr}")
            raise Exception(f"FFmpeg failed: {result.stderr}")
        
        print(f"✅ Video generated successfully")
        
        # Upload to S3
        s3_key = f"generated/{datetime.now().strftime('%Y/%m/%d')}/{video_id}.mp4"
        print(f"📤 Uploading to S3: {s3_key}")
        
        s3_client.upload_file(
            output_path,
            BUCKET_NAME,
            s3_key,
            ExtraArgs={
                'ContentType': 'video/mp4',
                'CacheControl': f'max-age={VIDEO_EXPIRY_DAYS * 86400}'
            }
        )
        
        # Generate URL
        if CLOUDFRONT_DOMAIN:
            video_url = f"https://{CLOUDFRONT_DOMAIN}/{s3_key}"
        else:
            # Generate presigned URL (expires in 7 days)
            video_url = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': BUCKET_NAME, 'Key': s3_key},
                ExpiresIn=VIDEO_EXPIRY_DAYS * 86400
            )
        
        print(f"🎉 Video URL: {video_url}")
        return video_url


def build_ffmpeg_command(input_path, output_path, user_data):
    """Build FFmpeg command with text overlays and color background"""
    
    # Font settings
    font_path = "/opt/fonts/Inter-Bold.ttf"  # From Lambda layer
    font_color = "white"
    font_size_large = 64
    font_size_medium = 48
    font_size_small = 36
    
    # Get color codes from user data
    current_color = user_data.get('color_code', '2e2e2e')
    next_color = user_data.get('next_color_code', '5b1b1b')
    
    # Text positions (x, y coordinates)
    # These will be adjusted based on your template video
    positions = {
        'firstname': {'x': '(w-text_w)/2', 'y': 200},      # Top center
        'level': {'x': '(w-text_w)/2', 'y': 400},          # Center
        'days': {'x': 100, 'y': 650},                      # Bottom left
        'rank': {'x': 'w-text_w-100', 'y': 650},          # Bottom right
        'next_level': {'x': '(w-text_w)/2', 'y': 800}     # Bottom center
    }
    
    # Build text overlays with timing
    # Format: drawtext=text='Hello':x=100:y=100:fontfile=font.ttf:fontsize=48:fontcolor=white:enable='between(t,0,3)'
    
    overlays = []
    
    # Firstname appears at 0-3 seconds
    overlays.append(
        f"drawtext=text='Hi {user_data['firstname']}!':"
        f"x={positions['firstname']['x']}:"
        f"y={positions['firstname']['y']}:"
        f"fontfile={font_path}:"
        f"fontsize={font_size_large}:"
        f"fontcolor={font_color}:"
        f"box=1:boxcolor=black@0.5:boxborderw=10:"
        f"enable='between(t,0,3)'"
    )
    
    # Level appears at 3-6 seconds
    overlays.append(
        f"drawtext=text='Level {user_data['level']} 🏆':"
        f"x={positions['level']['x']}:"
        f"y={positions['level']['y']}:"
        f"fontfile={font_path}:"
        f"fontsize={font_size_large}:"
        f"fontcolor={font_color}:"
        f"box=1:boxcolor=black@0.5:boxborderw=10:"
        f"enable='between(t,3,6)'"
    )
    
    # Days appears at 6-9 seconds
    overlays.append(
        f"drawtext=text='{user_data['days']} Days Strong 💪':"
        f"x={positions['days']['x']}:"
        f"y={positions['days']['y']}:"
        f"fontfile={font_path}:"
        f"fontsize={font_size_medium}:"
        f"fontcolor={font_color}:"
        f"box=1:boxcolor=black@0.5:boxborderw=8:"
        f"enable='between(t,6,9)'"
    )
    
    # Rank appears at 9-12 seconds
    overlays.append(
        f"drawtext=text='Top {user_data['rank']}%% Globally 🌍':"
        f"x={positions['rank']['x']}:"
        f"y={positions['rank']['y']}:"
        f"fontfile={font_path}:"
        f"fontsize={font_size_medium}:"
        f"fontcolor={font_color}:"
        f"box=1:boxcolor=black@0.5:boxborderw=8:"
        f"enable='between(t,9,12)'"
    )
    
    # Next level appears at 12-15 seconds
    overlays.append(
        f"drawtext=text='Next: Level {user_data['next_level']} 🎯':"
        f"x={positions['next_level']['x']}:"
        f"y={positions['next_level']['y']}:"
        f"fontfile={font_path}:"
        f"fontsize={font_size_medium}:"
        f"fontcolor={font_color}:"
        f"box=1:boxcolor=black@0.5:boxborderw=8:"
        f"enable='between(t,12,15)'"
    )
    
    # Combine all overlays
    vf_filter = ','.join(overlays)
    
    # Create color gradient filter using current and next level colors
    # This creates a gradient background from current level color to next level color
    color_filter = f"color=c=0x{current_color}:s=1080x1920:d=15"
    gradient_overlay = f"color=c=0x{next_color}:s=1080x1920:d=15,fade=t=in:st=0:d=15:alpha=1"
    
    # Combine color background, gradient overlay, and text overlays
    # We'll use complex filter to blend everything
    complex_filter = f"[0:v]{vf_filter}[txt];"\
                    f"{color_filter}[bg];"\
                    f"{gradient_overlay}[grad];"\
                    f"[bg][grad]blend=all_mode='multiply':all_opacity=0.3[colored];"\
                    f"[colored][txt]overlay=0:0"
    
    # FFmpeg command
    cmd = [
        FFMPEG_PATH,
        '-i', input_path,                    # Input template video
        '-filter_complex', complex_filter,   # Complex filter (background + overlays)
        '-c:v', 'libx264',                   # Video codec
        '-preset', 'fast',                   # Encoding speed
        '-crf', '23',                        # Quality (lower = better, 23 is good)
        '-c:a', 'copy',                      # Copy audio without re-encoding
        '-t', '15',                          # Duration (15 seconds)
        '-y',                                # Overwrite output
        output_path
    ]
    
    return cmd


def error_response(status_code, message):
    """Generate error response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        'body': json.dumps({
            'success': False,
            'error': message
        })
    }


# Test handler locally
if __name__ == "__main__":
    test_event = {
        'firstname': 'Merijn',
        'level': 5,
        'days': 150,
        'rank': 6,
        'next_level': 6,
        'gender': 'male',
        'color_code': '013220',  # Lone Wolf color
        'next_color_code': '1b263b'  # Lightning color
    }
    
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2))

