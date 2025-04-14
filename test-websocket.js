// Simple script to test WebSocket connection
const WebSocket = require('ws');

const WS_URL = 'ws://167.86.79.37:26657/websocket';

console.log(`Attempting to connect to WebSocket at: ${WS_URL}`);

const ws = new WebSocket(WS_URL);

ws.on('open', function open() {
  console.log('Connection established!');
  
  // Subscribe to new blocks
  const subscribeMsg = JSON.stringify({
    jsonrpc: '2.0',
    method: 'subscribe',
    id: 1,
    params: {
      query: "tm.event='NewBlock'"
    }
  });
  
  console.log('Sending subscription request for new blocks...');
  ws.send(subscribeMsg);
  
  // Set a timeout to close the connection after 10 seconds
  setTimeout(() => {
    console.log('Test complete. Closing connection...');
    ws.close();
    process.exit(0);
  }, 10000);
});

ws.on('message', function incoming(data) {
  console.log('Received message:');
  try {
    const parsed = JSON.parse(data);
    console.log(JSON.stringify(parsed, null, 2));
  } catch (e) {
    console.log('Could not parse as JSON:', data);
  }
});

ws.on('error', function error(err) {
  console.error('WebSocket error:', err.message);
  process.exit(1);
});

ws.on('close', function close(code, reason) {
  console.log(`Connection closed. Code: ${code}, Reason: ${reason || 'No reason provided'}`);
});
