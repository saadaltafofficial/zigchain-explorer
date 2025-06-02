import axios from 'axios';

// API endpoint for our FastAPI backend - homepage will use this
const API_ENDPOINT = 'https://zigscan.net/api';

// Direct RPC endpoint for fallback
const RPC_URL = 'https://zigscan.net';

// ZigChain Testnet API endpoint - address page will use this
const ZIGCHAIN_API = process.env.REMOTE_API_ENDPOINT || 'https://testnet-api.zigchain.com';

// RPC proxy URL for direct access to RPC endpoints
const RPC_PROXY_URL = 'https://zigscan.net';

// Helper function to build proxy URL
const buildProxyUrl = (path: string, params: Record<string, string> = {}) => {
  // Direct path to RPC endpoint without using the proxy function
  return `${RPC_PROXY_URL}${path.startsWith('/') ? path : '/' + path}`;
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
      console.log('[API Client] Fetching from ZigChain Testnet API:', `${ZIGCHAIN_API}/cosmos/auth/v1beta1/accounts/${address}`);
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
      
      // Calculate total delegated amount
      const delegations = delegationResponse.data.delegation_responses || [];
      const totalDelegated = delegations.reduce((sum: number, delegation: any) => {
        return sum + parseInt(delegation.balance?.amount || '0');
      }, 0);
      
      // Calculate total rewards
      const totalRewards = rewardsResponse.data.total || [];
      const zigRewards = totalRewards.find((r: any) => r.denom === 'uzig') || { amount: '0', denom: 'uzig' };
      
      // Format the account info
      return {
        address: address,
        balance: formatDenom(zigBalance.amount, zigBalance.denom),
        sequence: parseInt(baseAccount.sequence || '0'),
        account_number: parseInt(baseAccount.account_number || '0'),
        delegated_amount: formatDenom(totalDelegated.toString(), 'uzig'),
        rewards: formatDenom(zigRewards.amount, zigRewards.denom),
        total_transactions: 0 // Will be updated when we fetch transactions
      };
    } catch (error) {
      console.warn('[API Client] Failed to get account info from ZigChain API:', error);
      
      // Try using the FastAPI backend as fallback
      try {
        const response = await axios.get(`${API_ENDPOINT}/account/${address}`);
        return response.data;
      } catch (apiError) {
        console.warn('[API Client] Failed to get account info from API, falling back to direct RPC');
        useDirectRpc = true;
      }
    }
    
    // Fallback to direct RPC calls
    if (useDirectRpc) {
      // Get account info from the RPC endpoint
      const response = await axios.get(buildProxyUrl('/auth/accounts/' + address));
      const account = response.data.result.account;
      return {
        address: account.address,
        balance: account.coins[0]?.amount + ' ' + (account.coins[0]?.denom || 'uzig'),
        sequence: account.sequence,
        account_number: account.account_number
      };
    }
  } catch (error) {
    return handleApiError(error, 'Failed to get account info');
  }
};

/**
 * Get transactions for an address (original function)
 * @param address Account address
 */
export const getAddressTransactions = async (address: string) => {
  try {
    console.log(`[API Client] Fetching all transactions for address ${address}`);
    
    // Using the exact URL format that works with zigscan.net
    // This format returns all transactions without pagination limits
    
    // Fetch sent transactions
    console.log(`[API Client] Fetching sent transactions for ${address}`);
    const sentTxResponse = await axios.get(buildProxyUrl('/tx_search', {
      query: `"transfer.sender='${address}'"`,
      prove: 'true'
    }));
    
    // Fetch received transactions
    console.log(`[API Client] Fetching received transactions for ${address}`);
    const receivedTxResponse = await axios.get(buildProxyUrl('/tx_search', {
      query: `"transfer.recipient='${address}'"`,
      prove: 'true'
    }));
    
    // Extract transactions from responses
    const sentTxs = sentTxResponse.data?.result?.txs || [];
    const receivedTxs = receivedTxResponse.data?.result?.txs || [];
    
    // Log info about the transactions we fetched
    console.log(`[API Client] Sent transactions count: ${sentTxs.length}`);
    console.log(`[API Client] Received transactions count: ${receivedTxs.length}`);
    
    // Combine all transactions and remove duplicates by hash
    const allTxs = [...sentTxs, ...receivedTxs];
    const uniqueTxs = allTxs.filter((tx, index, self) => 
      index === self.findIndex((t) => t.hash === tx.hash)
    );
    
    console.log(`[API Client] Combined unique transactions: ${uniqueTxs.length}`);
    
    // Sort by height descending (newest first)
    const sortedTxs = uniqueTxs.sort((a, b) => {
      const heightA = a.height ? parseInt(a.height) : 0;
      const heightB = b.height ? parseInt(b.height) : 0;
      return heightB - heightA;
    });
    
    // Get total transaction count
    const totalTxs = sortedTxs.length;
    
    // No pagination - use all transactions
    console.log(`[API Client] Showing all ${totalTxs} transactions`);
    
    // Transform transactions to our standard format
    const formattedTxs = sortedTxs.map(tx => {
      // Parse the transaction data
      const txData = tx.tx_result || {};
      const txHash = tx.hash || '';
      const txHeight = tx.height || '0';
      
      // Try to extract transaction details from the events
      let txType = 'transfer';
      let amount = '0 uzig';
      let fromAddress = '';
      let toAddress = '';
      let status = txData.code === 0 ? 'success' : 'failed';
      
      // Try to find transfer events in the transaction
      try {
        // Parse the events from the logs if available
        const events = txData.events || [];
        
        // Look for transfer events
        const transferEvent = events.find((e: { type: string }) => e.type === 'transfer');
        if (transferEvent) {
          const attributes = transferEvent.attributes || [];
          
          // Find sender and recipient attributes
          const senderAttr = attributes.find((a: { key: string }) => a.key === 'sender');
          const recipientAttr = attributes.find((a: { key: string }) => a.key === 'recipient');
          const amountAttr = attributes.find((a: { key: string }) => a.key === 'amount');
          
          if (senderAttr) fromAddress = senderAttr.value || '';
          if (recipientAttr) toAddress = recipientAttr.value || '';
          if (amountAttr) amount = amountAttr.value || '0uzig';
        }
      } catch (error) {
        console.warn(`[API Client] Error parsing transaction events: ${error}`);
      }
      
      // Format the transaction for our UI
      return {
        hash: txHash,
        height: parseInt(txHeight),
        timestamp: tx.timestamp || new Date().toISOString(),
        type: txType,
        status: status,
        fee: '0.01 ZIG', // Default fee
        amount: amount,
        memo: '',
        from: fromAddress,
        to: toAddress
      };
    });
    
    console.log(`[API Client] Returning all ${formattedTxs.length} transactions`);
    
    // Return all formatted transactions
    return {
      transactions: formattedTxs,
      pagination: {
        total: totalTxs,
        page: 1,
        limit: totalTxs,
        pages: 1
      }
    };
  } catch (error) {
    console.error('[API Client] Error fetching address transactions:', error);
    // Return empty results instead of throwing
    return {
      transactions: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 0,
        pages: 1
      }
    };
  }
};


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

export async function getBlockTime(block: string): Promise<string> {
  const request = await axios.get(`${RPC_URL}/block?height=${block}`);
  const response = request.data;
  return response.result.block.header.time;
}

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
    console.log(`[API Client] Fetching ${type} transactions for address ${address} using exact URL format`);
    
    // Function to fetch transactions up to a maximum number of pages
    const fetchAllPages = async (baseQuery: string) => {
      // Start with page 1
      let currentPage = 1;
      const perPage = 100; // Fetch 100 per page to minimize number of requests
      let allTxs: any[] = [];
      let hasMorePages = true;
      let totalTxCount = 0;
      
      while (hasMorePages && currentPage <= maxPages) {
        console.log(`[API Client] Fetching page ${currentPage} of max ${maxPages} with ${perPage} transactions per page`);
        
        // Build URL with pagination parameters
        const paginatedUrl = buildProxyUrl('/tx_search', {
          query: baseQuery,
          prove: 'true',
          page: currentPage.toString(),
          per_page: perPage.toString(),
          order_by: '"desc"' // Newest first
        });
        
        const response = await axios.get(paginatedUrl);
        const txs = response.data?.result?.txs || [];
        totalTxCount = parseInt(response.data?.result?.total_count || '0');
        
        console.log(`[API Client] Page ${currentPage}: Found ${txs.length} transactions. Total available: ${totalTxCount}`);
        
        // Add transactions from this page to our collection
        allTxs = [...allTxs, ...txs];
        
        // Check if we need to fetch more pages
        const fetchedSoFar = currentPage * perPage;
        hasMorePages = fetchedSoFar < totalTxCount;
        
        // Move to next page
        currentPage++;
        
        // If we've reached the max pages, log how many transactions we're not fetching
        if (currentPage > maxPages && hasMorePages) {
          const remaining = totalTxCount - allTxs.length;
          console.log(`[API Client] Reached maximum page limit (${maxPages}). Not fetching ${remaining} remaining transactions.`);
        }
      }
      
      // Return the transactions we've fetched along with the total count for pagination UI
      return { txs: allTxs, totalCount: totalTxCount };
    };
    
    // Handle different transaction types
    if (type === 'sent' || type === 'all') {
      // Fetch all pages of sent transactions
      const sentQuery = `"transfer.sender='${address}'"`;      
      const sentResult = await fetchAllPages(sentQuery);
      console.log(`[API Client] Found a total of ${sentResult.txs.length} sent transactions out of ${sentResult.totalCount} total`);
      
      // If only sent transactions were requested, return them directly
      if (type === 'sent') {
        return {
          result: {
            txs: sentResult.txs,
            total_count: sentResult.totalCount.toString()
          }
        };
      }
      
      // For 'all' type, fetch received transactions and combine them
      const receivedQuery = `"transfer.recipient='${address}'"`;      
      const receivedResult = await fetchAllPages(receivedQuery);
      console.log(`[API Client] Found a total of ${receivedResult.txs.length} received transactions out of ${receivedResult.totalCount} total`);
      
      // Combine transactions and remove duplicates by hash
      const allTxs = [...sentResult.txs, ...receivedResult.txs];
      const uniqueTxs = allTxs.filter((tx, index, self) => 
        index === self.findIndex((t) => t.hash === tx.hash)
      );
      
      console.log(`[API Client] Combined ${uniqueTxs.length} unique transactions after removing duplicates`);
      
      // Calculate the total unique transactions (approximately)
      const totalUniqueTxs = Math.max(sentResult.totalCount, receivedResult.totalCount);
      
      // Return combined transactions in the same format as the API response
      return {
        result: {
          txs: uniqueTxs,
          total_count: totalUniqueTxs.toString(),
          // Add metadata about pagination for the UI
          pagination_info: {
            fetched_count: uniqueTxs.length,
            total_count: totalUniqueTxs,
            has_more: uniqueTxs.length < totalUniqueTxs,
            max_pages_fetched: maxPages
          }
        }
      };
    } else if (type === 'received') {
      // Fetch only received transactions with pagination
      const receivedQuery = `"transfer.recipient='${address}'"`;      
      const receivedResult = await fetchAllPages(receivedQuery);
      
      return {
        result: {
          txs: receivedResult.txs,
          total_count: receivedResult.totalCount.toString(),
          // Add pagination info
          pagination_info: {
            fetched_count: receivedResult.txs.length,
            total_count: receivedResult.totalCount,
            has_more: receivedResult.txs.length < receivedResult.totalCount,
            max_pages_fetched: maxPages
          }
        }
      };
    }
  } catch (error) {
    console.error(`[API Client] Error fetching ${type} transactions for address ${address}:`, error);
    // Return empty results instead of throwing
    return {
      result: {
        txs: [],
        total_count: '0'
      }
    };
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
        // Fetching chain info from API endpoint
        const response = await axios.get(`${API_ENDPOINT}/chain/info`);
        // Process chain info response
        
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
          
          // Return processed chain info
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
      const statusResponse = await axios.get(buildProxyUrl('/status'));
      console.log('[API Client] RPC status response:', statusResponse.data);
      
      const syncInfo = statusResponse.data.result.sync_info;
      const nodeInfo = statusResponse.data.result.node_info;
      
      // Get validator count
      const validatorsResponse = await axios.get(buildProxyUrl('/validators'));
      const validatorCount = validatorsResponse.data.result.total || 0;
      
      return {
        chainId: nodeInfo.network || 'Unknown',
        blockHeight: parseInt(syncInfo.latest_block_height || 0),
        blockTime: new Date(syncInfo.latest_block_time).getTime(),
        validatorCount: parseInt(validatorCount),
        bondedTokens: '0', // Not available from this endpoint
        nodeInfo: {
          version: nodeInfo.version || 'Unknown'
        }
      };
    }
  } catch (error) {
    console.error('[API Client] Error fetching chain info:', error);
    
    // Return a default object with minimal info to prevent UI errors
    return {
      chainId: 'Unknown',
      blockHeight: 0,
      blockTime: 0,
      validatorCount: 0,
      bondedTokens: '0',
      nodeInfo: {
        version: 'Unknown'
      }
    };
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
        // Fetching latest blocks from API endpoint
        const response = await axios.get(`${API_ENDPOINT}/blocks/latest?limit=${limit}`);
        // Process blocks response
        
        // Check if the API response matches the expected format
        if (response.data && Array.isArray(response.data)) {
          return response.data;
        }
      } catch (error) {
        console.warn('[API Client] Failed to get latest blocks from API, falling back to direct RPC');
        console.error('[API Client] Error details:', error);
        useDirectRpc = true;
      }
    }
    
    // Fallback to direct RPC calls
    if (useDirectRpc) {
      console.log('[API Client] Using direct RPC call for latest blocks');
      
      // Get latest blocks from blockchain endpoint
      const blocksResponse = await axios.get(buildProxyUrl('/blockchain'));
      console.log('[API Client] RPC blocks response:', blocksResponse.data);
      
      const blocks = blocksResponse.data.result.block_metas || [];
      
      // Transform the blocks to match the expected format
      const formattedBlocks = blocks.map((block: any) => {
        // Log the timestamp format from the API
        console.log(`[API Client] Block ${block.header.height} timestamp:`, block.header.time);
        
        return {
          height: parseInt(block.header.height),
          hash: block.block_id.hash,
          time: block.header.time,
          proposer: block.header.proposer_address,
          numTxs: parseInt(block.num_txs || 0)
        };
      }).slice(0, limit);
      
      console.log('[API Client] Formatted blocks:', formattedBlocks);
      return formattedBlocks;
    }
  } catch (error) {
    console.error('[API Client] Error fetching latest blocks:', error);
    return []; // Return empty array on error
  }
};

/**
 * Get transaction block height from RPC
 * @param txHash Transaction hash
 * @returns Block height as a string or null if not found
 */
export const getTransactionBlockHeight = async (txHash: string): Promise<string | null> => {
  try {
    // Remove 0x prefix if present
    const cleanHash = txHash.startsWith('0x') ? txHash.substring(2) : txHash;
    
    // Query the transaction by hash to get its block height
    const txResponse = await axios.get(buildProxyUrl(`/tx?hash=0x${cleanHash}`));
    
    if (txResponse.data && txResponse.data.result && txResponse.data.result.height) {
      const height = txResponse.data.result.height;
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
    // Try using the FastAPI backend first
    if (!useDirectRpc) {
      try {
        // Fetching latest transactions from API endpoint
        const response = await axios.get(`${API_ENDPOINT}/transactions/latest?limit=${limit}`);
        // Process transactions response
        
        // Check if the API response matches the expected format
        if (response.data) {
          // Handle both array and object with transactions property
          const txs = Array.isArray(response.data) ? response.data : (response.data.transactions || []);
          
          // Process transactions but don't try to get heights from API response
          // We'll fetch heights directly from RPC when needed
          const processedTxs = txs.map((tx: any) => {
            return {
              ...tx,
              height: 0 // Set default height to 0, will be fetched from RPC when needed
            };
          });
          
          return processedTxs;
        }
      } catch (error) {
        console.warn('[API Client] Failed to get latest transactions from API, falling back to direct RPC');
        console.error('[API Client] Error details:', error);
        useDirectRpc = true;
      }
    }
    
    // Fallback to direct RPC calls
    if (useDirectRpc) {
      console.log('[API Client] Using direct RPC call for latest transactions');
      
      // Get latest blocks first
      const blocksResponse = await axios.get(buildProxyUrl('/blockchain'));
      const blocks = blocksResponse.data.result.block_metas || [];
      
      // Get transactions from each block
      const transactions = [];
      
      for (let i = 0; i < Math.min(blocks.length, 5); i++) {
        const block = blocks[i];
        if (parseInt(block.num_txs) > 0) {
          try {
            const blockResponse = await axios.get(buildProxyUrl(`/block?height=${block.header.height}`));
            const blockData = blockResponse.data.result;
            
            if (blockData.block.data.txs) {
              for (const tx of blockData.block.data.txs) {
                // Get transaction details
                try {
                  const txResponse = await axios.get(buildProxyUrl(`/tx?hash=0x${tx}`));
                  const txData = txResponse.data.result;
                  
                  transactions.push({
                    hash: txData.hash,
                    height: block.header.height,
                    time: block.header.time,
                    status: txData.tx_result.code === 0 ? 'success' : 'failed',
                    code: txData.tx_result.code
                  });
                  
                  if (transactions.length >= limit) {
                    break;
                  }
                } catch (txError) {
                  console.error(`[API Client] Error fetching transaction details for ${tx}:`, txError);
                }
              }
            }
            
            if (transactions.length >= limit) {
              break;
            }
          } catch (blockError) {
            console.error(`[API Client] Error fetching block details for height ${block.header.height}:`, blockError);
          }
        }
      }
      
      return transactions;
    }
  } catch (error) {
    console.error('[API Client] Error fetching latest transactions:', error);
    return []; // Return empty array on error
  }
};

/**
 * Get block details by height
 * @param height Block height
 * @returns Block details
 */
export const getBlockByHeight = async (height: number) => {
  try {
    console.log(`[API Client] Fetching block with height ${height}`);
    
    // Try FastAPI backend first
    try {
      const response = await axios.get(`${API_ENDPOINT}/blocks/${height}`);
      console.log('[API Client] FastAPI block response:', response.data);
      
      if (response.data && response.data.block) {
        return {
          height: parseInt(response.data.block.header.height),
          time: response.data.block.header.time,
          proposer: response.data.block.header.proposer_address,
          txCount: response.data.block.data.txs ? response.data.block.data.txs.length : 0,
          hash: response.data.block_id.hash,
          transactions: response.data.block.data.txs || [],
          appHash: response.data.block.header.app_hash,
          consensusHash: response.data.block.header.consensus_hash,
          lastCommitHash: response.data.block.header.last_commit_hash,
          validatorHash: response.data.block.header.validators_hash,
          evidenceHash: response.data.block.header.evidence_hash,
          lastResultsHash: response.data.block.header.last_results_hash
        };
      }
    } catch (error) {
      console.warn('[API Client] FastAPI block fetch failed, trying RPC proxy:', error);
    }
    
    // Fallback to RPC proxy
    const blockResponse = await axios.get(buildProxyUrl(`/block?height=${height}`));
    console.log('[API Client] RPC block response:', blockResponse.data);
    
    if (blockResponse.data && blockResponse.data.result) {
      const blockData = blockResponse.data.result;
      
      // Get transactions if they exist
      const transactions = blockData.block.data.txs || [];
      
      return {
        height: parseInt(blockData.block.header.height),
        time: blockData.block.header.time,
        proposer: blockData.block.header.proposer_address,
        txCount: transactions.length,
        hash: blockData.block_id.hash,
        transactions: transactions,
        appHash: blockData.block.header.app_hash,
        consensusHash: blockData.block.header.consensus_hash,
        lastCommitHash: blockData.block.header.last_commit_hash,
        validatorHash: blockData.block.header.validators_hash,
        evidenceHash: blockData.block.header.evidence_hash,
        lastResultsHash: blockData.block.header.last_results_hash
      };
    }
    
    throw new Error(`Block with height ${height} not found`);
  } catch (error) {
    console.error(`[API Client] Failed to get block with height ${height}:`, error);
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

// No need to export from self - would cause circular dependency
