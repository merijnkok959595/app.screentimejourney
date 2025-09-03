#!/usr/bin/env node

/**
 * Switch React App to Local API
 * Updates App.js to use local Lambda runner for development
 * Run with: node switch_to_local_api.js
 */

const fs = require('fs');
const path = require('path');

const APP_JS_PATH = path.join(__dirname, 'src', 'App.js');
const BACKUP_PATH = path.join(__dirname, 'src', 'App.js.backup');

// API URLs
const PRODUCTION_API = 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws';
const LOCAL_API = 'http://localhost:5001';

function switchToLocal() {
    try {
        // Read App.js
        const content = fs.readFileSync(APP_JS_PATH, 'utf8');
        
        // Create backup if it doesn't exist
        if (!fs.existsSync(BACKUP_PATH)) {
            fs.writeFileSync(BACKUP_PATH, content);
            console.log('✅ Created backup: App.js.backup');
        }
        
        // Replace production API with local API
        const updatedContent = content.replace(
            new RegExp(PRODUCTION_API.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
            LOCAL_API
        );
        
        // Write updated content
        fs.writeFileSync(APP_JS_PATH, updatedContent);
        
        console.log('🔄 Switched to LOCAL API');
        console.log(`📍 Local API: ${LOCAL_API}`);
        console.log('💡 Start local Lambda runner: python3 local_lambda_runner.py');
        console.log('🚀 Start React app: npm start');
        
    } catch (error) {
        console.error('❌ Error switching to local API:', error.message);
    }
}

function switchToProduction() {
    try {
        // Read App.js
        const content = fs.readFileSync(APP_JS_PATH, 'utf8');
        
        // Replace local API with production API
        const updatedContent = content.replace(
            new RegExp(LOCAL_API.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
            PRODUCTION_API
        );
        
        // Write updated content
        fs.writeFileSync(APP_JS_PATH, updatedContent);
        
        console.log('🌐 Switched to PRODUCTION API');
        console.log(`📍 Production API: ${PRODUCTION_API}`);
        
    } catch (error) {
        console.error('❌ Error switching to production API:', error.message);
    }
}

function showStatus() {
    try {
        const content = fs.readFileSync(APP_JS_PATH, 'utf8');
        
        if (content.includes(LOCAL_API)) {
            console.log('📍 Currently using: LOCAL API');
            console.log(`🔗 ${LOCAL_API}`);
        } else if (content.includes(PRODUCTION_API)) {
            console.log('📍 Currently using: PRODUCTION API');
            console.log(`🔗 ${PRODUCTION_API}`);
        } else {
            console.log('❓ API URL not recognized');
        }
        
    } catch (error) {
        console.error('❌ Error checking status:', error.message);
    }
}

function showHelp() {
    console.log('🔧 API Switcher for React App\n');
    console.log('Usage:');
    console.log('  node switch_to_local_api.js local      # Switch to local Lambda runner');
    console.log('  node switch_to_local_api.js production # Switch to production API');
    console.log('  node switch_to_local_api.js status     # Show current API');
    console.log('  node switch_to_local_api.js help       # Show this help');
    console.log('\n💡 Local development workflow:');
    console.log('  1. node switch_to_local_api.js local');
    console.log('  2. python3 local_lambda_runner.py');
    console.log('  3. npm start');
    console.log('  4. Test your app at http://localhost:3000');
}

// Main execution
const command = process.argv[2] || 'status';

switch (command.toLowerCase()) {
    case 'local':
    case 'l':
        switchToLocal();
        break;
    case 'production':
    case 'prod':
    case 'p':
        switchToProduction();
        break;
    case 'status':
    case 's':
        showStatus();
        break;
    case 'help':
    case 'h':
    case '--help':
        showHelp();
        break;
    default:
        console.log(`❌ Unknown command: ${command}`);
        showHelp();
        process.exit(1);
}
