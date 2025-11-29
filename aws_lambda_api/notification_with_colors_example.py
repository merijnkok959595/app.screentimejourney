"""
Example: How to include color codes in WhatsApp and Email notifications
This shows how to pass color codes when sending milestone achievement notifications
"""

import boto3
from decimal import Decimal

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name='eu-north-1')
stj_system_table = dynamodb.Table('stj_system')


def get_milestone_with_colors(level, gender):
    """
    Get milestone data including color codes from stj_system table
    
    Args:
        level (int): Milestone level (0-10)
        gender (str): 'male' or 'female'
        
    Returns:
        dict: Milestone data with color codes
    """
    try:
        # Get milestones from stj_system
        response = stj_system_table.get_item(Key={'config_key': 'milestones'})
        milestones_data = response.get('Item', {}).get('data', [])
        
        # Find the specific milestone
        milestone = next(
            (m for m in milestones_data if m['gene'] == gender and m['level'] == Decimal(str(level))),
            None
        )
        
        if not milestone:
            print(f"⚠️  Milestone not found for level {level}, gender {gender}")
            return None
        
        return {
            'level': int(milestone['level']),
            'title': milestone['title'],
            'emoji': milestone['emoji'],
            'description': milestone['description'],
            'color_code': milestone.get('color_code', '2e2e2e'),
            'next_color_code': milestone.get('next_color_code', '5b1b1b'),
            'next_level_title': milestone.get('next_level_title'),
            'next_level_emoji': milestone.get('next_level_emoji'),
            'days_to_next': int(milestone.get('days_to_next', 0)) if milestone.get('days_to_next') else None
        }
        
    except Exception as e:
        print(f"❌ Error fetching milestone: {str(e)}")
        return None


def generate_share_url_with_colors(user_data, milestone_data):
    """
    Generate social share URL with all required parameters including color codes
    
    Args:
        user_data (dict): User information (firstname, days, rank, gender)
        milestone_data (dict): Milestone information (level, colors)
        
    Returns:
        str: Complete share URL
    """
    base_url = "https://screentimejourney.com/pages/milestone-share"
    
    params = {
        'firstname': user_data['firstname'],
        'level': milestone_data['level'],
        'days': user_data['days'],
        'rank': user_data['rank'],
        'next_level': milestone_data['level'] + 1,
        'gender': user_data['gender'],
        'color_code': milestone_data['color_code'],
        'next_color_code': milestone_data['next_color_code']
    }
    
    # Build query string
    query_string = '&'.join([f"{key}={value}" for key, value in params.items()])
    
    return f"{base_url}?{query_string}"


def send_whatsapp_milestone_notification(user_data, milestone_data):
    """
    Example: Send WhatsApp notification with color-coded share link
    
    Args:
        user_data (dict): User information
        milestone_data (dict): Milestone data with colors
    """
    share_url = generate_share_url_with_colors(user_data, milestone_data)
    
    message = f"""
🎉 Congratulations {user_data['firstname']}!

You've reached Level {milestone_data['level']}: {milestone_data['title']} {milestone_data['emoji']}

{milestone_data['description']}

📊 Your Stats:
• {user_data['days']} days strong
• Top {user_data['rank']}% globally
• Next milestone: {milestone_data['next_level_title']} {milestone_data['next_level_emoji']}

🎬 View and share your personalized achievement video:
{share_url}

Keep going! 💪
"""
    
    print("📱 WhatsApp Message Preview:")
    print(message)
    print("\n" + "="*60 + "\n")
    
    # In actual implementation, send via WATI API
    # wati_response = send_wati_message(user_data['phone'], message)
    
    return message


def send_email_milestone_notification(user_data, milestone_data):
    """
    Example: Send Email notification with color-coded HTML template
    
    Args:
        user_data (dict): User information
        milestone_data (dict): Milestone data with colors
    """
    share_url = generate_share_url_with_colors(user_data, milestone_data)
    
    # HTML email template with color-coded button
    html_template = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 0; background: #f9f9f9;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        
        <!-- Header with gradient using milestone colors -->
        <div style="background: linear-gradient(135deg, #{milestone_data['color_code']} 0%, #{milestone_data['next_color_code']} 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; font-size: 2.5rem; margin: 0;">
                {milestone_data['emoji']}
            </h1>
            <h2 style="color: white; font-size: 1.5rem; margin: 10px 0 0 0; font-weight: 600;">
                Congratulations {user_data['firstname']}!
            </h2>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
            <div style="text-align: center; margin-bottom: 25px;">
                <h3 style="color: #0F172A; font-size: 1.25rem; margin: 0 0 10px 0;">
                    You've reached Level {milestone_data['level']}:
                </h3>
                <h2 style="color: #{milestone_data['color_code']}; font-size: 1.75rem; margin: 0; font-family: 'DM Serif Display', serif;">
                    {milestone_data['title']}
                </h2>
            </div>
            
            <p style="color: #5b6472; line-height: 1.6; text-align: center; font-size: 1.1rem;">
                {milestone_data['description']}
            </p>
            
            <!-- Stats Grid -->
            <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px; text-align: center; border-right: 1px solid #E5E5E5;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: #{milestone_data['color_code']};">
                                {user_data['days']}
                            </div>
                            <div style="font-size: 0.875rem; color: #5b6472; margin-top: 5px;">
                                Days Strong
                            </div>
                        </td>
                        <td style="padding: 10px; text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: #{milestone_data['color_code']};">
                                Top {user_data['rank']}%
                            </div>
                            <div style="font-size: 0.875rem; color: #5b6472; margin-top: 5px;">
                                Globally
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
            
            <!-- Next Milestone -->
            <div style="text-align: center; margin: 25px 0;">
                <p style="color: #5b6472; margin: 0 0 10px 0; font-size: 0.9rem;">
                    Next Milestone:
                </p>
                <p style="color: #{milestone_data['next_color_code']}; font-size: 1.25rem; font-weight: 600; margin: 0;">
                    {milestone_data['next_level_title']} {milestone_data['next_level_emoji']}
                </p>
            </div>
            
            <!-- CTA Button with current level color -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="{share_url}" 
                   style="display: inline-block; 
                          background: linear-gradient(135deg, #{milestone_data['color_code']} 0%, #{milestone_data['next_color_code']} 100%); 
                          color: white; 
                          padding: 15px 40px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: 600; 
                          font-size: 1.1rem;
                          box-shadow: 0 4px 12px rgba(46, 4, 86, 0.2);">
                    🎬 View & Share Your Achievement
                </a>
            </div>
            
            <p style="color: #5b6472; text-align: center; font-size: 0.9rem; margin: 20px 0 0 0;">
                Generate your personalized milestone video and share it with friends!
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #E5E5E5;">
            <p style="color: #5b6472; font-size: 0.875rem; margin: 0;">
                Keep going strong! 💪 Your journey inspires others.
            </p>
            <p style="color: #9CA3AF; font-size: 0.75rem; margin: 10px 0 0 0;">
                Screen Time Journey • Making every day count
            </p>
        </div>
        
    </div>
</body>
</html>
"""
    
    print("📧 Email HTML Preview:")
    print(html_template[:500] + "...\n")
    print(f"✅ Email includes color-coded elements using:")
    print(f"   • Current level color: #{milestone_data['color_code']}")
    print(f"   • Next level color: #{milestone_data['next_color_code']}")
    print(f"   • Share URL: {share_url}")
    print("\n" + "="*60 + "\n")
    
    # In actual implementation, send via SES or email service
    # ses_response = send_ses_email(user_data['email'], subject, html_template)
    
    return html_template


def example_usage():
    """Example of complete flow"""
    
    print("🎬 Milestone Notification with Color Codes - Example\n")
    print("="*60 + "\n")
    
    # Example user data
    user_data = {
        'firstname': 'Merijn',
        'email': 'merijn@example.com',
        'phone': '+31612345678',
        'gender': 'male',
        'days': 150,
        'rank': 6.2,
        'level': 5  # Reached Lone Wolf
    }
    
    print(f"👤 User: {user_data['firstname']}")
    print(f"📊 Reached Level: {user_data['level']}")
    print(f"🎯 Days: {user_data['days']}")
    print(f"🌍 Global Rank: Top {user_data['rank']}%")
    print("\n" + "="*60 + "\n")
    
    # Get milestone data with colors
    milestone_data = get_milestone_with_colors(user_data['level'], user_data['gender'])
    
    if not milestone_data:
        print("❌ Could not retrieve milestone data")
        return
    
    print(f"🎯 Milestone: {milestone_data['title']} {milestone_data['emoji']}")
    print(f"🎨 Color Code: #{milestone_data['color_code']}")
    print(f"🎨 Next Color: #{milestone_data['next_color_code']}")
    print("\n" + "="*60 + "\n")
    
    # Generate share URL
    share_url = generate_share_url_with_colors(user_data, milestone_data)
    print(f"🔗 Share URL:\n{share_url}")
    print("\n" + "="*60 + "\n")
    
    # Send WhatsApp notification
    whatsapp_message = send_whatsapp_milestone_notification(user_data, milestone_data)
    
    # Send Email notification
    email_html = send_email_milestone_notification(user_data, milestone_data)
    
    print("✅ Notifications sent with color codes!")
    print("\n" + "="*60)
    print("\n💡 Key Points:")
    print("   • Color codes are fetched from stj_system table")
    print("   • Both current and next level colors are included")
    print("   • Share URL contains all necessary parameters")
    print("   • Email template uses gradient with milestone colors")
    print("   • WhatsApp message includes the share link")


if __name__ == "__main__":
    example_usage()










