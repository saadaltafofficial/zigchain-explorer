'use client';

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ArrowRight, Clock, Database, Hash, ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import { getLatestTransactions, getTransactionByHash } from "../services/apiClient";
import TransactionDetailView from "../components/TransactionDetailView";

interface Transaction {
  hash: string;
  height: string;
  time: string;
  from?: string;
  to?: string;
  amount?: string;
  fee?: string;
  status?: string;
  code?: number;
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
  const [itemsPerPage, setItemsPerPage] = useState(25);
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

  // Fetch transactions when pagination changes or maxBlocksToFetch changes
  useEffect(() => {
    fetchTransactions(maxBlocksToFetch);
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
      const txs = await getLatestTransactions(limit);
      
      console.log(`[Transactions] Found ${txs.length} transactions`);
      setAllFetchedTransactions(txs);
      setTotalItems(txs.length);
      
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
        const detailedTx: TransactionDetail = {
          ...txDetails,
          hash: txDetails.hash,
          height: (txDetails.height?.toString() || tx.height?.toString() || '0'),
          time: txDetails.time || tx.time,
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

  const formatHash = (hash: string) => {
    if (!hash) return '';
    return hash.length > 16 ? `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}` : hash;
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
      <h1 className="text-3xl font-bold mb-6">Transactions</h1>

      {loading && (
        <div className="flex justify-center items-center py-20 bg-gray-900 rounded-lg shadow-md">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-300">Loading transactions...</span>
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
              <div className="overflow-hidden shadow-md rounded-lg">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-800 text-gray-300">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Hash
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Block
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Time
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          View
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-900 divide-y divide-gray-700">
                      {transactions.map((tx, index) => (
                        <tr 
                          key={tx.hash} 
                          className="cursor-pointer hover:bg-gray-800 transition-colors"
                          onClick={() => handleTransactionClick(tx.hash)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Hash className="flex-shrink-0 h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-gray-300 font-mono">{formatHash(tx.hash)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Database className="flex-shrink-0 h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-gray-300">{tx.height}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Clock className="flex-shrink-0 h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-gray-300">{formatDate(tx.time)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              tx.status === 'success' || (tx as any).code === 0 || tx.tx_result?.code === 0 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }`}>
                              {tx.status === 'success' || (tx as any).code === 0 || tx.tx_result?.code === 0 ? 'Success' : 'Failed'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-blue-500 hover:text-blue-400">
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gray-800 dark:bg-gray-900 rounded-lg shadow-md p-4 mt-6">
                <div className="flex flex-col space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300">Show</span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handlePerPageChange(25)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            itemsPerPage === 25 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          25
                        </button>
                        <button
                          onClick={() => handlePerPageChange(50)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            itemsPerPage === 50 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          50
                        </button>
                        <button
                          onClick={() => handlePerPageChange(100)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            itemsPerPage === 100 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          100
                        </button>
                      </div>
                      <span className="text-sm text-gray-300">per page</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300">Fetch last</span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleMaxBlocksChange(50)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            maxBlocksToFetch === 50 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          50
                        </button>
                        <button
                          onClick={() => handleMaxBlocksChange(100)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            maxBlocksToFetch === 100 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          100
                        </button>
                        {maxBlocksToFetch !== 50 && maxBlocksToFetch !== 100 && (
                          <div className="px-3 py-1 rounded text-sm font-medium bg-blue-600 text-white">
                            {maxBlocksToFetch}
                          </div>
                        )}
                        <form onSubmit={handleCustomBlocksSubmit} className="flex items-center">
                          <input
                            type="number"
                            value={customBlocksInput}
                            onChange={(e) => setCustomBlocksInput(e.target.value)}
                            placeholder="Custom"
                            min="1"
                            className="w-16 px-2 py-1 rounded text-sm bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            type="submit"
                            className="ml-1 px-2 py-1 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                          >
                            Go
                          </button>
                        </form>
                      </div>
                      <span className="text-sm text-gray-300">blocks</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-center items-center">
                    <div className="flex items-center gap-1">
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
                  
                  <div className="text-center text-sm text-gray-400">
                    Showing {totalItems === 0 ? 0 : Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} transactions
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
