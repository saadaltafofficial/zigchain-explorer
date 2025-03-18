'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTransactionByHash } from '../../services/api';
import { formatDate, truncateString } from '../../utils/format';

interface TransactionDetailPageProps {
  params: {
    hash: string;
  };
}

export default function TransactionDetailPage({ params }: TransactionDetailPageProps) {
  // Safely access the hash parameter
  const hash = params?.hash || '';
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransaction = async () => {
    if (!hash) {
      setError('Transaction hash is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching transaction details for hash: ${hash}`);
      
      const txData = await getTransactionByHash(hash);
      console.log('Transaction data received:', txData ? 'success' : 'not found');
      setTransaction(txData);
      setLoading(false);
    } catch (err: any) {
      console.error(`Error fetching transaction ${hash}:`, err);
      setError(err.message || `Failed to load transaction ${hash}. Please try again later.`);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransaction();
  }, [hash]);

  const handleRetry = () => {
    fetchTransaction();
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          ← Back to Home
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-2">Transaction Details</h1>
      <p className="text-gray-500 dark:text-gray-400 break-all mb-6">{hash}</p>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
            <button 
              onClick={handleRetry}
              className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      {!transaction && !loading && !error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Transaction Not Found</p>
          <p>
            The transaction with hash {hash} could not be found. This could be because:
          </p>
          <ul className="list-disc ml-5 mt-2">
            <li>The transaction hash is incorrect</li>
            <li>The transaction is too recent and not yet indexed</li>
            <li>The node is still syncing and doesn't have this transaction yet</li>
          </ul>
          <button 
            onClick={handleRetry}
            className="mt-3 bg-yellow-700 hover:bg-yellow-800 text-white font-bold py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      )}
      
      {transaction && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Transaction Information</h2>
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Status</span>
                    <span className={`font-medium ${transaction.tx_response?.code === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {transaction.tx_response?.code === 0 ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  
                  {transaction.tx_response?.height && (
                    <div className="flex flex-col">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">Block</span>
                      <Link href={`/blocks/${transaction.tx_response.height}`} className="font-medium text-blue-600 hover:text-blue-800">
                        {transaction.tx_response.height}
                      </Link>
                    </div>
                  )}
                  
                  {transaction.tx_response?.timestamp && (
                    <div className="flex flex-col">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">Time</span>
                      <span className="font-medium">{formatDate(transaction.tx_response.timestamp)}</span>
                    </div>
                  )}
                  
                  <div className="flex flex-col">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Gas Used / Wanted</span>
                    <span className="font-medium">{transaction.tx_response?.gas_used || 0} / {transaction.tx_response?.gas_wanted || 0}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-4">Transaction Details</h2>
                <div className="space-y-3">
                  {transaction.tx?.auth_info?.fee?.amount?.[0] && (
                    <div className="flex flex-col">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">Fee</span>
                      <span className="font-medium">
                        {transaction.tx.auth_info.fee.amount[0].amount || 0} {transaction.tx.auth_info.fee.amount[0].denom || ''}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex flex-col">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Memo</span>
                    <span className="font-medium">{transaction.tx?.body?.memo || 'N/A'}</span>
                  </div>
                  
                  {transaction.tx_response?.code !== 0 && (
                    <div className="flex flex-col">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">Error</span>
                      <span className="font-medium text-red-600 dark:text-red-400">{transaction.tx_response?.raw_log || 'Unknown error'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Messages</h2>
            
            {transaction.tx?.body?.messages?.length > 0 ? (
              <div className="space-y-4">
                {transaction.tx.body.messages.map((message: any, index: number) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="font-medium text-lg mb-2">Message {index + 1}: {message['@type']?.split('.')?.pop() || 'Unknown Type'}</h3>
                    <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto text-sm">
                      {JSON.stringify(message, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No messages found in this transaction</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
