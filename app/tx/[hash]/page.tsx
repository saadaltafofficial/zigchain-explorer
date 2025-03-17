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
  const { hash } = params;
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        const txData = await getTransactionByHash(hash);
        setTransaction(txData);
        setLoading(false);
      } catch (err) {
        console.error(`Error fetching transaction ${hash}:`, err);
        setError(`Failed to load transaction ${hash}. Please try again later.`);
        setLoading(false);
      }
    };

    if (hash) {
      fetchTransaction();
    }
  }, [hash]);

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

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        Transaction not found.
      </div>
    );
  }

  const txResponse = transaction.tx_response;
  const txData = transaction.tx;
  const isSuccess = txResponse?.code === 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          ← Back to Home
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-2">Transaction Details</h1>
      <p className="text-gray-500 dark:text-gray-400 break-all mb-6">{hash}</p>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Transaction Information</h2>
            <div className="space-y-3">
              <div className="flex flex-col">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Status</span>
                <span className={`font-medium ${isSuccess ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isSuccess ? 'Success' : 'Failed'}
                </span>
              </div>
              
              <div className="flex flex-col">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Block</span>
                <Link href={`/blocks/${txResponse?.height}`} className="font-medium text-blue-600 hover:text-blue-800">
                  {txResponse?.height}
                </Link>
              </div>
              
              <div className="flex flex-col">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Time</span>
                <span className="font-medium">{formatDate(txResponse?.timestamp || '')}</span>
              </div>
              
              <div className="flex flex-col">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Gas Used / Wanted</span>
                <span className="font-medium">{txResponse?.gas_used || 0} / {txResponse?.gas_wanted || 0}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-4">Transaction Details</h2>
            <div className="space-y-3">
              <div className="flex flex-col">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Fee</span>
                <span className="font-medium">
                  {txData?.auth_info?.fee?.amount?.[0]?.amount || 0} {txData?.auth_info?.fee?.amount?.[0]?.denom || ''}
                </span>
              </div>
              
              <div className="flex flex-col">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Memo</span>
                <span className="font-medium">{txData?.body?.memo || 'N/A'}</span>
              </div>
              
              {!isSuccess && (
                <div className="flex flex-col">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Error</span>
                  <span className="font-medium text-red-600 dark:text-red-400">{txResponse?.raw_log || 'Unknown error'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Messages</h2>
        
        {txData?.body?.messages?.length > 0 ? (
          <div className="space-y-4">
            {txData.body.messages.map((message: any, index: number) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-lg mb-2">Message {index + 1}: {message['@type']?.split('.')?.pop()}</h3>
                <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto text-sm">
                  {JSON.stringify(message, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No messages found in this transaction.</p>
        )}
      </div>
    </div>
  );
}
