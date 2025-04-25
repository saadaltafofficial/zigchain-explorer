'use client';

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ArrowRight, Clock, Database, Hash, ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import { getLatestTransactions, getTransactionByHash } from "../services/apiClient";
import TransactionDetailView from "../components/TransactionDetailView";

interface Transaction {
  hash: string;
  height: string;
  time?: string;
  timestamp?: string; // Added timestamp property to match API response
  from?: string;
  to?: string;
  amount?: string;
  fee?: string;
  status?: string;
  code?: number;
  type?: string;
  tx_result?: {
    code: number;
    data?: string;
    log: string;
    gas_wanted: string;
    gas_used: string;
    events?: Array<{
      type: string;
      attributes: Array<{
        key: string;
        value: string;
        index?: boolean;
      }>;
    }>;
  };
  tx?: any;
}

interface TransactionDetail extends Transaction {
  // Additional fields for detailed view if needed
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="text-center py-10">Loading transactions...</div>}>
      <TransactionsContent />
    </Suspense>
  );
}

function TransactionsContent() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<TransactionDetail | null>(null);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  
  // Filter state
  const [senderAddress, setSenderAddress] = useState<string | null>(null);
  const [receiverAddress, setReceiverAddress] = useState<string | null>(null);
  const [transactionAmount, setTransactionAmount] = useState<string | null>(null);
  const [transactionFee, setTransactionFee] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Transaction fetching state
  const [allFetchedTransactions, setAllFetchedTransactions] = useState<Transaction[]>([]);
  const [maxBlocksToFetch, setMaxBlocksToFetch] = useState(50);
  const [customBlocksInput, setCustomBlocksInput] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Get transaction hash from URL if present
  useEffect(() => {
    const txHash = searchParams.get('tx');
    const page = searchParams.get('page');
    const perPage = searchParams.get('per_page');
    const blocks = searchParams.get('blocks');
    
    if (page) {
      setCurrentPage(parseInt(page));
    }
    
    if (perPage) {
      setItemsPerPage(parseInt(perPage));
    }
    
    if (blocks) {
      const blockCount = parseInt(blocks);
      if (!isNaN(blockCount) && blockCount > 0) {
        setMaxBlocksToFetch(blockCount);
      }
    }
    
    if (txHash) {
      // Fetch transaction details
      const tx = transactions.find(t => t.hash === txHash);
      if (tx) {
        fetchTransactionDetails(tx);
      } else {
        setSelectedTx(null);
      }
    } else {
      setSelectedTx(null);
    }
  }, [searchParams]);

  // Load transactions from sessionStorage on initial render
  useEffect(() => {
    const savedTransactions = sessionStorage.getItem('zigchain_transactions');
    const savedPage = sessionStorage.getItem('zigchain_tx_page');
    const savedItemsPerPage = sessionStorage.getItem('zigchain_tx_per_page');
    const savedMaxBlocks = sessionStorage.getItem('zigchain_tx_max_blocks');
    
    if (savedTransactions) {
      try {
        const parsedData = JSON.parse(savedTransactions);
        setAllFetchedTransactions(parsedData);
        setTotalItems(parsedData.length);
        updateDisplayedTransactions(parsedData);
        console.log('[Transactions] Restored transactions from session storage');
        
        if (savedPage) setCurrentPage(parseInt(savedPage));
        if (savedItemsPerPage) setItemsPerPage(parseInt(savedItemsPerPage));
        if (savedMaxBlocks) setMaxBlocksToFetch(parseInt(savedMaxBlocks));
      } catch (e) {
        console.error('[Transactions] Error parsing saved transactions:', e);
        fetchTransactions(maxBlocksToFetch);
      }
    } else {
      fetchTransactions(maxBlocksToFetch);
    }
  }, []);
  
  // Fetch transactions when pagination changes or maxBlocksToFetch changes
  useEffect(() => {
    if (maxBlocksToFetch > 0) {
      fetchTransactions(maxBlocksToFetch);
    }
  }, [maxBlocksToFetch]);

  // Update displayed transactions when page or items per page changes
  useEffect(() => {
    updateDisplayedTransactions();
  }, [currentPage, itemsPerPage, allFetchedTransactions]);

  const fetchTransactions = async (limit = 50) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`[Transactions] Fetching ${limit} latest transactions from API`);
      // Fetch a larger number of transactions to ensure we have enough data
      const txs = await getLatestTransactions(limit);
      
      console.log(`[Transactions] Found ${txs.length} transactions`);
      setAllFetchedTransactions(txs);
      setTotalItems(txs.length);
      
      // Save to sessionStorage for persistence
      sessionStorage.setItem('zigchain_transactions', JSON.stringify(txs));
      sessionStorage.setItem('zigchain_tx_page', currentPage.toString());
      sessionStorage.setItem('zigchain_tx_per_page', itemsPerPage.toString());
      sessionStorage.setItem('zigchain_tx_max_blocks', maxBlocksToFetch.toString());
      
      // Initial update of displayed transactions
      updateDisplayedTransactions(txs);
    } catch (error) {
      console.error("[Transactions] Error fetching transactions:", error);
      setError("Failed to fetch transactions. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const updateDisplayedTransactions = (txs = allFetchedTransactions) => {
    // Calculate start and end indices for current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, txs.length);
    
    // Get transactions for current page
    const paginatedTransactions = txs.slice(startIndex, endIndex);
    setTransactions(paginatedTransactions);
  };

  const fetchTransactionDetails = async (tx: Transaction) => {
    try {
      setTxLoading(true);
      setTxError(null);
      
      console.log(`[Transactions] Fetching details for transaction ${tx.hash}`);
      
      // Use the API client to get detailed transaction data
      const txDetails = await getTransactionByHash(tx.hash);
      
      if (txDetails) {
        console.log('[Transactions] Transaction details:', txDetails);
        
        // Ensure we have a status field
        const status = txDetails.status || 
                     ((txDetails as any).code === 0 || (txDetails as any).tx_result?.code === 0 ? 'success' : 'failed');
        
        // Create a complete transaction detail object
        // Create a complete transaction detail object with type safety
        const detailedTx: TransactionDetail = {
          ...txDetails,
          hash: txDetails.hash,
          height: (txDetails.height?.toString() || tx.height?.toString() || '0'),
          // Handle both time and timestamp properties for compatibility
          time: (txDetails as any).timestamp || (txDetails as any).time || tx.time || '',
          from: txDetails.from || tx.from || '',
          to: txDetails.to || tx.to || '',
          amount: txDetails.amount || tx.amount || '',
          fee: txDetails.fee || '',
          status: status,
          tx_result: (txDetails as any).tx_result || {
            code: (txDetails as any).code === 0 ? 0 : 1,
            data: '',
            log: '',
            gas_wanted: '',
            gas_used: '',
            events: []
          }
        };
        
        setSelectedTx(detailedTx);
        setSenderAddress(detailedTx.from || '');
        setReceiverAddress(detailedTx.to || '');
        setTransactionAmount(detailedTx.amount || '');
        
        // Calculate fee based on available data
        const fee = detailedTx.fee || 
                  (detailedTx.tx_result?.gas_used ? `${detailedTx.tx_result.gas_used} gas` : 'Unknown');
        setTransactionFee(fee);
      } else {
        // Fallback to using the data we already have
        console.log('[Transactions] No detailed data available, using basic transaction data');
        
        const status = tx.status || 
                     ((tx as any).code === 0 || tx.tx_result?.code === 0 ? 'success' : 'failed');
        
        setSelectedTx({
          ...tx,
          status: status,
          tx_result: tx.tx_result || {
            code: (tx as any).code === 0 ? 0 : 1,
            data: '',
            log: '',
            gas_wanted: '',
            gas_used: '',
            events: []
          }
        });
        
        setSenderAddress(tx.from || '');
        setReceiverAddress(tx.to || '');
        setTransactionAmount(tx.amount || '');
        setTransactionFee('Unknown');
      }
    } catch (error) {
      console.error("Error fetching transaction details:", error);
      setTxError("Failed to fetch transaction details. Please try again later.");
    } finally {
      setTxLoading(false);
    }
  };

  const handleTransactionClick = (hash: string) => {
    // Update URL with transaction hash
    router.push(`${pathname}?tx=${hash}${currentPage > 1 ? `&page=${currentPage}` : ''}${itemsPerPage !== 25 ? `&per_page=${itemsPerPage}` : ''}${maxBlocksToFetch !== 50 ? `&blocks=${maxBlocksToFetch}` : ''}`);
    
    // Set the referrer for the transaction detail page
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('txReferrer', '/transactions');
    }
    
    const tx = transactions.find(t => t.hash === hash);
    if (tx) {
      fetchTransactionDetails(tx);
    }
  };

  const closeDetails = () => {
    setSelectedTx(null);
    setTxError(null);
    // Update URL to remove transaction hash but keep pagination parameters
    router.push(`${pathname}${currentPage > 1 ? `?page=${currentPage}` : ''}${itemsPerPage !== 25 && currentPage > 1 ? `&per_page=${itemsPerPage}` : (itemsPerPage !== 25 && currentPage === 1 ? `?per_page=${itemsPerPage}` : '')}${maxBlocksToFetch !== 50 && currentPage > 1 ? `&blocks=${maxBlocksToFetch}` : (maxBlocksToFetch !== 50 && currentPage === 1 ? `?blocks=${maxBlocksToFetch}` : '')}`);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    router.push(`${pathname}?page=${pageNumber}&per_page=${itemsPerPage}&blocks=${maxBlocksToFetch}`);
  };

  const handlePerPageChange = (perPage: number) => {
    setItemsPerPage(perPage);
    setCurrentPage(1);
    router.push(`${pathname}?page=1&per_page=${perPage}&blocks=${maxBlocksToFetch}`);
  };

  const handleMaxBlocksChange = (blocks: number) => {
    setMaxBlocksToFetch(blocks);
    setCurrentPage(1);
    router.push(`${pathname}?page=1&per_page=${itemsPerPage}&blocks=${blocks}`);
  };

  const handleCustomBlocksSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const blocks = parseInt(customBlocksInput);
    if (!isNaN(blocks) && blocks > 0) {
      handleMaxBlocksChange(blocks);
      setCustomBlocksInput('');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatHash = (hash: string, fullDisplay = false) => {
    if (!hash) return '';
    return fullDisplay ? `0x${hash}` : hash.length > 16 ? `0x${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}` : hash;
  };

  const copyToClipboard = async (text: string, setCopied: (copied: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);

    return (
      <button
        onClick={() => copyToClipboard(text, setCopied)}
        className="text-gray-500 hover:text-blue-500 transition-colors"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-16">Latest Transactions</h1>

      {loading && (
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 animate-pulse">
              <div className="flex justify-between">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mt-3"></div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-900 text-red-100 p-4 rounded-lg shadow-md">
          <p className="font-semibold">Error loading transactions:</p>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-6">
          {selectedTx ? (
            <TransactionDetailView 
              transaction={selectedTx} 
              onBack={closeDetails}
            />
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {transactions.map((tx) => (
                  <div key={tx.hash} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <div className="flex items-center">
                        <div className="mr-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                          <Hash size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <button
                            onClick={() => handleTransactionClick(tx.hash)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-lg font-semibold transition-colors"
                          >
                            <span className="hidden md:inline" title={tx.hash}>
                              {formatHash(tx.hash, true)}
                            </span>
                            <span className="inline md:hidden" title={tx.hash}>
                              {formatHash(tx.hash)}
                            </span>
                          </button>
                          <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-1">
                            <Clock size={14} className="mr-1" />
                            <span>{formatDate(tx.time || tx.timestamp || '')}</span>
                          </div>
                        </div>
                      </div>
                      
                    <div className="flex flex-wrap gap-3 items-center">
                        
                        
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          tx.status === 'success' || tx.code === 0 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}>
                          {tx.status === 'success' || tx.code === 0 ? 'Success' : 'Failed'}
                        </div>
                        
                        <button
                          onClick={() => handleTransactionClick(tx.hash)}
                          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination controls */}
              <div className="mt-16">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className={`p-1 rounded ${
                          currentPage === 1 
                            ? 'text-gray-500 cursor-not-allowed' 
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                        aria-label="First page"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="11 17 6 12 11 7"></polyline>
                          <polyline points="18 17 13 12 18 7"></polyline>
                        </svg>
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`p-1 rounded ${
                          currentPage === 1 
                            ? 'text-gray-500 cursor-not-allowed' 
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      
                      <div className="flex items-center mx-3 px-3 py-1 bg-gray-700 rounded">
                        <span className="text-sm text-gray-200">
                          Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{Math.max(1, Math.ceil(totalItems / itemsPerPage))}</span>
                        </span>
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
                        className={`p-1 rounded ${
                          currentPage >= Math.ceil(totalItems / itemsPerPage)
                            ? 'text-gray-500 cursor-not-allowed' 
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                        aria-label="Next page"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handlePageChange(Math.ceil(totalItems / itemsPerPage))}
                        disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
                        className={`p-1 rounded ${
                          currentPage >= Math.ceil(totalItems / itemsPerPage)
                            ? 'text-gray-500 cursor-not-allowed' 
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                        aria-label="Last page"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="13 17 18 12 13 7"></polyline>
                          <polyline points="6 17 11 12 6 7"></polyline>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-300">Items per page:</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePerPageChange(10)}
                        className={`px-2 py-1 text-xs hover:cursor-pointer rounded ${itemsPerPage === 10 ? 'bg-blue-600 text-white' : ' text-gray-300 hover:bg-gray-700'}`}
                      >
                        10
                      </button>
                      <button
                        onClick={() => handlePerPageChange(25)}
                        className={`px-2 py-1 text-xs hover:cursor-pointer rounded ${itemsPerPage === 25 ? 'bg-blue-600 text-white' : ' text-gray-300 hover:bg-gray-700'}`}
                      >
                        25
                      </button>
                      <button
                        onClick={() => handlePerPageChange(50)}
                        className={`px-2 py-1 text-xs hover:cursor-pointer rounded ${itemsPerPage === 50 ? 'bg-blue-600 text-white' : ' text-gray-300 hover:bg-gray-700'}`}
                      >
                        50
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {transactions.length === 0 && !loading && !error && (
                <div className="text-center py-10 bg-gray-900 rounded-lg shadow-md">
                  <p className="text-gray-400">No transactions found</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
