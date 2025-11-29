# Social Share URL Format

## Base URL
```
https://www.screentimejourney.com/pages/social-share
```

## Query Parameters

All milestone variables included as URL query parameters:

### Full URL Template
```
https://www.screentimejourney.com/pages/social-share?first_name={first_name}&percentage={percentage}&current_level={current_level}&focus_days={focus_days}&next_level={next_level}&next_level_days={next_level_days}&king_queen={king_queen}&king_queen_days={king_queen_days}
```

## Example with Real Data

```
https://www.screentimejourney.com/pages/social-share?first_name=theking&percentage=50&current_level=Ground%20Zero%20🪨&focus_days=3&next_level=Fighter%20🥊&next_level_days=11&king_queen=King&king_queen_days=362
```

## Parameter Definitions

| Parameter | Description | Example Value |
|-----------|-------------|---------------|
| `first_name` | User's username or first name | `theking` |
| `percentage` | Top percentile ranking (1-100) | `50` |
| `current_level` | Current milestone level with emoji | `Ground Zero 🪨` |
| `focus_days` | Days in focus (streak) | `3` |
| `next_level` | Next milestone level with emoji | `Fighter 🥊` |
| `next_level_days` | Days until next level | `11` |
| `king_queen` | Final goal title (King/Queen) | `King` |
| `king_queen_days` | Days until King/Queen status | `362` |

## URL Encoding Notes

- Spaces should be encoded as `%20`
- Emojis should be URL-encoded (automatically handled by `encodeURIComponent()` in JavaScript)
- Special characters should be properly encoded

## JavaScript Function to Generate URL

```javascript
function generateShareURL(milestoneData) {
  const baseURL = 'https://www.screentimejourney.com/pages/social-share';
  
  const params = new URLSearchParams({
    first_name: milestoneData.first_name,
    percentage: milestoneData.percentage,
    current_level: milestoneData.current_level,
    focus_days: milestoneData.focus_days,
    next_level: milestoneData.next_level,
    next_level_days: milestoneData.next_level_days,
    king_queen: milestoneData.king_queen,
    king_queen_days: milestoneData.king_queen_days
  });
  
  return `${baseURL}?${params.toString()}`;
}

// Example usage:
const shareURL = generateShareURL({
  first_name: 'theking',
  percentage: 50,
  current_level: 'Ground Zero 🪨',
  focus_days: 3,
  next_level: 'Fighter 🥊',
  next_level_days: 11,
  king_queen: 'King',
  king_queen_days: 362
});

console.log(shareURL);
// Output: https://www.screentimejourney.com/pages/social-share?first_name=theking&percentage=50&current_level=Ground+Zero+%F0%9F%AA%A8&focus_days=3&next_level=Fighter+%F0%9F%A5%8A&next_level_days=11&king_queen=King&king_queen_days=362
```

## Python Function to Generate URL (for Lambda)

```python
from urllib.parse import urlencode

def generate_share_url(milestone_data):
    """Generate social share URL with milestone parameters"""
    base_url = 'https://www.screentimejourney.com/pages/social-share'
    
    params = {
        'first_name': milestone_data['first_name'],
        'percentage': str(milestone_data['percentage']),
        'current_level': milestone_data['current_level'],
        'focus_days': str(milestone_data['focus_days']),
        'next_level': milestone_data['next_level'],
        'next_level_days': str(milestone_data['next_level_days']),
        'king_queen': milestone_data['king_queen'],
        'king_queen_days': str(milestone_data['king_queen_days'])
    }
    
    query_string = urlencode(params)
    return f"{base_url}?{query_string}"

# Example usage:
share_url = generate_share_url({
    'first_name': 'theking',
    'percentage': 50,
    'current_level': 'Ground Zero 🪨',
    'focus_days': 3,
    'next_level': 'Fighter 🥊',
    'next_level_days': 11,
    'king_queen': 'King',
    'king_queen_days': 362
})

print(share_url)
```

## Integration with Lambda Function

Add this to the Lambda response to include the shareable URL:

```python
# In milestone_notification_handler.py, add after calculating milestone data:

from urllib.parse import urlencode

# Generate share URL
share_url_params = {
    'first_name': first_name,
    'percentage': str(int(percentile)),
    'current_level': f"{current_level} {current_emoji}",
    'focus_days': str(days_in_focus),
    'next_level': f"{next_level} {next_emoji}",
    'next_level_days': str(days_to_next),
    'king_queen': king_queen_title,
    'king_queen_days': str(days_to_king_queen)
}

share_url = f"https://www.screentimejourney.com/pages/social-share?{urlencode(share_url_params)}"

# Add to response
response_data['share_url'] = share_url
```

## Use Cases

1. **WhatsApp Messages**: Include the share URL in WhatsApp messages so users can share their progress
2. **Email Notifications**: Add share URL to email updates
3. **Dashboard**: Display share button on user dashboard
4. **Social Media**: Pre-populate social media posts with milestone data
5. **Leaderboard**: Allow users to share their ranking

## Example Share URLs

### Beginner (Day 3)
```
https://www.screentimejourney.com/pages/social-share?first_name=theking&percentage=50&current_level=Ground%20Zero%20🪨&focus_days=3&next_level=Fighter%20🥊&next_level_days=11&king_queen=King&king_queen_days=362
```

### Advanced (Day 30)
```
https://www.screentimejourney.com/pages/social-share?first_name=champion&percentage=15&current_level=Resister%20🛡️&focus_days=30&next_level=Guardian%20🦅&next_level_days=30&king_queen=King&king_queen_days=335
```

### King/Queen Status (Day 365+)
```
https://www.screentimejourney.com/pages/social-share?first_name=legend&percentage=1&current_level=King%20👑&focus_days=365&next_level=King%20👑&next_level_days=0&king_queen=King&king_queen_days=0
```











