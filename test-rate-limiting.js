const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';
const TEST_FROM_BLOCK = 34823331;
const TEST_TO_BLOCK = 34824450;

async function testRateLimiting() {
  console.log('🧪 Testing rate limiting with multiple concurrent requests...\n');
  
  const promises = [];
  const startTime = Date.now();
  
  // Create 15 concurrent requests (more than the 10 req/sec limit)
  for (let i = 1; i <= 15; i++) {
    promises.push(
      axios.get(`${API_BASE_URL}/events`, {
        params: {
          fromBlock: TEST_FROM_BLOCK,
          toBlock: TEST_TO_BLOCK
        }
      }).then(response => {
        console.log(`✅ Request ${i}: Success (${response.status})`);
        return { success: true, requestId: i };
      }).catch(error => {
        console.log(`❌ Request ${i}: ${error.response?.status || 'Error'} - ${error.response?.data?.message || error.message}`);
        return { success: false, requestId: i, error: error.response?.status };
      })
    );
  }
  
  try {
    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const rateLimited = results.filter(r => r.error === 429).length;
    
    console.log('\n📊 Test Results:');
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Successful: ${successful}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Rate Limited (429): ${rateLimited}`);
    console.log(`   Success Rate: ${((successful / results.length) * 100).toFixed(1)}%`);
    
    if (rateLimited > 0) {
      console.log('\n⚠️  Some requests were rate limited - this is expected behavior!');
      console.log('   The rate limiting system is working correctly.');
    } else {
      console.log('\n✅ No rate limiting occurred - all requests succeeded!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testSingleRequest() {
  console.log('🔍 Testing single request...\n');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/events`, {
      params: {
        fromBlock: TEST_FROM_BLOCK,
        toBlock: TEST_TO_BLOCK
      }
    });
    
    console.log('✅ Single request successful!');
    console.log(`   Status: ${response.status}`);
    console.log(`   Events found: ${response.data.events?.length || 0}`);
    
  } catch (error) {
    console.log('❌ Single request failed:');
    console.log(`   Status: ${error.response?.status || 'Unknown'}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
  }
}

async function main() {
  console.log('🚀 DEXTools Qubic API Rate Limiting Test\n');
  console.log(`Testing endpoint: ${API_BASE_URL}/events`);
  console.log(`Block range: ${TEST_FROM_BLOCK} to ${TEST_TO_BLOCK}\n`);
  
  // Test single request first
  await testSingleRequest();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test rate limiting with multiple requests
  await testRateLimiting();
  
  console.log('\n🏁 Test completed!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testRateLimiting, testSingleRequest };
