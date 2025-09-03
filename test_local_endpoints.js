#!/usr/bin/env node

/**
 * Local Endpoint Testing Suite
 * Test all Lambda endpoints through the local proxy server
 * Run with: node test_local_endpoints.js
 */

const axios = require('axios');

// Local test server URL
const LOCAL_API_URL = 'http://localhost:5001';

// Test configuration
const TEST_CUSTOMER_ID = 'test_customer_123';
const TEST_PHONE = '+31612345678';
const TEST_CODE = '123456';

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, method, endpoint, data = {}) {
    try {
        log('cyan', `\n🧪 Testing: ${name}`);
        console.log(`📞 ${method.toUpperCase()} ${endpoint}`);
        
        const startTime = Date.now();
        const response = await axios({
            method,
            url: `${LOCAL_API_URL}${endpoint}`,
            data: method === 'GET' ? undefined : data,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const duration = Date.now() - startTime;
        
        if (response.status >= 200 && response.status < 300) {
            log('green', `✅ SUCCESS (${response.status}) - ${duration}ms`);
            console.log('📄 Response:', JSON.stringify(response.data, null, 2));
            return { success: true, data: response.data, duration };
        } else {
            log('yellow', `⚠️  WARNING (${response.status}) - ${duration}ms`);
            console.log('📄 Response:', JSON.stringify(response.data, null, 2));
            return { success: false, data: response.data, duration };
        }
        
    } catch (error) {
        log('red', `❌ ERROR: ${error.message}`);
        if (error.response) {
            console.log('📄 Error Response:', JSON.stringify(error.response.data, null, 2));
            return { success: false, data: error.response.data, duration: 0 };
        }
        return { success: false, error: error.message, duration: 0 };
    }
}

async function runAllTests() {
    log('blue', '🚀 Starting Local Lambda Endpoint Tests');
    log('blue', `📍 Testing against: ${LOCAL_API_URL}`);
    
    const results = [];
    
    // 1. Health Check
    results.push(await testEndpoint(
        'Health Check',
        'GET',
        '/health'
    ));
    
    // 2. Username Availability
    results.push(await testEndpoint(
        'Username Availability Check',
        'POST',
        '/check_username',
        { username: 'testuser123' }
    ));
    
    // 3. Get Customer Profile
    results.push(await testEndpoint(
        'Get Customer Profile',
        'POST',
        '/get_profile',
        { customer_id: TEST_CUSTOMER_ID }
    ));
    
    // 4. WhatsApp Verification Send
    results.push(await testEndpoint(
        'Send WhatsApp Verification',
        'POST',
        '/send_whatsapp_code',
        { 
            customer_id: TEST_CUSTOMER_ID,
            phone_number: TEST_PHONE
        }
    ));
    
    // 5. WhatsApp Code Verification
    results.push(await testEndpoint(
        'Verify WhatsApp Code',
        'POST',
        '/verify_whatsapp_code',
        {
            customer_id: TEST_CUSTOMER_ID,
            phone_number: TEST_PHONE,
            code: TEST_CODE,
            username: 'testuser',
            gender: 'male'
        }
    ));
    
    // 6. Save Profile
    results.push(await testEndpoint(
        'Save Profile',
        'POST',
        '/save_profile',
        {
            customer_id: TEST_CUSTOMER_ID,
            username: 'testuser2',
            gender: 'female'
        }
    ));
    
    // 7. Update Profile
    results.push(await testEndpoint(
        'Update Profile',
        'POST',
        '/update_profile',
        { 
            customer_id: TEST_CUSTOMER_ID,
            username: 'updateduser'
        }
    ));
    
    // 8. Create Webapp Checkout
    results.push(await testEndpoint(
        'Create Webapp Checkout',
        'POST',
        '/create_webapp_checkout',
        { 
            customer_id: TEST_CUSTOMER_ID,
            commitment_type: 'basic'
        }
    ));
    
    // 9. Evaluate Only
    results.push(await testEndpoint(
        'Evaluate Only',
        'POST',
        '/evaluate_only',
        { 
            customer_id: TEST_CUSTOMER_ID,
            commitment_data: {
                duration: 30,
                type: 'basic'
            }
        }
    ));
    
    // Summary
    log('blue', '\n📊 TEST SUMMARY');
    console.log('=' * 50);
    
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    const averageTime = results.reduce((sum, r) => sum + r.duration, 0) / total;
    
    log('green', `✅ Successful: ${successful}/${total}`);
    log('red', `❌ Failed: ${total - successful}/${total}`);
    log('cyan', `⏱️  Average Response Time: ${averageTime.toFixed(1)}ms`);
    
    if (successful === total) {
        log('green', '\n🎉 All tests passed! Your local setup is working perfectly.');
    } else {
        log('yellow', '\n⚠️  Some tests failed. Check the Lambda logs or endpoint implementation.');
    }
    
    return results;
}

// Main execution
if (require.main === module) {
    console.log('🧪 Local Lambda Endpoint Test Suite\n');
    
    // Check if local server is running
    axios.get(`${LOCAL_API_URL}/health`)
        .then(() => {
            log('green', '✅ Local test server is running');
            return runAllTests();
        })
        .catch(() => {
            log('red', '❌ Local test server is not running!');
            log('yellow', '💡 Start it with: node local_lambda_test_server.js');
            process.exit(1);
        });
}


