'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getAccountInfo, getAddressTransactions } from '../../services/apiClient';
import { Copy, Clock, ArrowRight } from 'lucide-react';

interface Transaction {
  hash: string;
  height: number;
  timestamp: string;
  type: string;
  status: string;
  fee: string;
  amount: string;
  memo?: string;
}

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
  const params = useParams();
  const address = params.address as string;
  
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTxLoading, setIsTxLoading] = useState(true);  // Separate loading state for transactions
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [copied, setCopied] = useState(false);
  
  // Function to fetch only transactions data
  const fetchTransactions = async (pageNum = currentPage) => {
    // Only set loading for transactions section
    setIsTxLoading(true);
    
    try {
      // Try to fetch transactions for this address - using 10 per page now
      const txData = await getAddressTransactions(address, pageNum, 10);
      console.log('Transaction data received:', txData);
      
      // Handle the response format from our updated API
      if (txData.transactions && Array.isArray(txData.transactions)) {
        // The API now returns an object with transactions array and pagination info
        setTransactions(txData.transactions);
        
        // Set total pages from pagination info if available
        if (txData.pagination) {
          setTotalPages(txData.pagination.pages || Math.ceil((txData.pagination.total || txData.transactions.length) / txData.pagination.limit || 10));
        } else {
          setTotalPages(Math.ceil(txData.transactions.length / 10));
        }
      } else if (Array.isArray(txData)) {
        // Fallback for backward compatibility if the API returns an array directly
        setTransactions(txData);
        setTotalPages(Math.ceil(txData.length / 10));
      }
    } catch (txError) {
      console.warn('Failed to fetch transactions:', txError);
      setTransactions([]);
      setTotalPages(1);
    } finally {
      setIsTxLoading(false);
    }
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
      
      // After getting account info, fetch transactions
      await fetchTransactions();
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
      if (err instanceof Error && err.message === 'Network Error') {
        setError('Network error: Unable to connect to the API. Please check your internet connection.');
      } else if (err instanceof Error && err.message.includes('404')) {
        setError(`Address not found: ${address}`);
      } else if (err instanceof Error && err.message.includes('500')) {
        setError('Server error: The blockchain API is experiencing issues. Please try again later.');
      } else {
        setError(`Failed to load address data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial data load when address changes
  useEffect(() => {
    if (address) {
      fetchData();
    }
  }, [address]);
  
  // Fetch only transactions when page changes
  useEffect(() => {
    if (address && accountInfo) { // Only fetch if we already have account info
      console.log('Page changed to:', currentPage);
      fetchTransactions(currentPage);
    }
  }, [currentPage]);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  const formatAmount = (amount: string) => {
    try {
      if (!amount) return '0 ZIG';
      
      if (amount.includes('uzig')) {
        const numericPart = amount.replace(/[^0-9.]/g, '');
        const value = parseFloat(numericPart);
        
        const zigValue = value / 1000000;
        
        if (zigValue >= 1000000) {
          return `${(zigValue / 1000000)}M ZIG`;
        } else if (zigValue >= 1000) {
          return `${(zigValue / 1)} ZIG`;
        } else {
          return `${zigValue} ZIG`;
        }
      }
      
      if (amount.includes('.')) {
        const value = parseFloat(amount);
        return `${value.toFixed(4)} ZIG`;
      }
      
      return amount;
    } catch (e) {
      return amount;
    }
  };
  
  const shortenHash = (hash: string) => {
    if (!hash) return '';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
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
      {/* Maintenance Overlay */}
      {/* <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
      </div> */}

      {/* Original Content (hidden behind overlay) */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Address Details</h1>
          
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            <div className="dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
            
            <div className="dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border-b border-gray-200 dark:border-gray-700 py-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Address Overview Card */}
            <div className="dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
                <h2 className="text-xl font-semibold text-white mb-2 md:mb-0">Account Overview</h2>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={copyToClipboard}
                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    {copied ? 'Copied!' : 'Copy Address'}
                  </button>
                  
                </div>
              </div>
              
              <div className="bg-gray-700/30 p-4 rounded-lg mb-4 break-all">
                <span className="font-mono text-gray-700 dark:text-gray-300">{address}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Balance</h3>
                  <p className="text-lg font-semibold text-white">{formatAmount(accountInfo?.balance || '0')}</p>
                </div>
                

                
                {accountInfo?.delegated_amount && (
                  <div className="bg-gray-700/30 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Delegated</h3>
                    <p className="text-lg font-semibold text-white">{formatAmount(accountInfo.delegated_amount)}</p>
                  </div>
                )}
                
                {accountInfo?.rewards && (
                  <div className="bg-gray-700/30 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Rewards</h3>
                    <p className="text-lg font-semibold text-white">{formatAmount(accountInfo.rewards)}</p>
                  </div>
                )}
                

              </div>
            </div>
            
            {/* Transactions Card */}
            <div className="dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Transactions</h2>
              
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No transactions found for this address.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-700">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tx Hash</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {transactions.slice(0, 10).map((tx, index) => (
                          <tr key={index} className="hover:bg-gray-700/30">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Link href={`/tx/${tx.hash}`} className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
                                {shortenHash(tx.hash)}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                                {tx.type || 'Transfer'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {formatAmount(tx.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {formatDate(tx.timestamp)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`${getStatusColor(tx.status)}`}>
                                {tx.status || 'Success'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  {transactions.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 space-y-4 sm:space-y-0">
                      <div className="flex items-center">
                        <button 
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1 || isTxLoading}
                          className="px-4 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {isTxLoading ? 
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Loading...
                            </span> : 
                            `Page ${currentPage} of ${totalPages}`
                          }
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <button 
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          disabled={transactions.length === 0 || isTxLoading}
                          className="px-4 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
