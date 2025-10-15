/**
 * Test script for the /events endpoint
 * This script tests the events data collection and serving functionality
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

async function testEventsEndpoint() {
  console.log('🧪 Testing /events endpoint implementation\n');
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
    
    // Test 2: Events collection status
    console.log('\n📊 Test 2: Events collection status');
    console.log('-'.repeat(80));
    try {
      const statusResponse = await axios.get(`${API_BASE_URL}/events/status`);
      console.log('✅ Status request successful');
      console.log('   Response:', JSON.stringify(statusResponse.data, null, 2));
      
      const status = statusResponse.data.status;
      console.log(`   Collection initialized: ${status.isInitialized ? '✅' : '❌'}`);
      console.log(`   Collection running: ${status.isCollecting ? '✅' : '❌'}`);
      console.log(`   Latest tick: ${status.collector?.latestTick || 'N/A'}`);
      console.log(`   Active addresses: ${status.collector?.activeAddressesCount || 0}`);
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Status request failed with status ${error.response.status}`);
        console.log('   Error response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Status request failed:', error.message);
      }
    }
    
    // Test 3: Events endpoint without parameters
    console.log('\n📊 Test 3: GET /events without parameters');
    console.log('-'.repeat(80));
    console.log(`   Endpoint: ${API_BASE_URL}/events`);
    
    try {
      const eventsResponse = await axios.get(`${API_BASE_URL}/events`);
      console.log('✅ Events request successful');
      console.log('   Response structure:', eventsResponse.data.events ? '✅' : '❌');
      
      if (eventsResponse.data.events) {
        console.log(`   Total events: ${eventsResponse.data.total || 0}`);
        console.log(`   Events array length: ${eventsResponse.data.events.length}`);
        
        if (eventsResponse.data.events.length > 0) {
          const firstEvent = eventsResponse.data.events[0];
          console.log('\n   First event structure:');
          console.log(`   ✓ block.blockNumber: ${firstEvent.block?.blockNumber ? '✅' : '❌'} (${firstEvent.block?.blockNumber})`);
          console.log(`   ✓ block.blockTimestamp: ${firstEvent.block?.blockTimestamp ? '✅' : '❌'} (${firstEvent.block?.blockTimestamp})`);
          console.log(`   ✓ txnId: ${firstEvent.txnId ? '✅' : '❌'} (${firstEvent.txnId})`);
          console.log(`   ✓ txnIndex: ${firstEvent.txnIndex !== undefined ? '✅' : '❌'} (${firstEvent.txnIndex})`);
          console.log(`   ✓ eventIndex: ${firstEvent.eventIndex !== undefined ? '✅' : '❌'} (${firstEvent.eventIndex})`);
          console.log(`   ✓ maker: ${firstEvent.maker ? '✅' : '❌'} (${firstEvent.maker})`);
          console.log(`   ✓ pairId: ${firstEvent.pairId ? '✅' : '❌'} (${firstEvent.pairId})`);
          console.log(`   ✓ eventType: ${firstEvent.eventType ? '✅' : '❌'} (${firstEvent.eventType})`);
          console.log(`   ✓ asset0In: ${firstEvent.asset0In ? '✅' : '❌'} (${firstEvent.asset0In})`);
          console.log(`   ✓ asset1Out: ${firstEvent.asset1Out ? '✅' : '❌'} (${firstEvent.asset1Out})`);
          console.log(`   ✓ reserves.asset0: ${firstEvent.reserves?.asset0 ? '✅' : '❌'} (${firstEvent.reserves?.asset0})`);
          console.log(`   ✓ reserves.asset1: ${firstEvent.reserves?.asset1 ? '✅' : '❌'} (${firstEvent.reserves?.asset1})`);
        }
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Events request failed with status ${error.response.status}`);
        console.log('   Error response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Events request failed:', error.message);
      }
    }
    
    // Test 4: Events endpoint with block range
    console.log('\n📊 Test 4: GET /events with block range');
    console.log('-'.repeat(80));
    console.log(`   Endpoint: ${API_BASE_URL}/events?fromBlock=1000&toBlock=2000`);
    
    try {
      const eventsResponse = await axios.get(`${API_BASE_URL}/events?fromBlock=1000&toBlock=2000`);
      console.log('✅ Events request with range successful');
      console.log(`   Total events in range: ${eventsResponse.data.total || 0}`);
      
      // Validate that all events are within the specified range
      if (eventsResponse.data.events && eventsResponse.data.events.length > 0) {
        const allInRange = eventsResponse.data.events.every(event => 
          event.block.blockNumber >= 1000 && event.block.blockNumber <= 2000
        );
        console.log(`   All events in range: ${allInRange ? '✅' : '❌'}`);
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Events range request failed with status ${error.response.status}`);
        console.log('   Error response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Events range request failed:', error.message);
      }
    }
    
    // Test 5: Invalid parameters
    console.log('\n📊 Test 5: Invalid parameters (should return 400)');
    console.log('-'.repeat(80));
    
    const invalidTests = [
      { name: 'Negative fromBlock', url: `${API_BASE_URL}/events?fromBlock=-1` },
      { name: 'Negative toBlock', url: `${API_BASE_URL}/events?toBlock=-1` },
      { name: 'Invalid fromBlock', url: `${API_BASE_URL}/events?fromBlock=abc` },
      { name: 'Invalid toBlock', url: `${API_BASE_URL}/events?toBlock=xyz` },
      { name: 'fromBlock > toBlock', url: `${API_BASE_URL}/events?fromBlock=2000&toBlock=1000` }
    ];
    
    for (const test of invalidTests) {
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
    
    // Test 6: Response format validation
    console.log('\n📊 Test 6: Response format validation');
    console.log('-'.repeat(80));
    
    try {
      const eventsResponse = await axios.get(`${API_BASE_URL}/events`);
      
      if (eventsResponse.data.events) {
        console.log('✅ Response format validation:');
        console.log(`   ✓ Has events array: ${Array.isArray(eventsResponse.data.events) ? '✅' : '❌'}`);
        console.log(`   ✓ Has total count: ${typeof eventsResponse.data.total === 'number' ? '✅' : '❌'}`);
        console.log(`   ✓ Has fromBlock: ${eventsResponse.data.fromBlock !== undefined ? '✅' : '❌'}`);
        console.log(`   ✓ Has toBlock: ${eventsResponse.data.toBlock !== undefined ? '✅' : '❌'}`);
        
        // Validate event structure
        if (eventsResponse.data.events.length > 0) {
          const event = eventsResponse.data.events[0];
          const requiredFields = [
            'block', 'txnId', 'txnIndex', 'eventIndex', 'maker', 
            'pairId', 'eventType', 'asset0In', 'asset1Out', 'reserves'
          ];
          
          console.log('\n   Event structure validation:');
          requiredFields.forEach(field => {
            const hasField = event.hasOwnProperty(field);
            console.log(`   ✓ ${field}: ${hasField ? '✅' : '❌'}`);
          });
        }
      }
      
    } catch (error) {
      console.log(`❌ Response format validation failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🏁 Events Endpoint Test Completed\n');
}

// Run the test
console.log('\n🚀 Starting /events endpoint test suite\n');
console.log('Configuration:');
console.log(`  API Base URL: ${API_BASE_URL}`);
console.log('\n💡 Note: Make sure the API server is running (npm start)\n');
console.log('⚠️  Note: Events data collection may take time to initialize\n');

testEventsEndpoint().then(() => {
  console.log('✅ All tests completed');
}).catch((error) => {
  console.error('❌ Test suite error:', error);
  process.exit(1);
});

