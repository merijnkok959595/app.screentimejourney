#!/usr/bin/env python3

"""
Local Lambda Runner
Runs your actual lambda_handler.py locally for fast testing
Usage: python3 local_lambda_runner.py
"""

import os
import sys
import json
import time
from flask import Flask, request, jsonify
from flask_cors import CORS

# Add the Lambda directory to Python path
lambda_dir = os.path.join(os.path.dirname(__file__), '..', 'aws_lambda_api')
sys.path.insert(0, lambda_dir)

try:
    # Import your actual Lambda handler
    from lambda_handler import handler
    print("✅ Successfully imported lambda_handler")
except ImportError as e:
    print(f"❌ Failed to import lambda_handler: {e}")
    print("Make sure aws_lambda_api/lambda_handler.py exists")
    sys.exit(1)

# Create Flask app
app = Flask(__name__)
CORS(app, origins=['http://localhost:3000'])

# Set up environment variables for local testing
os.environ.setdefault('SUBSCRIBERS_TABLE', 'stj_subscribers')
os.environ.setdefault('AUTH_TABLE', 'stj_auth')
os.environ.setdefault('JWT_SECRET', 'local-test-jwt-secret')
os.environ.setdefault('APP_BASE_URL', 'http://localhost:3000')
os.environ.setdefault('SHOPIFY_API_SECRET', 'local-test-secret')
os.environ.setdefault('DEBUG', 'true')

def create_lambda_event(method, path, body=None, query_params=None):
    """Create a Lambda event object from Flask request"""
    return {
        'httpMethod': method,
        'path': path,
        'pathParameters': None,
        'queryStringParameters': query_params or {},
        'headers': dict(request.headers),
        'body': json.dumps(body) if body else None,
        'isBase64Encoded': False,
        'requestContext': {
            'requestId': f'local-{int(time.time() * 1000)}',
            'stage': 'local',
            'httpMethod': method
        }
    }

def create_lambda_context():
    """Create a mock Lambda context object"""
    class LambdaContext:
        def __init__(self):
            self.function_name = 'local-lambda'
            self.function_version = '1.0'
            self.invoked_function_arn = 'arn:aws:lambda:local:123456789012:function:local-lambda'
            self.memory_limit_in_mb = 256
            self.remaining_time_in_millis = lambda: 30000
            
        def get_remaining_time_in_millis(self):
            return 30000
    
    return LambdaContext()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Local Lambda runner is working',
        'lambda_imported': True,
        'environment': 'local'
    })

@app.route('/', defaults={'path': ''}, methods=['GET', 'POST', 'PUT', 'DELETE'])
@app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def lambda_proxy(path):
    """Proxy all requests to Lambda handler"""
    try:
        start_time = time.time()
        
        # Log the request
        print(f"\n🔍 {request.method} /{path}")
        if request.is_json and request.json:
            print(f"📄 Body: {json.dumps(request.json, indent=2)}")
        
        # Create Lambda event and context
        event = create_lambda_event(
            method=request.method,
            path=f'/{path}',
            body=request.json if request.is_json else None,
            query_params=dict(request.args)
        )
        context = create_lambda_context()
        
        # Call the actual Lambda handler
        response = handler(event, context)
        
        # Calculate timing
        duration = (time.time() - start_time) * 1000
        
        # Log the response
        status_code = response.get('statusCode', 200)
        print(f"✅ {status_code} in {duration:.1f}ms")
        
        # Parse response body if it's JSON
        response_body = response.get('body', '{}')
        if isinstance(response_body, str):
            try:
                response_body = json.loads(response_body)
            except json.JSONDecodeError:
                pass
        
        print(f"📤 Response: {json.dumps(response_body, indent=2)}")
        
        # Return response
        return jsonify(response_body), status_code, response.get('headers', {})
        
    except Exception as e:
        print(f"❌ Error in Lambda handler: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'error': 'Lambda handler error',
            'message': str(e),
            'type': type(e).__name__
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found',
        'message': 'Check your Lambda handler routing'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error',
        'message': str(error)
    }), 500

def print_startup_info():
    """Print startup information"""
    print("\n" + "="*60)
    print("🚀 Local Lambda Runner Started!")
    print("="*60)
    print(f"📍 Server: http://localhost:5001")
    print(f"🔗 Lambda handler: {lambda_dir}/lambda_handler.py")
    print(f"🌐 CORS enabled for: http://localhost:3000")
    print("\n💡 Usage:")
    print("   - Update your React app API_URL to: http://localhost:5001")
    print("   - All requests will run through your actual Lambda code")
    print("   - Changes to lambda_handler.py require restart")
    print("\n📋 Available endpoints (from your Lambda):")
    print("   POST /check_username")
    print("   POST /get_profile")
    print("   POST /send_whatsapp_verification")
    print("   POST /verify_whatsapp_code")
    print("   POST /save_profile_skip_whatsapp")
    print("   POST /get_milestones")
    print("   POST /get_system_config")
    print("   POST /get_notifications")
    print("   POST /update_notifications")
    print("   POST /store_pincode")
    print("   POST /generate_vpn_profile")
    print("   POST /generate_audio")
    print("   POST /validate_surrender")
    print("\n🧪 Test with:")
    print("   curl http://localhost:5001/health")
    print("   node test_local_endpoints.js")
    print("\n🔄 Environment:")
    for key in ['SUBSCRIBERS_TABLE', 'AUTH_TABLE', 'DEBUG']:
        print(f"   {key}: {os.environ.get(key, 'Not set')}")
    print("="*60 + "\n")

if __name__ == '__main__':
    print_startup_info()
    
    try:
        app.run(
            host='0.0.0.0',
            port=5001,
            debug=True,
            use_reloader=False  # Disable reloader to avoid import issues
        )
    except KeyboardInterrupt:
        print("\n👋 Shutting down Local Lambda Runner...")
