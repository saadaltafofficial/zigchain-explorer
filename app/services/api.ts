import axios from 'axios';

// API endpoint for our FastAPI backend
const API_ENDPOINT = 'https://api.zigscan.net';

// Direct RPC endpoint for fallback
const RPC_URL = 'https://rpc.zigscan.net';

// ZigChain API endpoint (Cosmos API/REST)
const ZIGCHAIN_API = process.env.NEXT_PUBLIC_ZIGCHAIN_API || 'https://api.zigscan.net';


// RPC proxy URL for direct access to RPC endpoints (Tendermint RPC)
const RPC_PROXY_URL = 'https://rpc.zigscan.net';

// Helper function to build proxy URL
const buildProxyUrl = (path: string, params: Record<string, string> = {}) => {
  // Direct path to RPC endpoint using the new domain structure
  const baseUrl = `${RPC_URL}${path.startsWith('/') ? path : '/' + path}`;

  // Add query parameters if provided
  if (Object.keys(params).length > 0) {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    return `${baseUrl}?${queryString}`;
  }

  return baseUrl;
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

// Helper function to format denominations
const formatDenom = (amount: string, denom: string) => {
  if (denom === 'uzig') {
    // Convert uzig to ZIG (1 ZIG = 1,000,000 uzig)
    const zigAmount = (parseInt(amount) / 1000000).toFixed(6);
    return `${zigAmount} ZIG`;
  }
  return `${amount} ${denom}`;
};

/**
 * Get account information
 * @param address Account address
 */
export const getAccountInfo = async (address: string) => {
  // Use browser console.log for client-side and global console for server-side
  const log = (...args: any[]) => {
    if (typeof window !== 'undefined') {
      window.console.log(...args);
    }
    console.log(...args);
  };
  
  try {
    log(`[API Client] Fetching account details for ${address}`);
    
    // Fetch account details from auth API
    const authUrl = `${ZIGCHAIN_API}/cosmos/auth/v1beta1/accounts/${address}`;
    log(`[API Client] Auth API URL: ${authUrl}`);
    
    const authResponse = await axios.get(authUrl);
    log(`[API Client] Auth API response:`, authResponse.data);
    
    // Extract account details
    const accountData = authResponse.data.account || {};
    const accountDetails = {
      address: accountData.address || address,
      account_number: accountData.account_number || '0',
      sequence: accountData.sequence || '0',
      pub_key: accountData.pub_key?.key || null,
      pub_key_type: accountData.pub_key?.['@type'] || null
    };
    
    // Fetch account balances from bank API
    const bankUrl = `${ZIGCHAIN_API}/cosmos/bank/v1beta1/balances/${address}`;
    log(`[API Client] Bank API URL: ${bankUrl}`);
    
    const bankResponse = await axios.get(bankUrl);
    log(`[API Client] Bank API response:`, bankResponse.data);
    
    // Process balances
    const balances = bankResponse.data.balances || [];
    
    // Find uzig balance
    const uzigBalance = balances.find((b: any) => b.denom === 'uzig');
    const uzigAmount = uzigBalance ? uzigBalance.amount : '0';
    
    // Calculate ZIG amount (1 ZIG = 1,000,000 uzig)
    const zigAmount = (parseInt(uzigAmount) / 1000000).toFixed(6);
    
    // Format other tokens
    const tokens = balances.map((b: any) => {
      // Extract token name from denom
      let tokenName = b.denom;
      if (tokenName.startsWith('coin.')) {
        // Extract the last part after the last dot
        const parts = tokenName.split('.');
        tokenName = parts[parts.length - 1];
      }
      
      return {
        denom: b.denom,
        amount: b.amount,
        tokenName: tokenName
      };
    });
    
    // Return combined data
    const result = {
      ...accountDetails,
      balance: formatDenom(uzigAmount, 'uzig'),
      uzig_balance: uzigAmount,
      zig_balance: zigAmount,
      tokens: tokens,
      total_tokens: tokens.length
    };
    
    log(`[API Client] Processed account info:`, result);
    return result;
    
  } catch (error) {
    log(`[API Client] Error fetching account info for ${address}:`, error);
    if (error instanceof Error) {
      log(`[API Client] Error details: ${error.message}`);
    }
    
    // Return a default object with error information
    return {
      address: address,
      balance: '0',
      uzig_balance: '0',
      account_number: '0',
      sequence: '0',
      tokens: [],
      total_tokens: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Get transactions by address using the exact URL format with pagination
 * @param address Account address
 * @param type Optional type: 'sent', 'received', or 'all' (default)
 * @param maxPages Maximum number of pages to fetch (default: 3)
 * @returns The raw transaction data from the API with transactions up to the page limit
 */
export const getTransactionsByAddress = async (
  address: string, 
  type: 'sent' | 'received' | 'all' = 'all',
  maxPages: number = 3
) => {
  try {
    // Use browser console.log for client-side and global console for server-side
    const log = (...args: any[]) => {
      // Log to browser console if available
      if (typeof window !== 'undefined') {
        window.console.log(...args);
      }
      // Also log to server console
      console.log(...args);
    };

    log(`[API Client] Fetching ${type} transactions for address ${address}`);
    
    // For 'all' type, we need to use a different query approach
    let queryParam;
    if (type === 'all') {
      // For 'all' transactions, use message.sender which is more reliable
      queryParam = `%22message.sender%3D%27${address}%27%22`;
      log(`[API Client] Using message.sender query for 'all' transactions`);
    } else if (type === 'sent') {
      queryParam = `%22transfer.sender%3D%27${address}%27%22`;
      log(`[API Client] Using transfer.sender query for 'sent' transactions`);
    } else {
      queryParam = `%22transfer.recipient%3D%27${address}%27%22`;
      log(`[API Client] Using transfer.recipient query for 'received' transactions`);
    }
    
    // Build the complete URL with all parameters directly included
    const apiUrl = `${RPC_URL}/tx_search?query=${queryParam}&prove=true&page=1&per_page=${maxPages}&order_by=%22desc%22`;
    log(`[API Client] Full request URL: ${apiUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    log(`[API Client] Starting fetch request...`);
    const response = await fetch(apiUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    log(`[API Client] Response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`API error! Status: ${response.status}`);
    }
    
    // Parse the response JSON
    const result = await response.json();
    log(`[API Client] Response parsed successfully`);
    log(`[API Client] Received ${result?.result?.txs?.length || 0} transactions from API`);
    
    // Log the full response for debugging
    log(`[API Client] Response data:`, result);
    
    return result;
  } catch (error) {
    // Enhanced error logging to help debug the issue
    if (typeof window !== 'undefined') {
      window.console.error(`[API Client] Error fetching ${type} transactions for address ${address}:`, error);
      
      // Log additional details about the error
      if (error instanceof Error) {
        window.console.error(`[API Client] Error name: ${error.name}, message: ${error.message}`);
        window.console.error(`[API Client] Error stack: ${error.stack}`);
      }
      
      // If it's a fetch error, log more details
      if (error instanceof TypeError && error.message.includes('fetch')) {
        window.console.error('[API Client] This appears to be a network or CORS-related error');
      }
    }
    
    // Also log to server console
    console.error(`[API Client] Error fetching ${type} transactions for address ${address}:`, error);
    
    // Return empty results with default pagination info on error
    return formatResult({ txs: [], totalCount: 0 });
  }
};

// Helper to format the result
function formatResult({ txs, totalCount }: { txs: any[]; totalCount: number }) {
  return {
    result: {
      txs,
      total_count: totalCount.toString(),
      pagination_info: {
        fetched_count: txs.length,
        total_count: totalCount,
        has_more: txs.length < totalCount,
        max_pages_fetched: 1
      }
    }
  };
}

/**
 * Convert an ISO-8601 timestamp into a human-readable date/time string.
 *
 * @param isoString  The timestamp in ISO-8601 format,
 *                   e.g. "2025-04-30T13:21:38.702178" or with zone "Z"/"+04:00"
 * @param locale     Optional BCP 47 locale tag (default: browser/user locale)
 * @param timeZone   Optional IANA time-zone (default: system locale zone)
 * @returns          A formatted date-time, e.g. "April 30, 2025, 1:21:38 PM"
 */
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

export const getBlockTime = async (block: string): Promise<string> => {
  // This is a placeholder - implement actual block time fetching if needed
  return new Date().toISOString();
};

/**
 * Get chain information
 */
// Define the ChainInfo interface based on expected structure and new API data
export interface ChainInfo {
  chainId: string;
  blockHeight: number;
  blockTime: number; // Represents an average block time, default to 5s as new API gives specific timestamp
  latestBlockTimestamp?: string; // Actual timestamp of the latest block from new API
  validatorCount: number;
  activeValidators: number;
  votingPower: number; // Voting power of the specific validator in validator_info, not total network voting power
  uptime: number; // Not available from /status, will be defaulted
  transactionsPerSecond: number; // Not available from /status, will be defaulted
  bondedTokens: string; // Not available from /status, will be defaulted
  nodeInfo: {
    protocol_version: { p2p: string; block: string; app: string };
    id: string;
    listen_addr: string;
    network: string;
    version: string;
    channels: string;
    moniker: string;
    other: { tx_index: string; rpc_address: string };
  } | null;
  version: string;
  isCatchingUp?: boolean;
}

const DEFAULT_CHAIN_INFO: ChainInfo = {
  chainId: 'unknown',
  blockHeight: 0,
  blockTime: 5.0, // Default average block time
  latestBlockTimestamp: undefined,
  validatorCount: 0,
  activeValidators: 0,
  votingPower: 0,
  uptime: 0,
  transactionsPerSecond: 0,
  bondedTokens: '0 ZIG',
  nodeInfo: null,
  version: '0.0.0',
  isCatchingUp: false,
};

/**
 * Get chain information from the RPC status endpoint
 */
export const getChainInfo = async (): Promise<ChainInfo> => {
  try {
    console.log('[API Client] Fetching chain info from RPC endpoint: https://rpc.zigscan.net/status');
    const response = await axios.get('https://rpc.zigscan.net/status', { timeout: 10000 });

    if (response.status === 200 && response.data && response.data.result) {
      const result = response.data.result;
      const nodeInfo = result.node_info;
      const syncInfo = result.sync_info;
      const validatorInfo = result.validator_info;

      return {
        chainId: nodeInfo?.network || 'unknown',
        blockHeight: syncInfo?.latest_block_height ? parseInt(syncInfo.latest_block_height) : 0,
        blockTime: 5.0, // Default average block time as /status provides a timestamp not an average
        latestBlockTimestamp: syncInfo?.latest_block_time || undefined,
        validatorCount: validatorInfo ? 3 : 0, // /status provides info for one validator, not total count
        activeValidators: validatorInfo ? 3 : 0, // Assuming if one is present, it's active
        votingPower: validatorInfo?.voting_power ? parseInt(validatorInfo.voting_power) : 0, // Voting power of the specific validator
        uptime: 0, // Not available from /status
        transactionsPerSecond: 0, // Not available from /status
        bondedTokens: '0 ZIG', // Not available from /status
        nodeInfo: nodeInfo || null,
        version: nodeInfo?.version || '0.0.0',
        isCatchingUp: syncInfo?.catching_up || false,
      };
    }
    console.error('[API Client] Failed to fetch valid data from RPC, status:', response.status);
    return DEFAULT_CHAIN_INFO;
  } catch (error) {
    console.error('[API Client] Error fetching chain info from RPC:', error);
    return DEFAULT_CHAIN_INFO;
  }
};

/**
 * Get latest blocks
 * @param limit Number of blocks to fetch
 */
export const getLatestBlocks = async (limit = 5) => {
  try {
    console.log(`[API Client] Fetching latest ${limit} blocks`);
    
    // Try fetching from our main API endpoint first
    try {
      console.log(`[API Client] Trying main API endpoint: ${API_ENDPOINT}/blocks/latest`);
      const response = await axios.get(`${API_ENDPOINT}/blocks/latest`, {
        params: { limit },
        timeout: 5000
      });
      if (response.status === 200) {
        return response.data;
      }
    } catch (error) {
      console.warn('[API Client] Failed to get latest blocks from main API endpoint, falling back to RPC');
    }
    
    // Fallback to direct RPC call
    console.log(`[API Client] Fetching latest blocks from RPC: ${RPC_URL}/status`);
    const latestBlockResponse = await axios.get(`${RPC_URL}/status`, { timeout: 10000 });
    const latestHeight = parseInt(latestBlockResponse.data?.result?.sync_info?.latest_block_height || '0');
      
    // Fetch the latest blocks one by one
    const blocks = [];
    for (let i = 0; i < limit; i++) {
      const height = latestHeight - i;
      if (height <= 0) break;
        
      try {
        const blockResponse = await axios.get(`${RPC_URL}/block?height=${height}`, { timeout: 5000 });
        const blockData = blockResponse.data?.result;
          
        if (blockData) {
          const block = {
            height: parseInt(blockData.block.header.height),
            hash: blockData.block_id.hash,
            time: blockData.block.header.time,
            proposer: blockData.block.header.proposer_address,
            txCount: blockData.block.data.txs ? blockData.block.data.txs.length : 0
          };
          blocks.push(block);
        }
      } catch (blockError) {
        console.warn(`[API Client] Error fetching block at height ${height}:`, blockError);
        continue;
      }
    }
      
    return blocks;
  } catch (error) {
    console.error('[API Client] Error fetching latest blocks:', error);
    return [];
  }
};

/**
 * Get transaction block height from RPC
 * @param txHash Transaction hash
 * @returns Block height as a string or null if not found
 */
export const getTransactionBlockHeight = async (txHash: string): Promise<string | null> => {
  try {
    console.log(`[API Client] Fetching block height for transaction ${txHash}`);
    
    // Query the transaction by hash to get its block height
    const response = await axios.get(buildProxyUrl('/tx', { hash: `0x${txHash}` }));
    
    // Extract the height from the response
    const height = response.data?.result?.height;
    if (height) {
      return height;
    }
    
    return null;
  } catch (error) {
    console.error(`[API Client] Error fetching block height for transaction ${txHash}:`, error);
    return null;
  }
};

/**
 * Get latest transactions
 * @param limit Number of transactions to fetch
 */
export const getLatestTransactions = async (limit = 5) => {
  try {
    console.log(`[API Client] Fetching latest ${limit} transactions`);

    // Try fetching from our main API endpoint first
    try {
      console.log(`[API Client] Trying main API endpoint for transactions: ${API_ENDPOINT}/transactions/latest`);
      const response = await axios.get(`${API_ENDPOINT}/transactions/latest`, {
        params: { limit },
        timeout: 5000
      });
      if (response.status === 200 && response.data) {
        console.log('[API Client] Successfully fetched latest transactions from main API endpoint.');
        return response.data;
      }
      console.warn(`[API Client] Main API endpoint for latest transactions returned status: ${response.status}, falling back to RPC.`);
    } catch (error) {
      console.warn('[API Client] Failed to get latest transactions from main API endpoint, falling back to RPC:', error instanceof Error ? error.message : error);
    }
    
    // Fallback to direct RPC call - query recent transactions
    console.log('[API Client] Falling back to RPC for latest transactions.');
    // Build the URL with parameters directly to avoid issues with parameter encoding
    const queryParam = encodeURIComponent('"tx.height > 0"');
    const perPage = encodeURIComponent(limit.toString());
    const orderBy = encodeURIComponent('"desc"');
    const fullUrl = `${RPC_URL}/tx_search?query=${queryParam}&per_page=${perPage}&order_by=${orderBy}&prove=true`;
    
    console.log(`[API Client] Fetching latest transactions from RPC: ${fullUrl}`);
    const txSearchResponse = await axios.get(fullUrl, { timeout: 10000 });
      
      const txs = txSearchResponse.data?.result?.txs || [];
      
      // Format the transactions
      const formattedTransactions = await Promise.all(txs.map(async (tx: any) => {
        // Extract basic transaction info
        const txHash = tx.hash || '';
        const txHeight = tx.height || '0';
        let blockTime = new Date().toISOString(); // Default, will be overwritten by actual block time

        if (txHeight !== '0') {
          try {
            // console.log(`[API Client] Fetching block header for height ${txHeight} to get timestamp for tx ${txHash}`);
            const blockResponse = await axios.get(`${RPC_URL}/block?height=${txHeight}`, { timeout: 5000 });
            if (blockResponse.data && blockResponse.data.result && blockResponse.data.result.block && blockResponse.data.result.block.header && blockResponse.data.result.block.header.time) {
              blockTime = blockResponse.data.result.block.header.time;
            } else {
              console.warn(`[API Client] Could not fetch valid block time for height ${txHeight}. Response:`, blockResponse.data);
            }
          } catch (blockError) {
            console.warn(`[API Client] Error fetching block at height ${txHeight} for timestamp:`, blockError instanceof Error ? blockError.message : String(blockError));
          }
        }
        
        let amount = '0 ZIG';
        let fromAddress = '';
        let toAddress = '';
        
        const safeAtob = (str: string): string => {
          try {
            if (typeof str !== 'string' || str.trim() === '') return '';
            const paddedStr = str.padEnd(Math.ceil(str.length / 4) * 4, '=');
            return atob(paddedStr);
          } catch (error) {
            console.warn(`[API Client] Error decoding base64 string: '${str}'`, error instanceof Error ? error.message : String(error));
            return '';
          }
        };
        
        const events = tx.tx_result?.events || [];
        const transferEvent = events.find((event: any) => event.type === 'transfer');
        if (transferEvent) {
          const attributes = transferEvent.attributes || [];
          const senderAttr = attributes.find((attr: any) => safeAtob(attr.key) === 'sender');
          const recipientAttr = attributes.find((attr: any) => safeAtob(attr.key) === 'recipient');
          const amountAttr = attributes.find((attr: any) => safeAtob(attr.key) === 'amount');
          
          if (senderAttr) fromAddress = safeAtob(senderAttr.value);
          if (recipientAttr) toAddress = safeAtob(recipientAttr.value);
          if (amountAttr) amount = safeAtob(amountAttr.value);
        }
        
        return {
          hash: txHash,
          block_id: parseInt(txHeight) || 0,
          created_at: blockTime,
          status: tx.tx_result?.code === 0 ? 'success' : 'failed',
          fee: '0.01 ZIG', // Placeholder
          amount: amount,
          from_address: fromAddress,
          to_address: toAddress,
        };
      }));
      return formattedTransactions;
  } catch (error) {
    console.error('[API Client] Error fetching latest transactions (overall process):', error);
    return [];
  } 
};

/**
 * Get block details by height
 * @param height Block height
 * @returns Block details
 */
export const getBlockByHeight = async (height: number) => {
  try {
    console.log(`[API Client] Fetching block at height ${height}`);
    
    // Try fetching from our API endpoint first
    try {
      const response = await axios.get(`${API_ENDPOINT}/blocks/${height}`);
      return response.data;
    } catch (error) {
      console.warn(`[API Client] Failed to get block at height ${height} from API endpoint, falling back to RPC`);
      
      // Fallback to direct RPC call
      const blockResponse = await axios.get(buildProxyUrl('/block', { height: height.toString() }));
      const blockResult = blockResponse.data?.result || {};
      
      // Get transactions in this block
      // Build the URL with parameters directly to avoid issues with parameter encoding
      const queryParam = encodeURIComponent(`"tx.height=${height}"`);
      const perPage = encodeURIComponent('100'); // Limit to 100 transactions per block for performance
      const orderBy = encodeURIComponent('"asc"');
      const fullUrl = `${RPC_PROXY_URL}/tx_search?query=${queryParam}&per_page=${perPage}&order_by=${orderBy}&prove=true`;
      
      console.log(`[API Client] Fetching transactions for block ${height} from: ${fullUrl}`);
      const txsResponse = await axios.get(fullUrl);
      
      const txs = txsResponse.data?.result?.txs || [];
      
      // Format the block details
      return {
        height: height,
        hash: blockResult.block_id?.hash || '',
        time: blockResult.block?.header?.time || '',
        proposer: blockResult.block?.header?.proposer_address || '',
        num_txs: parseInt(blockResult.block?.data?.txs?.length || '0'),
        total_gas: txs.reduce((total: number, tx: any) => total + parseInt(tx.tx_result?.gas_used || '0'), 0),
        size: blockResult.block_size || 0,
        transactions: txs.map((tx: any) => ({
          hash: tx.hash || '',
          status: tx.tx_result?.code === 0 ? 'success' : 'failed',
          fee: '0.01 ZIG', // Placeholder - extract from tx data if available
          gas_used: tx.tx_result?.gas_used || '0',
          gas_wanted: tx.tx_result?.gas_wanted || '0',
        }))
      };
    }
  } catch (error) {
    console.error(`[API Client] Error fetching block at height ${height}:`, error);
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
    
    // Try fetching from ZigChain Testnet API first
    try {
      console.log(`[API Client] Fetching transaction from ZigChain API: ${ZIGCHAIN_API}/cosmos/tx/v1beta1/txs/${hash}`);
      const response = await axios.get(`${ZIGCHAIN_API}/cosmos/tx/v1beta1/txs/${hash}`);
      console.log('[API Client] ZigChain transaction response:', response.data);
      
      // Extract transaction details from Cosmos SDK format
      const txData = response.data.tx_response || {};
      const messages = txData.tx?.body?.messages || [];
      
      // Determine transaction type
      let txType = 'unknown';
      let amount = '';
      let from = '';
      let to = '';
      let multiSendData = null;
      
      if (messages.length > 0) {
        const firstMsg = messages[0];
        const typeUrl = firstMsg['@type'] || '';
        
        if (typeUrl.includes('MsgSend')) {
          txType = 'transfer';
          from = firstMsg.from_address || '';
          to = firstMsg.to_address || '';
          
          if (firstMsg.amount && firstMsg.amount.length > 0) {
            amount = `${firstMsg.amount[0].amount} ${firstMsg.amount[0].denom || 'uzig'}`;
          }
        } else if (typeUrl.includes('MsgMultiSend')) {
          txType = 'multisend';
          
          // Extract inputs (senders) and outputs (receivers)
          const inputs = firstMsg.inputs || [];
          const outputs = firstMsg.outputs || [];
          
          // Format for display
          multiSendData = {
            inputs: inputs.map((input: any) => ({
              address: input.address,
              amounts: input.coins?.map((coin: any) => 
                `${coin.amount} ${coin.denom || 'uzig'}`
              ).join(', ') || ''
            })),
            outputs: outputs.map((output: any) => ({
              address: output.address,
              amounts: output.coins?.map((coin: any) => 
                `${coin.amount} ${coin.denom || 'uzig'}`
              ).join(', ') || ''
            }))
          };
          
          // Set simplified from/to for basic display
          if (inputs.length > 0) from = inputs[0].address;
          if (outputs.length > 0) to = outputs[0].address;
          
          // Calculate total amount for display
          const totalAmount = outputs.reduce((total: number, output: any) => {
            const outputAmount = output.coins?.reduce((sum: number, coin: any) => {
              return sum + (parseInt(coin.amount) || 0);
            }, 0) || 0;
            return total + outputAmount;
          }, 0);
          
          const denom = outputs[0]?.coins?.[0]?.denom || 'uzig';
          amount = `${totalAmount} ${denom}`;
        } else {
          // Handle other transaction types
          txType = typeUrl.split('.').pop() || 'unknown';
        }
      }
      
      return {
        hash: txData.txhash,
        height: txData.height || '0',
        timestamp: txData.timestamp,
        type: txType,
        status: txData.code === 0 ? 'success' : 'failed',
        fee: txData.tx?.auth_info?.fee?.amount?.[0]?.amount + ' ' + (txData.tx?.auth_info?.fee?.amount?.[0]?.denom || 'uzig'),
        amount: amount,
        memo: txData.tx?.body?.memo || '',
        from: from,
        to: to,
        multiSendData: multiSendData,
        gas_used: txData.gas_used,
        gas_wanted: txData.gas_wanted,
        raw_log: txData.raw_log,
        messages: messages
      };
    } catch (error) {
      console.warn('[API Client] Failed to get transaction from ZigChain API, falling back to API endpoint');
      
      const response = await axios.get(`${API_ENDPOINT}/transactions/${hash}`);
      return {
        hash: response.data.hash,
        height: response.data.height,
        timestamp: response.data.timestamp,
        type: response.data.type || 'transfer',
        status: response.data.status || 'success',
        fee: response.data.fee || '0.01 ZIG',
        amount: response.data.amount || '0 ZIG',
        memo: response.data.memo || '',
        from: response.data.from || '',
        to: response.data.to || ''
      };
    }
  } catch (error) {
    console.error('[API Client] Error fetching transaction by hash:', error);
    throw error;
  }
};
