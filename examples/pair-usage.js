/**
 * Example usage of the /pair endpoint
 * 
 * This script demonstrates how to use the pair endpoint to retrieve
 * pair (pool) information from the Qubic blockchain via the DEXTools API.
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

/**
 * Get pair information by address
 * @param {string} pairAddress - The Qubic pair address (identity)
 * @returns {Promise<Object>} Pair data
 */
async function getPairInfo(pairAddress) {
  try {
    console.log(`\n📊 Getting pair info for: ${pairAddress}`);
    console.log('-'.repeat(80));
    
    const response = await axios.get(`${API_BASE_URL}/pair`, {
      params: { id: pairAddress }
    });
    
    const pair = response.data.pair;
    
    console.log('✅ Success! Pair information:');
    console.log(`   ID: ${pair.id}`);
    console.log(`   Asset 0 (Base Token): ${pair.asset0Id}`);
    console.log(`   Asset 1 (Quote Token): ${pair.asset1Id}`);
    console.log(`   Created at Block: ${pair.createdAtBlockNumber}`);
    console.log(`   Created at Timestamp: ${pair.createdAtBlockTimestamp} (${new Date(pair.createdAtBlockTimestamp * 1000).toISOString()})`);
    console.log(`   Creation Transaction ID: ${pair.createdAtTxnId}`);
    console.log(`   Factory Address: ${pair.factoryAddress}`);
    
    return pair;
  } catch (error) {
    if (error.response) {
      console.error(`❌ API Error: ${error.response.status} - ${error.response.data.error || error.response.statusText}`);
    } else if (error.request) {
      console.error('❌ No response from API. Is the server running?');
    } else {
      console.error(`❌ Error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get pair information using path parameter (alternative method)
 * @param {string} pairAddress - The Qubic pair address (identity)
 * @returns {Promise<Object>} Pair data
 */
async function getPairInfoByPath(pairAddress) {
  try {
    console.log(`\n📊 Getting pair info (path param) for: ${pairAddress}`);
    console.log('-'.repeat(80));
    
    const response = await axios.get(`${API_BASE_URL}/pair/${pairAddress}`);
    
    const pair = response.data.pair;
    
    console.log('✅ Success! (Same result as query parameter method)');
    
    return pair;
  } catch (error) {
    if (error.response) {
      console.error(`❌ API Error: ${error.response.status} - ${error.response.data.error || error.response.statusText}`);
    } else if (error.request) {
      console.error('❌ No response from API. Is the server running?');
    } else {
      console.error(`❌ Error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Verify pair constants
 * @param {Object} pair - Pair data
 */
function verifyPairConstants(pair) {
  console.log(`\n🔍 Verifying Qubic-specific constants:`);
  console.log('-'.repeat(80));
  
  const NULL_ADDRESS = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB';
  const QX_ADDRESS = 'BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID';
  
  const asset0IsNull = pair.asset0Id === NULL_ADDRESS;
  const factoryIsQX = pair.factoryAddress === QX_ADDRESS;
  
  console.log(`   ✓ Asset0 is null address: ${asset0IsNull ? '✅ YES' : '❌ NO'}`);
  console.log(`   ✓ Factory is QX DEX: ${factoryIsQX ? '✅ YES' : '❌ NO'}`);
  console.log(`   ✓ Asset1 equals pair ID: ${pair.asset1Id === pair.id ? '✅ YES' : '❌ NO'}`);
  
  if (asset0IsNull && factoryIsQX) {
    console.log('\n✅ All constants verified successfully!');
  } else {
    console.log('\n⚠️  Warning: Some constants don\'t match expected values');
  }
}

/**
 * Main demonstration function
 */
async function main() {
  console.log('\n🚀 DEXTools Qubic API - Pair Endpoint Demo\n');
  console.log('='.repeat(80));
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log('='.repeat(80));
  
  // Example pair address (using hardcoded response address)
  const examplePairAddress = process.env.TEST_PAIR_ADDRESS || 'RAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADKAH';
  
  console.log(`\nℹ️  Using example pair address: ${examplePairAddress}`);
  console.log('   (Set TEST_PAIR_ADDRESS in .env to use a real pair address)\n');
  
  try {
    // Method 1: Query parameter
    const pair1 = await getPairInfo(examplePairAddress);
    
    // Method 2: Path parameter
    const pair2 = await getPairInfoByPath(examplePairAddress);
    
    // Verify constants
    verifyPairConstants(pair1);
    
    // Additional examples
    console.log('\n\n📚 Additional Examples:');
    console.log('='.repeat(80));
    
    console.log('\n1. Using cURL (query parameter):');
    console.log(`   curl "${API_BASE_URL}/pair?id=${examplePairAddress}"`);
    
    console.log('\n2. Using cURL (path parameter):');
    console.log(`   curl "${API_BASE_URL}/pair/${examplePairAddress}"`);
    
    console.log('\n3. Using JavaScript fetch:');
    console.log(`   const response = await fetch('${API_BASE_URL}/pair?id=${examplePairAddress}');`);
    console.log(`   const data = await response.json();`);
    
    console.log('\n4. Using Python requests:');
    console.log(`   import requests`);
    console.log(`   response = requests.get('${API_BASE_URL}/pair', params={'id': '${examplePairAddress}'})`);
    console.log(`   data = response.json()`);
    
  } catch (error) {
    console.error('\n❌ Demo failed. Please check:');
    console.error('   1. API server is running (npm start)');
    console.error('   2. Qubic RPC is accessible');
    console.error('   3. Pair address is valid');
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Demo completed successfully!\n');
}

// Run the demo
if (require.main === module) {
  main().catch((error) => {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  });
}

// Export functions for use in other scripts
module.exports = {
  getPairInfo,
  getPairInfoByPath,
  verifyPairConstants
};

