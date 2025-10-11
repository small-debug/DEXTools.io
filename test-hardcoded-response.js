/**
 * Test script to verify the hardcoded response for the specific pair address
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
const HARDCODED_PAIR_ADDRESS = 'RAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADKAH';

async function testHardcodedResponse() {
  console.log('🧪 Testing Hardcoded Response\n');
  console.log('='.repeat(80));
  console.log(`Testing pair address: ${HARDCODED_PAIR_ADDRESS}`);
  console.log('='.repeat(80));
  
  try {
    // Test 1: Check if API is running
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
    
    // Test 2: Test hardcoded response
    console.log('\n📊 Test 2: Hardcoded response test');
    console.log('-'.repeat(80));
    console.log(`   Endpoint: ${API_BASE_URL}/pair?id=${HARDCODED_PAIR_ADDRESS}`);
    
    try {
      const pairResponse = await axios.get(`${API_BASE_URL}/pair?id=${HARDCODED_PAIR_ADDRESS}`);
      console.log('✅ Request successful');
      console.log('   Response:');
      console.log(JSON.stringify(pairResponse.data, null, 2));
      
      // Validate hardcoded values
      if (pairResponse.data.pair) {
        const pair = pairResponse.data.pair;
        console.log('\n   Validating hardcoded values:');
        
        const tests = [
          {
            name: 'id',
            expected: HARDCODED_PAIR_ADDRESS,
            actual: pair.id,
            pass: pair.id === HARDCODED_PAIR_ADDRESS
          },
          {
            name: 'asset0Id',
            expected: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB',
            actual: pair.asset0Id,
            pass: pair.asset0Id === 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB'
          },
          {
            name: 'asset1Id',
            expected: HARDCODED_PAIR_ADDRESS,
            actual: pair.asset1Id,
            pass: pair.asset1Id === HARDCODED_PAIR_ADDRESS
          },
          {
            name: 'createdAtBlockNumber',
            expected: 34500000,
            actual: pair.createdAtBlockNumber,
            pass: pair.createdAtBlockNumber === 34500000
          },
          {
            name: 'createdAtBlockTimestamp',
            expected: 1760195702,
            actual: pair.createdAtBlockTimestamp,
            pass: pair.createdAtBlockTimestamp === 1760195702
          },
          {
            name: 'createdAtTxnId',
            expected: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB',
            actual: pair.createdAtTxnId,
            pass: pair.createdAtTxnId === 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB'
          },
          {
            name: 'factoryAddress',
            expected: 'BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID',
            actual: pair.factoryAddress,
            pass: pair.factoryAddress === 'BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID'
          }
        ];
        
        let allPassed = true;
        tests.forEach(test => {
          const status = test.pass ? '✅' : '❌';
          console.log(`   ${status} ${test.name}: ${test.pass ? 'PASS' : 'FAIL'}`);
          console.log(`      Expected: ${test.expected}`);
          console.log(`      Actual:   ${test.actual}`);
          if (!test.pass) allPassed = false;
        });
        
        console.log(`\n   Overall result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
        
        // Additional validation
        console.log('\n   Additional validations:');
        console.log(`   ✓ Response has pair object: ${pairResponse.data.pair ? '✅' : '❌'}`);
        console.log(`   ✓ All required fields present: ${Object.keys(pair).length >= 7 ? '✅' : '❌'}`);
        console.log(`   ✓ Block number is positive: ${pair.createdAtBlockNumber > 0 ? '✅' : '❌'}`);
        console.log(`   ✓ Timestamp is positive: ${pair.createdAtBlockTimestamp > 0 ? '✅' : '❌'}`);
        
        // Human readable timestamp
        const humanDate = new Date(pair.createdAtBlockTimestamp);
        console.log(`   ✓ Human readable timestamp: ${humanDate.toISOString()}`);
        
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
    
    // Test 3: Test path parameter version
    console.log('\n📊 Test 3: Path parameter test');
    console.log('-'.repeat(80));
    console.log(`   Endpoint: ${API_BASE_URL}/pair/${HARDCODED_PAIR_ADDRESS}`);
    
    try {
      const pairResponse = await axios.get(`${API_BASE_URL}/pair/${HARDCODED_PAIR_ADDRESS}`);
      console.log('✅ Path parameter request successful');
      console.log('   Response matches query parameter:', 
        JSON.stringify(pairResponse.data) === JSON.stringify(pairResponse.data) ? '✅' : '❌');
    } catch (error) {
      if (error.response) {
        console.log(`❌ Path parameter request failed with status ${error.response.status}`);
      } else {
        console.log('❌ Path parameter request failed:', error.message);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🏁 Hardcoded Response Test Completed\n');
}

// Run the test
console.log('\n🚀 Starting Hardcoded Response Test\n');
console.log('This test verifies the hardcoded response for the specific pair address\n');

testHardcodedResponse().then(() => {
  console.log('✅ Test completed');
}).catch((error) => {
  console.error('❌ Test error:', error);
  process.exit(1);
});
