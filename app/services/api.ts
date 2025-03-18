import axios from 'axios';
import { StargateClient } from '@cosmjs/stargate';
import { IndexedTx } from '@cosmjs/stargate';

// Define additional interfaces to extend the existing types
interface ExtendedBlockHeader {
  proposerAddress?: string;
  time?: string;
}

interface ExtendedTx {
  tx: {
    memo?: string;
    body?: {
      messages: any[];
    };
  };
  fee?: {
    amount: { amount: string; denom: string }[];
  };
}

// Define a custom validator interface
interface Validator {
  address: string;
  description?: {
    moniker?: string;
  };
  votingPower: bigint;
  commission?: {
    commissionRates?: {
      rate: string;
    };
  };
  status: string;
}

// Remote endpoints
const REMOTE_RPC_ENDPOINT = 'https://testnet-rpc.zigchain.com/';
const REMOTE_API_ENDPOINT = 'https://testnet-api.zigchain.com/';

// Use the appropriate endpoints
const getEndpoints = () => {
  return {
    RPC_ENDPOINT: REMOTE_RPC_ENDPOINT,
    API_ENDPOINT: REMOTE_API_ENDPOINT
  };
};

// Helper function to log and handle errors
const handleApiError = (error: any, context: string) => {
  console.error(`Error in ${context}:`, error);
  
  // Log more detailed information about the error
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('Error response data:', error.response.data);
    console.error('Error response status:', error.response.status);
    console.error('Error response headers:', error.response.headers);
  } else if (error.request) {
    // The request was made but no response was received
    console.error('Error request:', error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('Error message:', error.message);
  }
  
  throw error;
};

// Initialize Stargate client
export const getStargateClient = async () => {
  try {
    const { RPC_ENDPOINT } = getEndpoints();
    console.log(`Connecting to RPC endpoint: ${RPC_ENDPOINT}`);
    return await StargateClient.connect(RPC_ENDPOINT);
  } catch (error) {
    return handleApiError(error, 'getStargateClient');
  }
};

// Get latest blocks
export const getLatestBlocks = async (count = 10) => {
  try {
    const { RPC_ENDPOINT } = getEndpoints();
    console.log(`Fetching latest blocks (count: ${count}) from remote node`);
    
    // Using remote node endpoint
    const client = await getStargateClient();
    const latestHeight = await client.getHeight();
    console.log(`Latest height: ${latestHeight}`);
    
    const blocks = [];
    for (let i = 0; i < count; i++) {
      if (latestHeight - i <= 0) break;
      
      const blockHeight = latestHeight - i;
      console.log(`Fetching block at height: ${blockHeight}`);
      const block = await client.getBlock(blockHeight);
      
      blocks.push({
        height: blockHeight,
        hash: block.id,
        time: new Date(block.header.time).toISOString(),
        txCount: block.txs.length
      });
    }
    
    return blocks;
  } catch (error) {
    return handleApiError(error, 'getLatestBlocks');
  }
};

// Get block by height
export const getBlockByHeight = async (height: number) => {
  try {
    const { RPC_ENDPOINT } = getEndpoints();
    console.log(`Fetching block at height ${height} from remote node`);
    
    // Using remote node endpoint
    const client = await getStargateClient();
    const block = await client.getBlock(height);
    
    // Format the block data
    const formattedBlock = {
      height: height,
      hash: block.id,
      time: new Date((block.header as unknown as ExtendedBlockHeader).time || new Date().toISOString()).toISOString(),
      proposer: (block.header as unknown as ExtendedBlockHeader).proposerAddress || '',
      txCount: block.txs.length,
      transactions: block.txs.map(tx => Buffer.from(tx).toString('hex')),
      gasUsed: 0,
      gasWanted: 0
    };
    
    return formattedBlock;
  } catch (error) {
    return handleApiError(error, 'getBlockByHeight');
  }
};

// Get transaction by hash
export const getTransactionByHash = async (hash: string) => {
  try {
    const { RPC_ENDPOINT } = getEndpoints();
    console.log(`Fetching transaction with hash ${hash} from remote node`);
    
    // Using remote node endpoint
    const client = await getStargateClient();
    
    // Sanitize and normalize the hash
    let searchHash = hash;
    
    // Remove 0x prefix if present
    if (searchHash.startsWith('0x')) {
      searchHash = searchHash.slice(2);
    }
    
    // Remove any URL encoding or special characters
    searchHash = searchHash.replace(/[^a-fA-F0-9]/g, '');
    
    console.log(`Sanitized hash for search: ${searchHash}`);
    
    // Ensure the hash is valid hex before converting
    if (!/^[a-fA-F0-9]*$/.test(searchHash)) {
      throw new Error(`Invalid transaction hash format: ${hash}`);
    }
    
    // Convert hex to base64 for searching
    const searchHashBuffer = Buffer.from(searchHash, 'hex');
    const base64Hash = searchHashBuffer.toString('base64');
    
    console.log(`Searching for transaction with base64 hash: ${base64Hash}`);
    
    // Search for the transaction
    const searchResult = await client.searchTx(`tx.hash='${base64Hash}'`);
    
    if (searchResult.length === 0) {
      throw new Error(`Transaction with hash ${hash} not found`);
    }
    
    const tx = searchResult[0] as IndexedTx & ExtendedTx;
    
    return {
      hash: hash,
      height: tx.height,
      index: 0, // Index not available in this API
      time: new Date().toISOString(), // Exact time not available, using current time
      gasUsed: tx.gasUsed,
      gasWanted: tx.gasWanted,
      fee: tx.fee,
      memo: tx.tx?.memo,
      messages: tx.tx?.body?.messages || [],
      logs: tx.rawLog
    };
  } catch (error) {
    return handleApiError(error, 'getTransactionByHash');
  }
};

// Get validators
export const getValidators = async () => {
  try {
    const { RPC_ENDPOINT } = getEndpoints();
    console.log('Fetching validators from remote node');
    
    // Using remote node endpoint
    const client = await getStargateClient();
    
    // Since getAllValidators doesn't exist on StargateClient, we'll use a custom approach
    // This is a placeholder - you'll need to implement the actual validator fetching logic
    // based on the available methods in your StargateClient
    
    // Placeholder for validators - replace with actual implementation
    const validators: Validator[] = [];
    
    // Example of how you might fetch validators if you had the right method
    // const validators = await client.getAllValidators();
    
    return validators.map((validator: Validator) => ({
      address: validator.address,
      moniker: validator.description?.moniker || 'Unknown',
      votingPower: validator.votingPower.toString(),
      commission: validator.commission?.commissionRates?.rate || '0',
      status: validator.status === 'BOND_STATUS_BONDED' ? 'active' : 'inactive'
    }));
  } catch (error) {
    return handleApiError(error, 'getValidators');
  }
};

// Get account balance
export const getAccountBalance = async (address: string) => {
  try {
    const { RPC_ENDPOINT } = getEndpoints();
    console.log(`Fetching balance for address ${address} from remote node`);
    
    // Using remote node endpoint
    const client = await getStargateClient();
    const balances = await client.getAllBalances(address);
    
    return balances.map(balance => ({
      denom: balance.denom,
      amount: balance.amount
    }));
  } catch (error) {
    return handleApiError(error, 'getAccountBalance');
  }
};

// Get transactions for an address
export const getAddressTransactions = async (address: string) => {
  try {
    const { RPC_ENDPOINT } = getEndpoints();
    console.log(`Fetching transactions for address ${address} from remote node`);
    
    // Using remote node endpoint
    const client = await getStargateClient();
    
    // Search for sent transactions
    const sentTxs = await client.searchTx(`message.sender='${address}'`);
    console.log(`Found ${sentTxs.length} sent transactions for address ${address}`);
    
    // Search for received transactions (this query may need to be adjusted based on your chain's indexing)
    const receivedTxs = await client.searchTx(`transfer.recipient='${address}'`);
    console.log(`Found ${receivedTxs.length} received transactions for address ${address}`);
    
    // Combine and deduplicate transactions
    const allTxs = [...sentTxs, ...receivedTxs];
    const uniqueTxs = Array.from(new Map(allTxs.map(tx => [tx.hash, tx])).values());
    
    // Sort by height in descending order (newest first)
    uniqueTxs.sort((a, b) => b.height - a.height);
    
    // Format transactions
    return uniqueTxs.map(tx => {
      return {
        hash: tx.hash,
        height: tx.height,
        time: new Date().toISOString(), // Placeholder - actual timestamp not available directly
        gasUsed: tx.gasUsed,
        gasWanted: tx.gasWanted,
        success: tx.code === 0,
        rawLog: tx.rawLog
      };
    });
  } catch (error) {
    console.error('Error fetching address transactions:', error);
    return [];
  }
};

// Get chain info
export const getChainInfo = async () => {
  try {
    const { RPC_ENDPOINT } = getEndpoints();
    console.log('Fetching chain info from remote node');
    
    // Using remote node endpoint
    const client = await getStargateClient();
    
    // Get chain ID
    const chainId = await client.getChainId();
    
    // Get latest block height
    const height = await client.getHeight();
    
    // Get block time (average of last 10 blocks if possible)
    const latestBlocks = await getLatestBlocks(10);
    let blockTime = 0;
    
    if (latestBlocks.length > 1) {
      // Calculate average block time in seconds
      const times = latestBlocks.map(block => new Date(block.time).getTime());
      let totalDiff = 0;
      
      for (let i = 0; i < times.length - 1; i++) {
        totalDiff += (times[i] - times[i + 1]) / 1000; // Convert ms to seconds
      }
      
      blockTime = totalDiff / (times.length - 1);
    }
    
    return {
      chainId,
      height,
      blockTime: blockTime.toFixed(2),
      latestBlockTime: latestBlocks.length > 0 ? latestBlocks[0].time : new Date().toISOString()
    };
  } catch (error) {
    return handleApiError(error, 'getChainInfo');
  }
};
