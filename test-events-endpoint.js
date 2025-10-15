const axios = require('axios');

// Test the events endpoint
async function testEventsEndpoint() {
  try {
    console.log('🧪 Testing /events endpoint...');
    
    const baseURL = 'http://localhost:3000';
    const fromBlock = 34776300;
    const toBlock = 34776700;
    
    console.log(`📡 Making request to: ${baseURL}/api/v1/events?fromBlock=${fromBlock}&toBlock=${toBlock}`);
    
    const response = await axios.get(`${baseURL}/api/v1/events`, {
      params: {
        fromBlock: fromBlock,
        toBlock: toBlock
      },
      timeout: 30000
    });
    
    console.log('✅ Response received:');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    // Validate response structure
    if (response.data && response.data.events) {
      console.log(`\n📊 Found ${response.data.events.length} events`);
      
      if (response.data.events.length > 0) {
        const firstEvent = response.data.events[0];
        console.log('\n🔍 First event structure:');
        console.log('- block.blockNumber:', firstEvent.block?.blockNumber);
        console.log('- block.blockTimestamp:', firstEvent.block?.blockTimestamp);
        console.log('- txnId:', firstEvent.txnId);
        console.log('- txnIndex:', firstEvent.txnIndex);
        console.log('- eventIndex:', firstEvent.eventIndex);
        console.log('- maker:', firstEvent.maker);
        console.log('- pairId:', firstEvent.pairId);
        console.log('- eventType:', firstEvent.eventType);
        console.log('- asset0In:', firstEvent.asset0In);
        console.log('- asset1Out:', firstEvent.asset1Out);
        console.log('- reserves:', firstEvent.reserves);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testEventsEndpoint();
