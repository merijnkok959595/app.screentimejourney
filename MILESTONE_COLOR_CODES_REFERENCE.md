# 🎨 Milestone Color Codes Reference

## Overview

Each milestone level has a unique color code that represents the journey stage. These colors are used as backgrounds in generated milestone videos and throughout the visual identity system.

---

## Male Journey Color Codes

| Level | Title | Emoji | Color Code | Next Color |
|-------|-------|-------|------------|------------|
| 0 | Ground Zero | 🪨 | `2e2e2e` | `5b1b1b` |
| 1 | Fighter | 🥊 | `5b1b1b` | `355d6e` |
| 2 | Resister | 🛡️ | `355d6e` | `6b705c` |
| 3 | Scout | 🪖 | `6b705c` | `3b1f4a` |
| 4 | Mindsmith | 🧠 | `3b1f4a` | `013220` |
| 5 | Lone Wolf | 🐺 | `013220` | `1b263b` |
| 6 | Lightning | ⚡ | `1b263b` | `2b1b1b` |
| 7 | Dragon | 🐉 | `2b1b1b` | `1b263b` |
| 8 | Battle Commander | ⚔️ | `1b263b` | `023020` |
| 9 | Wizard | 🧙‍♂️ | `023020` | `ffd700` |
| 10 | King | 👑 | `ffd700` | - |

---

## Female Journey Color Codes

| Level | Title | Emoji | Color Code | Next Color |
|-------|-------|-------|------------|------------|
| 0 | Awakening | 🌑 | `0a0f2c` | `84384f` |
| 1 | Blossoming | 🌷 | `84384f` | `3e3a63` |
| 2 | Protector | 🕊️ | `3e3a63` | `3a1e3f` |
| 3 | Seeker | 🌸 | `3a1e3f` | `2c2c54` |
| 4 | Reflectress | 🪞 | `2c2c54` | `3b2c55` |
| 5 | Lightweaver | 🪽 | `3b2c55` | `202850` |
| 6 | Ascendant | 🦋 | `202850` | `0d2b3a` |
| 7 | The Swan | 🦢 | `0d2b3a` | `2c103c` |
| 8 | Priestess | 🔮 | `2c103c` | `4b0f2f` |
| 9 | Empress | 👸 | `4b0f2f` | `ffd700` |
| 10 | Queen | 👑 | `ffd700` | - |

---

## Color Palette Meanings

### Male Journey Progression
- **Ground Zero (Dark Gray)**: Starting from nothing, the solid foundation
- **Fighter/Resister (Reds/Blues)**: Active struggle and resistance
- **Scout/Mindsmith (Earth tones/Purple)**: Strategy and mental clarity
- **Lone Wolf (Deep Green)**: Independence and self-reliance
- **Lightning/Dragon (Navy/Dark Red)**: Power and precision
- **Commander/Wizard (Navy/Deep Green)**: Leadership and wisdom
- **King (Gold)**: Ultimate achievement and mastery

### Female Journey Progression
- **Awakening (Deep Blue)**: Beginning of consciousness
- **Blossoming (Rose)**: Growth and flowering
- **Protector (Purple)**: Strength and boundaries
- **Seeker/Reflectress (Deep purples)**: Self-discovery
- **Lightweaver/Ascendant (Purple/Navy)**: Transformation
- **Swan/Priestess (Teal/Purple)**: Grace and wisdom
- **Empress (Deep Rose)**: Power and radiance
- **Queen (Gold)**: Ultimate grace and leadership

---

## Usage in Systems

### 1. Video Generation

When generating milestone videos, pass both `color_code` and `next_color_code`:

```javascript
const videoData = {
  firstname: 'Merijn',
  level: 5,
  days: 150,
  rank: 6,
  next_level: 6,
  gender: 'male',
  color_code: '013220',      // Lone Wolf
  next_color_code: '1b263b'  // Lightning
};
```

The video will use:
- `color_code` as the primary background color
- `next_color_code` as a gradient overlay to show progression

### 2. Social Share URLs

Include color codes in share page URLs:

```
https://screentimejourney.com/pages/milestone-share?
  firstname=John&
  level=5&
  days=150&
  rank=6&
  next_level=6&
  gender=male&
  color_code=013220&
  next_color_code=1b263b
```

### 3. WhatsApp Notifications

```python
# Get milestone data including colors
milestone = get_milestone_by_level(level, gender)

share_url = (
    f"https://screentimejourney.com/pages/milestone-share?"
    f"firstname={customer_firstname}&"
    f"level={level}&"
    f"days={days}&"
    f"rank={global_rank}&"
    f"next_level={level + 1}&"
    f"gender={gender}&"
    f"color_code={milestone['color_code']}&"
    f"next_color_code={milestone['next_color_code']}"
)

message = f"""
🎉 Congratulations {customer_firstname}!

You've reached Level {level}: {milestone['title']} {milestone['emoji']}

🎬 View and share your achievement:
{share_url}
"""
```

### 4. Email Templates

```html
<a href="https://screentimejourney.com/pages/milestone-share?firstname={{firstname}}&level={{level}}&days={{days}}&rank={{rank}}&next_level={{next_level}}&gender={{gender}}&color_code={{color_code}}&next_color_code={{next_color_code}}"
   style="display: inline-block; padding: 15px 30px; background: #{{color_code}}; color: white; text-decoration: none; border-radius: 8px;">
  🎬 View & Share Your Achievement
</a>
```

### 5. Database Query

Color codes are stored in the `stj_system` DynamoDB table under the `milestones` collection:

```python
import boto3

dynamodb = boto3.resource('dynamodb', region_name='eu-north-1')
table = dynamodb.Table('stj_system')

# Get milestones
response = table.get_item(Key={'config_key': 'milestones'})
milestones = response['Item']['data']

# Find specific milestone
male_level_5 = next(m for m in milestones if m['gene'] == 'male' and m['level'] == 5)
print(f"Color: {male_level_5['color_code']}")  # 013220
print(f"Next Color: {male_level_5['next_color_code']}")  # 1b263b
```

---

## Implementation Checklist

### ✅ Completed
- [x] Color codes added to `upload_milestones.py`
- [x] Database schema updated to include `color_code` and `next_color_code`
- [x] Social share widget updated to accept color query params
- [x] Video generation handler updated to use colors as background
- [x] Test cases updated with color codes

### 📋 To Do
- [ ] Upload updated milestones to DynamoDB:
  ```bash
  python upload_milestones.py
  python setup_stj_system.py  # Copy to stj_system table
  ```
- [ ] Update notification templates (WhatsApp, Email) to include color codes
- [ ] Test video generation with different color combinations
- [ ] Update account dashboard to pass color codes in share links

---

## Visual Examples

### Color Preview (CSS)

```css
/* Ground Zero */
background: #2e2e2e;

/* Fighter */
background: #5b1b1b;

/* Lone Wolf */
background: #013220;

/* King/Queen */
background: #ffd700;

/* Gradient Example (Level 5 → Level 6) */
background: linear-gradient(135deg, #013220 0%, #1b263b 100%);
```

### Video Background Effect

The video generation system creates a blended effect:
1. Base layer: `color_code` (current level)
2. Gradient overlay: `next_color_code` fading in (next level)
3. Text overlays: White text with semi-transparent black boxes

This creates a visual progression showing the user's journey from current to next milestone.

---

## Troubleshooting

### Colors Not Showing in Video
1. Check that `color_code` and `next_color_code` are passed to API
2. Verify hex codes don't include `#` prefix (use `2e2e2e` not `#2e2e2e`)
3. Check FFmpeg logs for filter errors

### Colors Not in URL
1. Ensure milestone API returns `color_code` and `next_color_code`
2. Check that milestones have been uploaded to database
3. Verify query params are properly encoded

### Wrong Colors Displayed
1. Verify level/gender mapping is correct
2. Check milestone data in database matches reference table
3. Ensure no typos in hex codes

---

## Future Enhancements

### Potential Additions
- **Seasonal Color Variants**: Special colors for holidays/events
- **Custom Color Themes**: Allow users to choose color preferences
- **Color Psychology**: Match colors to psychological journey stages
- **Animated Gradients**: More dynamic color transitions in videos
- **Color Accessibility**: High contrast alternatives for accessibility

---

## Resources

- **Color Testing Tool**: https://colorhex.net/
- **Gradient Generator**: https://cssgradient.io/
- **Accessibility Checker**: https://webaim.org/resources/contrastchecker/

---

## Questions?

For issues with color codes:
1. Check this reference table
2. Verify database has latest milestone data
3. Test with known working color codes (e.g., `ffd700` for King/Queen)
4. Review CloudWatch logs for FFmpeg color filter errors

**Color codes are now integrated throughout the milestone system!** 🎨










