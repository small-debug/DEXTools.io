/**
 * Test script for the /pair endpoint
 * This script tests the pair retrieval functionality
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
const QUBIC_RPC_URL = process.env.QUBIC_RPC_URL || 'https://rpc.qubic.org/v1';

// Test pair address (using hardcoded response address)
const TEST_PAIR_ADDRESS = process.env.TEST_PAIR_ADDRESS || 'RAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADKAH';

async function testPairEndpoint() {
  console.log('🧪 Testing /pair endpoint implementation\n');
  console.log('='.repeat(80));
  
  try {
    // Test 1: Check if API is running
    console.log('\n📊 Test 1: Health check');
    console.log('-'.repeat(80));
    try {
      const healthResponse = await axios.get('http://localhost:3000/health');
      console.log('✅ API is running');
      console.log(`   Status: ${healthResponse.data.status}`);
      console.log(`   Version: ${healthResponse.data.version}`);
    } catch (error) {
      console.error('❌ API is not running. Please start the API with: npm start');
      return;
    }
    
    // Test 2: Test /pair endpoint with query parameter
    console.log('\n📊 Test 2: GET /pair with query parameter');
    console.log('-'.repeat(80));
    console.log(`   Endpoint: ${API_BASE_URL}/pair?id=${TEST_PAIR_ADDRESS}`);
    
    try {
      const pairResponse = await axios.get(`${API_BASE_URL}/pair?id=${TEST_PAIR_ADDRESS}`);
      console.log('✅ Request successful');
      console.log('   Response structure:');
      console.log(JSON.stringify(pairResponse.data, null, 2));
      
      // Validate response structure
      if (pairResponse.data.pair) {
        const pair = pairResponse.data.pair;
        console.log('\n   Validating response fields:');
        console.log(`   ✓ id: ${pair.id ? '✅' : '❌'} (${pair.id})`);
        console.log(`   ✓ asset0Id: ${pair.asset0Id ? '✅' : '❌'} (${pair.asset0Id})`);
        console.log(`   ✓ asset1Id: ${pair.asset1Id ? '✅' : '❌'} (${pair.asset1Id})`);
        console.log(`   ✓ createdAtBlockNumber: ${pair.createdAtBlockNumber >= 0 ? '✅' : '❌'} (${pair.createdAtBlockNumber})`);
        console.log(`   ✓ createdAtBlockTimestamp: ${pair.createdAtBlockTimestamp >= 0 ? '✅' : '❌'} (${pair.createdAtBlockTimestamp})`);
        console.log(`   ✓ createdAtTxnId: ${pair.createdAtTxnId ? '✅' : '❌'} (${pair.createdAtTxnId})`);
        console.log(`   ✓ factoryAddress: ${pair.factoryAddress ? '✅' : '❌'} (${pair.factoryAddress})`);
        
        // Verify expected values
        console.log('\n   Verifying expected values:');
        console.log(`   ✓ id equals parameter: ${pair.id === TEST_PAIR_ADDRESS ? '✅' : '❌'}`);
        console.log(`   ✓ asset0Id is null address: ${pair.asset0Id === 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB' ? '✅' : '❌'}`);
        console.log(`   ✓ asset1Id equals parameter: ${pair.asset1Id === TEST_PAIR_ADDRESS ? '✅' : '❌'}`);
        console.log(`   ✓ factoryAddress is QX: ${pair.factoryAddress === 'BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID' ? '✅' : '❌'}`);
        
        // Verify hardcoded values for specific pair
        if (TEST_PAIR_ADDRESS === 'RAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADKAH') {
          console.log('\n   Verifying hardcoded values:');
          console.log(`   ✓ createdAtBlockNumber is 34500000: ${pair.createdAtBlockNumber === 34500000 ? '✅' : '❌'} (${pair.createdAtBlockNumber})`);
          console.log(`   ✓ createdAtBlockTimestamp is 1760195702: ${pair.createdAtBlockTimestamp === 1760195702 ? '✅' : '❌'} (${pair.createdAtBlockTimestamp})`);
          console.log(`   ✓ createdAtTxnId is FXIB: ${pair.createdAtTxnId === 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB' ? '✅' : '❌'} (${pair.createdAtTxnId})`);
        }
      } else {
        console.log('❌ Response does not contain "pair" object');
      }
    } catch (error) {
      if (error.response) {
        console.log(`❌ Request failed with status ${error.response.status}`);
        console.log('   Error response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Request failed:', error.message);
      }
    }
    
    // Test 3: Test /pair endpoint with path parameter
    console.log('\n📊 Test 3: GET /pair/:pairId with path parameter');
    console.log('-'.repeat(80));
    console.log(`   Endpoint: ${API_BASE_URL}/pair/${TEST_PAIR_ADDRESS}`);
    
    try {
      const pairResponse = await axios.get(`${API_BASE_URL}/pair/${TEST_PAIR_ADDRESS}`);
      console.log('✅ Request successful');
      console.log('   Response structure matches Test 2:', pairResponse.data.pair ? '✅' : '❌');
    } catch (error) {
      if (error.response) {
        console.log(`❌ Request failed with status ${error.response.status}`);
        console.log('   Error response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Request failed:', error.message);
      }
    }
    
    // Test 4: Test /pair endpoint without id parameter (should fail)
    console.log('\n📊 Test 4: GET /pair without id parameter (should return error)');
    console.log('-'.repeat(80));
    console.log(`   Endpoint: ${API_BASE_URL}/pair`);
    
    try {
      const pairResponse = await axios.get(`${API_BASE_URL}/pair`);
      console.log('❌ Should have returned an error, but got:', pairResponse.data);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Correctly returned 400 Bad Request');
        console.log('   Error message:', error.response.data.error);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // Test 5: Direct Qubic RPC test (for debugging)
    console.log('\n📊 Test 5: Direct Qubic RPC test');
    console.log('-'.repeat(80));
    console.log(`   Testing connection to: ${QUBIC_RPC_URL}`);
    
    try {
      const tickResponse = await axios.get(`${QUBIC_RPC_URL}/tick-info`);
      console.log('✅ Qubic RPC is accessible');
      console.log(`   Latest tick: ${tickResponse.data.tickInfo?.tick || tickResponse.data.tick || 'unknown'}`);
    } catch (error) {
      console.log('❌ Cannot connect to Qubic RPC');
      console.log('   Error:', error.message);
      console.log('   Make sure QUBIC_RPC_URL is correct in your .env file');
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🏁 Test suite completed\n');
}

// Run the tests
console.log('\n🚀 Starting /pair endpoint test suite\n');
console.log('Configuration:');
console.log(`  API Base URL: ${API_BASE_URL}`);
console.log(`  Qubic RPC URL: ${QUBIC_RPC_URL}`);
console.log(`  Test Pair Address: ${TEST_PAIR_ADDRESS}`);
console.log('\n💡 Note: Make sure the API server is running (npm start)\n');

testPairEndpoint().then(() => {
  console.log('✅ All tests completed');
}).catch((error) => {
  console.error('❌ Test suite error:', error);
  process.exit(1);
});

