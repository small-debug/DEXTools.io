#!/usr/bin/env node

/**
 * Test script to verify Qubic RPC connection and tick number
 * This script tests the connection to Qubic RPC and shows the actual tick number
 */

const axios = require('axios');

const QUBIC_RPC_URL = process.env.QUBIC_RPC_URL || 'http://localhost:8000';

async function testQubicConnection() {
  console.log('🔍 Testing Qubic RPC Connection...\n');
  console.log(`📍 Qubic RPC URL: ${QUBIC_RPC_URL}\n`);

  try {
    // Test tick-info endpoint
    console.log('1. Testing /tick-info endpoint...');
    const tickInfoResponse = await axios.get(`${QUBIC_RPC_URL}/tick-info`, {
      timeout: 10000
    });
    
    console.log('✅ Qubic RPC Response:');
    console.log(JSON.stringify(tickInfoResponse.data, null, 2));
    
    // Extract tick number
    const tickInfo = tickInfoResponse.data.tickInfo || tickInfoResponse.data;
    const tickNumber = tickInfo.tick || tickInfo.currentTick || tickInfo.tickNumber;
    
    console.log(`\n📊 Current Tick Number: ${tickNumber}`);
    
    if (tickNumber && tickNumber > 0) {
      console.log('✅ Successfully retrieved tick number from Qubic RPC!');
    } else {
      console.log('⚠️  Warning: Tick number is 0 or undefined');
    }

  } catch (error) {
    console.error('❌ Failed to connect to Qubic RPC:');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Possible solutions:');
      console.log('1. Make sure Qubic RPC is running on', QUBIC_RPC_URL);
      console.log('2. Check if the Qubic RPC service is started');
      console.log('3. Verify the correct port (usually 8000)');
      console.log('4. Check firewall settings');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Possible solutions:');
      console.log('1. Check the QUBIC_RPC_URL environment variable');
      console.log('2. Verify the hostname/IP address is correct');
    }
    
    process.exit(1);
  }

  // Test our API transformation
  console.log('\n2. Testing API transformation...');
  try {
    const { QubicClient } = require('./src/services/qubicClient');
    const client = new QubicClient();
    
    const latestBlock = await client.getLatestBlock();
    console.log('✅ API Transformation Result:');
    console.log(JSON.stringify(latestBlock, null, 2));
    
    if (latestBlock.block && latestBlock.block.blockNumber > 0) {
      console.log('✅ API is correctly returning tick number as block number!');
    } else {
      console.log('⚠️  Warning: API is returning block number as 0');
    }
    
  } catch (error) {
    console.error('❌ API transformation failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testQubicConnection().catch(console.error);
}

module.exports = { testQubicConnection };
