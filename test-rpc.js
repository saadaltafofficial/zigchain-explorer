// Simple script to test RPC endpoint connectivity
const axios = require('axios');
require('dotenv').config();

const RPC_URL = process.env.RPC_URL || 'https://testnet-rpc.zigchain.com';

async function testRpcConnection() {
  try {
    console.log('Testing connection to RPC endpoint...');
    
    // Test 1: Get status
    console.log('\nTest 1: Fetching status...');
    const statusResponse = await axios.get(`${RPC_URL}/status`);
    console.log('Status response code:', statusResponse.status);
    console.log('Latest block height:', statusResponse.data.result.sync_info.latest_block_height);
    
    // Test 2: Get a block
    console.log('\nTest 2: Fetching block...');
    const blockHeight = statusResponse.data.result.sync_info.latest_block_height;
    const blockResponse = await axios.get(`${RPC_URL}/block?height=${blockHeight}`);
    console.log('Block response code:', blockResponse.status);
    console.log('Block time:', blockResponse.data.result.block.header.time);
    console.log('Number of transactions:', (blockResponse.data.result.block.data.txs || []).length);
    
    console.log('\nAll tests passed! RPC endpoint is working correctly.');
  } catch (error) {
    console.error('\nError occurred:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received. Network error or server down.');
      console.error(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    console.error('\nError config:', error.config);
  }
}

testRpcConnection();
