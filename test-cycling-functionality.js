/**
 * Test script for cycling functionality
 * This script tests the continuous cycling process
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

async function testCyclingFunctionality() {
  console.log('🧪 Testing Cycling Functionality\n');
  console.log('='.repeat(80));
  console.log('This test verifies the continuous cycling process:');
  console.log('1. Fetch active addresses');
  console.log('2. Process transactions for each address');
  console.log('3. Filter and save events');
  console.log('4. Repeat the cycle');
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
    
    // Test 2: Check cycling stats (before starting)
    console.log('\n📊 Test 2: Check initial cycling stats');
    console.log('-'.repeat(80));
    try {
      const cyclingResponse = await axios.get(`${API_BASE_URL}/events/cycling/stats`);
      console.log('✅ Cycling stats request successful');
      console.log('   Response:', JSON.stringify(cyclingResponse.data, null, 2));
      
      const stats = cyclingResponse.data.cyclingStats;
      if (stats) {
        console.log(`   Cycle count: ${stats.cycleCount}`);
        console.log(`   Total cycles completed: ${stats.totalCyclesCompleted}`);
        console.log(`   Last collection time: ${stats.lastCollectionTime || 'Never'}`);
        console.log(`   Last cycle duration: ${Math.round(stats.lastCycleDuration / 1000)}s`);
        console.log(`   Average cycle duration: ${Math.round(stats.averageCycleDuration / 1000)}s`);
        console.log(`   Processed addresses: ${stats.processedAddresses}`);
        console.log(`   Total events found: ${stats.totalEventsFound}`);
        console.log(`   Active addresses count: ${stats.activeAddressesCount}`);
        console.log(`   Is collecting: ${stats.isCollecting ? '✅' : '❌'}`);
        console.log(`   Next cycle scheduled: ${stats.nextCycleScheduled ? '✅' : '❌'}`);
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Cycling stats request failed with status ${error.response.status}`);
        console.log('   Error response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Cycling stats request failed:', error.message);
      }
    }
    
    // Test 3: Check events collection status
    console.log('\n📊 Test 3: Check events collection status');
    console.log('-'.repeat(80));
    try {
      const statusResponse = await axios.get(`${API_BASE_URL}/events/status`);
      console.log('✅ Status request successful');
      
      const status = statusResponse.data.status;
      console.log(`   Collection initialized: ${status.isInitialized ? '✅' : '❌'}`);
      console.log(`   Collection running: ${status.isCollecting ? '✅' : '❌'}`);
      console.log(`   Latest tick: ${status.collector?.latestTick || 'N/A'}`);
      console.log(`   Active addresses: ${status.collector?.activeAddressesCount || 0}`);
      
    } catch (error) {
      console.log(`❌ Status request failed: ${error.message}`);
    }
    
    // Test 4: Check events data
    console.log('\n📊 Test 4: Check events data');
    console.log('-'.repeat(80));
    try {
      const eventsResponse = await axios.get(`${API_BASE_URL}/events`);
      console.log('✅ Events request successful');
      console.log(`   Total events: ${eventsResponse.data.total || 0}`);
      console.log(`   Events array length: ${eventsResponse.data.events?.length || 0}`);
      
      if (eventsResponse.data.events && eventsResponse.data.events.length > 0) {
        const firstEvent = eventsResponse.data.events[0];
        console.log('\n   First event structure:');
        console.log(`   ✓ block.blockNumber: ${firstEvent.block?.blockNumber ? '✅' : '❌'} (${firstEvent.block?.blockNumber})`);
        console.log(`   ✓ block.blockTimestamp: ${firstEvent.block?.blockTimestamp ? '✅' : '❌'} (${firstEvent.block?.blockTimestamp})`);
        console.log(`   ✓ txnId: ${firstEvent.txnId ? '✅' : '❌'} (${firstEvent.txnId})`);
        console.log(`   ✓ maker: ${firstEvent.maker ? '✅' : '❌'} (${firstEvent.maker})`);
        console.log(`   ✓ pairId: ${firstEvent.pairId ? '✅' : '❌'} (${firstEvent.pairId})`);
        console.log(`   ✓ eventType: ${firstEvent.eventType ? '✅' : '❌'} (${firstEvent.eventType})`);
        console.log(`   ✓ asset0In: ${firstEvent.asset0In ? '✅' : '❌'} (${firstEvent.asset0In})`);
        console.log(`   ✓ asset1Out: ${firstEvent.asset1Out ? '✅' : '❌'} (${firstEvent.asset1Out})`);
        console.log(`   ✓ reserves.asset0: ${firstEvent.reserves?.asset0 ? '✅' : '❌'} (${firstEvent.reserves?.asset0})`);
        console.log(`   ✓ reserves.asset1: ${firstEvent.reserves?.asset1 ? '✅' : '❌'} (${firstEvent.reserves?.asset1})`);
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Events request failed with status ${error.response.status}`);
        console.log('   Error response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Events request failed:', error.message);
      }
    }
    
    // Test 5: Monitor cycling progress
    console.log('\n📊 Test 5: Monitor cycling progress');
    console.log('-'.repeat(80));
    console.log('   Monitoring cycling progress for 2 minutes...');
    console.log('   (This will show how the cycling process works)');
    
    const monitoringDuration = 2 * 60 * 1000; // 2 minutes
    const checkInterval = 30 * 1000; // 30 seconds
    const startTime = Date.now();
    
    const monitorInterval = setInterval(async () => {
      try {
        const cyclingResponse = await axios.get(`${API_BASE_URL}/events/cycling/stats`);
        const stats = cyclingResponse.data.cyclingStats;
        
        if (stats) {
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          console.log(`   [${elapsed}s] Cycle #${stats.cycleCount}, Events: ${stats.totalEventsFound}, Duration: ${Math.round(stats.lastCycleDuration / 1000)}s`);
        }
      } catch (error) {
        console.log(`   [${Math.round((Date.now() - startTime) / 1000)}s] Failed to get cycling stats: ${error.message}`);
      }
    }, checkInterval);
    
    // Wait for monitoring duration
    await new Promise(resolve => setTimeout(resolve, monitoringDuration));
    clearInterval(monitorInterval);
    
    // Test 6: Final cycling stats
    console.log('\n📊 Test 6: Final cycling stats');
    console.log('-'.repeat(80));
    try {
      const cyclingResponse = await axios.get(`${API_BASE_URL}/events/cycling/stats`);
      console.log('✅ Final cycling stats request successful');
      
      const stats = cyclingResponse.data.cyclingStats;
      if (stats) {
        console.log(`   Cycle count: ${stats.cycleCount}`);
        console.log(`   Total cycles completed: ${stats.totalCyclesCompleted}`);
        console.log(`   Last collection time: ${stats.lastCollectionTime || 'Never'}`);
        console.log(`   Last cycle duration: ${Math.round(stats.lastCycleDuration / 1000)}s`);
        console.log(`   Average cycle duration: ${Math.round(stats.averageCycleDuration / 1000)}s`);
        console.log(`   Processed addresses: ${stats.processedAddresses}`);
        console.log(`   Total events found: ${stats.totalEventsFound}`);
        console.log(`   Active addresses count: ${stats.activeAddressesCount}`);
        console.log(`   Is collecting: ${stats.isCollecting ? '✅' : '❌'}`);
        console.log(`   Next cycle scheduled: ${stats.nextCycleScheduled ? '✅' : '❌'}`);
        
        // Calculate cycling efficiency
        if (stats.totalCyclesCompleted > 0) {
          const avgEventsPerCycle = Math.round(stats.totalEventsFound / stats.totalCyclesCompleted);
          const avgAddressesPerCycle = Math.round(stats.processedAddresses / stats.totalCyclesCompleted);
          console.log(`\n   📊 Cycling Efficiency:`);
          console.log(`   Average events per cycle: ${avgEventsPerCycle}`);
          console.log(`   Average addresses per cycle: ${avgAddressesPerCycle}`);
          console.log(`   Events per address: ${avgAddressesPerCycle > 0 ? (avgEventsPerCycle / avgAddressesPerCycle).toFixed(3) : 'N/A'}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Final cycling stats request failed: ${error.message}`);
    }
    
    // Test 7: Verify cycling process
    console.log('\n📊 Test 7: Verify cycling process');
    console.log('-'.repeat(80));
    
    const verificationChecks = [
      {
        name: 'Cycling is active',
        check: async () => {
          const response = await axios.get(`${API_BASE_URL}/events/cycling/stats`);
          return response.data.cyclingStats?.isCollecting === true;
        }
      },
      {
        name: 'Events are being collected',
        check: async () => {
          const response = await axios.get(`${API_BASE_URL}/events`);
          return (response.data.total || 0) > 0;
        }
      },
      {
        name: 'Addresses are being processed',
        check: async () => {
          const response = await axios.get(`${API_BASE_URL}/events/cycling/stats`);
          return (response.data.cyclingStats?.processedAddresses || 0) > 0;
        }
      },
      {
        name: 'Cycles are completing',
        check: async () => {
          const response = await axios.get(`${API_BASE_URL}/events/cycling/stats`);
          return (response.data.cyclingStats?.totalCyclesCompleted || 0) > 0;
        }
      }
    ];
    
    for (const check of verificationChecks) {
      try {
        const result = await check.check();
        console.log(`   ${check.name}: ${result ? '✅' : '❌'}`);
      } catch (error) {
        console.log(`   ${check.name}: ❌ (Error: ${error.message})`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🏁 Cycling Functionality Test Completed\n');
}

// Run the test
console.log('\n🚀 Starting Cycling Functionality Test\n');
console.log('This test verifies the continuous cycling process');
console.log('Configuration:');
console.log(`  API Base URL: ${API_BASE_URL}`);
console.log('\n💡 Note: Make sure the API server is running (npm start)\n');
console.log('⚠️  Note: This test will monitor the cycling process for 2 minutes\n');

testCyclingFunctionality().then(() => {
  console.log('✅ All tests completed');
}).catch((error) => {
  console.error('❌ Test error:', error);
  process.exit(1);
});

