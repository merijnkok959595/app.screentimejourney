#!/usr/bin/env node

/**
 * Test Actual Lambda Functions Locally
 * Tests your real lambda_handler.py running locally
 * Run with: node test_actual_lambda.js
 */

const axios = require('axios');

// Local Lambda runner URL
const LOCAL_LAMBDA_URL = 'http://localhost:5001';

// Test data
const TEST_DATA = {
    customer_id: 'test_local_customer_123',
    phone_number: '+31612345678',
    username: 'localtest',
    gender: 'male'
};

// Colors for output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    reset: '\x1b[0m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testLambdaEndpoint(name, endpoint, data = {}) {
    try {
        log('cyan', `\n🧪 Testing: ${name}`);
        console.log(`📞 POST ${endpoint}`);
        console.log(`📄 Data:`, JSON.stringify(data, null, 2));
        
        const startTime = Date.now();
        const response = await axios.post(`${LOCAL_LAMBDA_URL}${endpoint}`, data, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });
        
        const duration = Date.now() - startTime;
        
        log('green', `✅ SUCCESS (${response.status}) - ${duration}ms`);
        console.log('📤 Response:', JSON.stringify(response.data, null, 2));
        
        return { success: true, data: response.data, duration, status: response.status };
        
    } catch (error) {
        const duration = Date.now() - startTime;
        
        if (error.response) {
            log('red', `❌ HTTP ERROR (${error.response.status}) - ${duration}ms`);
            console.log('📤 Error Response:', JSON.stringify(error.response.data, null, 2));
            return { success: false, data: error.response.data, duration, status: error.response.status };
        } else {
            log('red', `❌ NETWORK ERROR: ${error.message}`);
            return { success: false, error: error.message, duration: 0 };
        }
    }
}

async function runComprehensiveLambdaTests() {
    log('blue', '🚀 Testing Actual Lambda Functions Locally');
    log('blue', `📍 Lambda Runner: ${LOCAL_LAMBDA_URL}`);
    
    const results = [];
    
    // Test 1: Health Check
    try {
        const response = await axios.get(`${LOCAL_LAMBDA_URL}/health`);
        log('green', '✅ Local Lambda Runner is healthy');
        console.log('📄 Health:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        log('red', '❌ Local Lambda Runner is not responding!');
        log('yellow', '💡 Start it with: python3 local_lambda_runner.py');
        return;
    }
    
    // Test 2: Username Check
    results.push(await testLambdaEndpoint(
        'Username Availability Check',
        '/check_username',
        { username: TEST_DATA.username }
    ));
    
    // Test 3: Get Profile (should fail for non-existent customer)
    results.push(await testLambdaEndpoint(
        'Get Customer Profile (Non-existent)',
        '/get_profile',
        { customer_id: TEST_DATA.customer_id }
    ));
    
    // Test 4: Save Profile Without WhatsApp
    results.push(await testLambdaEndpoint(
        'Save Profile Without WhatsApp',
        '/save_profile_skip_whatsapp',
        {
            customer_id: TEST_DATA.customer_id,
            username: TEST_DATA.username,
            gender: TEST_DATA.gender
        }
    ));
    
    // Test 5: Get Profile Again (should succeed now)
    results.push(await testLambdaEndpoint(
        'Get Customer Profile (After Save)',
        '/get_profile',
        { customer_id: TEST_DATA.customer_id }
    ));
    
    // Test 6: WhatsApp Verification Send
    results.push(await testLambdaEndpoint(
        'Send WhatsApp Verification',
        '/send_whatsapp_verification',
        {
            customer_id: TEST_DATA.customer_id,
            phone_number: TEST_DATA.phone_number
        }
    ));
    
    // Test 7: WhatsApp Code Verification (will fail - code doesn't exist)
    results.push(await testLambdaEndpoint(
        'Verify WhatsApp Code',
        '/verify_whatsapp_code',
        {
            customer_id: TEST_DATA.customer_id,
            phone_number: TEST_DATA.phone_number,
            code: '123456'
        }
    ));
    
    // Test 8: Get Milestones
    results.push(await testLambdaEndpoint(
        'Get Milestones',
        '/get_milestones',
        {
            customer_id: TEST_DATA.customer_id,
            gender: TEST_DATA.gender
        }
    ));
    
    // Test 9: Get System Config
    results.push(await testLambdaEndpoint(
        'Get System Config',
        '/get_system_config',
        { config_key: 'device_setup_flow' }
    ));
    
    // Test 10: Store Pincode
    results.push(await testLambdaEndpoint(
        'Store Pincode',
        '/store_pincode',
        {
            customer_id: TEST_DATA.customer_id,
            pincode: '1234',
            device_info: {
                device_type: 'iPhone',
                device_name: 'Test iPhone',
                uuid: 'test-uuid-123'
            }
        }
    ));
    
    // Test 11: Generate VPN Profile
    results.push(await testLambdaEndpoint(
        'Generate VPN Profile',
        '/generate_vpn_profile',
        {
            customer_id: TEST_DATA.customer_id,
            device_type: 'iOS',
            device_name: 'Test iPhone'
        }
    ));
    
    // Test 12: Get Notifications
    results.push(await testLambdaEndpoint(
        'Get Notification Settings',
        '/get_notifications',
        { customer_id: TEST_DATA.customer_id }
    ));
    
    // Test 13: Update Notifications
    results.push(await testLambdaEndpoint(
        'Update Notification Settings',
        '/update_notifications',
        {
            customer_id: TEST_DATA.customer_id,
            settings: {
                email_notifications: true,
                whatsapp_notifications: true,
                milestone_alerts: false
            }
        }
    ));
    
    // Test 14: Generate Audio Guide
    results.push(await testLambdaEndpoint(
        'Generate Audio Guide',
        '/generate_audio',
        {
            customer_id: TEST_DATA.customer_id,
            device_name: 'Test iPhone',
            pincode: '1234'
        }
    ));
    
    // Test 15: Validate Surrender
    results.push(await testLambdaEndpoint(
        'Validate Surrender',
        '/validate_surrender',
        {
            customer_id: TEST_DATA.customer_id,
            audio_data: 'base64_audio_data_here',
            surrender_reason: 'Emergency'
        }
    ));
    
    // Summary
    log('blue', '\n📊 LAMBDA TEST SUMMARY');
    console.log('=' * 60);
    
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    const averageTime = results.reduce((sum, r) => sum + r.duration, 0) / total;
    
    log('green', `✅ Successful: ${successful}/${total}`);
    log('red', `❌ Failed: ${total - successful}/${total}`);
    log('cyan', `⏱️  Average Response Time: ${averageTime.toFixed(1)}ms`);
    
    // Analyze results
    const httpErrors = results.filter(r => !r.success && r.status >= 400).length;
    const networkErrors = results.filter(r => !r.success && !r.status).length;
    
    if (httpErrors > 0) {
        log('yellow', `⚠️  HTTP Errors: ${httpErrors} (expected for some tests)`);
    }
    if (networkErrors > 0) {
        log('red', `🔥 Network Errors: ${networkErrors} (check Lambda runner)`);
    }
    
    if (successful >= total * 0.8) {
        log('green', '\n🎉 Most tests passed! Your local Lambda setup is working well.');
        log('blue', '💡 Some failures are expected (e.g., WhatsApp verification without real codes)');
    } else {
        log('yellow', '\n⚠️  Many tests failed. Check the Lambda runner logs.');
    }
    
    return results;
}

// Run tests
if (require.main === module) {
    console.log('🧪 Actual Lambda Function Test Suite\n');
    runComprehensiveLambdaTests()
        .then(() => {
            log('blue', '\n✨ Testing complete!');
        })
        .catch(error => {
            log('red', `\n💥 Test suite failed: ${error.message}`);
            process.exit(1);
        });
}
