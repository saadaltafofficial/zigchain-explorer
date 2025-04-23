import axios from 'axios';

// API endpoint for our FastAPI backend
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_URL || 'https://zigscan.net/api';

// Direct RPC endpoint for fallback
const RPC_URL = process.env.RPC_URL || 'https://zigscan.net';

// ZigChain Testnet API endpoint
const ZIGCHAIN_API = 'https://testnet-api.zigchain.com';

// Local RPC proxy to avoid CORS issues
const RPC_PROXY_URL = '/api/rpc';

// Flag to determine if we should use direct RPC calls
let useDirectRpc = false;

// Function to check if the API is available
const checkApiAvailability = async () => {
  try {
    const response = await axios.get(`${API_ENDPOINT}/chain/info`);
    if (response.status === 200) {
      console.log('[API Client] FastAPI backend is available');
      useDirectRpc = false;
      return true;
    }
  } catch (error) {
    console.warn('[API Client] FastAPI backend is not available, falling back to direct RPC calls');
    useDirectRpc = true;
  }
  return false;
};

// Check API availability on startup
checkApiAvailability();

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

/**
 * Get chain information
 */
export const getChainInfo = async () => {
  try {
    // Try using the FastAPI backend first
    if (!useDirectRpc) {
      try {
        console.log('[API Client] Fetching chain info from API endpoint:', `${API_ENDPOINT}/chain/info`);
        const response = await axios.get(`${API_ENDPOINT}/chain/info`);
        console.log('[API Client] Raw chain info response:', response.data);
        
        // Check if the API response matches the expected format
        if (response.data && typeof response.data === 'object') {
          // Map the API response to the format expected by the frontend
          // This handles both the direct API response and the info endpoint format seen in the screenshot
          const chainInfo = {
            chainId: response.data.chain_id || response.data.chainId || 'Unknown',
            blockHeight: parseInt(response.data.latest_block_height || response.data.blockHeight || 0),
            blockTime: response.data.latest_block_time ? new Date(response.data.latest_block_time).getTime() : (response.data.blockTime || 0),
            validatorCount: parseInt(response.data.validator_count || response.data.validatorCount || 0),
            bondedTokens: response.data.bonded_tokens || response.data.bondedTokens || '0',
            nodeInfo: {
              version: response.data.node_info?.version || (response.data.nodeInfo?.version || 'Unknown')
            }
          };
          
          console.log('[API Client] Processed chain info:', chainInfo);
          return chainInfo;
        }
      } catch (error) {
        console.warn('[API Client] Failed to get chain info from API, falling back to direct RPC');
        console.error('[API Client] Error details:', error);
        useDirectRpc = true;
      }
    }
    
    // Fallback to direct RPC calls
    if (useDirectRpc) {
      console.log('[API Client] Using direct RPC call for chain info');
      
      // Get status for latest block height and chain ID
      const statusResponse = await axios.get(`${RPC_URL}/status`);
      console.log('[API Client] RPC status response:', statusResponse.data);
      
      const syncInfo = statusResponse.data.result.sync_info;
      const nodeInfo = statusResponse.data.result.node_info;
      
      // Get validator count
      const validatorsResponse = await axios.get(`${RPC_URL}/validators`);
      const validators = validatorsResponse.data.result.validators || [];
      
      const chainInfo = {
        chainId: nodeInfo.network,
        blockHeight: parseInt(syncInfo.latest_block_height),
        blockTime: new Date(syncInfo.latest_block_time).getTime(),
        validatorCount: validators.length,
        bondedTokens: '0', // Not easily available from RPC
        nodeInfo: {
          version: nodeInfo.version
        }
      };
      
      console.log('[API Client] Processed chain info from RPC:', chainInfo);
      return chainInfo;
    }
    
    // If we get here, both methods failed
    console.error('[API Client] Failed to get chain info from both API and RPC');
    return null;
  } catch (error) {
    console.error('[API Client] Critical error in getChainInfo:', error);
    return null; // Return null instead of throwing to prevent app crashes
  }
};

/**
 * Get latest blocks
 * @param limit Number of blocks to fetch
 */
export const getLatestBlocks = async (limit = 10) => {
  try {
    // Try using the FastAPI backend first
    if (!useDirectRpc) {
      try {
        console.log(`[API Client] Fetching ${limit} latest blocks from API`);
        const response = await axios.get(`${API_ENDPOINT}/blocks?limit=${limit}`);
        
        // Map the API response to the format expected by the frontend
        return response.data.map((block: any) => ({
          height: block.height,
          hash: block.hash,
          time: block.time,
          proposer: block.proposer,
          txCount: block.num_txs || 0
        }));
      } catch (error) {
        console.warn('[API Client] Failed to get latest blocks from API, falling back to direct RPC');
        useDirectRpc = true;
      }
    }
    
    // Fallback to direct RPC calls
    if (useDirectRpc) {
      console.log(`[API Client] Using direct RPC call for latest ${limit} blocks`);
      
      // Get the latest block height
      const statusResponse = await axios.get(`${RPC_URL}/status`);
      const latestHeight = parseInt(statusResponse.data.result.sync_info.latest_block_height);
      
      const blocks = [];
      
      // Fetch the blocks from newest to oldest
      for (let height = latestHeight; height > latestHeight - limit && height > 0; height--) {
        try {
          const blockResponse = await axios.get(`${RPC_URL}/block?height=${height}`);
          const blockData = blockResponse.data.result;
          
          blocks.push({
            height: height,
            hash: blockData.block_id.hash,
            time: blockData.block.header.time,
            proposer: blockData.block.header.proposer_address,
            txCount: blockData.block.data.txs ? blockData.block.data.txs.length : 0
          });
        } catch (blockError) {
          console.error(`[API Client] Error fetching block at height ${height}:`, blockError);
        }
      }
      
      return blocks;
    }
    
    return [];
  } catch (error) {
    console.error('[API Client] Error fetching latest blocks:', error);
    throw error;
  }
};

/**
 * Get block by height
 * @param height Block height
 */
export const getBlockByHeight = async (height: number) => {
  try {
    console.log(`[API Client] Fetching block at height ${height} from API`);
    const response = await axios.get(`${API_ENDPOINT}/blocks/${height}`);
    
    // Map the API response to the format expected by the frontend
    return {
      height: response.data.height,
      hash: response.data.hash,
      time: response.data.time,
      proposer: response.data.proposer,
      txCount: response.data.num_txs || 0,
      transactions: response.data.transactions || []
    };
  } catch (error) {
    console.error('[API Client] Error fetching block by height:', error);
    throw error;
  }
};

/**
 * Get latest transactions
 * @param limit Number of transactions to fetch
 */
export const getLatestTransactions = async (limit = 10) => {
  try {
    // Try using the FastAPI backend first
    if (!useDirectRpc) {
      try {
        console.log(`[API Client] Fetching ${limit} latest transactions from API`);
        const response = await axios.get(`${API_ENDPOINT}/transactions/latest?limit=${limit}`);
        
        // Map the API response to the format expected by the frontend
        return response.data.map((tx: any) => ({
          hash: tx.hash,
          height: tx.block_id?.toString() || '',
          time: tx.created_at,
          status: tx.status,
          from: tx.from_address,
          to: tx.to_address,
          amount: tx.amount
        }));
      } catch (error) {
        console.warn('[API Client] Failed to get latest transactions from API, falling back to direct RPC');
        useDirectRpc = true;
      }
    }
    
    // Fallback to direct RPC calls
    if (useDirectRpc) {
      console.log(`[API Client] Using direct RPC call for latest ${limit} transactions`);
      
      // Get the latest block height
      const statusResponse = await axios.get(`${RPC_URL}/status`);
      const latestHeight = parseInt(statusResponse.data.result.sync_info.latest_block_height);
      
      const transactions = [];
      let txCount = 0;
      
      // Fetch transactions from blocks, starting from the latest
      for (let height = latestHeight; height > latestHeight - 50 && height > 0 && txCount < limit; height--) {
        try {
          const blockResponse = await axios.get(`${RPC_URL}/block?height=${height}`);
          const blockData = blockResponse.data.result;
          const blockTime = blockData.block.header.time;
          
          const txs = blockData.block.data.txs || [];
          
          if (txs.length > 0) {
            for (const tx of txs) {
              if (txCount >= limit) break;
              
              // Get transaction details
              try {
                // For Tendermint-based chains like ZigChain, the hash is usually calculated from the tx bytes
                // But we can use the tx directly as the hash parameter
                const txResponse = await axios.get(`${RPC_URL}/tx?hash=0x${tx}`);
                const txData = txResponse.data.result;
                
                transactions.push({
                  hash: txData.hash,
                  height: height.toString(),
                  time: blockTime,
                  status: txData.tx_result.code === 0 ? 'success' : 'failed',
                  from: '', // Not easily available from RPC
                  to: '', // Not easily available from RPC
                  amount: '' // Not easily available from RPC
                });
                
                txCount++;
              } catch (txError) {
                console.error('[API Client] Error fetching transaction details:', txError);
              }
            }
          }
        } catch (blockError) {
          console.error(`[API Client] Error fetching block at height ${height}:`, blockError);
        }
      }
      
      return transactions;
    }
    
    return [];
  } catch (error) {
    console.error('[API Client] Error fetching latest transactions:', error);
    throw error;
  }
};

/**
 * Get transaction by hash
 * @param hash Transaction hash
 */
export const getTransactionByHash = async (hash: string) => {
  try {
    console.log(`[API Client] Fetching transaction with hash ${hash} from API`);
    const response = await axios.get(`${API_ENDPOINT}/transactions/${hash}`);
    
    return {
      hash: response.data.hash,
      height: response.data.block_id?.toString() || '',
      time: response.data.created_at,
      status: response.data.status,
      from: response.data.from_address,
      to: response.data.to_address,
      amount: response.data.amount,
      fee: response.data.fee
    };
  } catch (error) {
    console.error('[API Client] Error fetching transaction by hash:', error);
    throw error;
  }
};

/**
 * Get account information
 * @param address Account address
 */
export const getAccountInfo = async (address: string) => {
  try {
    console.log(`[API Client] Fetching account info for ${address} from API`);
    const response = await axios.get(`${API_ENDPOINT}/accounts/${address}`);
    return response.data;
  } catch (error) {
    console.error('[API Client] Error fetching account info:', error);
    throw error;
  }
};

/**
 * Get validators
 */
export const getValidators = async () => {
  try {
    // Fetch validators from ZigChain Testnet API
    console.log('[API Client] Fetching validators from ZigChain Testnet API');
    const validatorsResponse = await axios.get(`${ZIGCHAIN_API}/cosmos/base/tendermint/v1beta1/validatorsets/latest`);
    console.log('[API Client] Validators response:', validatorsResponse.data);
    
    // Return the raw response - we'll handle the transformation in the component
    return validatorsResponse.data;
  } catch (error) {
    console.error('[API Client] Error fetching validators from ZigChain API:', error);
    
    // Fallback to zigscan.net if ZigChain API fails
    try {
      console.log('[API Client] Falling back to zigscan.net for validators');
      const fallbackResponse = await axios.get(`${RPC_URL}/validators`);
      return fallbackResponse.data;
    } catch (fallbackError) {
      console.error('[API Client] zigscan.net fallback also failed:', fallbackError);
      
      // Final fallback to proxy
      try {
        console.log('[API Client] Trying proxy as final fallback for validators');
        const proxyResponse = await axios.get(`${RPC_PROXY_URL}?path=/validators`);
        return proxyResponse.data;
      } catch (proxyError) {
        console.error('[API Client] All validator fetch attempts failed');
        return []; // Return empty array on all errors
      }
    }
  }
};
        

        

        


/**
 * Get validator by address
 * @param address Validator address
 */
export const getValidatorByAddress = async (address: string) => {
  // Check if address is valid
  if (!address) {
    console.error('[API Client] Invalid validator address: undefined or empty');
    return null;
  }
  
  try {
    // Try to get validators from ZigChain Testnet API first
    console.log(`[API Client] Fetching validators from ZigChain API to find ${address}`);
    const validatorsResponse = await axios.get(`${ZIGCHAIN_API}/cosmos/base/tendermint/v1beta1/validatorsets/latest`);
    
    let validators: any[] = [];
    if (validatorsResponse.data && validatorsResponse.data.validators) {
      validators = validatorsResponse.data.validators;
    } else if (validatorsResponse.data && validatorsResponse.data.result && validatorsResponse.data.result.validators) {
      validators = validatorsResponse.data.result.validators;
    } else if (Array.isArray(validatorsResponse.data)) {
      validators = validatorsResponse.data;
    }
    
    console.log(`[API Client] Found ${validators.length} validators, searching for ${address}`);
    
    // Find the specific validator by address - handle different address formats
    const validator = validators.find((v: any) => {
      // Check different possible address formats
      if (v.address === address) return true;
      if (v.address && address.startsWith('zigvaloper') && v.address.replace('zigvalcons', 'zigvaloper') === address) return true;
      if (v.operator_address === address) return true;
      return false;
    });
    
    if (!validator) {
      console.warn(`[API Client] Validator with address ${address} not found in list of ${validators.length} validators`);
      
      // Fallback to zigscan.net if not found
      try {
        console.log(`[API Client] Falling back to zigscan.net for validator ${address}`);
        const fallbackResponse = await axios.get(`${RPC_URL}/validators`);
        let fallbackValidators = [];
        
        if (fallbackResponse.data && fallbackResponse.data.result && fallbackResponse.data.result.validators) {
          fallbackValidators = fallbackResponse.data.result.validators;
        } else if (Array.isArray(fallbackResponse.data)) {
          fallbackValidators = fallbackResponse.data;
        }
        
        const fallbackValidator = fallbackValidators.find((v: any) => v.address === address);
        if (!fallbackValidator) {
          return null;
        }
        
        return transformValidatorData(fallbackValidator, address);
      } catch (fallbackError) {
        console.error(`[API Client] Fallback also failed for validator ${address}:`, fallbackError);
        return null;
      }
    }
    
    return transformValidatorData(validator, address);
  } catch (err) {
    console.error(`[API Client] Error fetching validator ${address}:`, err);
    return null;
  }
};

/**
 * Transform validator data from any format to our standardized format
 */
const transformValidatorData = (validator: any, address: string) => {
  if (!validator) return null;
  
  // Get validator index from address if possible
  let validatorIndex = 1;
  try {
    const addressPart = address.substring(0, 8);
    const num = parseInt(addressPart, 16);
    validatorIndex = !isNaN(num) ? (num % 100) || 1 : 1;
  } catch (e) {
    console.warn('[API Client] Could not parse validator index:', e);
  }
  
  // Process validator data based on format
  let operatorAddress = '';
  let validatorAddress = '';
  
  // Check if we already have a zigval address format
  if (validator.address && validator.address.startsWith('zigvalcons')) {
    // Already in ZigChain format
    operatorAddress = validator.address.replace('zigvalcons', 'zigvaloper');
    validatorAddress = validator.address;
  } else if (validator.address) {
    // Convert hex address to zigvaloper format if needed
    try {
      if (validator.address.startsWith('zigvaloper')) {
        operatorAddress = validator.address;
      } else {
        operatorAddress = `zigvaloper1${Buffer.from(validator.address, 'hex').toString('base64').substring(0, 16)}`;
      }
      validatorAddress = validator.address;
    } catch (e) {
      console.error('[API Client] Error converting address:', e);
      operatorAddress = `zigvaloper-${validatorIndex}`;
      validatorAddress = validator.address || `validator-${validatorIndex}`;
    }
  } else {
    // Fallback if no address is available
    operatorAddress = `zigvaloper-${validatorIndex}`;
    validatorAddress = `validator-${validatorIndex}`;
  }
  
  // Extract moniker/name
  let moniker = `zigval-${validatorIndex}`;
  if (validator.description && validator.description.moniker) {
    moniker = validator.description.moniker;
  } else if (validator.name) {
    moniker = validator.name;
  }
  
  // Extract pub key
  let pubKeyValue = '';
  let pubKeyType = '/cosmos.crypto.ed25519.PubKey';
  
  try {
    // Handle different pub key formats
    if (validator.pub_key && validator.pub_key.value) {
      pubKeyValue = validator.pub_key.value;
      if (validator.pub_key.type) {
        pubKeyType = validator.pub_key.type;
      }
    } else if (validator.consensus_pubkey && validator.consensus_pubkey.key) {
      pubKeyValue = validator.consensus_pubkey.key;
      if (validator.consensus_pubkey['@type']) {
        pubKeyType = validator.consensus_pubkey['@type'];
      }
    } else if (validator.pub_key) {
      pubKeyValue = JSON.stringify(validator.pub_key);
    }
  } catch (err) {
    console.warn('[API Client] Error extracting validator pub key:', err);
  }
  
  // Ensure voting power is a number
  let votingPower = 0;
  try {
    votingPower = parseInt(validator.voting_power || '0');
    if (isNaN(votingPower)) votingPower = 0;
  } catch (err) {
    console.warn('[API Client] Error parsing voting power:', err);
  }

  // Transform the data to match the expected format
  return {
    operator_address: operatorAddress,
    address: validatorAddress,
    consensus_pubkey: {
      '@type': pubKeyType,
      key: pubKeyValue
    },
    jailed: false, // Not available in basic RPC response
    status: votingPower > 0 ? 'BOND_STATUS_BONDED' : 'BOND_STATUS_UNBONDED',
    tokens: (votingPower * 1000000).toString(), // Convert to uzig
    delegator_shares: (votingPower * 1000000).toString(),
    voting_power: votingPower,
    votingPower: votingPower, // Include both formats for compatibility
    description: {
      moniker: moniker,
      identity: '',
      website: `https://zigscan.net/validator/${validatorAddress}`,
      security_contact: '',
      details: `Validator ${validatorIndex} on ZigChain network`
    },
    unbonding_height: '0',
    unbonding_time: '',
    commission: {
      commission_rates: {
        rate: '0.05', // Default commission rate
        max_rate: '0.20',
        max_change_rate: '0.01'
      },
      update_time: new Date().toISOString()
    },
    min_self_delegation: '1'
  };
};

/**
 * Get transactions for an address
 * @param address Account address
 * @param page Page number
 * @param limit Number of transactions per page
 */
export const getAddressTransactions = async (address: string, page = 1, limit = 10) => {
  try {
    console.log(`[API Client] Fetching transactions for address ${address} from API`);
    const response = await axios.get(`${API_ENDPOINT}/accounts/${address}/transactions?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('[API Client] Error fetching address transactions:', error);
    throw error;
  }
};
