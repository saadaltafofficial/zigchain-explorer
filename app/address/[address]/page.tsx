'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAccountBalance, getAddressTransactions } from '../../services/api';
import { formatTokenAmount, formatDate } from '../../utils/format';

// Define the correct props type for Next.js App Router
type Props = {
  params: Promise<{ address: string }>,
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>,
};

export default async function AddressDetailPage({ params }: Props) {
  const { address } = await params;
  return (
    <Suspense fallback={<div>Loading address details...</div>}>
      <AddressDetailContent address={address} />
    </Suspense>
  );
}

function AddressDetailContent({ address }: { address: string }) {
  const [balances, setBalances] = useState<{ amount: string; denom: string }[]>([]);
  
  // Define a transaction type
  interface Transaction {
    hash: string;
    height: string;
    time: string;
    status?: string;
    from?: string;
    to?: string;
    amount?: string;
    success?: boolean;
    gasUsed?: bigint;
    gasWanted?: bigint;
    rawLog?: string;
  };
  
  // Current page transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add a state for initial loading vs refreshing
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get('page') || '1');
  const [pagination, setPagination] = useState({
    currentPage: currentPage,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!address) return;
      
      try {
        // Set appropriate loading state
        if (transactions.length === 0) {
          setInitialLoading(true);
        } else {
          setRefreshing(true);
        }
        setLoading(true);
        setError(null);
        
        console.log(`Fetching data for address ${address}, page ${currentPage}`);
        
        // Fetch both balances and transactions in parallel
        const [balanceData, txData] = await Promise.all([
          getAccountBalance(address),
          getAddressTransactions(address, currentPage, 20)
        ]);
        
        console.log('Received transaction data:', txData);
        
        // Update balances
        setBalances([...balanceData]);
        
        // Format transactions
        const formattedTxs = txData.transactions.map(tx => ({
          hash: tx.hash,
          height: tx.height.toString(), // Convert number to string
          time: tx.time,
          status: tx.success ? 'Success' : 'Failed',
          success: tx.success,
          gasUsed: tx.gasUsed,
          gasWanted: tx.gasWanted,
          rawLog: tx.rawLog
        }));
        
        console.log('Formatted transactions:', formattedTxs);
        
        // Update current transactions
        setTransactions(formattedTxs);
        
        // Update pagination
        setPagination(txData.pagination);
        
        // Set loading to false after all updates
        setLoading(false);
        setInitialLoading(false);
        setRefreshing(false);
      } catch (err) {
        console.error(`Error fetching data for address ${address}:`, err);
        setError(`Failed to load data for address ${address}. Please try again later.`);
        setLoading(false);
        setInitialLoading(false);
        setRefreshing(false);
      }
    };

    fetchData();
  }, [address, currentPage]);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    
    // Show loading state immediately for better UX
    setRefreshing(true);
    
    // Navigate to the new page
    router.push(`/address/${address}?page=${page}`);
  };

  // Generate pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxButtons = 5; // Maximum number of page buttons to show
    
    // Always show first page
    buttons.push(
      <button
        key="first"
        onClick={() => handlePageChange(1)}
        disabled={currentPage === 1}
        className={`px-3 py-1 mx-1 rounded ${
          currentPage === 1
            ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
            : 'bg-white text-blue-600 hover:bg-blue-100 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700'
        }`}
      >
        1
      </button>
    );
    
    // Calculate range of pages to show
    let startPage = Math.max(2, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(pagination.totalPages - 1, startPage + maxButtons - 3);
    
    if (endPage - startPage < maxButtons - 3) {
      startPage = Math.max(2, endPage - (maxButtons - 3) + 1);
    }
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      buttons.push(
        <span key="ellipsis1" className="px-3 py-1 mx-1">
          ...
        </span>
      );
    }
    
    // Add page buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 mx-1 rounded ${
            currentPage === i
              ? 'bg-blue-600 text-white dark:bg-blue-700'
              : 'bg-white text-blue-600 hover:bg-blue-100 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // Add ellipsis before last page if needed
    if (endPage < pagination.totalPages - 1) {
      buttons.push(
        <span key="ellipsis2" className="px-3 py-1 mx-1">
          ...
        </span>
      );
    }
    
    // Always show last page if there is more than one page
    if (pagination.totalPages > 1) {
      buttons.push(
        <button
          key="last"
          onClick={() => handlePageChange(pagination.totalPages)}
          disabled={currentPage === pagination.totalPages}
          className={`px-3 py-1 mx-1 rounded ${
            currentPage === pagination.totalPages
              ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
              : 'bg-white text-blue-600 hover:bg-blue-100 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700'
          }`}
        >
          {pagination.totalPages}
        </button>
      );
    }
    
    return buttons;
  };

  // Render the transaction table
  const renderTransactionTable = () => {
    if (initialLoading) {
      return (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading transactions for page {currentPage}...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="text-center py-8">
          <div className="text-red-500 text-xl mb-2">⚠️</div>
          <p className="text-red-500">{error}</p>
        </div>
      );
    }
    
    if (transactions.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">No transactions found for this address.</p>
        </div>
      );
    }
    
    return (
      <div>
        {refreshing && (
          <div className="text-center py-2 mb-4">
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Refreshing data...</span>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">TX HASH</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">BLOCK</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">TIME</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {transactions.map((tx) => (
                <tr key={tx.hash} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-2">
                    <Link href={`/tx/${tx.hash}`} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                      {tx.hash.substring(0, 10)}...
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`/blocks/${tx.height}`} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                      {tx.height}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{formatDate(tx.time)}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      tx.status === 'Success' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination info */}
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
          Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total transactions)
        </div>
        
        {/* Pagination controls */}
        <div className="flex justify-center mt-4">
          {renderPaginationButtons()}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          ← Back to Home
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-2">Address Details</h1>
      <p className="text-gray-500 dark:text-gray-400 break-all mb-6">{address}</p>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Balances</h2>
            
            {balances.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Denom
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {balances.map((balance, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {balance.denom}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatTokenAmount(balance.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No balances found for this address.</p>
            )}
          </div>
          
          {/* Transaction History Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
            
            {renderTransactionTable()}
          </div>
        </>
      )}
    </div>
  );
}
