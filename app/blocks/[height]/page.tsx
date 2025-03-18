'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBlockByHeight } from '../../services/api';
import { formatDate, formatNumber, truncateString } from '../../utils/format';

interface BlockDetailPageProps {
  params: {
    height: string;
  };
}

export default function BlockDetailPage({ params }: BlockDetailPageProps) {
  // Safely access the height parameter
  const height = params?.height || '';
  
  const [block, setBlock] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlock = async () => {
    if (!height) {
      setError('Block height is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching block details for height: ${height}`);
      
      const blockData = await getBlockByHeight(parseInt(height));
      console.log('Block data received:', blockData ? 'success' : 'not found');
      setBlock(blockData);
      setLoading(false);
    } catch (err: any) {
      console.error(`Error fetching block ${height}:`, err);
      setError(err.message || `Failed to load block ${height}. Please try again later.`);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlock();
  }, [height]);

  const handleRetry = () => {
    fetchBlock();
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link href="/blocks" className="text-blue-600 hover:text-blue-800">
          ← Back to Blocks
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Block #{height}</h1>
      
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
      
      {loading ? (
        <div className="animate-pulse">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      ) : !block && !error ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Block Not Found</p>
          <p>
            The block with height {height} could not be found. This could be because:
          </p>
          <ul className="list-disc ml-5 mt-2">
            <li>The block height is incorrect</li>
            <li>The block is too recent and not yet indexed</li>
            <li>The node is still syncing and doesn't have this block yet</li>
          </ul>
          <button 
            onClick={handleRetry}
            className="mt-3 bg-yellow-700 hover:bg-yellow-800 text-white font-bold py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      ) : block && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Block Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Height:</span> {block.height}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Time:</span> {formatDate(block.time)}
                </p>
                {block.proposer && (
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Proposer:</span>{' '}
                    <Link href={`/validator/${block.proposer}`} className="text-blue-600 hover:text-blue-800">
                      {truncateString(block.proposer, 8, 8)}
                    </Link>
                  </p>
                )}
              </div>
              <div>
                {block.hash && (
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Hash:</span> {truncateString(block.hash, 10, 10)}
                  </p>
                )}
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Transactions:</span> {formatNumber(block.txCount || 0)}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Gas Used:</span> {block.gasUsed ? formatNumber(block.gasUsed) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          {block.transactions && block.transactions.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Transactions</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Hash
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {block.transactions.map((tx: string, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          <Link href={`/tx/${tx}`} className="text-blue-600 hover:text-blue-800">
                            {truncateString(tx, 10, 10)}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          Transaction
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Success
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Transactions</h2>
              <p className="text-gray-600 dark:text-gray-400">No transactions in this block</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
