"""
Milestone Video Generation Handler
Generates personalized milestone reels with color backgrounds and text overlays
"""

import json
import boto3
import subprocess
import os
from datetime import datetime
from typing import Dict, Any

s3_client = boto3.client('s3')
BUCKET_NAME = 'wati-files'
VIDEO_OUTPUT_PREFIX = 'milestone-videos'

def json_resp(data: Dict[str, Any], status_code: int = 200) -> Dict[str, Any]:
    """Helper to format JSON response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': '*'
        },
        'body': json.dumps(data)
    }


def generate_milestone_video(event, context):
    """
    Generate personalized milestone video reel
    
    Input format:
    {
        "customer_id": "8885250982135",
        "firstname": "Merijn",
        "level": 0,
        "days": 0,
        "rank": 100,
        "current_title": "Ground Zero",
        "current_emoji": "🪨",
        "next_title": "Fighter",
        "next_emoji": "🥊",
        "color_code": "2e2e2e",
        "next_color_code": "5b1b1b",
        "gender": "male"
    }
    """
    
    try:
        # Parse input
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', event)
        
        # Extract user data
        customer_id = body.get('customer_id', 'unknown')
        firstname = body.get('firstname', 'Champion')
        level = body.get('level', 0)
        days = body.get('days', 0)
        rank = body.get('rank', 100)
        current_title = body.get('current_title', 'Ground Zero')
        current_emoji = body.get('current_emoji', '🪨')
        next_title = body.get('next_title', 'Fighter')
        next_emoji = body.get('next_emoji', '🥊')
        color_code = body.get('color_code', '2e2e2e')
        next_color_code = body.get('next_color_code', '5b1b1b')
        gender = body.get('gender', 'male')
        king_queen = 'King' if gender == 'male' else 'Queen'
        king_queen_color = 'ffd700'  # Gold
        
        print(f"🎬 Generating video for {firstname} - Level {level}")
        
        # Generate unique filename
        timestamp = int(datetime.now().timestamp())
        output_filename = f"milestone-{customer_id}-{timestamp}.mp4"
        output_path = f'/tmp/{output_filename}'
        
        # Video settings
        width = 1080
        height = 1920
        fps = 30
        duration = 15  # 15 seconds total
        
        # Build FFmpeg command with color backgrounds and text overlays
        ffmpeg_cmd = build_ffmpeg_command(
            output_path=output_path,
            width=width,
            height=height,
            fps=fps,
            duration=duration,
            firstname=firstname,
            current_title=current_title,
            current_emoji=current_emoji,
            days=days,
            rank=rank,
            next_title=next_title,
            next_emoji=next_emoji,
            color_code=color_code,
            next_color_code=next_color_code,
            king_queen=king_queen,
            king_queen_color=king_queen_color
        )
        
        print(f"🎥 Running FFmpeg command...")
        
        # Execute FFmpeg
        result = subprocess.run(
            ffmpeg_cmd,
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode != 0:
            print(f"❌ FFmpeg error: {result.stderr}")
            raise Exception(f"FFmpeg failed: {result.stderr}")
        
        print(f"✅ Video generated: {output_path}")
        
        # Upload to S3
        s3_key = f'{VIDEO_OUTPUT_PREFIX}/{output_filename}'
        s3_client.upload_file(
            output_path,
            BUCKET_NAME,
            s3_key,
            ExtraArgs={
                'ContentType': 'video/mp4',
                'ACL': 'public-read',
                'CacheControl': 'max-age=31536000'
            }
        )
        
        print(f"☁️ Uploaded to S3: {s3_key}")
        
        # Generate URL
        video_url = f"https://{BUCKET_NAME}.s3.eu-north-1.amazonaws.com/{s3_key}"
        
        # Clean up
        if os.path.exists(output_path):
            os.remove(output_path)
        
        return json_resp({
            'success': True,
            'video_url': video_url,
            'message': 'Video generated successfully',
            'duration': duration
        })
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return json_resp({
            'success': False,
            'error': str(e)
        }, 500)


def build_ffmpeg_command(
    output_path: str,
    width: int,
    height: int,
    fps: int,
    duration: int,
    firstname: str,
    current_title: str,
    current_emoji: str,
    days: int,
    rank: float,
    next_title: str,
    next_emoji: str,
    color_code: str,
    next_color_code: str,
    king_queen: str,
    king_queen_color: str
) -> list:
    """
    Build FFmpeg command with color backgrounds and animated text overlays
    
    Timeline (15 seconds):
    0-5s: Current level (color_code background)
    5-10s: Next level (next_color_code background)
    10-15s: King/Queen goal (gold background)
    """
    
    # Escape special characters for FFmpeg
    firstname = firstname.replace("'", "\\'")
    current_title = current_title.replace("'", "\\'")
    next_title = next_title.replace("'", "\\'")
    
    # Text content
    texts = {
        # Slide 1: Current Level (0-5s)
        'greeting': f"Hi {firstname},",
        'current_status': f"Right now you are {current_title} {current_emoji}",
        'days_text': f"{days} days in focus",
        'rank_text': f"Top {rank}% in the world 🌍",
        'dopamine_text': "Reclaiming your dopamine",
        
        # Slide 2: Next Level (5-10s)
        'next_intro': "Next up:",
        'next_title_text': f"{next_title} {next_emoji}",
        'keep_going': "Keep pushing forward!",
        
        # Slide 3: King/Queen Goal (10-15s)
        'final_goal': f"Your path to {king_queen} 👑",
        'journey_text': "365 days of transformation",
        'motivation': "Every day counts 💪"
    }
    
    # Font settings
    font = "Arial"
    fontcolor = "white"
    
    # Build complex filter for color backgrounds and text overlays
    filter_complex = f"""
    color=c=0x{color_code}:s={width}x{height}:d={duration}:r={fps}[bg1];
    color=c=0x{next_color_code}:s={width}x{height}:d={duration}:r={fps}[bg2];
    color=c=0x{king_queen_color}:s={width}x{height}:d={duration}:r={fps}[bg3];
    
    [bg1][bg2]blend=all_expr='if(lt(T,5),A,B)':shortest=1[bg12];
    [bg12][bg3]blend=all_expr='if(lt(T,10),A,B)':shortest=1[bg];
    
    [bg]drawtext=text='{texts["greeting"]}':fontfile=/Library/Fonts/Arial.ttf:fontsize=80:fontcolor={fontcolor}:x=(w-text_w)/2:y=300:enable='between(t,0,5)'[t1];
    
    [t1]drawtext=text='{texts["current_status"]}':fontfile=/Library/Fonts/Arial.ttf:fontsize=64:fontcolor={fontcolor}:x=(w-text_w)/2:y=500:enable='between(t,0,5)'[t2];
    
    [t2]drawtext=text='{texts["days_text"]}':fontfile=/Library/Fonts/Arial.ttf:fontsize=56:fontcolor={fontcolor}:x=(w-text_w)/2:y=650:enable='between(t,0,5)'[t3];
    
    [t3]drawtext=text='{texts["rank_text"]}':fontfile=/Library/Fonts/Arial.ttf:fontsize=56:fontcolor={fontcolor}:x=(w-text_w)/2:y=800:enable='between(t,0,5)'[t4];
    
    [t4]drawtext=text='{texts["dopamine_text"]}':fontfile=/Library/Fonts/Arial.ttf:fontsize=48:fontcolor={fontcolor}:x=(w-text_w)/2:y=1000:enable='between(t,0,5)'[t5];
    
    [t5]drawtext=text='{texts["next_intro"]}':fontfile=/Library/Fonts/Arial.ttf:fontsize=72:fontcolor={fontcolor}:x=(w-text_w)/2:y=400:enable='between(t,5,10)'[t6];
    
    [t6]drawtext=text='{texts["next_title_text"]}':fontfile=/Library/Fonts/Arial.ttf:fontsize=88:fontcolor={fontcolor}:x=(w-text_w)/2:y=600:enable='between(t,5,10)'[t7];
    
    [t7]drawtext=text='{texts["keep_going"]}':fontfile=/Library/Fonts/Arial.ttf:fontsize=56:fontcolor={fontcolor}:x=(w-text_w)/2:y=900:enable='between(t,5,10)'[t8];
    
    [t8]drawtext=text='{texts["final_goal"]}':fontfile=/Library/Fonts/Arial.ttf:fontsize=88:fontcolor=black:x=(w-text_w)/2:y=500:enable='between(t,10,15)'[t9];
    
    [t9]drawtext=text='{texts["journey_text"]}':fontfile=/Library/Fonts/Arial.ttf:fontsize=56:fontcolor=black:x=(w-text_w)/2:y=700:enable='between(t,10,15)'[t10];
    
    [t10]drawtext=text='{texts["motivation"]}':fontfile=/Library/Fonts/Arial.ttf:fontsize=64:fontcolor=black:x=(w-text_w)/2:y=900:enable='between(t,10,15)'[out]
    """
    
    # FFmpeg command
    cmd = [
        'ffmpeg',
        '-f', 'lavfi',
        '-i', f'anullsrc=r=44100:cl=stereo',  # Silent audio
        '-filter_complex', filter_complex.replace('\n', '').replace('    ', ''),
        '-map', '[out]',
        '-t', str(duration),
        '-pix_fmt', 'yuv420p',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-y',
        output_path
    ]
    
    return cmd


def lambda_handler(event, context):
    """Lambda handler entry point"""
    return generate_milestone_video(event, context)


# Local testing
if __name__ == "__main__":
    test_event = {
        "customer_id": "8885250982135",
        "firstname": "Merijn",
        "level": 0,
        "days": 0,
        "rank": 100,
        "current_title": "Ground Zero",
        "current_emoji": "🪨",
        "next_title": "Fighter",
        "next_emoji": "🥊",
        "color_code": "2e2e2e",
        "next_color_code": "5b1b1b",
        "gender": "male"
    }
    
    result = generate_milestone_video(test_event, None)
    print(json.dumps(result, indent=2))










