"""
Test script for milestone video generation
Tests the Lambda function locally and via API
"""

import json
import requests
import time

# Configuration
LAMBDA_URL = "YOUR_LAMBDA_FUNCTION_URL_HERE"

# Test cases
TEST_CASES = [
    {
        "name": "Basic Test - Male",
        "data": {
            "firstname": "Merijn",
            "level": 5,
            "days": 150,
            "rank": 6,
            "next_level": 6,
            "gender": "male"
        }
    },
    {
        "name": "High Level - Female",
        "data": {
            "firstname": "Sarah",
            "level": 9,
            "days": 300,
            "rank": 2,
            "next_level": 10,
            "gender": "female"
        }
    },
    {
        "name": "Beginner - Male",
        "data": {
            "firstname": "John",
            "level": 1,
            "days": 7,
            "rank": 85,
            "next_level": 2,
            "gender": "male"
        }
    },
    {
        "name": "Special Characters",
        "data": {
            "firstname": "José",
            "level": 3,
            "days": 45,
            "rank": 50,
            "next_level": 4,
            "gender": "male"
        }
    },
    {
        "name": "Long Name",
        "data": {
            "firstname": "Christopher",
            "level": 7,
            "days": 200,
            "rank": 10,
            "next_level": 8,
            "gender": "male"
        }
    }
]


def test_lambda_api(test_case):
    """Test Lambda function via API"""
    
    print(f"\n{'='*60}")
    print(f"🧪 Test: {test_case['name']}")
    print(f"{'='*60}")
    print(f"📊 Input data: {json.dumps(test_case['data'], indent=2)}")
    
    try:
        start_time = time.time()
        
        response = requests.post(
            LAMBDA_URL,
            json=test_case['data'],
            timeout=120  # 2 minute timeout
        )
        
        duration = time.time() - start_time
        
        print(f"\n⏱️  Duration: {duration:.2f}s")
        print(f"📡 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success!")
            print(f"📹 Video URL: {result.get('video_url')}")
            print(f"🆔 Video ID: {result.get('video_id')}")
            print(f"💬 Message: {result.get('message')}")
            
            return True, result
        else:
            print(f"❌ Failed!")
            print(f"Response: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False, None


def test_local_handler(test_case):
    """Test Lambda handler locally (requires local environment)"""
    
    print(f"\n{'='*60}")
    print(f"🧪 Local Test: {test_case['name']}")
    print(f"{'='*60}")
    
    try:
        # Import local handler
        from generate_milestone_video_handler import lambda_handler
        
        start_time = time.time()
        
        result = lambda_handler(test_case['data'], None)
        
        duration = time.time() - start_time
        
        print(f"⏱️  Duration: {duration:.2f}s")
        print(f"📊 Result: {json.dumps(result, indent=2)}")
        
        if result.get('statusCode') == 200:
            print(f"✅ Success!")
            return True, result
        else:
            print(f"❌ Failed!")
            return False, None
            
    except ImportError:
        print("⚠️  Local handler not available (run from aws_lambda_api directory)")
        return False, None
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False, None


def generate_share_url(data):
    """Generate Shopify share URL with query params"""
    
    base_url = "https://screentimejourney.com/pages/milestone-share"
    params = "&".join([f"{k}={v}" for k, v in data.items()])
    return f"{base_url}?{params}"


def main():
    """Run all tests"""
    
    print("🎬 Milestone Video Generation - Test Suite")
    print("=" * 60)
    
    if LAMBDA_URL == "YOUR_LAMBDA_FUNCTION_URL_HERE":
        print("\n⚠️  Please update LAMBDA_URL in this script")
        print("You can find it in the deploy output or AWS Console")
        print("\nTesting locally instead...\n")
        test_mode = "local"
    else:
        test_mode = "api"
    
    results = []
    
    for test_case in TEST_CASES:
        if test_mode == "api":
            success, result = test_lambda_api(test_case)
        else:
            success, result = test_local_handler(test_case)
        
        results.append({
            "name": test_case["name"],
            "success": success,
            "result": result
        })
        
        # Generate share URL
        share_url = generate_share_url(test_case['data'])
        print(f"\n🔗 Share URL: {share_url}")
        
        # Wait between tests to avoid rate limits
        if test_mode == "api":
            time.sleep(2)
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for r in results if r['success'])
    total = len(results)
    
    print(f"\nTotal Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    print("\n" + "=" * 60)
    print("DETAILED RESULTS")
    print("=" * 60)
    
    for r in results:
        status = "✅" if r['success'] else "❌"
        print(f"{status} {r['name']}")
        if r['success'] and r['result']:
            if isinstance(r['result'], dict):
                body = json.loads(r['result'].get('body', '{}'))
                video_url = body.get('video_url', 'N/A')
                print(f"   Video: {video_url[:60]}...")
    
    print("\n" + "=" * 60)
    
    if passed == total:
        print("🎉 All tests passed!")
    else:
        print(f"⚠️  {total - passed} test(s) failed")
    
    print("=" * 60)


if __name__ == "__main__":
    main()










