'use client';

import React, { useEffect, useState } from 'react';
import { getTransactionByHash } from '@/app/services/apiClient';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { formatDate, truncateString } from '@/app/utils/format';

interface TransactionDetailClientProps {
  params: {
    hash: string;
  };
}

interface Transaction {
  hash: string;
  height: string;
  time?: string;
  timestamp?: string; // Added to support API response format
  from?: string;
  to?: string;
  amount?: string;
  fee?: string;
  status?: string;
  code?: number;
  tx_result?: {
    code: number;
  };
  memo?: string;
  gas_used?: string;
  gas_wanted?: string;
}

export default function TransactionDetailClient({ params }: TransactionDetailClientProps) {
  const { hash } = params;
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!hash) {
        setError('Transaction hash is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log(`Fetching transaction with hash: ${hash}`);
        const txData = await getTransactionByHash(hash);
        
        if (txData) {
          console.log('Transaction data:', txData);
          setTransaction(txData);
        } else {
          setError(`Transaction with hash ${hash} not found`);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching transaction:', err);
        setError(`Failed to load transaction details: ${err instanceof Error ? err.message : String(err)}`);
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [hash]);

  // Helper function to determine transaction status
  const getStatusDisplay = (tx: Transaction) => {
    if (tx.status) {
      return tx.status;
    }
    
    // Fallback to code if status is not directly available
    if (tx.code !== undefined) {
      return tx.code === 0 ? 'success' : 'failed';
    }
    
    if (tx.tx_result?.code !== undefined) {
      return tx.tx_result.code === 0 ? 'success' : 'failed';
    }
    
    return 'unknown';
  };

  // Helper function to get status class
  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/" className="flex items-center text-blue-500 hover:text-blue-700">
            <ArrowLeft className="mr-2" size={16} />
            Back to Home
          </Link>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/" className="flex items-center text-blue-500 hover:text-blue-700">
            <ArrowLeft className="mr-2" size={16} />
            Back to Home
          </Link>
        </div>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/" className="flex items-center text-blue-500 hover:text-blue-700">
            <ArrowLeft className="mr-2" size={16} />
            Back to Home
          </Link>
        </div>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <p>No transaction data found.</p>
        </div>
      </div>
    );
  }

  const status = getStatusDisplay(transaction);
  const statusClass = getStatusClass(status);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/" className="flex items-center text-blue-500 hover:text-blue-700">
          <ArrowLeft className="mr-2" size={16} />
          Back to Home
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-2">Transaction Details</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {truncateString(transaction.hash, 10, 10)}
      </p>
      
      <div className="dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Transaction Overview</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Hash</p>
                  <p className="font-mono text-sm break-all">{transaction.hash}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClass}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Block</p>
                  <Link href={`/blocks/${transaction.height}`} className="text-blue-500 hover:text-blue-700">
                    {transaction.height}
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Timestamp</p>
                  <p>{formatDate(transaction.time || transaction.timestamp || '')}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Transaction Details</h2>
              <div className="space-y-4">
                {transaction.from && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">From</p>
                    <span title="Address details coming soon" className="text-blue-500 cursor-not-allowed font-mono text-sm break-all">
                      {transaction.from}
                    </span>
                  </div>
                )}
                
                {transaction.to && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">To</p>
                    <span title="Address details coming soon" className="text-blue-500 cursor-not-allowed font-mono text-sm break-all">
                      {transaction.to}
                    </span>
                  </div>
                )}
                
                {transaction.amount && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                    <p>{transaction.amount}</p>
                  </div>
                )}
                
                {transaction.fee && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Fee</p>
                    <p>{transaction.fee}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Additional transaction details */}
          {transaction.memo && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Memo</h2>
              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded">
                <p className="font-mono text-sm break-all">{transaction.memo}</p>
              </div>
            </div>
          )}
          
          {/* Gas information */}
          {(transaction.gas_used || transaction.gas_wanted) && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Gas Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {transaction.gas_used && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gas Used</p>
                    <p>{transaction.gas_used}</p>
                  </div>
                )}
                {transaction.gas_wanted && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gas Wanted</p>
                    <p>{transaction.gas_wanted}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
