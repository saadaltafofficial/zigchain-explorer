import axios from 'axios';

// API endpoint for our FastAPI backend
const API_ENDPOINT = 'https://zigscan.net/api';

// Direct RPC endpoint for fallback
const RPC_URL = 'https://zigscan.net';

// ZigChain API endpoint
const ZIGCHAIN_API = process.env.NEXT_PUBLIC_ZIGCHAIN_API || 'https://zigscan.net/api';

// RPC proxy URL for direct access to RPC endpoints
const RPC_PROXY_URL = 'https://zigscan.net';

// Helper function to build proxy URL
const buildProxyUrl = (path: string, params: Record<string, string> = {}) => {
  // Direct path to RPC endpoint without using the proxy function
  const baseUrl = `${RPC_PROXY_URL}${path.startsWith('/') ? path : '/' + path}`;
  
  // If no params, return the base URL
  if (Object.keys(params).length === 0) {
    return baseUrl;
  }
  
  // Build query string
  const queryString = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  
  // Return URL with query string
  return `${baseUrl}?${queryString}`;
};

// Flag to determine if we should use direct RPC calls
let useDirectRpc = false;

// Function to check if the API is available
const checkApiAvailability = async () => {
  try {
    const response = await axios.get(`${API_ENDPOINT}/chain/info`);
    if (response.status === 200) {
      // FastAPI backend is available
      useDirectRpc = false;
      return true;
    }
  } catch (error) {
    console.warn('[API Client] FastAPI backend is not available, falling back to RPC proxy');
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
  try {
    console.log('[API Client] Fetching account info for address:', address);
    
    // Try fetching from ZigChain Testnet API first
    try {
      console.log('[API Client] Fetching from ZigChain API:', `${ZIGCHAIN_API}/cosmos/auth/v1beta1/accounts/${address}`);
      const authResponse = await axios.get(`${ZIGCHAIN_API}/cosmos/auth/v1beta1/accounts/${address}`);
      console.log('[API Client] ZigChain Auth API response:', authResponse.data);
      
      // Get balance information
      console.log('[API Client] Fetching balance from ZigChain API:', `${ZIGCHAIN_API}/cosmos/bank/v1beta1/balances/${address}`);
      const balanceResponse = await axios.get(`${ZIGCHAIN_API}/cosmos/bank/v1beta1/balances/${address}`);
      console.log('[API Client] ZigChain Balance API response:', balanceResponse.data);
      
      // Get delegation information
      console.log('[API Client] Fetching delegations from ZigChain API:', `${ZIGCHAIN_API}/cosmos/staking/v1beta1/delegations/${address}`);
      const delegationResponse = await axios.get(`${ZIGCHAIN_API}/cosmos/staking/v1beta1/delegations/${address}`);
      console.log('[API Client] ZigChain Delegation API response:', delegationResponse.data);
      
      // Get rewards information
      console.log('[API Client] Fetching rewards from ZigChain API:', `${ZIGCHAIN_API}/cosmos/distribution/v1beta1/delegators/${address}/rewards`);
      const rewardsResponse = await axios.get(`${ZIGCHAIN_API}/cosmos/distribution/v1beta1/delegators/${address}/rewards`);
      console.log('[API Client] ZigChain Rewards API response:', rewardsResponse.data);
      
      // Extract account details
      const account = authResponse.data.account;
      const baseAccount = account.base_account || account;
      
      // Extract balance information
      const balances = balanceResponse.data.balances || [];
      const zigBalance = balances.find((b: any) => b.denom === 'uzig') || { amount: '0', denom: 'uzig' };
      
      // Extract delegation information
      const delegations = delegationResponse.data.delegation_responses || [];
      let totalDelegated = 0;
      
      delegations.forEach((delegation: any) => {
        if (delegation.balance && delegation.balance.amount) {
          totalDelegated += parseInt(delegation.balance.amount);
        }
      });
      
      // Extract rewards information
      const rewards = rewardsResponse.data.total || [];
      let totalRewards = 0;
      
      rewards.forEach((reward: any) => {
        if (reward.denom === 'uzig') {
          totalRewards += parseFloat(reward.amount);
        }
      });
      
      // Format the account information
      return {
        address: address,
        balance: formatDenom(zigBalance.amount, zigBalance.denom),
        sequence: parseInt(baseAccount.sequence || '0'),
        account_number: parseInt(baseAccount.account_number || '0'),
        delegated_amount: formatDenom(totalDelegated.toString(), 'uzig'),
        rewards: formatDenom(Math.floor(totalRewards).toString(), 'uzig'),
        total_transactions: 0 // Will be updated by the transaction count API
      };
    } catch (error) {
      console.warn('[API Client] Failed to get account info from ZigChain API, falling back to API endpoint');
      
      // Fallback to our API endpoint
      const response = await axios.get(`${API_ENDPOINT}/accounts/${address}`);
      return response.data;
    }
  } catch (error) {
    console.error('[API Client] Error fetching account info:', error);
    throw error;
  }
};

/**
 * Get transactions by address using the exact URL format with pagination
 * @param address Account address
 * @param type Optional type: 'sent', 'received', or 'all' (default)
 * @param maxPages Maximum number of pages to fetch (default: 3)
 * @returns The raw transaction data from the API with transactions up to the page limit
 */
// export const getTransactionsByAddress = async (
//   address: string, 
//   type: 'sent' | 'received' | 'all' = 'all',
//   maxPages: number = 3
// ) => {
//   try {
//     console.log(`[API Client] Fetching ${type} transactions for address ${address} using Tendermint RPC endpoint`);
    
//     // Function to fetch transactions with pagination
//     const fetchTransactionsPage = async (queryType: string, page: number = 1, perPage: number = 100) => {
//       // Build the query string based on the transaction type
//       let queryString = '';
      
//       if (queryType === 'message') {
//         // For message sender transactions
//         queryString = `message.sender='${address}'`;
//       } else if (queryType === 'transfer.sender') {
//         // For sent transactions
//         queryString = `transfer.sender="${address}"`;
//       } else {
//         // For received transactions
//         queryString = `transfer.recipient="${address}"`;
//       }
      
//       console.log(`[API Client] Fetching transactions with query: ${queryString}`);
      
//       // Make a proper JSON-RPC request to the Tendermint endpoint
//       const rpcEndpoint = 'https://zigscan.net';
      
//       // Construct the JSON-RPC request payload
//       const rpcPayload = {
//         jsonrpc: '2.0',
//         id: 1,
//         method: 'tx_search',
//         params: {
//           query: queryString,
//           prove: true,
//           page: page.toString(),
//           per_page: perPage.toString(),
//           order_by: 'desc'
//         }
//       };
      
//       console.log(`[API Client] RPC payload: ${JSON.stringify(rpcPayload)}`);
      
//       // Make the API request with a timeout
//       const response = await axios.get(rpcEndpoint, {
//         timeout: 15000,
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       });
      
//       if (response.status !== 200) {
//         console.error(`[API Client] Error response: ${response.status}`, response.data);
//         return { txs: [], totalCount: 0 };
//       }
      
//       // Extract transactions from the Tendermint RPC response
//       const txs = response.data?.result?.txs || [];
//       const totalCount = parseInt(response.data?.result?.total_count || '0');
      
//       console.log(`[API Client] Found ${txs.length} ${queryType} transactions out of ${totalCount} total`);
//       return { txs, totalCount };
//     };
    
//     // Fetch transactions based on type
//     if (type === 'sent') {
//       // Only fetch sent transactions
//       const sentResult = await fetchTransactionsPage('transfer.sender', 1, 100);
      
//       return {
//         result: {
//           txs: sentResult.txs,
//           total_count: sentResult.totalCount.toString(),
//           pagination_info: {
//             fetched_count: sentResult.txs.length,
//             total_count: sentResult.totalCount,
//             has_more: sentResult.txs.length < sentResult.totalCount,
//             max_pages_fetched: 1
//           }
//         }
//       };
//     } else if (type === 'received') {
//       // Only fetch received transactions
//       const receivedResult = await fetchTransactionsPage('transfer.recipient', 1, 100);
      
//       return {
//         result: {
//           txs: receivedResult.txs,
//           total_count: receivedResult.totalCount.toString(),
//           pagination_info: {
//             fetched_count: receivedResult.txs.length,
//             total_count: receivedResult.totalCount,
//             has_more: receivedResult.txs.length < receivedResult.totalCount,
//             max_pages_fetched: 1
//           }
//         }
//       };
//     } else {
//       // Fetch both sent and received transactions
//       const sentResult = await fetchTransactionsPage('transfer.sender', 1, 100);
//       const receivedResult = await fetchTransactionsPage('transfer.recipient', 1, 100);
//       const messageResult = await fetchTransactionsPage('message', 1, 100);
      
//       // Combine all transactions and remove duplicates by hash
//       const allTxs = [...sentResult.txs, ...receivedResult.txs, ...messageResult.txs];
//       const uniqueTxs = allTxs.filter((tx, index, self) => 
//         index === self.findIndex((t) => t.hash === tx.hash)
//       );
      
//       // Calculate the total unique transactions (approximately)
//       const totalUniqueTxs = Math.max(
//         sentResult.totalCount, 
//         receivedResult.totalCount,
//         messageResult.totalCount
//       );
      
//       console.log(`[API Client] Combined ${uniqueTxs.length} unique transactions after removing duplicates`);
      
//       return {
//         result: {
//           txs: uniqueTxs,
//           total_count: totalUniqueTxs.toString(),
//           pagination_info: {
//             fetched_count: uniqueTxs.length,
//             total_count: totalUniqueTxs,
//             has_more: uniqueTxs.length < totalUniqueTxs,
//             max_pages_fetched: 1
//           }
//         }
//       };
//     }
//   } catch (error) {
//     console.error(`[API Client] Error fetching ${type} transactions for address ${address}:`, error);
    
//     // Return empty results with default pagination info on error
//     return {
//       result: {
//         txs: [],
//         total_count: '0',
//         pagination_info: {
//           fetched_count: 0,
//           total_count: 0,
//           has_more: false,
//           max_pages_fetched: 0
//         }
//       }
//     };
//   }
// };

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
    const apiUrl = `https://zigscan.net/tx_search?query=${queryParam}&prove=true&page=1&per_page=${maxPages}&order_by=%22desc%22`;
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
export const getChainInfo = async () => {
  try {
    console.log('[API Client] Fetching chain info');
    
    // Try fetching from our API endpoint first
    try {
      const response = await axios.get(`${API_ENDPOINT}/chain/info`);
      return response.data;
    } catch (error) {
      console.warn('[API Client] Failed to get chain info from API endpoint, falling back to RPC');
      
      // Fallback to direct RPC call
      const statusResponse = await axios.get(buildProxyUrl('/status'));
      const validatorsResponse = await axios.get(buildProxyUrl('/validators'));
      
      // Extract chain info from status response
      const nodeInfo = statusResponse.data?.result?.node_info || {};
      const syncInfo = statusResponse.data?.result?.sync_info || {};
      const validatorInfo = statusResponse.data?.result?.validator_info || {};
      
      // Extract validators info
      const validators = validatorsResponse.data?.result?.validators || [];
      
      // Format the chain information
      return {
        chain_id: nodeInfo.network,
        latest_block_height: parseInt(syncInfo.latest_block_height || '0'),
        latest_block_time: syncInfo.latest_block_time,
        active_validators: validators.length,
        total_validators: validators.length,
        average_block_time: '6.0', // Placeholder - calculate from actual data if available
        total_transactions: '0', // Placeholder - get from a stats endpoint if available
        community_pool: '0 ZIG', // Placeholder - get from a stats endpoint if available
        inflation: '0.0%', // Placeholder - get from a stats endpoint if available
        staking_ratio: '0.0%', // Placeholder - get from a stats endpoint if available
        bonded_tokens: '0 ZIG', // Placeholder - get from a stats endpoint if available
      };
    }
  } catch (error) {
    console.error('[API Client] Error fetching chain info:', error);
    throw error;
  }
};

/**
 * Get latest blocks
 * @param limit Number of blocks to fetch
 */
export const getLatestBlocks = async (limit = 10) => {
  try {
    console.log(`[API Client] Fetching latest ${limit} blocks`);
    
    // Try fetching from our API endpoint first
    try {
      const response = await axios.get(`${API_ENDPOINT}/blocks/latest`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.warn('[API Client] Failed to get latest blocks from API endpoint, falling back to RPC');
      
      // Fallback to direct RPC call
      const latestBlockResponse = await axios.get(buildProxyUrl('/status'));
      const latestHeight = parseInt(latestBlockResponse.data?.result?.sync_info?.latest_block_height || '0');
      
      // Fetch the latest blocks one by one
      const blocks = [];
      for (let i = 0; i < limit; i++) {
        const height = latestHeight - i;
        if (height <= 0) break;
        
        try {
          const blockResponse = await axios.get(buildProxyUrl('/block', { height: height.toString() }));
          const blockResult = blockResponse.data?.result || {};
          
          blocks.push({
            height: height,
            hash: blockResult.block_id?.hash || '',
            time: blockResult.block?.header?.time || '',
            proposer: blockResult.block?.header?.proposer_address || '',
            num_txs: parseInt(blockResult.block?.data?.txs?.length || '0'),
          });
        } catch (blockError) {
          console.error(`[API Client] Error fetching block at height ${height}:`, blockError);
        }
      }
      
      return blocks;
    }
  } catch (error) {
    console.error('[API Client] Error fetching latest blocks:', error);
    throw error;
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
export const getLatestTransactions = async (limit = 10) => {
  try {
    console.log(`[API Client] Fetching latest ${limit} transactions`);
    
    // Try fetching from our API endpoint first
    try {
      const response = await axios.get(`${API_ENDPOINT}/transactions/latest`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.warn('[API Client] Failed to get latest transactions from API endpoint, falling back to RPC');
      
      // Fallback to direct RPC call - query recent transactions
      // Build the URL with parameters directly to avoid issues with parameter encoding
      const queryParam = encodeURIComponent('"tx.height > 0"');
      const perPage = encodeURIComponent(limit.toString());
      const orderBy = encodeURIComponent('"desc"');
      const fullUrl = `${RPC_PROXY_URL}/tx_search?query=${queryParam}&per_page=${perPage}&order_by=${orderBy}&prove=true`;
      
      console.log(`[API Client] Fetching latest transactions from: ${fullUrl}`);
      const txSearchResponse = await axios.get(fullUrl);
      
      const txs = txSearchResponse.data?.result?.txs || [];
      
      // Format the transactions
      return txs.map((tx: any) => {
        // Extract basic transaction info
        const txHash = tx.hash || '';
        const txHeight = tx.height || '0';
        
        // Try to extract more details from the tx result
        let txType = 'transfer';
        let amount = '0 ZIG';
        let from = '';
        let to = '';
        
        // Extract events if available
        const events = tx.tx_result?.events || [];
        
        // Look for transfer events
        const transferEvent = events.find((event: any) => event.type === 'transfer');
        if (transferEvent) {
          const attributes = transferEvent.attributes || [];
          
          // Find sender and recipient
          const senderAttr = attributes.find((attr: any) => atob(attr.key) === 'sender');
          const recipientAttr = attributes.find((attr: any) => atob(attr.key) === 'recipient');
          const amountAttr = attributes.find((attr: any) => atob(attr.key) === 'amount');
          
          if (senderAttr) from = atob(senderAttr.value);
          if (recipientAttr) to = atob(recipientAttr.value);
          if (amountAttr) amount = atob(amountAttr.value);
        }
        
        return {
          hash: txHash,
          height: txHeight,
          time: new Date().toISOString(), // Placeholder - get actual time from block if available
          type: txType,
          status: tx.tx_result?.code === 0 ? 'success' : 'failed',
          fee: '0.01 ZIG', // Placeholder - extract from tx data if available
          amount: amount,
          from: from,
          to: to
        };
      });
    }
  } catch (error) {
    console.error('[API Client] Error fetching latest transactions:', error);
    throw error;
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
