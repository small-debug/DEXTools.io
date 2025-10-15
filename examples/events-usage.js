const axios = require('axios');

/**
 * Example usage of the /events endpoint
 * This demonstrates how to fetch events (transactions, swaps, etc.) in a range of blocks
 */

async function getEventsExample() {
  try {
    console.log('🚀 DEXTools Qubic API - Events Endpoint Example');
    console.log('================================================\n');

    const baseURL = 'http://localhost:3000';
    
    // Example: Get events from tick 34776300 to 34776700
    const fromBlock = 34776300;
    const toBlock = 34776700;
    
    console.log(`📡 Fetching events from block ${fromBlock} to ${toBlock}...`);
    
    const response = await axios.get(`${baseURL}/api/v1/events`, {
      params: {
        fromBlock: fromBlock,
        toBlock: toBlock
      },
      timeout: 30000
    });
    
    console.log('✅ Response received successfully!');
    console.log(`📊 Found ${response.data.events.length} events\n`);
    
    // Display each event
    response.data.events.forEach((event, index) => {
      console.log(`Event ${index + 1}:`);
      console.log(`  Block: ${event.block.blockNumber} (${new Date(event.block.blockTimestamp * 1000).toISOString()})`);
      console.log(`  Transaction: ${event.txnId}`);
      console.log(`  Maker: ${event.maker}`);
      console.log(`  Pair ID: ${event.pairId}`);
      console.log(`  Event Type: ${event.eventType}`);
      console.log(`  Asset0 In: ${event.asset0In}`);
      console.log(`  Asset1 Out: ${event.asset1Out}`);
      console.log(`  Reserves: Asset0=${event.reserves.asset0}, Asset1=${event.reserves.asset1}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Error fetching events:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`Error: ${error.message}`);
    }
  }
}

// Run the example
if (require.main === module) {
  getEventsExample();
}

module.exports = { getEventsExample };
