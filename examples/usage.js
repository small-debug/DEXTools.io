/**
 * DEXTools Qubic API Usage Examples
 * 
 * This file demonstrates how to use the DEXTools Qubic API
 * to fetch blockchain data and integrate with DEXTools platform.
 */

const axios = require('axios');

// API Configuration
const API_BASE_URL = 'http://localhost:3000/api/v1';

// Helper function to make API requests
async function makeRequest(endpoint, params = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
}

// Example 1: Get Latest Block Information
async function getLatestBlock() {
  console.log('🔍 Fetching latest block...');
  try {
    const result = await makeRequest('/latest-block');
    console.log('✅ Latest Block (DEXTools format):', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('❌ Failed to fetch latest block:', error.message);
  }
}

// Example 2: Get Specific Block by Number
async function getBlockByNumber(blockNumber) {
  console.log(`🔍 Fetching block ${blockNumber}...`);
  try {
    const result = await makeRequest(`/block/${blockNumber}`);
    console.log(`✅ Block ${blockNumber} (DEXTools format):`, JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error(`❌ Failed to fetch block ${blockNumber}:`, error.message);
  }
}

// Example 3: Get Asset Information
async function getAssetInfo(assetId) {
  console.log(`🔍 Fetching asset ${assetId}...`);
  try {
    const result = await makeRequest(`/asset/${assetId}`);
    console.log(`✅ Asset ${assetId} (DEXTools format):`, JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error(`❌ Failed to fetch asset ${assetId}:`, error.message);
  }
}

// Example 4: Get Exchange Information
async function getExchangeInfo(exchangeId) {
  console.log(`🔍 Fetching exchange ${exchangeId}...`);
  try {
    const result = await makeRequest(`/exchange/${exchangeId}`);
    console.log(`✅ Exchange ${exchangeId} (DEXTools format):`, JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error(`❌ Failed to fetch exchange ${exchangeId}:`, error.message);
  }
}

// Example 5: Get Trading Pair Information
async function getPairInfo(pairId) {
  console.log(`🔍 Fetching pair ${pairId}...`);
  try {
    const result = await makeRequest(`/pair/${pairId}`);
    console.log(`✅ Pair ${pairId} (DEXTools format):`, JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error(`❌ Failed to fetch pair ${pairId}:`, error.message);
  }
}

// Example 6: Get Events with Filters
async function getEvents(filters = {}) {
  console.log('🔍 Fetching events with filters:', filters);
  try {
    const result = await makeRequest('/events', filters);
    console.log('✅ Events (DEXTools format):', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('❌ Failed to fetch events:', error.message);
  }
}

// Example 7: Get API Documentation
async function getApiDocs() {
  console.log('🔍 Fetching API documentation...');
  try {
    const result = await makeRequest('/docs');
    console.log('✅ API Documentation:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('❌ Failed to fetch API docs:', error.message);
  }
}

// Example 8: Health Check
async function checkHealth() {
  console.log('🔍 Checking API health...');
  try {
    const response = await axios.get('http://localhost:3000/health');
    console.log('✅ Health Status:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
}

// Example 9: Batch Operations
async function batchOperations() {
  console.log('🚀 Running batch operations...');
  
  try {
    // Run multiple operations in parallel
    const [latestBlock, events, health] = await Promise.all([
      getLatestBlock(),
      getEvents({ page: 1, limit: 10 }),
      checkHealth()
    ]);
    
    console.log('✅ Batch operations completed successfully');
    return { latestBlock, events, health };
  } catch (error) {
    console.error('❌ Batch operations failed:', error.message);
  }
}

// Example 10: Error Handling
async function demonstrateErrorHandling() {
  console.log('🔍 Demonstrating error handling...');
  
  try {
    // This should fail with 400 error
    await makeRequest('/block/invalid-identifier');
  } catch (error) {
    console.log('✅ Error handling works:', error.response?.data?.error || error.message);
  }
  
  try {
    // This should fail with 404 error
    await makeRequest('/nonexistent-endpoint');
  } catch (error) {
    console.log('✅ 404 handling works:', error.response?.status);
  }
}

// Main execution function
async function main() {
  console.log('🚀 DEXTools Qubic API Examples\n');
  
  // Check if API is running
  await checkHealth();
  console.log('');
  
  // Run examples
  await getLatestBlock();
  console.log('');
  
  await getBlockByNumber(12345);
  console.log('');
  
  await getAssetInfo('0x1234567890abcdef');
  console.log('');
  
  await getExchangeInfo('0x567890abcdef1234');
  console.log('');
  
  await getPairInfo('pair123');
  console.log('');
  
  await getEvents({ page: 1, limit: 5, type: 'swap' });
  console.log('');
  
  await getApiDocs();
  console.log('');
  
  await batchOperations();
  console.log('');
  
  await demonstrateErrorHandling();
  
  console.log('\n✅ All examples completed!');
}

// Run examples if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getLatestBlock,
  getBlockByNumber,
  getAssetInfo,
  getExchangeInfo,
  getPairInfo,
  getEvents,
  getApiDocs,
  checkHealth,
  batchOperations,
  demonstrateErrorHandling
};
