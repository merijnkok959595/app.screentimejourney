# FFmpeg Lambda Layer Setup

## Overview
The audio surrender validation now includes automatic format conversion using FFmpeg to ensure compatibility with OpenAI Whisper API across all devices (iPhone, Android, Desktop Chrome, Safari, etc.).

## Why FFmpeg?
- **Universal Compatibility**: Converts any audio format to Whisper-compatible OGG Opus
- **Robust Solution**: Works for all browsers and devices
- **Fallback Safety**: If frontend sends incompatible format, backend auto-converts
- **No User Errors**: Users never see "format not supported" errors

## Setup Instructions

### Option 1: Use Pre-built FFmpeg Lambda Layer (Recommended)

1. **Add FFmpeg Lambda Layer from AWS Serverless Application Repository**
   ```bash
   # Layer ARN for eu-north-1 region
   arn:aws:lambda:eu-north-1:145266761615:layer:ffmpeg:4
   ```

2. **Add Layer to Lambda Function**
   ```bash
   aws lambda update-function-configuration \
     --function-name mk_shopify_web_app \
     --layers arn:aws:lambda:eu-north-1:145266761615:layer:ffmpeg:4 \
     --region eu-north-1
   ```

### Option 2: Build Custom FFmpeg Layer

1. **Create FFmpeg binary for Lambda**
   ```bash
   mkdir -p ffmpeg-layer/bin
   cd ffmpeg-layer
   
   # Download pre-compiled FFmpeg for Amazon Linux 2
   wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
   tar xvf ffmpeg-release-amd64-static.tar.xz
   
   # Copy ffmpeg binary
   cp ffmpeg-*-amd64-static/ffmpeg bin/
   chmod +x bin/ffmpeg
   ```

2. **Create Layer ZIP**
   ```bash
   zip -r ffmpeg-layer.zip bin/
   ```

3. **Upload as Lambda Layer**
   ```bash
   aws lambda publish-layer-version \
     --layer-name ffmpeg \
     --description "FFmpeg binary for audio conversion" \
     --zip-file fileb://ffmpeg-layer.zip \
     --compatible-runtimes python3.11 python3.12 \
     --region eu-north-1
   ```

4. **Attach to Lambda Function**
   ```bash
   aws lambda update-function-configuration \
     --function-name mk_shopify_web_app \
     --layers arn:aws:lambda:eu-north-1:YOUR_ACCOUNT_ID:layer:ffmpeg:1 \
     --region eu-north-1
   ```

### Option 3: Test Locally Without FFmpeg

If FFmpeg is not available, the system will:
1. Try transcription with original audio format
2. If it fails, return user-friendly error message
3. Frontend audio format selection should prevent most issues

## How It Works

### Flow Diagram
```
User Records Audio
      ↓
Frontend: Select best format (WebM Opus, OGG Opus, WAV)
      ↓
Backend: Receive audio
      ↓
Backend: Try Whisper transcription
      ↓
   Success? → Continue with validation
      ↓ (No - 400 Error)
Backend: Auto-convert with FFmpeg to OGG Opus
      ↓
Backend: Retry Whisper transcription
      ↓
   Success → Continue with validation
```

### Conversion Settings
- **Output Format**: OGG Opus (best for Whisper)
- **Bitrate**: 96k (good quality, small size)
- **Sample Rate**: 16kHz (Whisper's preferred rate)
- **Timeout**: 30 seconds max

## Testing

### Test Different Formats
```python
# The system should handle all these formats:
formats = [
    'audio/webm;codecs=opus',  # Chrome Desktop/Android
    'audio/ogg;codecs=opus',   # Firefox, Safari fallback
    'audio/mp4',               # Safari (gets converted)
    'audio/wav',               # Universal fallback
]
```

### Monitor Lambda Logs
```bash
aws logs tail /aws/lambda/mk_shopify_web_app --follow --region eu-north-1
```

Look for:
- `🎵 Audio format detected:` - Shows incoming format
- `⚠️ First attempt failed` - FFmpeg conversion triggered
- `✅ FFmpeg conversion successful` - Conversion worked
- `❌ FFmpeg conversion failed` - Check FFmpeg availability

## Troubleshooting

### FFmpeg Not Found
**Error**: `FileNotFoundError: [Errno 2] No such file or directory: 'ffmpeg'`

**Solution**: Add FFmpeg Lambda Layer (see Option 1 or 2 above)

### Conversion Timeout
**Error**: `subprocess.TimeoutExpired`

**Solution**: Audio file too large or complex. Increase timeout or check audio length in frontend.

### Permission Issues
**Error**: `Permission denied`

**Solution**: Ensure FFmpeg binary has execute permissions (`chmod +x`)

## Browser Compatibility Matrix

| Browser/Device | Format Sent | Needs Conversion? |
|---------------|-------------|-------------------|
| Chrome Desktop | WebM Opus | ❌ No |
| Firefox Desktop | OGG Opus | ❌ No |
| Safari Desktop | OGG Opus / WAV | ❌ No |
| Safari iOS | OGG Opus / WAV | ❌ No |
| Chrome Android | WebM Opus | ❌ No |
| Edge | WebM Opus | ❌ No |

**Note**: Safari MP4 (if somehow sent) will be auto-converted ✅

## Performance Impact

- **Without Conversion**: ~1-2 seconds (Whisper only)
- **With Conversion**: ~3-5 seconds (FFmpeg + Whisper)
- **Lambda Timeout**: Set to 30 seconds (safe buffer)

## Cost Considerations

- **FFmpeg Layer**: Free (< 50MB)
- **Lambda Duration**: +2-3 seconds per conversion
- **Storage**: Temp files auto-deleted after conversion

## Next Steps

1. ✅ Deploy Lambda with updated code
2. ⚠️ Add FFmpeg Lambda Layer (Option 1 recommended)
3. ✅ Test on different devices
4. ✅ Monitor logs for conversion attempts

---

**Last Updated**: 2025-11-28
**Lambda Function**: `mk_shopify_web_app`
**Region**: `eu-north-1`

