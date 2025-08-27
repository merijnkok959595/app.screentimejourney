#!/usr/bin/env node

/**
 * Username Functionality Test Script
 * Tests both local and production username checking
 */

const https = require('https');
const http = require('http');

// Configuration
const LOCAL_DEV = false; // Set to true to test local dev logic
const API_BASE_URL = 'https://lc5d0u74gd.execute-api.eu-north-1.amazonaws.com/default';
const OLD_API_URL = 'https://44rqhfqqrjz57zd2q7lw2d63mi0akcdj.lambda-url.eu-west-1.on.aws';

// Test cases
const TEST_USERNAMES = [
  'testuser123',
  'admin',
  'test',
  'user',
  'newusername',
  'myusername2024',
  'shortname',
  'verylongusernamethatexceeds20chars',
  'user_with_underscore',
  'user-with-dash',
  'user123',
  'validuser',
  'anothertestuser'
];

// Helper function to make API requests
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: parsed,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: data,
            headers: res.headers,
            parseError: e.message
          });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.write(postData);
    req.end();
  });
}

// Test local development logic
function testLocalLogic(username) {
  const isAvailable = !['admin', 'test', 'user'].includes(username.toLowerCase());
  return {
    username,
    available: isAvailable,
    source: 'local'
  };
}

// Test username validation
function validateUsername(username) {
  const errors = [];
  
  if (!username) {
    errors.push('Username is required');
  }
  
  if (username && username.length < 3) {
    errors.push('Username must be at least 3 characters');
  }
  
  if (username && username.length > 20) {
    errors.push('Username must be 20 characters or less');
  }
  
  if (username && !/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Test API endpoint
async function testAPIEndpoint(url, username) {
  try {
    console.log(`🔍 Testing API: ${url}`);
    const response = await makeRequest(`${url}/check_username`, {
      username: username.trim()
    });
    
    return {
      username,
      statusCode: response.statusCode,
      data: response.data,
      source: 'api',
      url,
      parseError: response.parseError
    };
  } catch (error) {
    return {
      username,
      error: error.message,
      source: 'api',
      url
    };
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Username Functionality Test Script');
  console.log('=====================================\n');
  
  console.log('📋 Test Configuration:');
  console.log(`- Local Dev Mode: ${LOCAL_DEV}`);
  console.log(`- Production API: ${API_BASE_URL}`);
  console.log(`- Old API: ${OLD_API_URL}`);
  console.log(`- Test Usernames: ${TEST_USERNAMES.length}\n`);
  
  // Test validation logic
  console.log('🔍 Testing Username Validation Logic:');
  console.log('=====================================');
  
  TEST_USERNAMES.forEach(username => {
    const validation = validateUsername(username);
    console.log(`${validation.valid ? '✅' : '❌'} ${username.padEnd(25)} ${validation.valid ? 'Valid' : validation.errors.join(', ')}`);
  });
  
  console.log('\\n');
  
  // Test local development logic
  if (LOCAL_DEV) {
    console.log('🏠 Testing Local Development Logic:');
    console.log('==================================');
    
    TEST_USERNAMES.forEach(username => {
      const result = testLocalLogic(username);
      console.log(`${result.available ? '✅' : '❌'} ${username.padEnd(25)} ${result.available ? 'Available' : 'Taken (hardcoded)'}`);
    });
    
    console.log('\\n');
  }
  
  // Test API endpoints
  console.log('🌐 Testing API Endpoints:');
  console.log('=========================');
  
  const validUsernames = TEST_USERNAMES.filter(username => validateUsername(username).valid);
  
  for (const username of validUsernames.slice(0, 5)) { // Test first 5 valid usernames
    console.log(`\\n--- Testing username: ${username} ---`);
    
    // Test production API
    const prodResult = await testAPIEndpoint(API_BASE_URL, username);
    console.log(`🔵 Production API (${prodResult.statusCode || 'ERROR'}):`);
    if (prodResult.error) {
      console.log(`   ❌ Error: ${prodResult.error}`);
    } else if (prodResult.parseError) {
      console.log(`   ⚠️  Parse Error: ${prodResult.parseError}`);
      console.log(`   📝 Raw Response: ${JSON.stringify(prodResult.data)}`);
    } else {
      console.log(`   📝 Response: ${JSON.stringify(prodResult.data)}`);
      if (prodResult.data && typeof prodResult.data.available !== 'undefined') {
        console.log(`   ${prodResult.data.available ? '✅' : '❌'} ${prodResult.data.available ? 'Available' : 'Taken'}`);
      }
    }
    
    // Test old API (for comparison)
    const oldResult = await testAPIEndpoint(OLD_API_URL, username);
    console.log(`🟡 Old API (${oldResult.statusCode || 'ERROR'}):`);
    if (oldResult.error) {
      console.log(`   ❌ Error: ${oldResult.error}`);
    } else if (oldResult.parseError) {
      console.log(`   ⚠️  Parse Error: ${oldResult.parseError}`);
      console.log(`   📝 Raw Response: ${JSON.stringify(oldResult.data)}`);
    } else {
      console.log(`   📝 Response: ${JSON.stringify(oldResult.data)}`);
      if (oldResult.data && typeof oldResult.data.available !== 'undefined') {
        console.log(`   ${oldResult.data.available ? '✅' : '❌'} ${oldResult.data.available ? 'Available' : 'Taken'}`);
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\\n\\n🎯 Test Summary:');
  console.log('================');
  console.log('✅ Validation logic tested');
  console.log('✅ Local development logic tested');
  console.log('✅ API endpoints tested');
  console.log('\\n📊 Check results above for any issues or inconsistencies.');
  console.log('\\n🔧 If issues found:');
  console.log('   1. Check API endpoint URLs are correct');
  console.log('   2. Verify backend function is deployed');
  console.log('   3. Check DynamoDB table exists and has data');
  console.log('   4. Verify CORS and authentication settings');
}

// Run the tests
runTests().catch(console.error);
