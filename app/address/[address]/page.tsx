'use client';

import { ArrowRight, Copy, ExternalLink, RefreshCw, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getAccountInfo, getTransactionsByAddress } from '@/app/services/api';

interface AccountInfo {
  address: string;
  balance: string;
  sequence: number;
  account_number: number;
  delegated_amount?: string;
  rewards?: string;
  total_transactions?: number;
}

export default function AddressPage() {
  // Use the useParams hook to get the address parameter
  const params = useParams();
  const address = params.address as string;
  
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Transaction state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [isRefreshingTx, setIsRefreshingTx] = useState(false);
  const [hasMoreTx, setHasMoreTx] = useState(false);
  const [totalTxCount, setTotalTxCount] = useState(0);
  const [currentMaxPages, setCurrentMaxPages] = useState(3); // Start with 3 pages
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Function to fetch transactions for the address
  const fetchTransactions = async (isRefreshing = false, loadMore = false) => {
    if (isRefreshing) {
      setIsRefreshingTx(true);
      // Reset pagination when refreshing
      setCurrentMaxPages(3);
    } else if (loadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoadingTx(true);
    }
    setTxError(null);
    
    console.log(`[CLIENT] Fetching transactions for address: ${address}`);
    console.log(`[CLIENT] Current page: ${currentMaxPages}, Max pages: ${currentMaxPages}`);

    try {
      console.log(`[CLIENT] Calling getTransactionsByAddress with: address=${address}, type=all, maxPages=${currentMaxPages}`);
      
      // Add a timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 15000)
      );

      console.log('Fetching transactions for address:', address);
      
      const response = await Promise.race([
        getTransactionsByAddress(address, 'all', currentMaxPages),
        timeoutPromise
      ]);
      
      console.log(`[CLIENT] Response received:`, response?.result?.txs?.length || 0, 'transactions');
      
      console.log('Transaction response:', response);
      
      // Type check the response to ensure it has the expected structure
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format');
      }
      
      // Extract and format transactions
      const responseObj = response as { result?: { txs?: any[], pagination_info?: any } };
      const result = responseObj.result || {};
      const txs = result.txs || [];
      console.log(`Found ${txs.length} transactions`);
      
      // Get pagination info
      const paginationInfo = result.pagination_info || {
        fetched_count: txs.length,
        total_count: txs.length,
        has_more: false,
        max_pages_fetched: currentMaxPages
      };
      
      // Update pagination state
      setHasMoreTx(paginationInfo.has_more);
      setTotalTxCount(paginationInfo.total_count);
      
      // Log the first transaction to see its structure
      if (txs.length > 0) {
        console.log('Transaction data structure:', JSON.stringify(txs[0], null, 2));
      }
      
      // Format transactions for display
      const formattedTxs = txs.map((tx: any) => {
        // Extract basic transaction info
        const txHash = tx.hash || '';
        const txHeight = tx.height || '0';
        
        // Log timestamp-related fields if they exist
        if (tx.timestamp) {
          console.log(`Transaction ${txHash} has timestamp field:`, tx.timestamp);
        }
        if (tx.time) {
          console.log(`Transaction ${txHash} has time field:`, tx.time);
        }
        
        // Try to extract transaction details from the events
        let txType = 'transfer';
        let amount = '0 uzig';
        let fee = '0 uzig';
        let fromAddress = '';
        let toAddress = '';
        let status = tx.tx_result?.code === 0 ? 'success' : 'failed';
        
        // For timestamp, we use the transaction's timestamp if available
        // Otherwise we use the current time as a fallback
        let timestamp;
        if (tx.timestamp) {
          timestamp = tx.timestamp;
        } else {
          // Since we don't have accurate genesis information and block time data,
          // we'll use the current time as a fallback
          timestamp = new Date().toISOString();
          
          // Add a note in the console about the missing timestamp
          console.log(`Missing timestamp for transaction ${txHash}, using current time as fallback`);
        }
        
        // Try to find transfer events in the transaction
        try {
          // Parse the events from the logs if available
          const events = tx.tx_result?.events || [];
          
          // Find all transfer events
          const transferEvents = events.filter((e: { type: string }) => e.type === 'transfer');
          
          // Find a transfer event where this address is either sender or recipient
          const relevantTransferEvent = transferEvents.find((event: any) => {
            const attributes = event.attributes || [];
            const recipientAttr = attributes.find((a: { key: string }) => a.key === 'recipient');
            const senderAttr = attributes.find((a: { key: string }) => a.key === 'sender');
            
            const recipient = recipientAttr?.value || '';
            const sender = senderAttr?.value || '';
            
            return recipient === address || sender === address;
          });
          
          if (relevantTransferEvent) {
            const attributes = relevantTransferEvent.attributes || [];
            
            // Find sender and recipient attributes
            const senderAttr = attributes.find((a: { key: string }) => a.key === 'sender');
            const recipientAttr = attributes.find((a: { key: string }) => a.key === 'recipient');
            const amountAttr = attributes.find((a: { key: string }) => a.key === 'amount');
            
            if (senderAttr) fromAddress = senderAttr.value || '';
            if (recipientAttr) toAddress = recipientAttr.value || '';
            if (amountAttr) amount = amountAttr.value || '0uzig';
          }
          
          // Look for fee in tx events
          const txEvents = events.filter((e: { type: string }) => e.type === 'tx');
          for (const txEvent of txEvents) {
            const attributes = txEvent.attributes || [];
            const feeAttr = attributes.find((a: { key: string }) => a.key === 'fee');
            if (feeAttr && feeAttr.value) {
              fee = feeAttr.value;
              break;
            }
          }
        } catch (error) {
          console.warn(`Error parsing transaction events: ${error}`);
        }
        
        // If we didn't find a fee in the events, try to extract it from tx data as fallback
        if (fee === '0 uzig') {
          try {
            if (tx.tx?.auth_info?.fee?.amount && tx.tx.auth_info.fee.amount.length > 0) {
              fee = tx.tx.auth_info.fee.amount[0].amount + ' ' + tx.tx.auth_info.fee.amount[0].denom;
            }
          } catch (error) {
            console.warn(`Error parsing fee from tx data: ${error}`);
          }
        }
        
        return {
          hash: txHash,
          height: parseInt(txHeight),
          timestamp: timestamp,
          type: txType,
          status: status,
          fee: fee, // Use actual fee from transaction
          amount: amount, // Use actual amount from transaction
          from: fromAddress,
          to: toAddress
        };
      });
      
      // If loading more, append to existing transactions, otherwise replace
      if (loadMore) {
        setTransactions(prev => [...prev, ...formattedTxs]);
      } else {
        setTransactions(formattedTxs);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      if (err instanceof Error) {
        setTxError(`Failed to load transactions: ${err.message}`);
      } else {
        setTxError('Failed to load transactions. Please try again later.');
      }
    } finally {
      setIsLoadingTx(false);
      setIsRefreshingTx(false);
      setIsLoadingMore(false);
    }
  };
  
  // Function to load more transactions
  const loadMoreTransactions = () => {
    // Increase the max pages by 3 each time
    setCurrentMaxPages(prev => prev + 3);
    // Fetch more transactions
    fetchTransactions(false, true);
  };
  
  // Main function to fetch all account data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch account info
      const accountData = await getAccountInfo(address);
      console.log('Account data received:', accountData);
      
      // Check if we have a valid response
      if (!accountData || !accountData.address) {
        throw new Error('Invalid account data received');
      }
      
      setAccountInfo(accountData);
      
      // Also fetch transactions
      fetchTransactions();
    } catch (err) {
      console.error('Error fetching address data:', err);
      
      // Log more detailed error information
      if (err instanceof Error) {
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
      }
      
      // Log axios specific error details if available
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as any;
        console.error('API Response status:', axiosError.response?.status);
        console.error('API Response data:', axiosError.response?.data);
        console.error('API Request URL:', axiosError.config?.url);
      }
      
      // Set a more descriptive error message based on the error type
      if (err instanceof Error) {
        setError(`Failed to load address data: ${err.message}`);
      } else {
        setError('Failed to load address data. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch data when the address changes
  useEffect(() => {
    // Reset state when address changes
    setAccountInfo(null);
    setError(null);
    setIsLoading(true);
    
    // Fetch fresh data for the new address
    fetchData();
  }, [address]);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const formatAmount = (amount: string) => {
    try {
      if (!amount) return '0 ZIG';
      
      // Handle amounts with 'uzig' denomination (1 ZIG = 1,000,000 uzig)
      if (amount.includes('uzig')) {
        // Extract the numeric part
        const numericPart = amount.replace(/[^0-9.]/g, '');
        const value = parseFloat(numericPart);
        
        // Convert from uzig to ZIG
        const zigValue = value / 1000000;
        
        // Format based on size
        if (zigValue >= 1000000) {
          // For values over 1M ZIG, show in millions
          return `${(zigValue / 1000000).toFixed(4)}M ZIG`;
        } else if (zigValue >= 1000) {
          // For values over 1K ZIG, show in thousands
          return `${(zigValue / 1000).toFixed(4)}K ZIG`;
        } else if (zigValue < 0.0001) {
          // For very small values, show scientific notation
          return `${zigValue.toExponential(4)} ZIG`;
        } else {
          // For normal values, show with 6 decimal places
          return `${zigValue.toFixed(6)} ZIG`;
        }
      }
      
      // Handle amounts that are already in ZIG format
      if (typeof amount === 'string' && amount.includes('.')) {
        const value = parseFloat(amount);
        return `${value.toFixed(6)} ZIG`;
      }
      
      // If we can parse it as a number, assume it's in uzig and convert
      if (!isNaN(parseFloat(amount))) {
        const value = parseFloat(amount);
        const zigValue = value / 1000000;
        return `${zigValue.toFixed(6)} ZIG`;
      }
      
      // If all else fails, return the original amount
      return amount;
    } catch (e) {
      console.error('Error formatting amount:', e);
      return amount;
    }
  };
  
  // Helper function to shorten hash for display
  const shortenHash = (hash: string) => {
    if (!hash) return '';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  // Helper function to convert uzig to ZIG (1 ZIG = 1,000,000 uzig)
  const convertUzigToZig = (amount: string) => {
    // Extract the numeric part from strings like "1000000uzig"
    const match = amount.match(/(\d+)\s*uzig/);
    if (!match) return amount; // Return original if no match
    
    const uzigAmount = parseInt(match[1]);
    const zigAmount = uzigAmount / 1000000; // Convert to ZIG
    
    // Format with 2 decimal places
    return `${zigAmount.toFixed(2)} ZIG`;
  };

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-900/20 border-l-4 border-red-600 p-4 mb-6">
          <p className="text-red-400">
            {error}
          </p>
        </div>
        
        <Link href="/" className="text-blue-400 hover:text-blue-300 hover:underline flex items-center">
          <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
          Return to Home
        </Link>
      </div>
    );
  }
  
  return (
    <div className="relative">
      {/* Maintenance Overlay - Commented out 
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-lg w-full text-center">
          <div className="mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Under Maintenance
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We are currently performing maintenance on this page. Please check back later.
          </p>
          <Link href="/" className="inline-flex items-center text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            Return to Home
          </Link>
        </div>
      </div>
      */}

      {/* Original Content (hidden behind overlay) */}
      <div className="container mx-auto py-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-white px-6">Address Details</h1>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            <div className="rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
            
            <div className="rounded-lg shadow-md p-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border-b border-gray-200 py-3">
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Address Overview Card */}
            <div className="rounded-lg shadow-md p-6 mb-4">              
              <div className="bg-gray-700/30 p-4 rounded-sm mb-4 break-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-gray-300 text-sm sm:text-base">{address}</span>
                <button 
                  onClick={copyToClipboard}
                  className="text-blue-500 hover:text-blue-600 flex items-center self-end sm:self-auto"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copied ? 'Copied!' : 'copy'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-700/30 p-4 rounded-sm">
                  <h3 className="text-sm  text-gray-300 mb-1">Balance</h3>
                  <p className="text-lg text-gray-300">{formatAmount(accountInfo?.balance || '0')}</p>
                </div>
                

                
                {accountInfo?.delegated_amount && parseInt(accountInfo.delegated_amount) > 0 && (
                  <div className="bg-gray-700/30 p-4 rounded-sm">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Delegated</h3>
                    <p className="text-lg font-semibold text-white">{formatAmount(accountInfo.delegated_amount)}</p>
                  </div>
                )}
                
                {accountInfo?.rewards && parseInt(accountInfo.rewards) > 0 && (
                  <div className="bg-gray-700/30 p-4 rounded-sm">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Rewards</h3>
                    <p className="text-lg font-semibold text-white">{formatAmount(accountInfo.rewards)}</p>
                  </div>
                )}
                

              </div>
            </div>
            
            {/* Transactions Section */}
            <div className="rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
                <h2 className="text-xl font-semibold text-white mb-2 md:mb-0">Transactions</h2>
              </div>
              
              {isLoadingTx && !isRefreshingTx ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : txError ? (
                <div className="bg-red-900/20 border-l-4 border-red-600 p-4 mb-6">
                  <p className="text-red-400">{txError}</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No transactions found for this address.</p>
                </div>
              ) : (
                <>
                {/* Desktop view - Table */}
                <div className="hidden sm:block overflow-x-auto overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className=''>
                      <tr>
                        <th className="p-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tx Hash</th>
                        <th className="p-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                        <th className="p-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                        <th className="p-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {transactions.map((tx, index) => (
                        <tr key={`${tx.hash}-${index}-desktop`} className="hover:bg-gray-700/30">
                          <td className="p-4 whitespace-nowrap">
                            <Link href={`/tx/${tx.hash}`} className="text-blue-400 hover:text-blue-300 hover:underline flex items-center">
                              {shortenHash(tx.hash)}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Link>
                          </td>
                          <td className="p-4 whitespace-nowrap text-gray-300">{tx.type}</td>
                          <td className="p-4 whitespace-nowrap text-gray-300">{convertUzigToZig(tx.amount)}</td>
                          <td className="p-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tx.status === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Mobile view - Card style list */}
                <div className="sm:hidden space-y-4">
                  {transactions.map((tx, index) => (
                    <div key={`${tx.hash}-${index}-mobile`} className="bg-gray-700/30 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <Link href={`/tx/${tx.hash}`} className="text-blue-400 hover:text-blue-300 hover:underline flex items-center text-sm break-all">
                          {shortenHash(tx.hash)}
                          <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                        </Link>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tx.status === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                          {tx.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">Type:</span>
                          <p className="text-gray-300">{tx.type}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Amount:</span>
                          <p className="text-gray-300">{convertUzigToZig(tx.amount)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                </>
              )}
              
              {transactions.length > 0 && (
                <div className="mt-4 text-sm text-gray-400 flex flex-col items-center">
                  <div className="mb-2">
                    Showing {transactions.length} of {totalTxCount} transaction{totalTxCount !== 1 ? 's' : ''}
                  </div>
                  
                  {hasMoreTx && (
                    <button
                      onClick={loadMoreTransactions}
                      disabled={isLoadingMore}
                      className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingMore ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                          Loading...
                        </>
                      ) : (
                        'Load More Transactions'
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
