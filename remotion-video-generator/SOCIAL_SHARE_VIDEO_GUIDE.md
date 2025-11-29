# Social Share Video Generator

This guide explains how to generate personalized social share videos for Screen Time Journey users.

## 🎬 Video Structure

The social share reel is a **15-second vertical video (1080x1920)** with 5 slides:

### Slide 1: Greeting & Rank (0-3s)
- **Background**: Brand purple (#2E0456)
- **Logo**: Top center with yellow crown
- **Content**: 
  - "Hi {firstname},"
  - "You are among the top {rank}% in the world 🌍"
- **Footer**: screentimejourney.com

### Slide 2: Current Level (3-6s)
- **Background**: Current level color code
- **Logo**: Top center
- **Content**:
  - "Right now, you are"
  - "{Current Level} {Emoji} with {days} days in focus"
  - Dopamine description text
- **Footer**: screentimejourney.com

### Slide 3: Next Level (6-9s)
- **Background**: Next level color code
- **Logo**: Top center
- **Content**:
  - "Next up:"
  - "{Next Level} {Emoji}"
  - "in {days} days"
- **Footer**: screentimejourney.com

### Slide 4: King/Queen Goal (9-12s)
- **Background**: Gold (#ffd700)
- **Logo**: Top center
- **Content**:
  - "You're on your path to"
  - "{King/Queen} 👑"
  - "in 365 days"
- **Footer**: screentimejourney.com (dark mode)

### Slide 5: Brand Outro (12-15s)
- **Background**: Brand purple (#2E0456)
- **Content**:
  - Large logo with scale animation
  - "SCREENTIMEJOURNEY"
  - "screentimejourney.com"

## 🚀 Usage

### 1. Fetch Customer Data

Use the test script to fetch customer data from the API:

```bash
node test-social-share.js <customer_id>
```

Example:
```bash
node test-social-share.js 8885250982135
```

This will output:
- Customer profile data
- Remotion props in JSON format
- Commands to preview and render the video

### 2. Preview the Video Locally

Start the Remotion dev server:

```bash
npm run dev
```

Then:
1. Open http://localhost:3000 in your browser
2. Select "SocialShareReel" composition
3. Use the props from step 1 to customize the video

### 3. Render the Video

Render a video file using the CLI:

```bash
npx remotion render SocialShareReel output.mp4 --props='<JSON_PROPS>'
```

Example:
```bash
npx remotion render SocialShareReel output.mp4 --props='{"firstname":"Merijn","rank":100,"currentTitle":"Ground Zero","currentEmoji":"🪨","days":0,"currentColorCode":"2e2e2e","nextTitle":"Fighter","nextEmoji":"🥊","daysToNext":7,"nextColorCode":"5b1b1b","description":"Every journey starts from the ground.","gender":"male","kingColorCode":"ffd700"}'
```

## 📋 Props Interface

```typescript
interface SocialShareReelProps {
  firstname: string;          // User's first name
  rank: number;                // Percentile rank (0-100)
  currentTitle: string;        // Current milestone title
  currentEmoji: string;        // Current milestone emoji
  days: number;                // Days in focus
  currentColorCode: string;    // Hex color (without #)
  nextTitle: string;           // Next milestone title
  nextEmoji: string;           // Next milestone emoji
  daysToNext: number;          // Days until next milestone
  nextColorCode: string;       // Next milestone hex color
  description: string;         // Current level description
  gender: string;              // 'male' or 'female'
  kingColorCode: string;       // King/Queen level color (usually ffd700)
}
```

## 🎨 Design Features

- **Typewriter effect**: Text appears with a smooth typing animation
- **Smooth transitions**: Spring-based animations for all elements
- **Brand consistency**: Uses official logo and brand colors
- **Responsive layout**: Optimized for vertical mobile viewing
- **Professional typography**: Inter font family with proper weights

## 🔗 API Endpoints

### Get Social Share Data
```
POST https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws/get_social_share_data

Body:
{
  "customer_id": "8885250982135"
}

Response:
{
  "success": true,
  "firstname": "Merijn",
  "level": 0,
  "days": 0,
  "rank": 100,
  "gender": "male",
  "color_code": "2e2e2e",
  "next_color_code": "5b1b1b",
  "current_title": "Ground Zero",
  "current_emoji": "🪨",
  "next_title": "Fighter",
  "next_emoji": "🥊",
  "days_to_next": 7,
  "description": "..."
}
```

### Get Milestones
```
POST https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws/get_milestones

Body:
{
  "gender": "male"
}

Response:
{
  "success": true,
  "milestones": [...]
}
```

## 🛠️ Development

### File Structure
```
remotion-video-generator/
├── src/
│   ├── SocialShareReel.tsx    # Main social share composition
│   ├── MilestoneReel.tsx       # Original milestone reel
│   ├── Emoji.tsx               # Emoji component
│   ├── Root.tsx                # Root with all compositions
│   └── index.ts
├── test-social-share.js        # Test script
├── package.json
└── remotion.config.ts
```

### Key Components

- **`SocialShareReel`**: Main composition with 5 slides
- **`GreetingSlide`**: First slide with greeting and rank
- **`CurrentLevelSlide`**: Current milestone info
- **`NextLevelSlide`**: Next milestone preview
- **`KingQueenSlide`**: Ultimate goal (365 days)
- **`BrandOutroSlide`**: Brand closing screen
- **`TypewriterText`**: Reusable typewriter effect
- **`Footer`**: Website URL footer

## 📱 Integration Ideas

### On Social Share Page
```javascript
// Fetch customer data
const response = await fetch(API_URL + '/get_social_share_data', {
  method: 'POST',
  body: JSON.stringify({ customer_id: customerId })
});

const data = await response.json();

// Generate video with props
const videoProps = {
  firstname: data.firstname,
  rank: data.rank,
  // ... etc
};

// Trigger video generation (Lambda function)
const videoUrl = await generateVideo(videoProps);

// Show download button
downloadButton.href = videoUrl;
```

## 🚀 Next Steps

1. **Lambda Integration**: Create a Lambda function to render videos on-demand
2. **S3 Storage**: Store rendered videos in S3 with CloudFront CDN
3. **Caching**: Cache videos by customer_id to avoid re-rendering
4. **Queue System**: Use SQS for async video generation
5. **Progress Tracking**: WebSocket/SSE for real-time generation status

## 📝 Notes

- Video generation takes ~30-60 seconds per video
- Consider pre-rendering videos for active users
- Videos can be cached for 24 hours
- Use Remotion Lambda for serverless rendering at scale








