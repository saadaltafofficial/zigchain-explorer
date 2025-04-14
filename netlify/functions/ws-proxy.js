// WebSocket information endpoint for ZigChain Explorer
// Since Netlify Functions don't directly support WebSocket connections,
// we're using a direct secure WebSocket connection to the blockchain node

exports.handler = async (event) => {
  // Get the WebSocket URL from environment variables or use the default secure endpoint
  const WS_URL = process.env.NEXT_PUBLIC_WS_ENDPOINT || 'wss://testnet-rpc.zigchain.com/websocket';
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
    body: JSON.stringify({
      status: "active",
      message: "WebSocket connection information",
      websocketEndpoint: WS_URL,
      info: "The application is configured to connect directly to a secure WebSocket endpoint"
    }),
  };
};
