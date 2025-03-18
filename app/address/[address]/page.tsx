'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { getAccountBalance, getAddressTransactions } from '../../services/api';
import { formatTokenAmount, formatDate } from '../../utils/format';

interface AddressDetailPageProps {
  params: {
    address: string;
  };
}

export default function AddressDetailPage({ params }: AddressDetailPageProps) {
  const { address } = params;
  
  const [balances, setBalances] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const searchParams = useSearchParams();
  const router = useRouter();
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
        setLoading(true);
        setError(null);
        
        // Fetch both balances and transactions in parallel
        const [balanceData, txData] = await Promise.all([
          getAccountBalance(address),
          getAddressTransactions(address, currentPage, 10)
        ]);
        
        // Update state with fetched data
        setBalances([...balanceData]);
        setTransactions(txData.transactions);
        setPagination(txData.pagination);
        
        setLoading(false);
      } catch (err) {
        console.error(`Error fetching data for address ${address}:`, err);
        setError(`Failed to load data for address ${address}. Please try again later.`);
        setLoading(false);
      }
    };

    fetchData();
  }, [address, currentPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
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
            
            {transactions.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Tx Hash
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Block
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {transactions.map((tx, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link href={`/tx/${encodeURIComponent(tx.hash)}?from=${encodeURIComponent(address)}`} className="text-blue-600 hover:text-blue-800">
                              {tx.hash.substring(0, 10)}...
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <Link href={`/blocks/${tx.height}`} className="text-blue-600 hover:text-blue-800">
                              {tx.height}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(tx.time)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${tx.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {tx.success ? 'Success' : 'Failed'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 mx-1 rounded ${
                        currentPage === 1
                          ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
                          : 'bg-white text-blue-600 hover:bg-blue-100 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700'
                      }`}
                    >
                      Previous
                    </button>
                    
                    {renderPaginationButtons()}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                      className={`px-3 py-1 mx-1 rounded ${
                        currentPage === pagination.totalPages
                          ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
                          : 'bg-white text-blue-600 hover:bg-blue-100 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
                
                <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Showing {transactions.length} of {pagination.totalItems} transactions
                </div>
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No transactions found for this address.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
