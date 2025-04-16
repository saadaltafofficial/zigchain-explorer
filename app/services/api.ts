import axios from 'axios';
import { StargateClient } from '@cosmjs/stargate';

// Define additional interfaces to extend the existing types
interface ExtendedBlockHeader {
  proposerAddress?: string;
  time?: string;
}

interface TransactionMessage {
  typeUrl: string;
  value: unknown;
}

interface ExtendedTx {
  tx: {
    memo?: string;
    body?: {
      messages: TransactionMessage[];
    };
  };
  fee?: {
    amount: { amount: string; denom: string }[];
  };
}

// Define types for transactions and responses
interface Transaction {
  hash: string;
  height: number;
  time: string;
  gasUsed: bigint;
  gasWanted: bigint;
  success: boolean;
  rawLog: string;
}

// Use direct secure endpoints for all environments
const REMOTE_RPC_ENDPOINT = process.env.RPC_URL || 'https://zigscan.net/';
const REMOTE_API_ENDPOINT = process.env.REMOTE_API_ENDPOINT || 'https://testnet-api.ZIGChain.com/';

// Use the appropriate endpoints
const getEndpoints = () => {
  return {
    RPC_ENDPOINT: REMOTE_RPC_ENDPOINT,
    API_ENDPOINT: REMOTE_API_ENDPOINT
  };
};

// Helper function to log and handle errors
const handleApiError = (error: unknown, context: string): never => {
  if (error instanceof Error) {
    console.error(`API Error (${context}):`, error.message);
    throw new Error(`${context}: ${error.message}`);
  } else {
    console.error(`API Error (${context}):`, error);
    throw new Error(`${context}: Unknown error`);
  }
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

// Cache duration in milliseconds
const CACHE_DURATION = 30000; // 30 seconds

// Get latest blocks with caching and pagination support
export const getLatestBlocks = async (count = 10, useCache = true, startFromHeight?: number) => {
  try {
    // Check browser cache first if we're in a browser environment
    if (typeof window !== 'undefined' && useCache) {
      const cacheKey = `latest-blocks-${count}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          // Use cache if it's fresh (less than CACHE_DURATION old)
          if (Date.now() - timestamp < CACHE_DURATION) {
            console.log(`[API] Using cached blocks (${data.length} blocks)`);
            return data;
          }
          console.log(`[API] Cache expired, fetching fresh data`);
        } catch (e) {
          console.warn(`[API] Error parsing cache:`, e);
          // Continue with fetching fresh data
        }
      }
    }
    
    const { RPC_ENDPOINT } = getEndpoints();
    
    // Get latest block height if not specified
    let startHeight: number;
    if (startFromHeight) {
      // Use the provided starting height for pagination
      startHeight = startFromHeight;
      console.log(`[API] Using provided start height: ${startHeight}`);
    } else {
      // Fetch the latest height from the blockchain
      console.log(`[API] Fetching latest block height`);
      const statusResponse = await axios.get(`/api/rpc?path=/status`);
      startHeight = parseInt(statusResponse.data.result.sync_info.latest_block_height);
      console.log(`[API] Latest block height: ${startHeight}`);
    }
    
    // Fetch blocks with throttling
    const blocks = [];
    console.log(`[API] Fetching ${count} blocks starting from height ${startHeight}`);
    
    // Create a cache key that includes the starting height for pagination
    if (typeof window !== 'undefined' && useCache && startFromHeight) {
      const pageCacheKey = `blocks-from-${startFromHeight}-count-${count}`;
      const cachedPage = localStorage.getItem(pageCacheKey);
      
      if (cachedPage) {
        try {
          const { data, timestamp } = JSON.parse(cachedPage);
          if (Date.now() - timestamp < CACHE_DURATION) {
            console.log(`[API] Using cached page of blocks from height ${startFromHeight}`);
            return data;
          }
        } catch (e) {
          console.warn(`[API] Error parsing pagination cache:`, e);
        }
      }
    }
    
    for (let i = 0; i < count && startHeight - i > 0; i++) {
      const height = startHeight - i;
      // Add slight throttling between requests to avoid overwhelming the RPC endpoint
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay between requests
      }
      
      const blockResponse = await axios.get(`/api/rpc?path=/block&height=${height}`);
      const blockData = blockResponse.data.result;
      const txCount = blockData.block.data.txs ? blockData.block.data.txs.length : 0;
      
      blocks.push({
        height: height,
        hash: blockData.block_id.hash,
        time: blockData.block.header.time,
        proposer: blockData.block.header.proposer_address,
        numTxs: txCount,
      });
    }
    
    // Cache the result in browser localStorage if available
    if (typeof window !== 'undefined' && useCache) {
      const cacheKey = `latest-blocks-${count}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        data: blocks,
        timestamp: Date.now()
      }));
      console.log(`[API] Cached ${blocks.length} blocks`);
    }
    
    return blocks;
  } catch (error) {
    return handleApiError(error, 'Failed to fetch latest blocks');
  }
};

// Helper function to get transaction hash from base64 encoded transaction data
export const getTxHashFromBase64 = async (txBase64: string): Promise<string> => {
  try {
    const { RPC_ENDPOINT } = getEndpoints();
    
    // First, try to search for the transaction
    const searchResponse = await axios.get(`${RPC_ENDPOINT}/tx_search`, {
      params: {
        query: `tx.hash exists`,
        per_page: 100
      }
    });
    
    if (searchResponse.data && searchResponse.data.result && searchResponse.data.result.txs) {
      // Look for a transaction that matches our base64 data
      const matchingTx = searchResponse.data.result.txs.find((tx: { tx: string }) => {
        return tx.tx === txBase64;
      });
      
      if (matchingTx) {
        return matchingTx.hash;
      }
    }
    
    // If we couldn't find the transaction by querying, calculate the hash
    // This is a fallback method - SHA-256 hash of the transaction data
    console.log('Calculating hash from base64 data...');
    try {
      const binary = atob(txBase64);
      const buffer = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        buffer[i] = binary.charCodeAt(i);
      }
      
      // Use the crypto API to calculate the hash
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      console.log('Generated hash from crypto API:', hashHex);
      return hashHex;
    } catch (cryptoError) {
      console.error('Error using crypto API:', cryptoError);
      // Continue to the next fallback
    }
    
    // If crypto API fails, use a simple hash function
    console.log('Using simple hash function as fallback...');
    try {
      const binary = atob(txBase64);
      let hash = '';
      for (let i = 0; i < Math.min(32, binary.length); i++) {
        hash += binary.charCodeAt(i).toString(16).padStart(2, '0');
      }
      console.log('Generated simple hash:', hash);
      return hash;
    } catch (simpleHashError) {
      console.error('Error generating simple hash:', simpleHashError);
    }
    
    // If all else fails, return a placeholder hash
    console.log('All hash generation methods failed, returning placeholder');
    return `tx_placeholder_${Date.now().toString(16)}`;
  } catch (error) {
    console.error('Error in getTxHashFromBase64:', error);
    
    // Return a fallback hash to prevent the application from crashing
    return `tx_error_${Date.now().toString(16)}`;
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
    
    // For CosmJS, we need to optimize our approach since it doesn't directly support pagination in searchTx
    
    // We'll limit the number of transactions we fetch to avoid performance issues
    // Only fetch what we need for the current page plus a small buffer
    const maxTxsToFetch = Math.min(50, page * limit + 10); 
    
    console.log(`Fetching up to ${maxTxsToFetch} transactions for address ${address}`);
    
    // Use a more specific query with a limit parameter if available
    // This will help reduce the number of transactions fetched
    let sentTxsPromise, receivedTxsPromise;
    
    try {
      // Try with limit parameter first (if supported by the client)
      // Note: Depending on the CosmJS version, the searchTx method might not accept a second parameter
      // @ts-ignore - Ignoring type error as we're handling the fallback if this fails
      sentTxsPromise = client.searchTx(`message.sender='${address}'`, { limit: maxTxsToFetch });
    } catch (error) {
      // Fallback to standard query without limit
      sentTxsPromise = client.searchTx(`message.sender='${address}'`);
    }
    
    try {
      // Try with limit parameter first (if supported by the client)
      // @ts-ignore - Ignoring type error as we're handling the fallback if this fails
      receivedTxsPromise = client.searchTx(`transfer.recipient='${address}'`, { limit: maxTxsToFetch });
    } catch (error) {
      // Fallback to standard query without limit
      receivedTxsPromise = client.searchTx(`transfer.recipient='${address}'`);
    }
    
    // Execute both queries in parallel
    const [sentTxs, receivedTxs] = await Promise.all([sentTxsPromise, receivedTxsPromise]);
    
    console.log(`Found ${sentTxs.length} sent transactions and ${receivedTxs.length} received transactions for address ${address}`);
    
    // Combine and deduplicate transactions
    const allTxs = [...sentTxs, ...receivedTxs];
    const uniqueTxs = Array.from(new Map(allTxs.map(tx => [tx.hash, tx])).values());
    
    // Sort by height in descending order (newest first)
    uniqueTxs.sort((a, b) => b.height - a.height);
    
    // Calculate pagination
    const totalItems = uniqueTxs.length;
    const totalPages = Math.ceil(totalItems / limit) || 1; // Ensure at least 1 page
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalItems);
    
    // Only get the transactions for the current page
    const paginatedTxs = uniqueTxs.slice(startIndex, endIndex);
    
    console.log(`Returning ${paginatedTxs.length} transactions for page ${page} (items ${startIndex+1}-${endIndex} of ${totalItems})`);
    
    // Format transactions for the current page only - using a faster approach
    // Instead of waiting for all timestamps, we'll use a default timestamp and update them later
    const formattedTxs = paginatedTxs.map(tx => {
      return {
        hash: tx.hash,
        height: tx.height,
        time: new Date().toISOString(), // Default timestamp
        gasUsed: tx.gasUsed,
        gasWanted: tx.gasWanted,
        success: tx.code === 0,
        rawLog: tx.rawLog
      };
    });
    
    // Return the transactions immediately with default timestamps
    const result = {
      transactions: formattedTxs,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit
      }
    };
    
    // Then update the timestamps in the background
    // This won't block the UI from displaying the transactions
    setTimeout(async () => {
      try {
        // Update timestamps in the background - but limit concurrent requests
        const updateBatchSize = 3; // Process 3 at a time to avoid overwhelming the node
        
        for (let i = 0; i < formattedTxs.length; i += updateBatchSize) {
          const batch = formattedTxs.slice(i, i + updateBatchSize);
          const batchPromises = batch.map(async (_, index) => {
            const txIndex = i + index;
            if (txIndex >= formattedTxs.length) return;
            
            try {
              const tx = paginatedTxs[txIndex];
              const blockData = await client.getBlock(tx.height);
              
              // Handle the timestamp based on the type returned
              if (blockData.header.time) {
                if (typeof blockData.header.time === 'string') {
                  formattedTxs[txIndex].time = blockData.header.time;
                } else {
                  // Assume it's a Date object or can be converted to string
                  formattedTxs[txIndex].time = String(blockData.header.time);
                }
              }
            } catch (error) {
              console.warn(`Could not get timestamp for block at height ${paginatedTxs[txIndex]?.height}`);
            }
          });
          
          // Wait for this batch to complete before moving to the next
          await Promise.all(batchPromises);
        }
      } catch (error) {
        console.error('Error updating timestamps:', error);
      }
    }, 0);
    
    return result;
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

export const getChainInfo = async () => {
  try {
    const { RPC_ENDPOINT } = getEndpoints();
    
    // Get status information
    const statusResponse = await axios.get(`${RPC_ENDPOINT}/status`);
    const statusData = statusResponse.data.result;
    
    // Get validator information
    const validatorsResponse = await axios.get(`${RPC_ENDPOINT}/validators`);
    const validatorsData = validatorsResponse.data.result;
    
    // Calculate total bonded tokens
    let totalBondedTokens = "0";
    if (validatorsData && validatorsData.validators) {
      totalBondedTokens = validatorsData.validators.reduce(
        (sum: string, validator: any) => {
          const power = validator.votingPower || BigInt(0);
          return (BigInt(sum) + power).toString();
        },
        "0"
      );
    }
    
    return {
      chainId: statusData.node_info.network,
      blockHeight: parseInt(statusData.sync_info.latest_block_height),
      blockTime: parseFloat(statusData.result?.block_time || "0"),
      validatorCount: validatorsData?.validators?.length || 0,
      bondedTokens: totalBondedTokens,
      nodeInfo: statusData.node_info
    };
  } catch (error) {
    return handleApiError(error, 'Failed to fetch chain info');
  }
};

// Get latest transactions
export const getLatestTransactions = async (count = 5) => {
  try {
    const { RPC_ENDPOINT } = getEndpoints();
    console.log(`Fetching latest transactions from ${RPC_ENDPOINT}`);
    
    try {
      const statusResponse = await axios.get(`${RPC_ENDPOINT}/status`);
      const latestHeight = parseInt(statusResponse.data.result.sync_info.latest_block_height);
      
      // We'll search through the latest 20 blocks to find transactions
      const blocksToSearch = 20;
      const minHeight = Math.max(1, latestHeight - blocksToSearch + 1);
      
      let transactions = [];
      let blocksChecked = 0;
      
      // Fetch each block in the range until we have enough transactions
      for (let height = latestHeight; height >= minHeight && transactions.length < count && blocksChecked < blocksToSearch; height--) {
        try {
          blocksChecked++;
          const blockResponse = await axios.get(`${RPC_ENDPOINT}/block`, {
            params: { height }
          });
          
          const blockData = blockResponse.data.result;
          const txs = blockData.block.data.txs || [];
          
          if (txs.length === 0) continue;
          
          // Process each transaction in this block
          for (const tx of txs) {
            if (transactions.length >= count) break;
            
            try {
              // Calculate the transaction hash
              const txHash = await getTxHashFromBase64(tx);
              
              // Get more details about the transaction
              const txResponse = await axios.get(`${RPC_ENDPOINT}/tx`, {
                params: { hash: `0x${txHash}` }
              });
              
              if (txResponse.data && txResponse.data.result) {
                const txData = txResponse.data.result;
                
                // Extract sender and receiver from events if available
                let sender = null;
                let receiver = null;
                let amount = null;
                
                if (txData.tx_result && txData.tx_result.events) {
                  // Look for transfer events
                  const transferEvents = txData.tx_result.events.filter((event: any) => event.type === 'transfer');
                  
                  if (transferEvents.length > 0) {
                    const transferEvent = transferEvents[0];
                    
                    // Extract sender and recipient from attributes
                    const senderAttr = transferEvent.attributes.find((attr: any) => attr.key === 'sender');
                    const recipientAttr = transferEvent.attributes.find((attr: any) => attr.key === 'recipient');
                    const amountAttr = transferEvent.attributes.find((attr: any) => attr.key === 'amount');
                    
                    if (senderAttr && senderAttr.value) {
                      sender = senderAttr.value;
                    }
                    
                    if (recipientAttr && recipientAttr.value) {
                      receiver = recipientAttr.value;
                    }
                    
                    if (amountAttr && amountAttr.value) {
                      amount = amountAttr.value;
                    }
                  }
                }
                
                transactions.push({
                  hash: txHash,
                  height: height.toString(),
                  time: blockData.block.header.time,
                  status: txData.tx_result.code === 0 ? 'success' : 'failed',
                  from: sender,
                  to: receiver,
                  amount: amount
                });
              }
            } catch (txError) {
              console.error(`Error processing transaction:`, txError);
            }
          }
        } catch (blockError) {
          console.error(`Error fetching block at height ${height}:`, blockError);
        }
      }
      
      console.log(`Found ${transactions.length} transactions in ${blocksChecked} blocks`);
      return transactions;
    } catch (statusError) {
      console.error('Error fetching status:', statusError);
      return handleApiError(statusError, 'getLatestTransactions');
    }
  } catch (error) {
    return handleApiError(error, 'getLatestTransactions');
  }
};
