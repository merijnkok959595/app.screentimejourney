#!/usr/bin/env node

/**
 * Test script to verify the connection between your local React app and real AWS Lambda
 * Run this to ensure your Lambda API is accessible and CORS is properly configured
 */

const https = require('https');
const http = require('http');

const LAMBDA_URL = 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws';

console.log('🧪 Testing connection to AWS Lambda API...');
console.log(`📡 Target: ${LAMBDA_URL}`);
console.log('');

// Test basic connectivity
function testConnection() {
    return new Promise((resolve, reject) => {
        const url = new URL(LAMBDA_URL);
        const options = {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname,
            method: 'GET',
            headers: {
                'User-Agent': 'Local-Test-Script',
                'Origin': 'http://localhost:3000',  // Simulate localhost origin
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            console.log(`✅ Status Code: ${res.statusCode}`);
            console.log(`📋 Headers:`, res.headers);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('📦 Response Body:', data);
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });

        req.on('error', (error) => {
            console.error('❌ Connection Error:', error.message);
            reject(error);
        });

        req.setTimeout(5000, () => {
            console.error('⏰ Request timeout');
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

// Test CORS preflight
function testCORS() {
    return new Promise((resolve, reject) => {
        const url = new URL(LAMBDA_URL);
        const options = {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname,
            method: 'OPTIONS',
            headers: {
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
        };

        const req = https.request(options, (res) => {
            console.log(`\n🔍 CORS Preflight Test:`);
            console.log(`   Status: ${res.statusCode}`);
            console.log(`   Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin']}`);
            console.log(`   Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods']}`);
            console.log(`   Access-Control-Allow-Headers: ${res.headers['access-control-allow-headers']}`);
            
            resolve(res.headers);
        });

        req.on('error', reject);
        req.end();
    });
}

async function runTests() {
    try {
        console.log('🔍 Test 1: Basic connectivity...');
        await testConnection();
        
        console.log('\n🔍 Test 2: CORS configuration...');
        await testCORS();
        
        console.log('\n✅ All tests completed!');
        console.log('\n💡 Next steps:');
        console.log('   1. Run: npm start (in the aws_amplify_app directory)');
        console.log('   2. Open: http://localhost:3000');
        console.log('   3. Check browser dev tools for API calls');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Check if your Lambda function is deployed');
        console.log('   2. Verify the Lambda URL is correct');
        console.log('   3. Ensure Lambda has proper CORS headers');
    }
}

runTests();
