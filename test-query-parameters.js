/**
 * Test script for query parameter endpoints
 * This script tests all endpoints that now support query parameters
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

// Test data
const TEST_BLOCK_NUMBER = 12345;
const TEST_ASSET_ID = 'GARTHFANXMPXMDPEZFQPWFPYMHOAWTKILINCTRMVLFFVATKVJRKEDYXGHJBF';
const TEST_EXCHANGE_ID = 'BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID';
const TEST_PAIR_ID = 'RAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADKAH';

async function testQueryParameterEndpoints() {
  console.log('🧪 Testing Query Parameter Endpoints\n');
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
    
    // Test 2: Block endpoint with query parameter
    console.log('\n📊 Test 2: GET /block with query parameter');
    console.log('-'.repeat(80));
    console.log(`   Endpoint: ${API_BASE_URL}/block?number=${TEST_BLOCK_NUMBER}`);
    
    try {
      const blockResponse = await axios.get(`${API_BASE_URL}/block?number=${TEST_BLOCK_NUMBER}`);
      console.log('✅ Block request successful');
      console.log('   Response structure:', blockResponse.data.block ? '✅' : '❌');
      if (blockResponse.data.block) {
        console.log(`   Block number: ${blockResponse.data.block.blockNumber}`);
        console.log(`   Block timestamp: ${blockResponse.data.block.blockTimestamp}`);
      }
    } catch (error) {
      if (error.response) {
        console.log(`❌ Block request failed with status ${error.response.status}`);
        console.log('   Error response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Block request failed:', error.message);
      }
    }
    
    // Test 3: Asset endpoint with query parameter
    console.log('\n📊 Test 3: GET /asset with query parameter');
    console.log('-'.repeat(80));
    console.log(`   Endpoint: ${API_BASE_URL}/asset?id=${TEST_ASSET_ID}`);
    
    try {
      const assetResponse = await axios.get(`${API_BASE_URL}/asset?id=${TEST_ASSET_ID}`);
      console.log('✅ Asset request successful');
      console.log('   Response structure:', assetResponse.data.asset ? '✅' : '❌');
      if (assetResponse.data.asset) {
        console.log(`   Asset ID: ${assetResponse.data.asset.id}`);
        console.log(`   Asset name: ${assetResponse.data.asset.name || 'N/A'}`);
        console.log(`   Asset symbol: ${assetResponse.data.asset.symbol || 'N/A'}`);
      }
    } catch (error) {
      if (error.response) {
        console.log(`❌ Asset request failed with status ${error.response.status}`);
        console.log('   Error response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Asset request failed:', error.message);
      }
    }
    
    // Test 4: Exchange endpoint with query parameter
    console.log('\n📊 Test 4: GET /exchange with query parameter');
    console.log('-'.repeat(80));
    console.log(`   Endpoint: ${API_BASE_URL}/exchange?id=${TEST_EXCHANGE_ID}`);
    
    try {
      const exchangeResponse = await axios.get(`${API_BASE_URL}/exchange?id=${TEST_EXCHANGE_ID}`);
      console.log('✅ Exchange request successful');
      console.log('   Response structure:', exchangeResponse.data.exchange ? '✅' : '❌');
      if (exchangeResponse.data.exchange) {
        console.log(`   Exchange name: ${exchangeResponse.data.exchange.name || 'N/A'}`);
        console.log(`   Factory address: ${exchangeResponse.data.exchange.factoryAddress || 'N/A'}`);
      }
    } catch (error) {
      if (error.response) {
        console.log(`❌ Exchange request failed with status ${error.response.status}`);
        console.log('   Error response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Exchange request failed:', error.message);
      }
    }
    
    // Test 5: Pair endpoint with query parameter
    console.log('\n📊 Test 5: GET /pair with query parameter');
    console.log('-'.repeat(80));
    console.log(`   Endpoint: ${API_BASE_URL}/pair?id=${TEST_PAIR_ID}`);
    
    try {
      const pairResponse = await axios.get(`${API_BASE_URL}/pair?id=${TEST_PAIR_ID}`);
      console.log('✅ Pair request successful');
      console.log('   Response structure:', pairResponse.data.pair ? '✅' : '❌');
      if (pairResponse.data.pair) {
        console.log(`   Pair ID: ${pairResponse.data.pair.id}`);
        console.log(`   Created at block: ${pairResponse.data.pair.createdAtBlockNumber}`);
        console.log(`   Created at timestamp: ${pairResponse.data.pair.createdAtBlockTimestamp}`);
      }
    } catch (error) {
      if (error.response) {
        console.log(`❌ Pair request failed with status ${error.response.status}`);
        console.log('   Error response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Pair request failed:', error.message);
      }
    }
    
    // Test 6: Missing parameter tests
    console.log('\n📊 Test 6: Missing parameter tests (should return 400)');
    console.log('-'.repeat(80));
    
    const missingParamTests = [
      { name: 'Block', url: `${API_BASE_URL}/block` },
      { name: 'Asset', url: `${API_BASE_URL}/asset` },
      { name: 'Exchange', url: `${API_BASE_URL}/exchange` },
      { name: 'Pair', url: `${API_BASE_URL}/pair` }
    ];
    
    for (const test of missingParamTests) {
      try {
        const response = await axios.get(test.url);
        console.log(`❌ ${test.name} should have returned 400, but got:`, response.status);
      } catch (error) {
        if (error.response && error.response.status === 400) {
          console.log(`✅ ${test.name} correctly returned 400 Bad Request`);
          console.log(`   Error: ${error.response.data.error}`);
        } else {
          console.log(`❌ ${test.name} unexpected error:`, error.message);
        }
      }
    }
    
    // Test 7: Compare query vs path parameters
    console.log('\n📊 Test 7: Compare query vs path parameters');
    console.log('-'.repeat(80));
    
    try {
      // Test block endpoint
      const blockQuery = await axios.get(`${API_BASE_URL}/block?number=${TEST_BLOCK_NUMBER}`);
      const blockPath = await axios.get(`${API_BASE_URL}/block/${TEST_BLOCK_NUMBER}`);
      console.log(`✅ Block query vs path: ${JSON.stringify(blockQuery.data) === JSON.stringify(blockPath.data) ? 'MATCH' : 'DIFFERENT'}`);
      
      // Test asset endpoint
      const assetQuery = await axios.get(`${API_BASE_URL}/asset?id=${TEST_ASSET_ID}`);
      const assetPath = await axios.get(`${API_BASE_URL}/asset/${TEST_ASSET_ID}`);
      console.log(`✅ Asset query vs path: ${JSON.stringify(assetQuery.data) === JSON.stringify(assetPath.data) ? 'MATCH' : 'DIFFERENT'}`);
      
      // Test exchange endpoint
      const exchangeQuery = await axios.get(`${API_BASE_URL}/exchange?id=${TEST_EXCHANGE_ID}`);
      const exchangePath = await axios.get(`${API_BASE_URL}/exchange/${TEST_EXCHANGE_ID}`);
      console.log(`✅ Exchange query vs path: ${JSON.stringify(exchangeQuery.data) === JSON.stringify(exchangePath.data) ? 'MATCH' : 'DIFFERENT'}`);
      
      // Test pair endpoint
      const pairQuery = await axios.get(`${API_BASE_URL}/pair?id=${TEST_PAIR_ID}`);
      const pairPath = await axios.get(`${API_BASE_URL}/pair/${TEST_PAIR_ID}`);
      console.log(`✅ Pair query vs path: ${JSON.stringify(pairQuery.data) === JSON.stringify(pairPath.data) ? 'MATCH' : 'DIFFERENT'}`);
      
    } catch (error) {
      console.log(`❌ Comparison test failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🏁 Query Parameter Test Completed\n');
}

// Run the test
console.log('\n🚀 Starting Query Parameter Endpoint Test\n');
console.log('This test verifies all endpoints that support query parameters\n');

testQueryParameterEndpoints().then(() => {
  console.log('✅ All tests completed');
}).catch((error) => {
  console.error('❌ Test error:', error);
  process.exit(1);
});
