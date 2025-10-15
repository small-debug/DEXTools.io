/**
 * Test script for full active addresses fetching
 * This script tests fetching all ~594,723 active addresses
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

async function testFullAddressesFetch() {
  console.log('🧪 Testing Full Active Addresses Fetch\n');
  console.log('='.repeat(80));
  console.log('This test will fetch ALL active addresses (~594,723 addresses)');
  console.log('This may take 15-30 minutes depending on network speed');
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
    
    // Test 2: Check current progress
    console.log('\n📊 Test 2: Check current progress');
    console.log('-'.repeat(80));
    try {
      const progressResponse = await axios.get(`${API_BASE_URL}/events/addresses/progress`);
      console.log('✅ Progress request successful');
      console.log('   Response:', JSON.stringify(progressResponse.data, null, 2));
      
      const progress = progressResponse.data.progress;
      if (progress) {
        console.log(`   Total addresses: ${progress.totalAddresses}`);
        console.log(`   Total pages: ${progress.totalPages}`);
        console.log(`   Current addresses: ${progress.currentAddresses}`);
        console.log(`   Progress: ${progress.progressPercentage}%`);
        console.log(`   Remaining pages: ${progress.remainingPages}`);
        console.log(`   Cache age: ${Math.round(progress.cacheAge / 60000)} minutes`);
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Progress request failed with status ${error.response.status}`);
        console.log('   Error response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Progress request failed:', error.message);
      }
    }
    
    // Test 3: Check cache info
    console.log('\n📊 Test 3: Check cache info');
    console.log('-'.repeat(80));
    try {
      const cacheResponse = await axios.get(`${API_BASE_URL}/events/addresses/cache`);
      console.log('✅ Cache info request successful');
      
      const cache = cacheResponse.data.cache;
      console.log(`   Cache exists: ${cache.exists ? '✅' : '❌'}`);
      console.log(`   Total addresses: ${cache.totalAddresses}`);
      console.log(`   Last updated: ${cache.lastUpdated || 'Never'}`);
      console.log(`   Cache age: ${cache.age === Infinity ? 'N/A' : Math.round(cache.age / 60000) + ' minutes'}`);
      
    } catch (error) {
      console.log(`❌ Cache info request failed: ${error.message}`);
    }
    
    // Test 4: Start full refresh (this will take a long time)
    console.log('\n📊 Test 4: Start full address refresh');
    console.log('-'.repeat(80));
    console.log('⚠️  WARNING: This will fetch ALL active addresses and may take 15-30 minutes');
    console.log('   You can monitor progress using the progress endpoint');
    console.log('   You can also resume from a specific page if interrupted');
    
    // Ask user if they want to proceed
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise((resolve) => {
      rl.question('\nDo you want to proceed with full address fetch? (y/N): ', resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('❌ Full address fetch cancelled by user');
      return;
    }
    
    console.log('\n🚀 Starting full address fetch...');
    const startTime = Date.now();
    
    try {
      const refreshResponse = await axios.post(`${API_BASE_URL}/events/addresses/refresh`, {
        resumeFromPage: 1
      });
      console.log('✅ Full refresh request successful');
      console.log('   Response:', JSON.stringify(refreshResponse.data, null, 2));
      
      const refreshData = refreshResponse.data;
      console.log(`   Success: ${refreshData.success ? '✅' : '❌'}`);
      console.log(`   Addresses count: ${refreshData.addressesCount}`);
      console.log(`   Message: ${refreshData.message}`);
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Full refresh request failed with status ${error.response.status}`);
        console.log('   Error response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Full refresh request failed:', error.message);
      }
    }
    
    // Test 5: Check final progress
    console.log('\n📊 Test 5: Check final progress');
    console.log('-'.repeat(80));
    try {
      const progressResponse = await axios.get(`${API_BASE_URL}/events/addresses/progress`);
      console.log('✅ Final progress request successful');
      
      const progress = progressResponse.data.progress;
      if (progress) {
        console.log(`   Total addresses: ${progress.totalAddresses}`);
        console.log(`   Current addresses: ${progress.currentAddresses}`);
        console.log(`   Progress: ${progress.progressPercentage}%`);
        console.log(`   Remaining pages: ${progress.remainingPages}`);
      }
      
    } catch (error) {
      console.log(`❌ Final progress request failed: ${error.message}`);
    }
    
    // Test 6: Verify cache file
    console.log('\n📊 Test 6: Verify cache file');
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
        console.log('   ✅ Excellent! Got 95%+ of expected addresses');
      } else if (percentage >= 80) {
        console.log('   ⚠️  Good! Got 80%+ of expected addresses');
      } else {
        console.log('   ❌ Low completion rate. Consider resuming from a specific page');
      }
      
    } catch (error) {
      console.log(`❌ Cache file verification failed: ${error.message}`);
    }
    
    // Test 7: Test resume functionality
    console.log('\n📊 Test 7: Test resume functionality');
    console.log('-'.repeat(80));
    console.log('   Testing resume from page 100 (if we have enough addresses)');
    
    try {
      const progressResponse = await axios.get(`${API_BASE_URL}/events/addresses/progress`);
      const progress = progressResponse.data.progress;
      
      if (progress && progress.currentAddresses > 10000) {
        console.log('   Resuming from page 100...');
        const resumeResponse = await axios.post(`${API_BASE_URL}/events/addresses/refresh`, {
          resumeFromPage: 100
        });
        console.log('   Resume test successful:', resumeResponse.data.message);
      } else {
        console.log('   Not enough addresses to test resume functionality');
      }
      
    } catch (error) {
      console.log(`❌ Resume test failed: ${error.message}`);
    }
    
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n⏱️  Total test time: ${Math.round(totalTime / 60)} minutes ${totalTime % 60} seconds`);
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🏁 Full Addresses Fetch Test Completed\n');
}

// Run the test
console.log('\n🚀 Starting Full Active Addresses Fetch Test\n');
console.log('This test will attempt to fetch ALL active addresses from Qubic RPC');
console.log('Configuration:');
console.log(`  API Base URL: ${API_BASE_URL}`);
console.log('\n💡 Note: Make sure the API server is running (npm start)\n');
console.log('⚠️  WARNING: This test will make thousands of API requests and may take 15-30 minutes\n');

testFullAddressesFetch().then(() => {
  console.log('✅ All tests completed');
}).catch((error) => {
  console.error('❌ Test error:', error);
  process.exit(1);
});

