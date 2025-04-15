// Script to test secure WebSocket connection to ZigChain testnet
const WebSocket = require('ws');
require('dotenv').config();

// Use the secure WebSocket endpoint from environment variable
const WS_URL = process.env.NEXT_PUBLIC_WS_ENDPOINT || 'wss://testnet-rpc.zigchain.com/websocket';

console.log(`Attempting to connect to secure WebSocket at: ${WS_URL}`);

const ws = new WebSocket(WS_URL);

// Connection opened
ws.on('open', function() {
  console.log('Connection established successfully!');
  
  // Subscribe to new blocks
  const subscribeMessage = JSON.stringify({
    jsonrpc: "2.0",
    method: "subscribe",
    params: {
      query: "tm.event='NewBlock'"
    },
    id: 1
  });
  
  console.log('Sending subscription request for new blocks...');
  ws.send(subscribeMessage);
  
  // Set a timeout to close the connection after 30 seconds
  setTimeout(() => {
    console.log('Test complete. Closing connection...');
    ws.close();
    process.exit(0);
  }, 30000);
});

// Listen for messages
ws.on('message', function(data) {
  try {
    const message = JSON.parse(data.toString());
    console.log('Received message:');
    
    // Check if it's a subscription confirmation
    if (message.id && message.result) {
      console.log('✅ Subscription confirmed!');
    }
    
    // Check if it's a block event
    if (message.result && message.result.data && message.result.data.value) {
      console.log('✅ Received block data:');
      const height = message.result.data.value.block?.header?.height;
      if (height) {
        console.log(`Block height: ${height}`);
      }
    }
  } catch (error) {
    console.error('Error parsing message:', error);
    console.log('Raw message:', data.toString());
  }
});

// Connection closed
ws.on('close', function(code, reason) {
  console.log(`Connection closed: ${code} ${reason}`);
});

// Connection error
ws.on('error', function(err) {
  console.error('WebSocket error:', err.message);
  process.exit(1);
});

console.log('Waiting for events... (Will exit after 30 seconds)');
