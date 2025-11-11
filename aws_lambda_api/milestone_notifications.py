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
            first_name = username or email.split('@')[0] if email else 'User'
            
            # Clean phone number
            phone_clean = phone.replace('+', '').replace(' ', '').replace('-', '')
            if phone_clean.startswith('00'):
                phone_clean = phone_clean[2:]
            
            # Generate social share query string
            social_params = {
                'first_name': first_name,
                'percentage': str(int(percentile)),
                'current_level': f"{current_level} {current_emoji}",
                'focus_days': str(days_since),
                'next_level': f"{next_level} {next_emoji}",
                'next_level_days': str(days_to_next),
                'king_queen': king_queen_title,
                'king_queen_days': str(days_to_king_queen)
            }
            query_string = urlencode(social_params)
            social_query = f"pages/social-share?{query_string}"
            
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
            
        except Exception as e:
            print(f"❌ Error processing {subscriber.get('email', 'unknown')}: {e}")
            errors += 1
            continue
    
    # Send batched notifications
    print(f"\n📤 Sending {len(batch_by_template)} batched notification(s)...")
    
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
    
    For now, only scheduled mode is implemented with all improvements:
    - Respects whatsapp_notifications preference
    - Day 0 notification (registration day at 10 AM)
    - Batch sending for efficiency
    - Proper device date handling
    """
    try:
        # Initialize DynamoDB
        dynamodb = boto3.resource('dynamodb', region_name='eu-north-1')
        subscribers_table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
        system_table = dynamodb.Table(os.environ.get('SYSTEM_TABLE', 'stj_system'))
        
        # For now, always run scheduled mode
        return handle_scheduled_notifications(dynamodb, system_table, subscribers_table)
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        return json_resp({'error': str(e), 'traceback': traceback.format_exc()}, 500)
