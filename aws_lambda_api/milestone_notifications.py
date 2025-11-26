"""
Consolidated Milestone Notification Handler for Screen Time Journey
Python 3.13 | Timezone-aware based on Shopify country code

Handles both:
1. Scheduled notifications (runs hourly, sends at 10 AM user local time)
2. On-demand notifications (API triggered for specific customer)

Key features:
- Day 0 notification (registration day at 10 AM local time)
- Then every 7 days at 10 AM local time
- Respects whatsapp_notifications preference
- Batch sending for efficiency
- Timezone from Shopify country code (primary)
"""

import boto3
import os
import json
import requests
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from urllib.parse import urlencode
from collections import defaultdict
import pytz


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


def get_timezone_from_country(country_code: str) -> Optional[str]:
    """
    Map ISO country code to primary timezone
    Based on Shopify subscription country field
    """
    if not country_code:
        return None
    
    country_timezones = {
        # Europe
        'NL': 'Europe/Amsterdam', 'BE': 'Europe/Brussels', 'FR': 'Europe/Paris',
        'DE': 'Europe/Berlin', 'ES': 'Europe/Madrid', 'IT': 'Europe/Rome',
        'GB': 'Europe/London', 'UK': 'Europe/London', 'SE': 'Europe/Stockholm',
        'NO': 'Europe/Oslo', 'DK': 'Europe/Copenhagen', 'FI': 'Europe/Helsinki',
        'PL': 'Europe/Warsaw', 'AT': 'Europe/Vienna', 'CH': 'Europe/Zurich',
        'PT': 'Europe/Lisbon', 'GR': 'Europe/Athens', 'CZ': 'Europe/Prague',
        'RO': 'Europe/Bucharest', 'HU': 'Europe/Budapest', 'IE': 'Europe/Dublin',
        'BG': 'Europe/Sofia', 'HR': 'Europe/Zagreb', 'SK': 'Europe/Bratislava',
        'SI': 'Europe/Ljubljana', 'LT': 'Europe/Vilnius', 'LV': 'Europe/Riga',
        'EE': 'Europe/Tallinn', 'LU': 'Europe/Luxembourg', 'MT': 'Europe/Malta',
        'CY': 'Asia/Nicosia', 'IS': 'Atlantic/Reykjavik',
        
        # Americas
        'US': 'America/New_York', 'CA': 'America/Toronto', 'MX': 'America/Mexico_City',
        'BR': 'America/Sao_Paulo', 'AR': 'America/Argentina/Buenos_Aires',
        'CL': 'America/Santiago', 'CO': 'America/Bogota', 'PE': 'America/Lima',
        'VE': 'America/Caracas', 'EC': 'America/Guayaquil', 'UY': 'America/Montevideo',
        'PY': 'America/Asuncion', 'BO': 'America/La_Paz', 'CR': 'America/Costa_Rica',
        'PA': 'America/Panama', 'GT': 'America/Guatemala', 'DO': 'America/Santo_Domingo',
        'CU': 'America/Havana', 'JM': 'America/Jamaica', 'TT': 'America/Port_of_Spain',
        
        # Asia
        'JP': 'Asia/Tokyo', 'CN': 'Asia/Shanghai', 'IN': 'Asia/Kolkata',
        'SG': 'Asia/Singapore', 'HK': 'Asia/Hong_Kong', 'TH': 'Asia/Bangkok',
        'PH': 'Asia/Manila', 'ID': 'Asia/Jakarta', 'MY': 'Asia/Kuala_Lumpur',
        'VN': 'Asia/Ho_Chi_Minh', 'KR': 'Asia/Seoul', 'TW': 'Asia/Taipei',
        'BD': 'Asia/Dhaka', 'PK': 'Asia/Karachi', 'LK': 'Asia/Colombo',
        'MM': 'Asia/Yangon', 'KH': 'Asia/Phnom_Penh', 'LA': 'Asia/Vientiane',
        'NP': 'Asia/Kathmandu', 'BT': 'Asia/Thimphu', 'MV': 'Indian/Maldives',
        
        # Oceania
        'AU': 'Australia/Sydney', 'NZ': 'Pacific/Auckland', 'FJ': 'Pacific/Fiji',
        'PG': 'Pacific/Port_Moresby', 'NC': 'Pacific/Noumea', 'SB': 'Pacific/Guadalcanal',
        
        # Middle East
        'AE': 'Asia/Dubai', 'SA': 'Asia/Riyadh', 'IL': 'Asia/Jerusalem',
        'TR': 'Europe/Istanbul', 'IQ': 'Asia/Baghdad', 'IR': 'Asia/Tehran',
        'KW': 'Asia/Kuwait', 'QA': 'Asia/Qatar', 'BH': 'Asia/Bahrain',
        'OM': 'Asia/Muscat', 'JO': 'Asia/Amman', 'LB': 'Asia/Beirut',
        'SY': 'Asia/Damascus', 'YE': 'Asia/Aden',
        
        # Africa
        'ZA': 'Africa/Johannesburg', 'EG': 'Africa/Cairo', 'NG': 'Africa/Lagos',
        'KE': 'Africa/Nairobi', 'GH': 'Africa/Accra', 'TZ': 'Africa/Dar_es_Salaam',
        'UG': 'Africa/Kampala', 'ET': 'Africa/Addis_Ababa', 'MA': 'Africa/Casablanca',
        'DZ': 'Africa/Algiers', 'TN': 'Africa/Tunis', 'LY': 'Africa/Tripoli',
        'SD': 'Africa/Khartoum', 'AO': 'Africa/Luanda', 'MZ': 'Africa/Maputo',
        'ZW': 'Africa/Harare', 'ZM': 'Africa/Lusaka', 'BW': 'Africa/Gaborone',
        'NA': 'Africa/Windhoek', 'SN': 'Africa/Dakar', 'CI': 'Africa/Abidjan',
    }
    
    return country_timezones.get(country_code.upper())


def get_timezone_from_phone(phone: str) -> str:
    """Get timezone based on phone country code (FALLBACK ONLY)"""
    phone_clean = phone.replace('+', '').replace(' ', '').replace('-', '')
    
    timezone_map = {
        '31': 'Europe/Amsterdam', '32': 'Europe/Brussels', '33': 'Europe/Paris',
        '34': 'Europe/Madrid', '39': 'Europe/Rome', '44': 'Europe/London',
        '49': 'Europe/Berlin', '46': 'Europe/Stockholm', '47': 'Europe/Oslo',
        '45': 'Europe/Copenhagen', '358': 'Europe/Helsinki', '48': 'Europe/Warsaw',
        '43': 'Europe/Vienna', '41': 'Europe/Zurich', '351': 'Europe/Lisbon',
        '30': 'Europe/Athens', '353': 'Europe/Dublin', '1': 'America/New_York',
        '52': 'America/Mexico_City', '55': 'America/Sao_Paulo',
        '54': 'America/Argentina/Buenos_Aires', '56': 'America/Santiago',
        '57': 'America/Bogota', '51': 'America/Lima', '61': 'Australia/Sydney',
        '64': 'Pacific/Auckland', '81': 'Asia/Tokyo', '86': 'Asia/Shanghai',
        '91': 'Asia/Kolkata', '65': 'Asia/Singapore', '852': 'Asia/Hong_Kong',
        '66': 'Asia/Bangkok', '63': 'Asia/Manila', '62': 'Asia/Jakarta',
        '60': 'Asia/Kuala_Lumpur', '84': 'Asia/Ho_Chi_Minh', '82': 'Asia/Seoul',
        '971': 'Asia/Dubai', '966': 'Asia/Riyadh', '972': 'Asia/Jerusalem',
        '90': 'Europe/Istanbul', '27': 'Africa/Johannesburg', '20': 'Africa/Cairo',
        '234': 'Africa/Lagos', '254': 'Africa/Nairobi',
    }
    
    for length in [3, 2, 1]:
        code = phone_clean[:length]
        if code in timezone_map:
            return timezone_map[code]
    
    return 'UTC'


def get_user_timezone(subscriber: Dict[str, Any]) -> str:
    """
    Get user's timezone with priority order:
    1. Explicit timezone field (if user set it manually)
    2. Country code from Shopify subscription (PRIMARY SOURCE)
    3. Phone number inference (fallback)
    4. UTC (ultimate fallback)
    """
    # Priority 1: Explicit timezone field
    explicit_tz = subscriber.get('timezone', '')
    if explicit_tz:
        try:
            pytz.timezone(explicit_tz)
            return explicit_tz
        except:
            pass
    
    # Priority 2: Country code from Shopify (PRIMARY)
    country_code = subscriber.get('country', '')
    if country_code:
        country_tz = get_timezone_from_country(country_code)
        if country_tz:
            return country_tz
    
    # Priority 3: Phone number inference (FALLBACK)
    phone = subscriber.get('phone', '')
    if phone:
        phone_tz = get_timezone_from_phone(phone)
        if phone_tz != 'UTC':
            return phone_tz
    
    return 'UTC'


def get_device_registration_date(devices: List[Dict]) -> Optional[datetime]:
    """
    Get the FIRST device registration date (earliest device)
    Returns None if no devices or can't parse date
    """
    if not devices:
        return None
    
    earliest_date = None
    
    for device in devices:
        # Handle DynamoDB Map structure
        device_data = device.get('M', device) if 'M' in device else device
        
        # Try multiple date fields in order of preference
        date_str = (
            device_data.get('addedDate', {}).get('S') if isinstance(device_data.get('addedDate'), dict)
            else device_data.get('addedDate', 
            device_data.get('created_at', {}).get('S') if isinstance(device_data.get('created_at'), dict)
            else device_data.get('created_at',
            device_data.get('added_at', {}).get('S') if isinstance(device_data.get('added_at'), dict)
            else device_data.get('added_at')))
        )
        
        if date_str:
            try:
                device_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                if earliest_date is None or device_date < earliest_date:
                    earliest_date = device_date
            except:
                continue
    
    return earliest_date


def get_milestone_for_days(milestones: List[Dict], days: int, gender: str) -> Optional[Dict]:
    """Find the milestone that corresponds to the given number of days"""
    gender_milestones = [m for m in milestones if m.get('gene', m.get('gender', '')).lower() == gender.lower()]
    sorted_milestones = sorted(gender_milestones, key=lambda m: int(m.get('milestone_day', m.get('days_required', 0))))
    
    current = None
    for milestone in sorted_milestones:
        required_days = int(milestone.get('milestone_day', milestone.get('days_required', 0)))
        if days >= required_days:
            current = milestone
        else:
            break
    
    return current


def get_next_milestone(milestones: List[Dict], days: int, gender: str) -> Optional[Dict]:
    """Find the next milestone after the current days"""
    gender_milestones = [m for m in milestones if m.get('gene', m.get('gender', '')).lower() == gender.lower()]
    sorted_milestones = sorted(gender_milestones, key=lambda m: int(m.get('milestone_day', m.get('days_required', 0))))
    
    for milestone in sorted_milestones:
        required_days = int(milestone.get('milestone_day', milestone.get('days_required', 0)))
        if required_days > days:
            return milestone
    
    return None


def should_send_scheduled_notification(device_registration_date: datetime, current_time: datetime) -> Tuple[bool, int]:
    """
    Check if we should send scheduled notification
    
    Schedule:
    - Day 0: Ground Zero (registration day at first 10:00 AM)
    - Then every 7 days: day 7, 14, 21, 28, 35, 42, etc.
    
    Returns: (should_send, days_since_registration)
    """
    try:
        days_since = (current_time.date() - device_registration_date.date()).days
        
        # Day 0 (Ground Zero - registration day)
        if days_since == 0:
            return True, days_since
        # Every 7 days after day 0
        elif days_since > 0 and days_since % 7 == 0:
            return True, days_since
        
        return False, days_since
        
    except Exception as e:
        print(f"❌ Error calculating days: {e}")
        return False, 0


def calculate_percentile(all_subscribers: List[Dict], days_in_focus: int, utc_now: datetime) -> float:
    """Calculate user's percentile ranking"""
    all_days = []
    
    for sub in all_subscribers:
        devices = sub.get('devices', [])
        reg_date = get_device_registration_date(devices)
        
        if reg_date:
            days = (utc_now.date() - reg_date.date()).days
            all_days.append(days)
        else:
            all_days.append(0)
    
    if not all_days:
        return 50.0
    
    users_with_fewer_days = sum(1 for d in all_days if d < days_in_focus)
    percentile = round((1 - (users_with_fewer_days / len(all_days))) * 100, 1)
    return max(1.0, min(100.0, percentile))


def send_whatsapp_batch(
    template_name: str,
    receivers: List[Dict[str, Any]],
    broadcast_name: str = "Milestone Notification Batch"
) -> Dict[str, Any]:
    """
    Send WhatsApp notifications in batch to multiple users
    More efficient than individual API calls
    
    Args:
        template_name: WATI template name (e.g., 'm0', 'm1', 'f0')
        receivers: List of receiver objects with phone and customParams
        broadcast_name: Name for the broadcast
    
    Returns:
        Result dict with success status
    """
    wati_token = os.environ.get('WATI_API_TOKEN')
    wati_endpoint = os.environ.get('WATI_ENDPOINT', 'https://live-mt-server.wati.io/443368')
    
    if not wati_token:
        return {'success': False, 'error': 'WATI_API_TOKEN not configured'}
    
    if not receivers:
        return {'success': False, 'error': 'No receivers'}
    
    # Prepare WATI batch payload
    wati_payload = {
        "template_name": template_name,
        "broadcast_name": broadcast_name,
        "receivers": receivers
    }
    
    # Send via WATI API
    headers = {
        'Authorization': f'Bearer {wati_token}',
        'Content-Type': 'application/json'
    }
    
    wati_url = f"{wati_endpoint}/api/v1/sendTemplateMessages"
    
    try:
        response = requests.post(wati_url, headers=headers, json=wati_payload, timeout=15)
        result = response.json()
        
        if result.get('result'):
            return {
                'success': True,
                'receivers_count': len(receivers),
                'template': template_name,
                'wati_response': result
            }
        else:
            return {
                'success': False,
                'error': 'WATI returned false result',
                'wati_response': result
            }
            
    except requests.exceptions.RequestException as e:
        return {
            'success': False,
            'error': f'WATI API error: {str(e)}'
        }


def send_milestone_email(
    to_email: str,
    first_name: str,
    current_level: str,
    current_emoji: str,
    focus_days: int,
    percentage: int,
    next_level: str,
    next_emoji: str,
    next_lvl_days: int,
    king_queen: str,
    king_queen_days: int,
    social_query: str,
    media_url: str = ""
) -> Dict[str, Any]:
    """
    Send milestone achievement email via AWS SES
    
    Args:
        to_email: Recipient email address
        first_name: User's first name
        current_level: Current milestone title
        current_emoji: Current milestone emoji
        focus_days: Days in focus
        percentage: Percentile ranking
        next_level: Next milestone title
        next_emoji: Next milestone emoji
        next_lvl_days: Days to next milestone
        king_queen: King/Queen title
        king_queen_days: Days to King/Queen
        social_query: URL query string for social share
        media_url: URL to milestone image
    
    Returns:
        Result dict with success status
    """
    
    # Load HTML Email Template from file
    try:
        template_path = os.path.join(os.path.dirname(__file__), 'email_template.html')
        with open(template_path, 'r') as f:
            html_template = f.read()
    except Exception as e:
        print(f"⚠️ Could not load email_template.html: {e}")
        # Fallback to simple inline template
        html_template = """<!DOCTYPE html>
<html><body style="font-family: Arial, sans-serif; padding: 20px;">
<h1>🎉 Milestone Achieved!</h1>
<p>Hi {first_name},</p>
<p>You've reached <strong>{current_level}</strong> {current_emoji}!</p>
<p>You're in the top {percentage}% of the world!</p>
<a href="https://app.screentimejourney.com/" style="display: inline-block; padding: 12px 24px; background-color: #2E0456; color: white; text-decoration: none; border-radius: 8px;">View Dashboard</a>
</body></html>"""
    
    
    # Replace placeholders (including to_email for unsubscribe link)
    html_body = html_template.replace('{{first_name}}', first_name) \
        .replace('{{current_level}}', current_level) \
        .replace('{{current_emoji}}', current_emoji) \
        .replace('{{focus_days}}', str(focus_days)) \
        .replace('{{percentage}}', str(percentage)) \
        .replace('{{next_level}}', next_level) \
        .replace('{{next_emoji}}', next_emoji) \
        .replace('{{next_lvl_days}}', str(next_lvl_days)) \
        .replace('{{king_queen}}', king_queen) \
        .replace('{{king_queen_days}}', str(king_queen_days)) \
        .replace('{{social_query}}', social_query) \
        .replace('{{media_url}}', media_url) \
        .replace('{{to_email}}', to_email)
    
    # Plain text version
    text_body = f"""
🎉 Milestone Achieved, {first_name}!

You've reached: {current_level} {current_emoji}
Days of Focus: {focus_days}
You're in the top {percentage}% of all warriors!

🎯 Next Milestone: {next_level} {next_emoji} in {next_lvl_days} days
👑 {king_queen} Status: {king_queen_days} days to go

View your progress: https://app.screentimejourney.com/milestones
Share your achievement: https://app.screentimejourney.com/{social_query}

Every day of focus is a victory. Keep going! 💪

- Screen Time Journey Team
"""
    
    # Create dynamic subject line (with comma, not em-dash)
    subject = f"{focus_days} Days in Focus, {current_level} {current_emoji} → {next_level} {next_emoji}"
    
    try:
        ses_client = boto3.client('ses', region_name='eu-north-1')
        
        response = ses_client.send_email(
            Source='SCREENTIMEJOURNEY <info@screentimejourney.com>',
            Destination={'ToAddresses': [to_email]},
            Message={
                'Subject': {
                    'Data': subject,
                    'Charset': 'UTF-8'
                },
                'Body': {
                    'Text': {
                        'Data': text_body,
                        'Charset': 'UTF-8'
                    },
                    'Html': {
                        'Data': html_body,
                        'Charset': 'UTF-8'
                    }
                }
            },
            # Add List-Unsubscribe headers for better email client support
            Tags=[
                {'Name': 'campaign', 'Value': 'milestone_notification'}
            ]
        )
        
        return {
            'success': True,
            'message_id': response['MessageId'],
            'recipient': to_email
        }
        
    except Exception as e:
        print(f"❌ SES email error: {e}")
        return {
            'success': False,
            'error': str(e),
            'recipient': to_email
        }


def handle_scheduled_notifications(dynamodb: Any, system_table: Any, subscribers_table: Any) -> Dict[str, Any]:
    """
    Handle scheduled notifications (runs every hour)
    
    Improvements:
    - Respects whatsapp_notifications preference
    - Uses correct device date field (addedDate)
    - Sends on day 0 (registration day) at 10 AM
    - Then every 7 days at 10 AM
    - Batch sending for efficiency
    - Skips users with no devices
    """
    
    print("🕐 Starting scheduled milestone notifications...")
    utc_now = datetime.now(pytz.UTC)
    print(f"⏰ Current UTC time: {utc_now.isoformat()}")
    
    # Get milestones
    milestones_response = system_table.get_item(Key={'config_key': 'milestones'})
    if 'Item' not in milestones_response:
        return json_resp({'error': 'Milestones not found'}, 500)
    
    milestones_data = milestones_response['Item'].get('data', [])
    print(f"✅ Loaded {len(milestones_data)} milestones")
    
    # Get all subscribers
    response = subscribers_table.scan()
    all_subscribers = response.get('Items', [])
    while 'LastEvaluatedKey' in response:
        response = subscribers_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        all_subscribers.extend(response.get('Items', []))
    
    print(f"✅ Found {len(all_subscribers)} subscribers")
    
    # Counters
    notifications_sent = 0
    notifications_skipped = 0
    errors = 0
    whatsapp_disabled_count = 0
    
    # Group users by template for batch sending
    batch_by_template = defaultdict(list)
    
    # Process each subscriber
    for subscriber in all_subscribers:
        try:
            customer_id = subscriber.get('customer_id', '')
            email = subscriber.get('email', '')
            username = subscriber.get('username', '')
            phone = subscriber.get('phone', '')
            gender = subscriber.get('gender', 'male').lower()
            devices = subscriber.get('devices', [])
            
            # CHECK 1: WhatsApp notifications enabled?
            whatsapp_enabled = subscriber.get('whatsapp_notifications', True)
            if whatsapp_enabled == False or whatsapp_enabled == 'false':
                whatsapp_disabled_count += 1
                notifications_skipped += 1
                continue
            
            # CHECK 2: Skip if no phone or no devices
            if not phone or not devices:
                notifications_skipped += 1
                continue
            
            # CHECK 3: Get FIRST device registration date
            device_reg_date = get_device_registration_date(devices)
            
            if not device_reg_date:
                notifications_skipped += 1
                continue
            
            # CHECK 4: Get user's timezone (PRIORITY: Shopify country code)
            user_timezone = get_user_timezone(subscriber)
            user_tz = pytz.timezone(user_timezone)
            user_local_time = utc_now.astimezone(user_tz)
            
            # CHECK 5: Is it 10:00 AM in user's timezone?
            if user_local_time.hour != 10:
                notifications_skipped += 1
                continue
            
            # CHECK 6: Should we send notification today?
            should_send, days_since = should_send_scheduled_notification(device_reg_date, utc_now)
            
            if not should_send:
                notifications_skipped += 1
                continue
            
            print(f"\n📤 Queuing notification for {username or email} (Day {days_since}, TZ: {user_timezone})")
            
            # Get milestones
            current_milestone = get_milestone_for_days(milestones_data, days_since, gender)
            next_milestone = get_next_milestone(milestones_data, days_since, gender)
            
            if not current_milestone:
                print(f"⚠️ No milestone for day {days_since}")
                notifications_skipped += 1
                continue
            
            template_name = current_milestone.get('level_template', '')
            if not template_name:
                print(f"⚠️ No template for milestone")
                notifications_skipped += 1
                continue
            
            # Get milestone details
            current_level = current_milestone.get('title', 'Unknown')
            current_emoji = current_milestone.get('emoji', '🏆')
            
            if next_milestone:
                next_level = next_milestone.get('title', 'Unknown')
                next_emoji = next_milestone.get('emoji', '🎯')
                next_milestone_days = int(next_milestone.get('milestone_day', 0))
                days_to_next = max(0, next_milestone_days - days_since)
            else:
                next_level = current_level
                next_emoji = current_emoji
                days_to_next = 0
            
            # Calculate percentile
            percentile = calculate_percentile(all_subscribers, days_since, utc_now)
            
            # Days to King/Queen
            gender_milestones = [m for m in milestones_data if m.get('gene', '').lower() == gender]
            if gender_milestones:
                king_queen_milestone = max(gender_milestones, key=lambda m: int(m.get('milestone_day', 0)))
                king_queen_days = int(king_queen_milestone.get('milestone_day', 90))
                days_to_king_queen = max(0, king_queen_days - days_since)
            else:
                days_to_king_queen = 90 - days_since
            
            king_queen_title = "King" if gender == "male" else "Queen"
            # Extract first name from email (capitalize first letter)
            if email:
                email_name = email.split('@')[0]
                # Capitalize first letter
                first_name = email_name.capitalize() if email_name else 'User'
            else:
                first_name = 'User'
            
            # Clean phone number
            phone_clean = phone.replace('+', '').replace(' ', '').replace('-', '')
            if phone_clean.startswith('00'):
                phone_clean = phone_clean[2:]
            
            # Generate social share query string with customer_id (secure)
            social_query = f"customer_id={customer_id}"
            
            # Add to batch queue
            receiver_data = {
                "whatsappNumber": phone_clean,
                "customParams": [
                    {"name": "first_name", "value": first_name},
                    {"name": "percentage", "value": str(int(percentile))},
                    {"name": "currnet_lvl", "value": f"{current_level} {current_emoji}"},
                    {"name": "focus_days", "value": str(days_since)},
                    {"name": "next_lvl", "value": f"{next_level} {next_emoji}"},
                    {"name": "next_lvl_days", "value": str(days_to_next)},
                    {"name": "king_queen", "value": king_queen_title},
                    {"name": "king_queen_days", "value": str(days_to_king_queen)},
                    {"name": "query", "value": social_query}
                ]
            }
            
            batch_by_template[template_name].append(receiver_data)
            
            # ✨ ALSO SEND EMAIL (if email_enabled is true)
            email_enabled = subscriber.get('email_enabled', True)
            if email and email_enabled:
                try:
                    email_result = send_milestone_email(
                        to_email=email,
                        first_name=first_name,
                        current_level=current_level,
                        current_emoji=current_emoji,
                        focus_days=days_since,
                        percentage=int(percentile),
                        next_level=next_level,
                        next_emoji=next_emoji,
                        next_lvl_days=days_to_next,
                        king_queen=king_queen_title,
                        king_queen_days=days_to_king_queen,
                        social_query=social_query,
                        media_url=current_milestone.get('media_url', '')
                    )
                    if email_result['success']:
                        print(f"   📧 Email sent to {email}")
                    else:
                        print(f"   ⚠️ Email failed for {email}: {email_result.get('error')}")
                except Exception as e:
                    print(f"   ⚠️ Email exception for {email}: {e}")
            
        except Exception as e:
            print(f"❌ Error processing {subscriber.get('email', 'unknown')}: {e}")
            errors += 1
            continue
    
    # Send batched WhatsApp notifications
    print(f"\n📤 Sending {len(batch_by_template)} batched WhatsApp notification(s)...")
    
    for template_name, receivers in batch_by_template.items():
        try:
            print(f"   Sending {len(receivers)} notification(s) with template '{template_name}'")
            
            result = send_whatsapp_batch(
                template_name=template_name,
                receivers=receivers,
                broadcast_name=f"Milestone Day - {template_name}"
            )
            
            if result['success']:
                notifications_sent += len(receivers)
                print(f"   ✅ Sent {len(receivers)} notification(s)")
            else:
                errors += len(receivers)
                print(f"   ❌ Failed: {result.get('error')}")
                
        except Exception as e:
            print(f"   ❌ Batch send error: {e}")
            errors += len(receivers)
    
    # Summary
    summary = {
        'success': True,
        'mode': 'scheduled',
        'timestamp': utc_now.isoformat(),
        'total_subscribers': len(all_subscribers),
        'notifications_sent': notifications_sent,
        'notifications_skipped': notifications_skipped,
        'whatsapp_disabled': whatsapp_disabled_count,
        'errors': errors,
        'batch_count': len(batch_by_template)
    }
    
    print("\n" + "=" * 70)
    print("✅ SCHEDULED RUN COMPLETE")
    print("=" * 70)
    print(f"Total subscribers: {len(all_subscribers)}")
    print(f"Notifications sent: {notifications_sent}")
    print(f"Notifications skipped: {notifications_skipped}")
    print(f"WhatsApp disabled: {whatsapp_disabled_count}")
    print(f"Errors: {errors}")
    print(f"Batch API calls: {len(batch_by_template)}")
    print("=" * 70)
    
    return json_resp(summary)


def lambda_handler(event, context):
    """
    Main Lambda handler - routes to scheduled or on-demand handler
    
    Modes:
    1. Scheduled: Runs hourly, sends milestone notifications
    2. Test Email: Sends a single test email (for testing layout)
    
    Features:
    - Respects whatsapp_notifications and email_enabled preferences
    - Day 0 notification (registration day at 10 AM)
    - Batch sending for efficiency
    - Proper device date handling
    """
    try:
        # Initialize DynamoDB (needed for both modes)
        dynamodb = boto3.resource('dynamodb', region_name='eu-north-1')
        subscribers_table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
        system_table = dynamodb.Table(os.environ.get('SYSTEM_TABLE', 'stj_system'))
        
        # REAL TEST MODE: Fetch real user data and send email with calculated milestones
        if event.get('real_test_email'):
            test_email = event.get('email', 'merijn@risottini.com')
            print(f"📧 REAL TEST EMAIL MODE for: {test_email}")
            
            # Fetch subscriber from DynamoDB
            response = subscribers_table.scan(
                FilterExpression='email = :email',
                ExpressionAttributeValues={':email': test_email}
            )
            
            if not response.get('Items'):
                return json_resp({
                    'success': False,
                    'error': f'Subscriber {test_email} not found in DynamoDB'
                }, 404)
            
            subscriber = response['Items'][0]
            print(f"✅ Found subscriber: {subscriber.get('username', 'N/A')}")
            
            # Get all subscribers for percentile calculation
            all_response = subscribers_table.scan()
            all_subscribers = all_response.get('Items', [])
            
            # Get milestones
            milestones_response = system_table.get_item(Key={'config_key': 'milestones'})
            if 'Item' not in milestones_response:
                return json_resp({'error': 'Milestones not found'}, 500)
            
            milestones_data = milestones_response['Item'].get('data', [])
            
            # Extract user data
            email = subscriber.get('email')
            username = subscriber.get('username', '')
            gender = subscriber.get('gender', 'male').lower()
            devices = subscriber.get('devices', [])
            
            if not devices:
                return json_resp({'error': 'No devices found for user'}, 400)
            
            # Get device registration date
            device_reg_date = get_device_registration_date(devices)
            if not device_reg_date:
                return json_resp({'error': 'Could not determine device registration date'}, 400)
            
            # Calculate days since registration
            utc_now = datetime.now(pytz.UTC)
            days_since = (utc_now.date() - device_reg_date.date()).days
            print(f"📅 Days since registration: {days_since}")
            
            # Get milestones
            current_milestone = get_milestone_for_days(milestones_data, days_since, gender)
            next_milestone = get_next_milestone(milestones_data, days_since, gender)
            
            if not current_milestone:
                return json_resp({'error': f'No milestone found for day {days_since}'}, 400)
            
            # Get milestone details
            current_level = current_milestone.get('title', 'Unknown')
            current_emoji = current_milestone.get('emoji', '🏆')
            
            if next_milestone:
                next_level = next_milestone.get('title', 'Unknown')
                next_emoji = next_milestone.get('emoji', '🎯')
                next_milestone_days = int(next_milestone.get('milestone_day', 0))
                days_to_next = max(0, next_milestone_days - days_since)
            else:
                next_level = current_level
                next_emoji = current_emoji
                days_to_next = 0
            
            # Calculate percentile
            percentile = calculate_percentile(all_subscribers, days_since, utc_now)
            
            # Days to King/Queen
            gender_milestones = [m for m in milestones_data if m.get('gene', '').lower() == gender]
            if gender_milestones:
                king_queen_milestone = max(gender_milestones, key=lambda m: int(m.get('milestone_day', 0)))
                king_queen_days = int(king_queen_milestone.get('milestone_day', 90))
                days_to_king_queen = max(0, king_queen_days - days_since)
            else:
                days_to_king_queen = 90 - days_since
            
            king_queen_title = "King" if gender == "male" else "Queen"
            # Extract first name from email (capitalize first letter)
            if email:
                email_name = email.split('@')[0]
                # Capitalize first letter
                first_name = email_name.capitalize() if email_name else 'User'
            else:
                first_name = 'User'
            
            # Generate social share query string with customer_id (secure)
            social_query = f"customer_id={customer_id}"
            
            print(f"📊 Milestone Data:")
            print(f"   Current: {current_level} {current_emoji}")
            print(f"   Days: {days_since}")
            print(f"   Percentile: {percentile}%")
            print(f"   Next: {next_level} {next_emoji} in {days_to_next} days")
            
            # Send email with real data
            result = send_milestone_email(
                to_email=email,
                first_name=first_name,
                current_level=current_level,
                current_emoji=current_emoji,
                focus_days=days_since,
                percentage=int(percentile),
                next_level=next_level,
                next_emoji=next_emoji,
                next_lvl_days=days_to_next,
                king_queen=king_queen_title,
                king_queen_days=days_to_king_queen,
                social_query=social_query,
                media_url=current_milestone.get('media_url', '')
            )
            
            if result['success']:
                print(f"✅ Real test email sent to {result['recipient']}")
                print(f"   Message ID: {result['message_id']}")
                return json_resp({
                    'success': True,
                    'mode': 'real_test_email',
                    'message_id': result['message_id'],
                    'recipient': result['recipient'],
                    'milestone_data': {
                        'current_level': current_level,
                        'days': days_since,
                        'percentile': percentile
                    }
                })
            else:
                print(f"❌ Real test email failed: {result['error']}")
                return json_resp({
                    'success': False,
                    'mode': 'real_test_email',
                    'error': result['error']
                }, 500)
        
        # SIMPLE TEST EMAIL MODE: Send with hardcoded data
        if event.get('test_email'):
            print("📧 SIMPLE TEST EMAIL MODE")
            result = send_milestone_email(
                to_email=event.get('to_email'),
                first_name=event.get('first_name', 'User'),
                current_level=event.get('current_level', 'Ground Zero'),
                current_emoji=event.get('current_emoji', '🏁'),
                focus_days=event.get('focus_days', 0),
                percentage=event.get('percentage', 50),
                next_level=event.get('next_level', 'Warrior'),
                next_emoji=event.get('next_emoji', '⚔️'),
                next_lvl_days=event.get('next_lvl_days', 7),
                king_queen=event.get('king_queen', 'King'),
                king_queen_days=event.get('king_queen_days', 90),
                social_query=event.get('social_query', 'pages/social-share'),
                media_url=event.get('media_url', 'https://wati-files.s3.eu-north-1.amazonaws.com/Milestones/male_level_0_groundzero.jpg')
            )
            
            if result['success']:
                print(f"✅ Test email sent to {result['recipient']}")
                print(f"   Message ID: {result['message_id']}")
                return json_resp({
                    'success': True,
                    'mode': 'test_email',
                    'message_id': result['message_id'],
                    'recipient': result['recipient']
                })
            else:
                print(f"❌ Test email failed: {result['error']}")
                return json_resp({
                    'success': False,
                    'mode': 'test_email',
                    'error': result['error']
                }, 500)
        
        # SCHEDULED MODE: Normal milestone notifications
        return handle_scheduled_notifications(dynamodb, system_table, subscribers_table)
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        return json_resp({'error': str(e), 'traceback': traceback.format_exc()}, 500)
