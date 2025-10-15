/**
 * Test script for active addresses file-based caching
 * This script tests the caching functionality of active addresses
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

async function testAddressesCaching() {
  console.log('🧪 Testing Active Addresses File-Based Caching\n');
  console.log('='.repeat(80));
  
  try {
    // Test 1: Health check
    console.log('\n📊 Test 1: Health check');
    console.log('-'.repeat(80));
    try {
      const healthResponse = await axios.get('http://localhost:3000/health');
      console.log('✅ API is running');
      console.log(`   Status: ${healthResponse.data.status}`);
    } catch (error) {
      console.error('❌ API is not running. Please start the API with: npm start');
      return;
    }
    
    // Test 2: Check cache info (before any operations)
    console.log('\n📊 Test 2: Check initial cache info');
    console.log('-'.repeat(80));
    try {
      const cacheResponse = await axios.get(`${API_BASE_URL}/events/addresses/cache`);
      console.log('✅ Cache info request successful');
      console.log('   Response:', JSON.stringify(cacheResponse.data, null, 2));
      
      const cache = cacheResponse.data.cache;
      console.log(`   Cache exists: ${cache.exists ? '✅' : '❌'}`);
      console.log(`   Total addresses: ${cache.totalAddresses}`);
      console.log(`   Last updated: ${cache.lastUpdated || 'Never'}`);
      console.log(`   Cache age: ${cache.age === Infinity ? 'N/A' : Math.round(cache.age / 60000) + ' minutes'}`);
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Cache info request failed with status ${error.response.status}`);
        console.log('   Error response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Cache info request failed:', error.message);
      }
    }
    
    // Test 3: Manually refresh cache
    console.log('\n📊 Test 3: Manually refresh cache');
    console.log('-'.repeat(80));
    console.log(`   Endpoint: POST ${API_BASE_URL}/events/addresses/refresh`);
    
    try {
      const refreshResponse = await axios.post(`${API_BASE_URL}/events/addresses/refresh`);
      console.log('✅ Cache refresh request successful');
      console.log('   Response:', JSON.stringify(refreshResponse.data, null, 2));
      
      const refreshData = refreshResponse.data;
      console.log(`   Success: ${refreshData.success ? '✅' : '❌'}`);
      console.log(`   Addresses count: ${refreshData.addressesCount}`);
      console.log(`   Message: ${refreshData.message}`);
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Cache refresh request failed with status ${error.response.status}`);
        console.log('   Error response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Cache refresh request failed:', error.message);
      }
    }
    
    // Test 4: Check cache info (after refresh)
    console.log('\n📊 Test 4: Check cache info after refresh');
    console.log('-'.repeat(80));
    try {
      const cacheResponse = await axios.get(`${API_BASE_URL}/events/addresses/cache`);
      console.log('✅ Cache info request successful');
      
      const cache = cacheResponse.data.cache;
      console.log(`   Cache exists: ${cache.exists ? '✅' : '❌'}`);
      console.log(`   Total addresses: ${cache.totalAddresses}`);
      console.log(`   Last updated: ${cache.lastUpdated || 'Never'}`);
      console.log(`   Cache age: ${cache.age === Infinity ? 'N/A' : Math.round(cache.age / 60000) + ' minutes'}`);
      console.log(`   Source: ${cache.source}`);
      
    } catch (error) {
      console.log(`❌ Cache info request failed: ${error.message}`);
    }
    
    // Test 5: Check actual cache file
    console.log('\n📊 Test 5: Check actual cache file');
    console.log('-'.repeat(80));
    try {
      const cacheFilePath = path.join(__dirname, 'src', 'data', 'active-addresses.json');
      console.log(`   Cache file path: ${cacheFilePath}`);
      
      try {
        const fileContent = await fs.readFile(cacheFilePath, 'utf8');
        const cacheData = JSON.parse(fileContent);
        
        console.log('✅ Cache file exists and is readable');
        console.log(`   File size: ${fileContent.length} bytes`);
        console.log(`   Addresses in file: ${cacheData.addresses?.length || 0}`);
        console.log(`   Last updated: ${cacheData.lastUpdated}`);
        console.log(`   Total addresses: ${cacheData.totalAddresses}`);
        console.log(`   Source: ${cacheData.source}`);
        
        // Show first few addresses as sample
        if (cacheData.addresses && cacheData.addresses.length > 0) {
          console.log('\n   Sample addresses:');
          cacheData.addresses.slice(0, 5).forEach((addr, index) => {
            console.log(`   ${index + 1}. ${addr}`);
          });
          if (cacheData.addresses.length > 5) {
            console.log(`   ... and ${cacheData.addresses.length - 5} more`);
          }
        }
        
      } catch (fileError) {
        console.log(`❌ Cache file doesn't exist or is invalid: ${fileError.message}`);
      }
      
    } catch (error) {
      console.log(`❌ Failed to check cache file: ${error.message}`);
    }
    
    // Test 6: Test events endpoint (which uses cached addresses)
    console.log('\n📊 Test 6: Test events endpoint with cached addresses');
    console.log('-'.repeat(80));
    try {
      const eventsResponse = await axios.get(`${API_BASE_URL}/events`);
      console.log('✅ Events request successful');
      console.log(`   Total events: ${eventsResponse.data.total || 0}`);
      console.log(`   Events array length: ${eventsResponse.data.events?.length || 0}`);
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Events request failed with status ${error.response.status}`);
        console.log('   Error response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Events request failed:', error.message);
      }
    }
    
    // Test 7: Performance test (multiple requests)
    console.log('\n📊 Test 7: Performance test (multiple requests)');
    console.log('-'.repeat(80));
    
    const startTime = Date.now();
    const requestCount = 5;
    
    try {
      const promises = [];
      for (let i = 0; i < requestCount; i++) {
        promises.push(axios.get(`${API_BASE_URL}/events/addresses/cache`));
      }
      
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      console.log(`✅ Completed ${requestCount} concurrent cache info requests`);
      console.log(`   Total time: ${totalTime}ms`);
      console.log(`   Average time per request: ${Math.round(totalTime / requestCount)}ms`);
      
      // Verify all responses are consistent
      const allConsistent = responses.every(response => 
        response.data.cache.totalAddresses === responses[0].data.cache.totalAddresses
      );
      console.log(`   All responses consistent: ${allConsistent ? '✅' : '❌'}`);
      
    } catch (error) {
      console.log(`❌ Performance test failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🏁 Active Addresses Caching Test Completed\n');
}

// Run the test
console.log('\n🚀 Starting Active Addresses Caching Test\n');
console.log('This test verifies the file-based caching functionality\n');
console.log('Configuration:');
console.log(`  API Base URL: ${API_BASE_URL}`);
console.log('\n💡 Note: Make sure the API server is running (npm start)\n');

testAddressesCaching().then(() => {
  console.log('✅ All tests completed');
}).catch((error) => {
  console.error('❌ Test error:', error);
  process.exit(1);
});

