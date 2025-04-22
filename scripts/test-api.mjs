// Simple script to test API connectivity using native fetch

const API_URL = 'http://167.86.79.37:8000/api';
const RPC_URL = 'http://167.86.79.37:26657';

async function testApiConnection() {
  console.log(`Testing API connection to ${API_URL}...`);
  
  try {
    // Test chain info endpoint
    console.log('Testing /chain/info endpoint...');
    const chainInfoResponse = await fetch(`${API_URL}/chain/info`);
    console.log('Status:', chainInfoResponse.status);
    if (chainInfoResponse.ok) {
      const chainInfo = await chainInfoResponse.json();
      console.log('Chain Info:', JSON.stringify(chainInfo, null, 2));
    } else {
      console.error('Failed to fetch chain info');
    }
  } catch (error) {
    console.error('Error testing API connection:', error.message);
  }
  
  try {
    // Test direct RPC connection
    console.log('\nTesting direct RPC connection to', RPC_URL);
    const rpcResponse = await fetch(`${RPC_URL}/status`);
    console.log('Status:', rpcResponse.status);
    if (rpcResponse.ok) {
      const rpcStatus = await rpcResponse.json();
      console.log('RPC Status:', JSON.stringify(rpcStatus.result.sync_info, null, 2));
    } else {
      console.error('Failed to connect to RPC endpoint');
    }
  } catch (error) {
    console.error('Error testing RPC connection:', error.message);
  }
}

testApiConnection();
