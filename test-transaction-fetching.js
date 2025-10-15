/**
 * Test script for transaction fetching
 * This script tests the corrected transaction fetching implementation
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const QUBIC_RPC_URL = process.env.QUBIC_RPC_URL || 'https://rpc.qubic.org/v1';

async function testTransactionFetching() {
  console.log('🧪 Testing Transaction Fetching\n');
  console.log('='.repeat(80));
  console.log(`Qubic RPC URL: ${QUBIC_RPC_URL}`);
  console.log('='.repeat(80));
  
  try {
    // Test addresses (mix of active and inactive)
    const testAddresses = [
      'JAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVKHO', // From your log
      'BYBYFUMBVLPUCANXEXTSKVMGFCJBMTLPPOFVPNSATABMWDGTMFXPLZLBCXJL', // From your log
      'BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID', // QX address (should have transactions)
      'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB'  // NULL address (should have transactions)
    ];
    
    // Test 1: Get latest tick
    console.log('\n📊 Test 1: Get latest tick');
    console.log('-'.repeat(80));
    try {
      const latestTickResponse = await axios.get(`${QUBIC_RPC_URL}/tick-info`);
      const latestTick = latestTickResponse.data.tickInfo?.tick || latestTickResponse.data.tick || 0;
      console.log(`✅ Latest tick: ${latestTick}`);
      
      // Test each address
      for (let i = 0; i < testAddresses.length; i++) {
        const address = testAddresses[i];
        console.log(`\n📊 Test ${i + 2}: Testing address ${address}`);
        console.log('-'.repeat(80));
        
        try {
          // Test transfer-transactions endpoint
          const response = await axios.get(`${QUBIC_RPC_URL}/identities/${address}/transfer-transactions`, {
            params: {
              startTick: Math.max(0, latestTick - 1000), // Last 1000 ticks
              endTick: latestTick
            }
          });
          
          console.log(`✅ Transfer transactions request successful for ${address}`);
          console.log('   Response structure:', JSON.stringify(response.data, null, 2));
          
          // Analyze response structure
          if (response.data.transferTransactionsPerTick) {
            console.log(`   ✓ transferTransactionsPerTick array found (${response.data.transferTransactionsPerTick.length} ticks)`);
            
            let totalTransactions = 0;
            response.data.transferTransactionsPerTick.forEach((tickData, index) => {
              if (tickData.transactions) {
                totalTransactions += tickData.transactions.length;
                console.log(`   ✓ Tick ${index}: ${tickData.transactions.length} transactions`);
              }
            });
            
            console.log(`   📊 Total transactions found: ${totalTransactions}`);
            
            // Show sample transaction structure
            if (totalTransactions > 0) {
              const firstTick = response.data.transferTransactionsPerTick.find(tick => tick.transactions && tick.transactions.length > 0);
              if (firstTick && firstTick.transactions[0]) {
                const sampleTx = firstTick.transactions[0];
                console.log('\n   Sample transaction structure:');
                console.log(`   ✓ sourceId: ${sampleTx.sourceId ? '✅' : '❌'} (${sampleTx.sourceId})`);
                console.log(`   ✓ destId: ${sampleTx.destId ? '✅' : '❌'} (${sampleTx.destId})`);
                console.log(`   ✓ amount: ${sampleTx.amount ? '✅' : '❌'} (${sampleTx.amount})`);
                console.log(`   ✓ inputType: ${sampleTx.inputType ? '✅' : '❌'} (${sampleTx.inputType})`);
                console.log(`   ✓ inputSize: ${sampleTx.inputSize ? '✅' : '❌'} (${sampleTx.inputSize})`);
                console.log(`   ✓ inputHex: ${sampleTx.inputHex ? '✅' : '❌'} (${sampleTx.inputHex?.substring(0, 32)}...)`);
                console.log(`   ✓ tickNumber: ${sampleTx.tickNumber ? '✅' : '❌'} (${sampleTx.tickNumber})`);
                console.log(`   ✓ txId: ${sampleTx.txId ? '✅' : '❌'} (${sampleTx.txId})`);
              }
            }
          } else if (response.data.transactions) {
            console.log(`   ✓ transactions array found (${response.data.transactions.length} transactions)`);
          } else {
            console.log('   ⚠️  No transactions found in response');
          }
          
        } catch (error) {
          if (error.response && error.response.status === 404) {
            console.log(`ℹ️  No transactions found for ${address} (404 - normal for inactive addresses)`);
          } else {
            console.log(`❌ Request failed for ${address}: ${error.message}`);
            if (error.response) {
              console.log(`   Status: ${error.response.status}`);
              console.log(`   Response:`, JSON.stringify(error.response.data, null, 2));
            }
          }
        }
      }
      
    } catch (error) {
      console.log(`❌ Failed to get latest tick: ${error.message}`);
    }
    
    // Test 3: Test the corrected implementation
    console.log('\n📊 Test 6: Test corrected implementation');
    console.log('-'.repeat(80));
    
    try {
      const EventsDataCollector = require('./src/services/eventsDataCollector');
      const collector = new EventsDataCollector();
      await collector.initialize();
      
      // Test with a single address
      const testAddress = 'BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID'; // QX address
      console.log(`   Testing with QX address: ${testAddress}`);
      
      const latestTick = await collector.getLatestTick();
      console.log(`   Latest tick: ${latestTick}`);
      
      const transactions = await collector.getAddressTransactions(testAddress, Math.max(0, latestTick - 1000), latestTick);
      console.log(`   ✅ Transactions fetched: ${transactions.length}`);
      
      if (transactions.length > 0) {
        console.log('   Sample transaction:');
        const sampleTx = transactions[0];
        console.log(`   ✓ sourceId: ${sampleTx.sourceId}`);
        console.log(`   ✓ destId: ${sampleTx.destId}`);
        console.log(`   ✓ amount: ${sampleTx.amount}`);
        console.log(`   ✓ inputType: ${sampleTx.inputType}`);
        console.log(`   ✓ inputHex: ${sampleTx.inputHex?.substring(0, 32)}...`);
      }
      
    } catch (error) {
      console.log(`❌ Implementation test failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🏁 Transaction Fetching Test Completed\n');
}

// Run the test
console.log('\n🚀 Starting Transaction Fetching Test\n');
console.log('This test verifies the corrected transaction fetching implementation\n');

testTransactionFetching().then(() => {
  console.log('✅ All tests completed');
}).catch((error) => {
  console.error('❌ Test error:', error);
  process.exit(1);
});

