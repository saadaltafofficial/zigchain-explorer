const axios = require('axios');

exports.handler = async (event) => {
  // Get the RPC URL from environment variables
  const RPC_URL = process.env.RPC_URL || 'https://testnet-rpc.zigchain.com';
  
  try {
    // Parse the path and parameters from the request
    const path = event.path.replace('/api/proxy/', '').replace('/.netlify/functions/proxy/', '');
    const params = event.queryStringParameters || {};
    
    // Determine the HTTP method
    const method = event.httpMethod.toLowerCase();
    
    let response;
    
    if (method === 'get') {
      // For GET requests
      const url = path ? `${RPC_URL}/${path}` : `${RPC_URL}`;
      console.log(`Proxying GET request to: ${url}`);
      response = await axios.get(url, { params });
    } else if (method === 'post') {
      // For POST requests
      const body = JSON.parse(event.body || '{}');
      const url = path ? `${RPC_URL}/${path}` : `${RPC_URL}`;
      console.log(`Proxying POST request to: ${url}`);
      response = await axios.post(url, body);
    } else {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }
    
    // Return the response from the blockchain node
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    console.error('Proxy error:', error);
    
    // Return error response
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to fetch data from RPC endpoint',
        details: error.message,
      }),
    };
  }
};
