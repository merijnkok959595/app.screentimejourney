import boto3
import os
from datetime import datetime
from typing import Dict, Any

def json_resp(data: Dict[str, Any], status_code: int = 200) -> Dict[str, Any]:
    """Helper to format JSON response"""
    import json
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

def calculate_percentile(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate user's percentile ranking based on days in focus compared to all subscribers"""
    try:
        customer_id = payload.get('customer_id')
        
        if not customer_id:
            return json_resp({'error': 'Customer ID is required'}, 400)
        
        print(f"📊 Calculating percentile for customer: {customer_id}")
        
        # Initialize DynamoDB
        dynamodb = boto3.resource('dynamodb', region_name='eu-north-1')
        subscribers_table = dynamodb.Table(os.environ.get('SUBSCRIBERS_TABLE', 'stj_subscribers'))
        
        # Get all subscribers and their devices
        try:
            # Scan all subscribers
            response = subscribers_table.scan()
            all_subscribers = response.get('Items', [])
            
            # Continue scanning if there are more items
            while 'LastEvaluatedKey' in response:
                response = subscribers_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
                all_subscribers.extend(response.get('Items', []))
            
            print(f"📊 Total subscribers found: {len(all_subscribers)}")
            
            # Calculate days in focus for each subscriber based on their latest device
            subscriber_days = []
            customer_days = 0
            
            for subscriber in all_subscribers:
                sub_id = subscriber.get('customer_id', '')
                devices = subscriber.get('devices', [])
                
                if not devices:
                    subscriber_days.append(0)
                    if sub_id == customer_id:
                        customer_days = 0
                    continue
                
                # Get latest device (most recent added_at)
                latest_device = max(devices, key=lambda d: d.get('added_at', ''))
                device_added = latest_device.get('added_at', latest_device.get('created_at', ''))
                
                if device_added:
                    device_date = datetime.fromisoformat(device_added.replace('Z', '+00:00'))
                    today = datetime.now(device_date.tzinfo)
                    days_in_focus = max(0, (today - device_date).days)
                else:
                    days_in_focus = 0
                
                subscriber_days.append(days_in_focus)
                
                if sub_id == customer_id:
                    customer_days = days_in_focus
            
            print(f"📊 Customer days in focus: {customer_days}")
            print(f"📊 All subscriber days range: {min(subscriber_days) if subscriber_days else 0} - {max(subscriber_days) if subscriber_days else 0}")
            
            # Calculate percentile
            # Percentile = (number of people with fewer days / total people) * 100
            users_with_fewer_days = sum(1 for days in subscriber_days if days < customer_days)
            total_users = len(subscriber_days)
            
            if total_users == 0:
                percentile = 50  # Default if no data
            else:
                # Calculate top percentile (inverted - higher days = lower percentile number = better)
                percentile = round((1 - (users_with_fewer_days / total_users)) * 100, 1)
                # Ensure it's at least 1% (you're always in some percentile)
                percentile = max(1, min(100, percentile))
            
            print(f"✅ Customer is in top {percentile}% (better than {users_with_fewer_days}/{total_users} users)")
            
            return json_resp({
                'success': True,
                'percentile': percentile,
                'days_in_focus': customer_days,
                'total_users': total_users,
                'users_with_fewer_days': users_with_fewer_days
            })
            
        except Exception as db_error:
            print(f"❌ Database error calculating percentile: {db_error}")
            import traceback
            print(f"❌ Full traceback: {traceback.format_exc()}")
            return json_resp({'error': 'Failed to calculate percentile'}, 500)
        
    except Exception as e:
        print(f"❌ Error in calculate_percentile: {e}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        return json_resp({'error': 'Failed to calculate percentile'}, 500)

