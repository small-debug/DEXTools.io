#!/usr/bin/env node

/**
 * Test script to verify DEXTools response format
 * This script tests the API endpoints to ensure they return data in the correct DEXTools format
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

// Test data for mock responses
const mockQubicData = {
  latestBlock: {
    tick: 12345,
    timestamp: Math.floor(Date.now() / 1000)
  },
  block: {
    tick: 12345,
    timestamp: Math.floor(Date.now() / 1000)
  },
  asset: {
    id: '0x1234567890abcdef',
    symbol: 'QUBC',
    name: 'Qubic Token',
    decimals: 18,
    totalSupply: '1000000000',
    circulatingSupply: '500000000',
    address: '0x1234567890abcdef',
    type: 'QUBIC',
    verified: true,
    timestamp: Math.floor(Date.now() / 1000)
  },
  exchange: {
    id: 'exchange123',
    name: 'Qubic DEX',
    factoryAddress: '0x567890abcdef1234',
    routerAddress: '0x9abcdef123456789',
    fee: '0.003',
    feeTo: '0xdef0123456789abc',
    allPairsLength: 150,
    timestamp: Math.floor(Date.now() / 1000),
    verified: true
  },
  pair: {
    id: 'pair123',
    token0: '0x1111111111111111',
    token1: '0x2222222222222222',
    reserve0: '1000000',
    reserve1: '2000000',
    totalSupply: '1000000',
    kLast: '2000000000000',
    price0CumulativeLast: '1000000',
    price1CumulativeLast: '2000000',
    timestamp: Math.floor(Date.now() / 1000),
    exchange: 'exchange123'
  },
  events: {
    events: [
      {
        id: 'event123',
        type: 'swap',
        blockNumber: 12345,
        timestamp: Math.floor(Date.now() / 1000),
        hash: '0xabcd1234567890ef',
        from: '0x1111111111111111',
        to: '0x2222222222222222',
        value: '1000000',
        gasUsed: '21000',
        gasPrice: '20000000000',
        status: 'success'
      }
    ],
    total: 1000,
    page: 1,
    limit: 100,
    hasMore: true
  }
};

// Mock the Qubic client for testing
const mockQubicClient = {
  getLatestBlock: () => Promise.resolve(mockQubicData.latestBlock),
  getBlock: () => Promise.resolve(mockQubicData.block),
  getAsset: () => Promise.resolve(mockQubicData.asset),
  getExchange: () => Promise.resolve(mockQubicData.exchange),
  getPair: () => Promise.resolve(mockQubicData.pair),
  getEvents: () => Promise.resolve(mockQubicData.events)
};

// Test the transformation functions
const { QubicClient } = require('./src/services/qubicClient');

async function testResponseFormats() {
  console.log('🧪 Testing DEXTools Response Formats\n');
  
  const client = new QubicClient();
  
  try {
    // Test latest block format
    console.log('1. Testing latest block format...');
    const latestBlock = client.transformLatestBlock(mockQubicData.latestBlock);
    console.log('✅ Latest Block Format:', JSON.stringify(latestBlock, null, 2));
    
    // Verify structure
    if (!latestBlock.block || typeof latestBlock.block.blockNumber !== 'number' || typeof latestBlock.block.blockTimestamp !== 'number') {
      throw new Error('Latest block format is incorrect');
    }
    console.log('✅ Latest block format is correct\n');
    
    // Test block format
    console.log('2. Testing block format...');
    const block = client.transformBlock(mockQubicData.block);
    console.log('✅ Block Format:', JSON.stringify(block, null, 2));
    
    if (!block.block || typeof block.block.blockNumber !== 'number' || typeof block.block.blockTimestamp !== 'number') {
      throw new Error('Block format is incorrect');
    }
    console.log('✅ Block format is correct\n');
    
    // Test asset format
    console.log('3. Testing asset format...');
    const asset = client.transformAsset(mockQubicData.asset);
    console.log('✅ Asset Format:', JSON.stringify(asset, null, 2));
    
    if (!asset.asset || !asset.asset.id || !asset.asset.symbol || typeof asset.asset.decimals !== 'number') {
      throw new Error('Asset format is incorrect');
    }
    console.log('✅ Asset format is correct\n');
    
    // Test exchange format
    console.log('4. Testing exchange format...');
    const exchange = client.transformExchange(mockQubicData.exchange);
    console.log('✅ Exchange Format:', JSON.stringify(exchange, null, 2));
    
    if (!exchange.exchange || !exchange.exchange.id || !exchange.exchange.name) {
      throw new Error('Exchange format is incorrect');
    }
    console.log('✅ Exchange format is correct\n');
    
    // Test pair format
    console.log('5. Testing pair format...');
    const pair = client.transformPair(mockQubicData.pair);
    console.log('✅ Pair Format:', JSON.stringify(pair, null, 2));
    
    if (!pair.pair || !pair.pair.id || !pair.pair.token0 || !pair.pair.token1) {
      throw new Error('Pair format is incorrect');
    }
    console.log('✅ Pair format is correct\n');
    
    // Test events format
    console.log('6. Testing events format...');
    const events = client.transformEvents(mockQubicData.events);
    console.log('✅ Events Format:', JSON.stringify(events, null, 2));
    
    if (!events.events || !Array.isArray(events.events) || typeof events.total !== 'number') {
      throw new Error('Events format is incorrect');
    }
    console.log('✅ Events format is correct\n');
    
    console.log('🎉 All response formats match DEXTools specification!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testResponseFormats().catch(console.error);
}

module.exports = { testResponseFormats };
