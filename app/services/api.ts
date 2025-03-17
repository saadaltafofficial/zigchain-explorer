import axios from 'axios';
import { StargateClient } from '@cosmjs/stargate';

const RPC_ENDPOINT = 'https://testnet-rpc.zigchain.com/';
const API_ENDPOINT = 'https://testnet-api.zigchain.com/';

// Initialize Stargate client
export const getStargateClient = async () => {
  return await StargateClient.connect(RPC_ENDPOINT);
};

// Get latest blocks
export const getLatestBlocks = async (limit: number = 10) => {
  try {
    const client = await getStargateClient();
    const height = await client.getHeight();
    
    const blocks = [];
    for (let i = 0; i < limit; i++) {
      if (height - i <= 0) break;
      const block = await client.getBlock(height - i);
      blocks.push({
        height: height - i,
        hash: block.id,
        time: block.header.time,
        txCount: block.txs.length,
      });
    }
    
    return blocks;
  } catch (error) {
    console.error('Error fetching latest blocks:', error);
    throw error;
  }
};

// Get block by height
export const getBlockByHeight = async (height: number) => {
  try {
    const client = await getStargateClient();
    const block = await client.getBlock(height);
    
    return {
      height,
      hash: block.id,
      time: block.header.time,
      txCount: block.txs.length,
      transactions: block.txs,
      blockMeta: block.header,
    };
  } catch (error) {
    console.error(`Error fetching block at height ${height}:`, error);
    throw error;
  }
};

// Get transaction by hash
export const getTransactionByHash = async (hash: string) => {
  try {
    const response = await axios.get(`${API_ENDPOINT}/cosmos/tx/v1beta1/txs/${hash}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching transaction with hash ${hash}:`, error);
    throw error;
  }
};

// Get validators
export const getValidators = async () => {
  try {
    const response = await axios.get(`${API_ENDPOINT}/cosmos/staking/v1beta1/validators?pagination.limit=100`);
    return response.data.validators;
  } catch (error) {
    console.error('Error fetching validators:', error);
    throw error;
  }
};

// Get account balance
export const getAccountBalance = async (address: string) => {
  try {
    const client = await getStargateClient();
    const balance = await client.getAllBalances(address);
    return balance;
  } catch (error) {
    console.error(`Error fetching balance for address ${address}:`, error);
    throw error;
  }
};

// Get chain info
export const getChainInfo = async () => {
  try {
    const client = await getStargateClient();
    const height = await client.getHeight();
    const chainId = await client.getChainId();
    
    return {
      chainId,
      latestBlockHeight: height,
    };
  } catch (error) {
    console.error('Error fetching chain info:', error);
    throw error;
  }
};
