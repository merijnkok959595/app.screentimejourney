#!/usr/bin/env node

/**
 * Local Lambda Test Server
 * Runs a local server that mimics AWS Lambda endpoints for faster testing
 * Run with: node local_lambda_test_server.js
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3001;

// AWS Lambda API Gateway URL (your actual deployed endpoint)
const LAMBDA_API_URL = 'https://lc5d0u74gd.execute-api.eu-north-1.amazonaws.com/default';

// Enable CORS for all routes
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
    console.log(`\n📞 ${req.method} ${req.path}`);
    if (Object.keys(req.body).length > 0) {
        console.log(`📄 Body:`, JSON.stringify(req.body, null, 2));
    }
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        message: 'Local Lambda test server running',
        lambda_url: LAMBDA_API_URL 
    });
});

// Generic proxy for all Lambda endpoints
app.all('*', async (req, res) => {
    try {
        const startTime = Date.now();
        
        // Forward request to actual Lambda
        const response = await axios({
            method: req.method,
            url: `${LAMBDA_API_URL}${req.path}`,
            data: req.body,
            headers: {
                'Content-Type': 'application/json',
                // Forward any auth headers if present
                ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
            },
            params: req.query,
            validateStatus: () => true // Don't throw on HTTP error status
        });

        const duration = Date.now() - startTime;
        
        // Log response
        console.log(`✅ ${response.status} in ${duration}ms`);
        if (response.data && typeof response.data === 'object') {
            console.log(`📤 Response:`, JSON.stringify(response.data, null, 2));
        }

        // Forward response
        res.status(response.status).json(response.data);
        
    } catch (error) {
        console.error(`❌ Error proxying request:`, error.message);
        
        if (error.response) {
            // HTTP error response
            console.error(`📤 Error Response:`, error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            // Network error
            res.status(503).json({
                error: 'Service unavailable',
                message: 'Could not reach Lambda API',
                details: error.message
            });
        } else {
            // Other error
            res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 Local Lambda Test Server Started!`);
    console.log(`📍 Server: http://localhost:${PORT}`);
    console.log(`🔗 Proxying to: ${LAMBDA_API_URL}`);
    console.log(`\n💡 Usage:`);
    console.log(`   - Update your React app API_URL to: http://localhost:${PORT}`);
    console.log(`   - All requests will be forwarded to your actual Lambda`);
    console.log(`   - Much faster than deploying for every test!`);
    console.log(`\n📋 Available endpoints:`);
    console.log(`   POST /check_username`);
    console.log(`   POST /get_profile`);
    console.log(`   POST /send_whatsapp_verification`);
    console.log(`   POST /verify_whatsapp_code`);
    console.log(`   POST /save_profile_skip_whatsapp`);
    console.log(`   POST /get_milestones`);
    console.log(`   POST /get_notifications`);
    console.log(`   POST /update_notifications`);
    console.log(`   And more...`);
    console.log(`\n🎯 Test with: curl http://localhost:${PORT}/health\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down Local Lambda Test Server...');
    process.exit(0);
});


