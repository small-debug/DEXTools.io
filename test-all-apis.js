/**
 * Test script to verify all APIs are working
 * This script tests all endpoints to ensure they're accessible
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

async function testAllAPIs() {
  console.log('🧪 Testing All APIs\n');
  console.log('='.repeat(80));
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log('='.repeat(80));
  
  const endpoints = [
    // Basic endpoints
    { method: 'GET', path: '/health', name: 'Health Check' },
    { method: 'GET', path: '/latest-block', name: 'Latest Block' },
    { method: 'GET', path: '/docs', name: 'API Documentation' },
    
    // Block endpoints
    { method: 'GET', path: '/block?number=1000', name: 'Block by Number (Query)' },
    { method: 'GET', path: '/block/1000', name: 'Block by Number (Path)' },
    
    // Asset endpoints
    { method: 'GET', path: '/asset?id=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB', name: 'Asset by ID (Query)' },
    { method: 'GET', path: '/asset/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB', name: 'Asset by ID (Path)' },
    { method: 'GET', path: '/asset/holders', name: 'Asset Holders' },
    
    // Exchange endpoints
    { method: 'GET', path: '/exchange?id=BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID', name: 'Exchange by ID (Query)' },
    { method: 'GET', path: '/exchange/BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID', name: 'Exchange by ID (Path)' },
    
    // Pair endpoints
    { method: 'GET', path: '/pair?id=RAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADKAH', name: 'Pair by ID (Query)' },
    { method: 'GET', path: '/pair/RAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADKAH', name: 'Pair by ID (Path)' },
    
    // Events endpoints (may not work if events collection is disabled)
    { method: 'GET', path: '/events', name: 'Events' },
    { method: 'GET', path: '/events/status', name: 'Events Status' },
    { method: 'GET', path: '/events/addresses/cache', name: 'Addresses Cache' },
    { method: 'GET', path: '/events/cycling/stats', name: 'Cycling Stats' }
  ];
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const endpoint of endpoints) {
    console.log(`\n📊 Testing ${endpoint.name}`);
    console.log('-'.repeat(80));
    console.log(`   ${endpoint.method} ${endpoint.path}`);
    
    try {
      const url = endpoint.path.startsWith('/health') ? 
        'http://localhost:3000/health' : 
        `${API_BASE_URL}${endpoint.path}`;
      
      const response = await axios({
        method: endpoint.method.toLowerCase(),
        url: url,
        timeout: 10000 // 10 second timeout
      });
      
      console.log(`   ✅ SUCCESS: ${response.status} ${response.statusText}`);
      
      // Show response structure for some endpoints
      if (endpoint.path.includes('/latest-block') || endpoint.path.includes('/health')) {
        console.log(`   📊 Response:`, JSON.stringify(response.data, null, 2));
      } else if (response.data) {
        console.log(`   📊 Response keys:`, Object.keys(response.data).join(', '));
      }
      
      successCount++;
      
    } catch (error) {
      errorCount++;
      
      if (error.response) {
        console.log(`   ❌ ERROR: ${error.response.status} ${error.response.statusText}`);
        if (error.response.data) {
          console.log(`   📊 Error response:`, JSON.stringify(error.response.data, null, 2));
        }
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`   ❌ ERROR: Connection refused - server not running`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`   ❌ ERROR: Request timeout`);
      } else {
        console.log(`   ❌ ERROR: ${error.message}`);
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 Test Summary');
  console.log('='.repeat(80));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📊 Total: ${successCount + errorCount}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 All APIs are working correctly!');
  } else if (errorCount < endpoints.length / 2) {
    console.log('\n⚠️  Most APIs are working, but some have issues');
  } else {
    console.log('\n❌ Many APIs are not working - check server logs');
  }
  
  // Specific recommendations
  if (errorCount > 0) {
    console.log('\n💡 Troubleshooting Tips:');
    console.log('   1. Check if the server is running: npm start');
    console.log('   2. Check server logs for error messages');
    console.log('   3. Try disabling events collection: ENABLE_EVENTS_COLLECTION=false');
    console.log('   4. Check if Qubic RPC is accessible');
    console.log('   5. Verify environment variables in .env file');
  }
}

// Run the test
console.log('\n🚀 Starting All APIs Test\n');
console.log('This test verifies that all API endpoints are accessible\n');

testAllAPIs().then(() => {
  console.log('\n✅ Test completed');
}).catch((error) => {
  console.error('❌ Test error:', error);
  process.exit(1);
});
