/**
 * Test script to verify ALL active addresses are fetched and saved
 * This script ensures we get the complete ~594,723 addresses
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

async function testAllAddressesFetch() {
  console.log('🧪 Testing ALL Active Addresses Fetch\n');
  console.log('='.repeat(80));
  console.log('This test verifies that we fetch and save ALL ~594,723 active addresses');
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
    
    // Test 2: Check current cache status
    console.log('\n📊 Test 2: Check current cache status');
    console.log('-'.repeat(80));
    try {
      const cacheResponse = await axios.get(`${API_BASE_URL}/events/addresses/cache`);
      console.log('✅ Cache info request successful');
      
      const cache = cacheResponse.data.cache;
      console.log(`   Cache exists: ${cache.exists ? '✅' : '❌'}`);
      console.log(`   Total addresses: ${cache.totalAddresses}`);
      console.log(`   Last updated: ${cache.lastUpdated || 'Never'}`);
      console.log(`   Cache age: ${cache.age === Infinity ? 'N/A' : Math.round(cache.age / 60000) + ' minutes'}`);
      
      if (cache.totalAddresses < 500000) {
        console.log(`   ⚠️  WARNING: Only ${cache.totalAddresses} addresses (expected ~594,723)`);
      } else {
        console.log(`   ✅ Good: ${cache.totalAddresses} addresses (close to expected ~594,723)`);
      }
      
    } catch (error) {
      console.log(`❌ Cache info request failed: ${error.message}`);
    }
    
    // Test 3: Force refresh all addresses
    console.log('\n📊 Test 3: Force refresh all addresses');
    console.log('-'.repeat(80));
    console.log('⚠️  WARNING: This will fetch ALL active addresses and may take 15-30 minutes');
    console.log('   You can monitor progress using the progress endpoint');
    
    // Ask user if they want to proceed
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise((resolve) => {
      rl.question('\nDo you want to proceed with force refresh? (y/N): ', resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('❌ Force refresh cancelled by user');
      return;
    }
    
    console.log('\n🚀 Starting force refresh...');
    const startTime = Date.now();
    
    try {
      const forceRefreshResponse = await axios.post(`${API_BASE_URL}/events/addresses/force-refresh`);
      console.log('✅ Force refresh request successful');
      console.log('   Response:', JSON.stringify(forceRefreshResponse.data, null, 2));
      
      const refreshData = forceRefreshResponse.data;
      console.log(`   Success: ${refreshData.success ? '✅' : '❌'}`);
      console.log(`   Addresses count: ${refreshData.addressesCount}`);
      console.log(`   Message: ${refreshData.message}`);
      
      // Verify we got a reasonable number of addresses
      if (refreshData.addressesCount >= 500000) {
        console.log(`   ✅ SUCCESS: Got ${refreshData.addressesCount} addresses (close to expected ~594,723)`);
      } else {
        console.log(`   ⚠️  WARNING: Only got ${refreshData.addressesCount} addresses (expected ~594,723)`);
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Force refresh request failed with status ${error.response.status}`);
        console.log('   Error response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Force refresh request failed:', error.message);
      }
    }
    
    // Test 4: Verify cache file
    console.log('\n📊 Test 4: Verify cache file');
    console.log('-'.repeat(80));
    try {
      const cacheFilePath = path.join(__dirname, 'src', 'data', 'active-addresses.json');
      console.log(`   Cache file path: ${cacheFilePath}`);
      
      const fileContent = await fs.readFile(cacheFilePath, 'utf8');
      const cacheData = JSON.parse(fileContent);
      
      console.log('✅ Cache file verification:');
      console.log(`   File size: ${(fileContent.length / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Addresses in file: ${cacheData.addresses?.length || 0}`);
      console.log(`   Last updated: ${cacheData.lastUpdated}`);
      console.log(`   Total addresses: ${cacheData.totalAddresses}`);
      console.log(`   Source: ${cacheData.source}`);
      
      // Verify we got close to the expected number
      const expectedAddresses = 594723; // From latest stats
      const actualAddresses = cacheData.addresses?.length || 0;
      const percentage = Math.round((actualAddresses / expectedAddresses) * 100);
      
      console.log(`\n   📊 Fetch Results:`);
      console.log(`   Expected addresses: ${expectedAddresses}`);
      console.log(`   Actual addresses: ${actualAddresses}`);
      console.log(`   Completion: ${percentage}%`);
      
      if (percentage >= 95) {
        console.log('   ✅ EXCELLENT! Got 95%+ of expected addresses');
      } else if (percentage >= 80) {
        console.log('   ✅ GOOD! Got 80%+ of expected addresses');
      } else if (percentage >= 50) {
        console.log('   ⚠️  PARTIAL: Got 50%+ of expected addresses');
      } else {
        console.log('   ❌ LOW: Got less than 50% of expected addresses');
      }
      
      // Show sample addresses
      if (cacheData.addresses && cacheData.addresses.length > 0) {
        console.log('\n   Sample addresses:');
        cacheData.addresses.slice(0, 5).forEach((addr, index) => {
          console.log(`   ${index + 1}. ${addr}`);
        });
        if (cacheData.addresses.length > 5) {
          console.log(`   ... and ${cacheData.addresses.length - 5} more`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Cache file verification failed: ${error.message}`);
    }
    
    // Test 5: Test cycling with full addresses
    console.log('\n📊 Test 5: Test cycling with full addresses');
    console.log('-'.repeat(80));
    try {
      const cyclingResponse = await axios.get(`${API_BASE_URL}/events/cycling/stats`);
      console.log('✅ Cycling stats request successful');
      
      const stats = cyclingResponse.data.cyclingStats;
      if (stats) {
        console.log(`   Active addresses count: ${stats.activeAddressesCount}`);
        console.log(`   Is collecting: ${stats.isCollecting ? '✅' : '❌'}`);
        console.log(`   Next cycle scheduled: ${stats.nextCycleScheduled ? '✅' : '❌'}`);
        
        if (stats.activeAddressesCount >= 500000) {
          console.log(`   ✅ SUCCESS: Cycling will process ${stats.activeAddressesCount} addresses`);
        } else {
          console.log(`   ⚠️  WARNING: Cycling will only process ${stats.activeAddressesCount} addresses`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Cycling stats request failed: ${error.message}`);
    }
    
    // Test 6: Test events endpoint
    console.log('\n📊 Test 6: Test events endpoint');
    console.log('-'.repeat(80));
    try {
      const eventsResponse = await axios.get(`${API_BASE_URL}/events`);
      console.log('✅ Events request successful');
      console.log(`   Total events: ${eventsResponse.data.total || 0}`);
      console.log(`   Events array length: ${eventsResponse.data.events?.length || 0}`);
      
    } catch (error) {
      console.log(`❌ Events request failed: ${error.message}`);
    }
    
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n⏱️  Total test time: ${Math.round(totalTime / 60)} minutes ${totalTime % 60} seconds`);
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🏁 All Addresses Fetch Test Completed\n');
}

// Run the test
console.log('\n🚀 Starting All Addresses Fetch Test\n');
console.log('This test verifies that we fetch and save ALL active addresses');
console.log('Configuration:');
console.log(`  API Base URL: ${API_BASE_URL}`);
console.log('\n💡 Note: Make sure the API server is running (npm start)\n');
console.log('⚠️  WARNING: This test will fetch ALL active addresses and may take 15-30 minutes\n');

testAllAddressesFetch().then(() => {
  console.log('✅ All tests completed');
}).catch((error) => {
  console.error('❌ Test error:', error);
  process.exit(1);
});

