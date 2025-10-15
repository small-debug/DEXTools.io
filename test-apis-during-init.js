/**
 * Test script to verify APIs work during events collection initialization
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Test endpoints that should work during initialization
const testEndpoints = [
  { name: 'Health Check', url: '/health', method: 'GET' },
  { name: 'Latest Block', url: '/latest-block', method: 'GET' },
  { name: 'Block by Number', url: '/block?number=1000', method: 'GET' },
  { name: 'Asset by ID', url: '/asset?id=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB', method: 'GET' },
  { name: 'Exchange by ID', url: '/exchange?id=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB', method: 'GET' },
  { name: 'Pair by ID', url: '/pair?id=RAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADKAH', method: 'GET' },
  { name: 'API Documentation', url: '/docs', method: 'GET' },
  { name: 'Events Init Status', url: '/events/init-status', method: 'GET' },
  { name: 'Events Status', url: '/events/status', method: 'GET' }
];

async function testEndpoint(endpoint) {
  try {
    const response = await axios({
      method: endpoint.method,
      url: `${BASE_URL}${endpoint.url}`,
      timeout: 10000
    });
    
    return {
      name: endpoint.name,
      status: 'SUCCESS',
      statusCode: response.status,
      responseTime: response.headers['x-response-time'] || 'N/A',
      dataSize: JSON.stringify(response.data).length
    };
  } catch (error) {
    return {
      name: endpoint.name,
      status: 'ERROR',
      statusCode: error.response?.status || 'N/A',
      error: error.message,
      responseTime: 'N/A'
    };
  }
}

async function runTests() {
  console.log('🧪 Testing APIs during events collection initialization...\n');
  
  const results = [];
  
  for (const endpoint of testEndpoints) {
    console.log(`Testing ${endpoint.name}...`);
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // Add small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 Test Results:');
  console.log('================');
  
  let successCount = 0;
  let errorCount = 0;
  
  results.forEach(result => {
    const status = result.status === 'SUCCESS' ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.statusCode} (${result.status})`);
    
    if (result.status === 'SUCCESS') {
      successCount++;
    } else {
      errorCount++;
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
  });
  
  console.log('\n📈 Summary:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📊 Total: ${results.length}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 All APIs are working correctly during initialization!');
  } else {
    console.log('\n⚠️  Some APIs failed. Check the errors above.');
  }
  
  // Test initialization status specifically
  console.log('\n🔍 Checking Events Collection Initialization Status...');
  try {
    const initStatusResponse = await axios.get(`${BASE_URL}/events/init-status`);
    const initStatus = initStatusResponse.data.data;
    
    console.log('Initialization Status:', initStatus.status);
    console.log('Is Initialized:', initStatus.isInitialized);
    console.log('Is Running:', initStatus.isRunning);
    console.log('Collector Ready:', initStatus.collectorReady);
    console.log('Timestamp:', initStatus.timestamp);
    
    if (initStatus.status === 'running') {
      console.log('✅ Events collection is running in background');
    } else if (initStatus.status === 'collector_ready') {
      console.log('🔄 Events collection is ready but not yet running');
    } else if (initStatus.status === 'starting') {
      console.log('🚀 Events collection is starting up');
    } else if (initStatus.status === 'failed') {
      console.log('❌ Events collection failed to initialize');
    } else {
      console.log(`ℹ️  Events collection status: ${initStatus.status}`);
    }
    
  } catch (error) {
    console.log('❌ Failed to get initialization status:', error.message);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
