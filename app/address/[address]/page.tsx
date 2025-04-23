'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getAccountInfo, getAddressTransactions } from '../../services/apiClient';
import { Copy, ExternalLink, Clock, ArrowRight, RefreshCw } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [copied, setCopied] = useState(false);
  
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch account info
      const accountData = await getAccountInfo(address);
      setAccountInfo(accountData);
      
      // Fetch transactions for this address
      const txData = await getAddressTransactions(address, currentPage, 10);
      setTransactions(txData.transactions || []);
      setTotalPages(Math.ceil((txData.total || 10) / 10));
    } catch (err) {
      console.error('Error fetching address data:', err);
      setError('Unable to fetch address details. The address may be invalid or the API is unavailable.');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (address) {
      fetchData();
    }
  }, [address, currentPage]);
  
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
      // Handle amounts in different formats
      if (!amount) return '0 ZIG';
      
      // If it's already formatted with a denomination
      if (amount.includes(' ')) return amount;
      
      // If it's a number in uzig (microzig)
      const value = parseFloat(amount);
      if (isNaN(value)) return amount;
      
      // Convert from uzig to ZIG (1 ZIG = 1,000,000 uzig)
      const zigAmount = value / 1000000;
      
      // Format with commas for thousands
      return `${zigAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })} ZIG`;
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
  
  const handleRefresh = () => {
    fetchData();
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Address Details</h1>
        <button 
          onClick={handleRefresh} 
          disabled={isLoading}
          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2 md:mb-0">Account Overview</h2>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={copyToClipboard}
                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copied ? 'Copied!' : 'Copy Address'}
                </button>
                <a 
                  href={`https://zigscan.net/account/${address}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View on ZigScan
                </a>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg mb-4 break-all">
              <span className="font-mono text-gray-700 dark:text-gray-300">{address}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Balance</h3>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">{formatAmount(accountInfo?.balance || '0')}</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Transactions</h3>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">{accountInfo?.total_transactions || transactions.length}</p>
              </div>
              
              {accountInfo?.delegated_amount && (
                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Delegated</h3>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">{formatAmount(accountInfo.delegated_amount)}</p>
                </div>
              )}
              
              {accountInfo?.rewards && (
                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Rewards</h3>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">{formatAmount(accountInfo.rewards)}</p>
                </div>
              )}
              
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Account Number</h3>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">{accountInfo?.account_number || 'N/A'}</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Sequence</h3>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">{accountInfo?.sequence || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          {/* Transactions Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Transactions</h2>
            
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No transactions found for this address.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tx Hash</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {transactions.map((tx, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
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
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-6">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
