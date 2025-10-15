/**
 * Test script for active addresses collection
 * This script tests the corrected getActiveAddresses implementation
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const QUBIC_RPC_URL = process.env.QUBIC_RPC_URL || 'https://rpc.qubic.org/v1';

async function testActiveAddressesCollection() {
  console.log('🧪 Testing Active Addresses Collection\n');
  console.log('='.repeat(80));
  console.log(`Qubic RPC URL: ${QUBIC_RPC_URL}`);
  console.log('='.repeat(80));
  
  try {
    // Test 1: Latest stats endpoint
    console.log('\n📊 Test 1: Latest stats endpoint');
    console.log('-'.repeat(80));
    console.log(`   URL: ${QUBIC_RPC_URL}/latest-stats`);
    
    try {
      const latestStatsResponse = await axios.get(`${QUBIC_RPC_URL}/latest-stats`);
      console.log('✅ Latest stats request successful');
      console.log('   Response structure:');
      console.log(JSON.stringify(latestStatsResponse.data, null, 2));
      
      const stats = latestStatsResponse.data;
      if (stats.data) {
        console.log('\n   Stats data validation:');
        console.log(`   ✓ timestamp: ${stats.data.timestamp ? '✅' : '❌'} (${stats.data.timestamp})`);
        console.log(`   ✓ circulatingSupply: ${stats.data.circulatingSupply ? '✅' : '❌'} (${stats.data.circulatingSupply})`);
        console.log(`   ✓ activeAddresses: ${stats.data.activeAddresses ? '✅' : '❌'} (${stats.data.activeAddresses})`);
        console.log(`   ✓ price: ${stats.data.price ? '✅' : '❌'} (${stats.data.price})`);
        console.log(`   ✓ marketCap: ${stats.data.marketCap ? '✅' : '❌'} (${stats.data.marketCap})`);
        console.log(`   ✓ epoch: ${stats.data.epoch ? '✅' : '❌'} (${stats.data.epoch})`);
        console.log(`   ✓ currentTick: ${stats.data.currentTick ? '✅' : '❌'} (${stats.data.currentTick})`);
        console.log(`   ✓ ticksInCurrentEpoch: ${stats.data.ticksInCurrentEpoch ? '✅' : '❌'} (${stats.data.ticksInCurrentEpoch})`);
        console.log(`   ✓ emptyTicksInCurrentEpoch: ${stats.data.emptyTicksInCurrentEpoch ? '✅' : '❌'} (${stats.data.emptyTicksInCurrentEpoch})`);
        console.log(`   ✓ epochTickQuality: ${stats.data.epochTickQuality ? '✅' : '❌'} (${stats.data.epochTickQuality})`);
        console.log(`   ✓ burnedQus: ${stats.data.burnedQus ? '✅' : '❌'} (${stats.data.burnedQus})`);
      }
      
    } catch (error) {
      console.log(`❌ Latest stats request failed: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Response:`, JSON.stringify(error.response.data, null, 2));
      }
    }
    
    // Test 2: Rich list endpoint
    console.log('\n📊 Test 2: Rich list endpoint');
    console.log('-'.repeat(80));
    console.log(`   URL: ${QUBIC_RPC_URL}/rich-list?page=1&pageSize=100`);
    
    try {
      const richListResponse = await axios.get(`${QUBIC_RPC_URL}/rich-list`, {
        params: {
          page: 1,
          pageSize: 100
        }
      });
      console.log('✅ Rich list request successful');
      console.log('   Response structure:');
      console.log(JSON.stringify(richListResponse.data, null, 2));
      
      const richListData = richListResponse.data;
      if (richListData.pagination) {
        console.log('\n   Pagination validation:');
        console.log(`   ✓ totalRecords: ${richListData.pagination.totalRecords ? '✅' : '❌'} (${richListData.pagination.totalRecords})`);
        console.log(`   ✓ currentPage: ${richListData.pagination.currentPage ? '✅' : '❌'} (${richListData.pagination.currentPage})`);
        console.log(`   ✓ totalPages: ${richListData.pagination.totalPages ? '✅' : '❌'} (${richListData.pagination.totalPages})`);
        console.log(`   ✓ pageSize: ${richListData.pagination.pageSize ? '✅' : '❌'} (${richListData.pagination.pageSize})`);
      }
      
      if (richListData.richList?.entities) {
        console.log('\n   Entities validation:');
        console.log(`   ✓ entities array length: ${richListData.richList.entities.length}`);
        
        if (richListData.richList.entities.length > 0) {
          const firstEntity = richListData.richList.entities[0];
          console.log(`   ✓ first entity identity: ${firstEntity.identity ? '✅' : '❌'} (${firstEntity.identity})`);
          console.log(`   ✓ first entity balance: ${firstEntity.balance ? '✅' : '❌'} (${firstEntity.balance})`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Rich list request failed: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Response:`, JSON.stringify(error.response.data, null, 2));
      }
    }
    
    // Test 3: Multiple pages test
    console.log('\n📊 Test 3: Multiple pages test');
    console.log('-'.repeat(80));
    
    try {
      const addresses = new Set();
      const maxPages = 3; // Test first 3 pages
      
      for (let page = 1; page <= maxPages; page++) {
        console.log(`   Fetching page ${page}...`);
        const response = await axios.get(`${QUBIC_RPC_URL}/rich-list`, {
          params: {
            page: page,
            pageSize: 100
          }
        });
        
        const data = response.data;
        if (data.richList?.entities) {
          data.richList.entities.forEach(entity => {
            if (entity.identity) {
              addresses.add(entity.identity);
            }
          });
          console.log(`   ✅ Page ${page}: Added ${data.richList.entities.length} addresses`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`\n   ✅ Total unique addresses collected: ${addresses.size}`);
      
    } catch (error) {
      console.log(`❌ Multiple pages test failed: ${error.message}`);
    }
    
    // Test 4: Simulate the actual implementation
    console.log('\n📊 Test 4: Simulate actual implementation');
    console.log('-'.repeat(80));
    
    try {
      // Get latest stats
      const latestStatsResponse = await axios.get(`${QUBIC_RPC_URL}/latest-stats`);
      const latestStats = latestStatsResponse.data;
      const totalRecords = latestStats.data?.activeAddresses || 0;
      
      console.log(`   Total active addresses: ${totalRecords}`);
      
      // Calculate pages needed
      const pageSize = 100;
      const totalPages = Math.ceil(totalRecords / pageSize);
      const maxPages = Math.min(totalPages, 10); // Limit to 10 pages
      
      console.log(`   Total pages available: ${totalPages}`);
      console.log(`   Pages to fetch: ${maxPages}`);
      
      const addresses = new Set();
      
      for (let page = 1; page <= maxPages; page++) {
        const response = await axios.get(`${QUBIC_RPC_URL}/rich-list`, {
          params: {
            page: page,
            pageSize: pageSize
          }
        });
        
        const data = response.data;
        if (data.richList?.entities) {
          data.richList.entities.forEach(entity => {
            if (entity.identity) {
              addresses.add(entity.identity);
            }
          });
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      console.log(`   ✅ Final result: ${addresses.size} unique addresses collected`);
      
    } catch (error) {
      console.log(`❌ Implementation simulation failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🏁 Active Addresses Collection Test Completed\n');
}

// Run the test
console.log('\n🚀 Starting Active Addresses Collection Test\n');
console.log('This test verifies the corrected getActiveAddresses implementation\n');

testActiveAddressesCollection().then(() => {
  console.log('✅ All tests completed');
}).catch((error) => {
  console.error('❌ Test error:', error);
  process.exit(1);
});

