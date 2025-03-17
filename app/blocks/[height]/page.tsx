'use client';

import React from 'react';
import Link from 'next/link';
import { getBlockByHeight } from '../../services/api';
import { formatDate, formatNumber, truncateString } from '../../utils/format';

interface BlockDetailPageProps {
  params: {
    height: string;
  };
}

export default async function BlockDetailPage({ params }: BlockDetailPageProps) {
  const { height } = params;
  
  let block: any = null;
  let error: string | null = null;
  
  try {
    block = await getBlockByHeight(parseInt(height));
  } catch (err) {
    console.error(`Error fetching block ${height}:`, err);
    error = `Failed to load block ${height}. Please try again later.`;
  }

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
          {error}
        </div>
      )}
      
      {!block ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">Block not found or still loading...</p>
        </div>
      ) : (
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
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Proposer:</span>{' '}
                  <Link href={`/validator/${block.proposer}`} className="text-blue-600 hover:text-blue-800">
                    {truncateString(block.proposer, 8, 8)}
                  </Link>
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Hash:</span> {truncateString(block.hash, 10, 10)}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Transactions:</span> {formatNumber(block.txCount)}
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
              <p className="text-gray-500 dark:text-gray-400">No transactions in this block.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
