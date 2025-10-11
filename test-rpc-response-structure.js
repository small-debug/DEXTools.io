/**
 * Test script to validate our implementation against the actual Qubic RPC response structure
 * This script tests the parsing logic with the real response data
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const QUBIC_RPC_URL = process.env.QUBIC_RPC_URL || 'https://rpc.qubic.org/v1';
const TEST_PAIR_ADDRESS = 'GARTHFANXMPXMDPEZFQPWFPYMHOAWTKILINCTRMVLFFVATKVJRKEDYXGHJBF';

// Constants from our implementation
const NULL_ADDRESS = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB';
const QX_ADDRESS = 'BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID';
const CREATION_AMOUNT = 1000000000;

async function testRpcResponseStructure() {
  console.log('🧪 Testing RPC Response Structure Parsing\n');
  console.log('='.repeat(80));
  console.log(`Testing with pair address: ${TEST_PAIR_ADDRESS}`);
  console.log('='.repeat(80));
  
  try {
    // Step 1: Get latest tick
    console.log('\n📊 Step 1: Getting latest tick...');
    const latestTickResponse = await axios.get(`${QUBIC_RPC_URL}/tick-info`);
    const latestTick = latestTickResponse.data.tickInfo?.tick || latestTickResponse.data.tick || 0;
    console.log(`✅ Latest tick: ${latestTick}`);
    
    // Step 2: Get transfer transactions
    console.log('\n📊 Step 2: Getting transfer transactions...');
    const transfersResponse = await axios.get(`${QUBIC_RPC_URL}/identities/${TEST_PAIR_ADDRESS}/transfer-transactions`, {
      params: {
        startTick: 0,
        endTick: latestTick
      }
    });
    
    console.log('✅ RPC Response received');
    console.log('Response structure:');
    console.log(`  - Has transferTransactionsPerTick: ${!!transfersResponse.data.transferTransactionsPerTick}`);
    console.log(`  - transferTransactionsPerTick length: ${transfersResponse.data.transferTransactionsPerTick?.length || 0}`);
    
    // Step 3: Parse transactions (same logic as our implementation)
    console.log('\n📊 Step 3: Parsing transactions...');
    const transferTransactionsPerTick = transfersResponse.data.transferTransactionsPerTick || [];
    const transactions = [];
    
    // Flatten all transactions from all ticks
    transferTransactionsPerTick.forEach(tickData => {
      if (tickData.transactions && Array.isArray(tickData.transactions)) {
        transactions.push(...tickData.transactions);
      }
    });
    
    console.log(`✅ Parsed ${transactions.length} transactions across ${transferTransactionsPerTick.length} ticks`);
    
    // Step 4: Search for creation transaction
    console.log('\n📊 Step 4: Searching for creation transaction...');
    console.log(`Looking for: sourceId=${TEST_PAIR_ADDRESS}, destId=${QX_ADDRESS}, amount=${CREATION_AMOUNT}`);
    
    let creationTransaction = null;
    let foundTransactions = 0;
    
    for (const tx of transactions) {
      const sourceId = tx.sourceId || '';
      const destId = tx.destId || '';
      const amount = parseInt(tx.amount || 0);
      
      // Count transactions that match our criteria
      if (sourceId === TEST_PAIR_ADDRESS && destId === QX_ADDRESS) {
        foundTransactions++;
        console.log(`   Found QX transaction: amount=${amount}, tickNumber=${tx.tickNumber}, txId=${tx.txId}`);
        
        if (amount === CREATION_AMOUNT) {
          creationTransaction = tx;
          console.log(`✅ Found creation transaction!`);
          break;
        }
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`  - Total transactions: ${transactions.length}`);
    console.log(`  - QX transactions found: ${foundTransactions}`);
    console.log(`  - Creation transaction found: ${creationTransaction ? '✅ YES' : '❌ NO'}`);
    
    if (creationTransaction) {
      console.log(`\n🎯 Creation Transaction Details:`);
      console.log(`  - tickNumber: ${creationTransaction.tickNumber}`);
      console.log(`  - txId: ${creationTransaction.txId}`);
      console.log(`  - sourceId: ${creationTransaction.sourceId}`);
      console.log(`  - destId: ${creationTransaction.destId}`);
      console.log(`  - amount: ${creationTransaction.amount}`);
      
      // Step 5: Get tick data for timestamp
      console.log(`\n📊 Step 5: Getting tick data for timestamp...`);
      try {
        const tickDataResponse = await axios.get(`${QUBIC_RPC_URL}/ticks/${creationTransaction.tickNumber}/tick-data`);
        const timestamp = tickDataResponse.data.tickData?.timestamp || tickDataResponse.data.timestamp;
        const timestampInSeconds = Math.floor(parseInt(timestamp) / 1000);
        
        console.log(`✅ Tick data retrieved:`);
        console.log(`  - Raw timestamp: ${timestamp}`);
        console.log(`  - Timestamp in seconds: ${timestampInSeconds}`);
        console.log(`  - Human readable: ${new Date(timestampInSeconds * 1000).toISOString()}`);
        
        // Final pair data
        console.log(`\n🎉 Final Pair Data:`);
        const pairData = {
          id: TEST_PAIR_ADDRESS,
          asset0Id: NULL_ADDRESS,
          asset1Id: TEST_PAIR_ADDRESS,
          createdAtBlockNumber: creationTransaction.tickNumber,
          createdAtBlockTimestamp: timestampInSeconds,
          createdAtTxnId: creationTransaction.txId,
          factoryAddress: QX_ADDRESS
        };
        
        console.log(JSON.stringify(pairData, null, 2));
        
      } catch (tickError) {
        console.error(`❌ Failed to get tick data: ${tickError.message}`);
      }
    } else {
      console.log(`\n❌ No creation transaction found. This might not be a valid pair address.`);
    }
    
  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    if (error.response) {
      console.error(`Response status: ${error.response.status}`);
      console.error(`Response data:`, JSON.stringify(error.response.data, null, 2));
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🏁 RPC Response Structure Test Completed\n');
}

// Run the test
console.log('\n🚀 Starting RPC Response Structure Test\n');
console.log('This test validates our parsing logic against the actual Qubic RPC response\n');

testRpcResponseStructure().then(() => {
  console.log('✅ Test completed');
}).catch((error) => {
  console.error('❌ Test error:', error);
  process.exit(1);
});
