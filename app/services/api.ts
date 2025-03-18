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
const REMOTE_RPC_ENDPOINT = 'http://localhost:26657/';
// const REMOTE_RPC_ENDPOINT = 'https://testnet-rpc.ZIGChain.com/';
const REMOTE_API_ENDPOINT = 'https://testnet-api.ZIGChain.com/';

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
    console.log(`Fetching latest blocks from ${RPC_ENDPOINT}`);
    
    // First, get the latest block height
    const statusResponse = await axios.get(`${RPC_ENDPOINT}/status`);
    const latestHeight = parseInt(statusResponse.data.result.sync_info.latest_block_height);
    console.log(`Latest block height: ${latestHeight}`);
    
    // Calculate the range of blocks to fetch
    const minHeight = Math.max(1, latestHeight - count + 1);
    console.log(`Fetching blocks from height ${minHeight} to ${latestHeight}`);
    
    const blocks = [];
    
    // Fetch each block in the range
    for (let height = latestHeight; height >= minHeight; height--) {
      try {
        const blockResponse = await axios.get(`${RPC_ENDPOINT}/block`, {
          params: { height }
        });
        
        const blockData = blockResponse.data.result;
        const txs = blockData.block.data.txs || [];
        
        // Get transaction hashes by querying each transaction
        const txHashes = [];
        for (const tx of txs) {
          try {
            // Calculate the transaction hash from the transaction data
            // This is a SHA-256 hash of the transaction data
            const txHash = await getTxHashFromBase64(tx);
            txHashes.push(txHash);
          } catch (e) {
            console.error(`Error getting transaction hash: ${e}`);
          }
        }
        
        blocks.push({
          height,
          hash: blockData.block_id.hash,
          time: blockData.block.header.time,
          txCount: txs.length,
          transactions: txHashes,
          proposer: blockData.block.header.proposer_address
        });
      } catch (blockError) {
        console.error(`Error fetching block at height ${height}:`, blockError);
      }
    }
    
    return blocks;
  } catch (error) {
    return handleApiError(error, 'getLatestBlocks');
  }
};

// Helper function to get transaction hash from base64 encoded transaction data
async function getTxHashFromBase64(txBase64: string): Promise<string> {
  try {
    // First, try to get the transaction hash by querying the transaction by its raw data
    const { RPC_ENDPOINT } = getEndpoints();
    
    // Use the tx_search endpoint to find the transaction by its exact data
    const searchResponse = await axios.get(`${RPC_ENDPOINT}/tx_search`, {
      params: {
        query: `tx.hash EXISTS`,
        page: 1,
        per_page: 100
      }
    });
    
    if (searchResponse.data && searchResponse.data.result && searchResponse.data.result.txs) {
      // Look for a transaction that matches our base64 data
      const matchingTx = searchResponse.data.result.txs.find((tx: any) => {
        return tx.tx === txBase64;
      });
      
      if (matchingTx) {
        return matchingTx.hash.toLowerCase();
      }
    }
    
    // If we couldn't find the transaction by querying, calculate the hash
    // This is a fallback method - SHA-256 hash of the transaction data
    const binary = atob(txBase64);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      buffer[i] = binary.charCodeAt(i);
    }
    
    // Use the crypto API to calculate the hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  } catch (error) {
    console.error('Error getting transaction hash:', error);
    
    // If all else fails, return a hash of the first 32 bytes of the transaction
    // This is not ideal but provides a consistent identifier
    const binary = atob(txBase64);
    let hash = '';
    for (let i = 0; i < Math.min(32, binary.length); i++) {
      hash += binary.charCodeAt(i).toString(16).padStart(2, '0');
    }
    return hash;
  }
}

// Fetch a range of blocks
export const fetchBlockRange = async (minHeight: number, maxHeight: number) => {
  try {
    const { RPC_ENDPOINT } = getEndpoints();
    console.log(`Fetching block range from ${minHeight} to ${maxHeight} from remote node`);
    
    // Make a direct HTTP request to the RPC endpoint
    const response = await axios.get(`${RPC_ENDPOINT}/blockchain`, {
      params: {
        minHeight: minHeight,
        maxHeight: maxHeight
      }
    });
    
    if (!response.data || !response.data.result || !response.data.result.block_metas) {
      console.error('Invalid blockchain data format:', response.data);
      throw new Error('Invalid blockchain data format');
    }
    
    const blockMetas = response.data.result.block_metas;
    console.log(`Received ${blockMetas.length} blocks from blockchain API`);
    
    // Format the blocks
    const blocks = blockMetas.map((blockMeta: any) => {
      return {
        height: parseInt(blockMeta.header.height),
        hash: blockMeta.block_id.hash,
        time: blockMeta.header.time,
        proposer: blockMeta.header.proposer_address,
        txCount: parseInt(blockMeta.num_txs),
      };
    });
    
    return blocks;
  } catch (error) {
    return handleApiError(error, 'fetchBlockRange');
  }
};

// Get block by height
export const getBlockByHeight = async (height: number) => {
  try {
    const { RPC_ENDPOINT } = getEndpoints();
    console.log(`Fetching block at height ${height} from ${RPC_ENDPOINT}`);
    
    const response = await axios.get(`${RPC_ENDPOINT}/block`, {
      params: { height }
    });
    
    const blockData = response.data.result;
    
    // Extract and format transaction hashes
    const transactions = blockData.block.data.txs || [];
    console.log(`Block ${height} has ${transactions.length} transactions`);
    
    // Format transaction hashes from base64 to hex
    const formattedTxs = transactions.map((tx: string) => {
      try {
        // Decode base64 to binary
        const binary = atob(tx);
        
        // Convert binary to hex
        let hex = '';
        for (let i = 0; i < binary.length; i++) {
          const hexByte = binary.charCodeAt(i).toString(16);
          hex += (hexByte.length === 2 ? hexByte : '0' + hexByte);
        }
        
        // Log both formats for debugging
        console.log(`Transaction in block ${height}:`);
        console.log(`  Base64: ${tx}`);
        console.log(`  Hex: ${hex}`);
        
        return hex;
      } catch (e) {
        console.error(`Error converting transaction from base64 to hex: ${e}`);
        return tx; // Return original if conversion fails
      }
    });
    
    // Format the block data for the frontend
    return {
      height: parseInt(blockData.block.header.height),
      hash: blockData.block_id.hash,
      time: blockData.block.header.time,
      proposer: blockData.block.header.proposer_address,
      numTxs: transactions.length,
      totalTxs: parseInt(blockData.block.header.total_txs || '0'),
      transactions: formattedTxs,
      validatorHash: blockData.block.header.validators_hash,
      consensusHash: blockData.block.header.consensus_hash,
      appHash: blockData.block.header.app_hash,
      evidenceHash: blockData.block.header.evidence_hash,
      lastCommitHash: blockData.block.header.last_commit_hash,
      lastResultsHash: blockData.block.header.last_results_hash,
    };
  } catch (error) {
    return handleApiError(error, 'getBlockByHeight');
  }
};

// Get transaction by hash
export const getTransactionByHash = async (hash: string) => {
  try {
    const { RPC_ENDPOINT } = getEndpoints();
    
    // Ensure the hash is properly formatted - remove any '0x' prefix if present
    const formattedHash = hash.startsWith('0x') ? hash.substring(2).toLowerCase() : hash.toLowerCase();
    
    console.log(`Fetching transaction with hash: ${formattedHash} from ${RPC_ENDPOINT}`);
    
    // Use the /tx endpoint with the hash parameter
    const response = await axios.get(`${RPC_ENDPOINT}/tx`, {
      params: {
        hash: `0x${formattedHash}` // Add 0x prefix if needed by the API
      }
    });
    
    if (response.data && response.data.result) {
      console.log('Transaction data received');
      
      // Extract the transaction data from the response
      const txData = response.data.result;
      
      // Extract timestamp from events if available
      let timestamp = '';
      try {
        if (txData.tx_result && txData.tx_result.events) {
          const txEvent = txData.tx_result.events.find((e: any) => e.type === 'tx');
          if (txEvent && txEvent.attributes) {
            const timestampAttr = txEvent.attributes.find((a: any) => a.key === 'timestamp');
            if (timestampAttr) {
              timestamp = timestampAttr.value;
            }
          }
        }
      } catch (e) {
        console.error('Error extracting timestamp:', e);
      }
      
      // Format the transaction data for the frontend
      const formattedTx = {
        hash: formattedHash,
        height: parseInt(txData.height) || 0,
        tx: txData.tx || '',
        tx_result: txData.tx_result || {},
        time: timestamp || new Date().toISOString(),
        gasUsed: parseInt(txData.tx_result?.gas_used) || 0,
        gasWanted: parseInt(txData.tx_result?.gas_wanted) || 0,
        logs: txData.tx_result?.log || txData.tx_result?.logs || []
      };
      
      return formattedTx;
    } else {
      console.error('No transaction data found in response');
      return null;
    }
  } catch (error) {
    return handleApiError(error, 'getTransactionByHash');
  }
};

// Get validators
export const getValidators = async () => {
  try {
    const { API_ENDPOINT } = getEndpoints();
    console.log('Fetching validators from testnet API endpoint:', API_ENDPOINT);
    
    // Make a direct HTTP request to the Cosmos staking API endpoint
    const response = await axios.get(`${API_ENDPOINT}/cosmos/staking/v1beta1/validators`);
    
    console.log('Validators API response status:', response.status);
    
    if (response.data && response.data.validators) {
      console.log(`Found ${response.data.validators.length} validators`);
      
      // Return the validators in the format expected by the UI
      return response.data.validators;
    } else {
      console.error('Invalid response format from validators endpoint:', JSON.stringify(response.data, null, 2));
      return [];
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error fetching validators:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    } else {
      console.error('Error fetching validators:', error);
    }
    return handleApiError(error, 'getValidators');
  }
};

// Get a single validator by address
export const getValidatorByAddress = async (address: string) => {
  try {
    const { API_ENDPOINT } = getEndpoints();
    console.log(`Fetching validator with address: ${address} from ${API_ENDPOINT}`);
    
    // Make a direct HTTP request to the Cosmos staking API endpoint for a specific validator
    const response = await axios.get(`${API_ENDPOINT}/cosmos/staking/v1beta1/validators/${address}`);
    
    console.log('Validator API response status:', response.status);
    
    if (response.data && response.data.validator) {
      console.log('Found validator:', response.data.validator.description?.moniker);
      return response.data.validator;
    } else {
      console.error('Invalid response format from validator endpoint:', JSON.stringify(response.data, null, 2));
      return null;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Axios error fetching validator with address ${address}:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    } else {
      console.error(`Error fetching validator with address ${address}:`, error);
    }
    return handleApiError(error, 'getValidatorByAddress');
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

// Get transactions for an address with pagination
export const getAddressTransactions = async (address: string, page = 1, limit = 10) => {
  try {
    const { RPC_ENDPOINT } = getEndpoints();
    console.log(`Fetching transactions for address ${address} from remote node (page ${page}, limit ${limit})`);
    
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
    
    // Calculate pagination
    const totalItems = uniqueTxs.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalItems);
    const paginatedTxs = uniqueTxs.slice(startIndex, endIndex);
    
    // Format transactions
    const formattedTxs = paginatedTxs.map(tx => {
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
    
    return {
      transactions: formattedTxs,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit
      }
    };
  } catch (error) {
    console.error('Error fetching address transactions:', error);
    return {
      transactions: [],
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalItems: 0,
        limit
      }
    };
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
