'use client';

import React, { useState, useEffect } from 'react';
import { getBlockByHeight } from '@/app/services/apiClient';
import { formatDate } from '@/app/utils/format';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import HashDisplay from '@/app/components/HashDisplay';

interface Block {
  height: number;
  time: string;
  proposer: string;
  txCount: number; // Changed from numTxs to match API client response
  hash: string;
  transactions: any[]; // Updated to match API client response
  // Optional fields that might not be in the API response
  numTxs?: number;
  totalTxs?: number;
  appHash?: string;
  consensusHash?: string;
  lastCommitHash?: string;
  validatorHash?: string;
  evidenceHash?: string;
  lastResultsHash?: string;
}

// Define the correct props type for Next.js App Router
type Props = {
  params: Promise<{ height: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default function BlockDetailPage({ params }: Props) {
  // Remove the async/await as it's causing issues with client components
  const [height, setHeight] = useState<string>('');
  
  const [block, setBlock] = useState<Block | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Extract height from params
      if (params && 'height' in params) {
        const blockHeight = typeof params.height === 'string' ? params.height : '';
        setHeight(blockHeight);
      }
    };
    fetchData();
  }, [params]);

  useEffect(() => {
    const fetchBlock = async () => {
      if (!height) {
        return; // Skip if height is not yet available
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log(`Fetching block with height: ${height}`);
        const blockData = await getBlockByHeight(parseInt(height));
        
        if (blockData) {
          console.log('Block data:', blockData);
          setBlock(blockData);
        } else {
          setError(`Block with height ${height} not found`);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching block:', err);
        setError(`Failed to load block details: ${err instanceof Error ? err.message : String(err)}`);
        setLoading(false);
      }
    };

    fetchBlock();
  }, [height]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/blocks" className="flex items-center text-blue-500 hover:text-blue-700">
            <ArrowLeft className="mr-2" size={16} />
            Back to Blocks
          </Link>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/blocks" className="flex items-center text-blue-500 hover:text-blue-700">
            <ArrowLeft className="mr-2" size={16} />
            Back to Blocks
          </Link>
        </div>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!block) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/blocks" className="flex items-center text-blue-500 hover:text-blue-700">
            <ArrowLeft className="mr-2" size={16} />
            Back to Blocks
          </Link>
        </div>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <p>No block data found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/blocks" className="flex items-center text-blue-500 hover:text-blue-700">
          <ArrowLeft className="mr-2" size={16} />
          Back to Blocks
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-2">Block #{block.height}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {formatDate(block.time)}
      </p>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Block Information</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Height</p>
              <p className="text-gray-800 dark:text-white">{block.height}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Time</p>
              <p className="text-gray-800 dark:text-white">{formatDate(block.time)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Proposer</p>
              <HashDisplay 
                hash={block.proposer} 
                truncateLength={12} 
                className="mt-1"
              />
              <Link href={`/validators/${block.proposer}`} className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-1">
                View Validator
              </Link>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Number of Transactions</p>
              <p className="text-gray-800 dark:text-white">{block.txCount || block.numTxs || 0}</p>
            </div>
          </div>
          
          <HashDisplay 
            hash={block.hash} 
            label="Hash" 
            truncateLength={16}
          />
          
          {block.totalTxs && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Transactions</p>
              <p className="text-gray-800 dark:text-white">{block.totalTxs}</p>
            </div>
          )}
          
          {block.appHash && block.consensusHash && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <HashDisplay 
                hash={block.appHash} 
                label="App Hash" 
                truncateLength={12}
              />
              <HashDisplay 
                hash={block.consensusHash} 
                label="Consensus Hash" 
                truncateLength={12}
              />
            </div>
          )}
          
          {block.lastCommitHash && block.validatorHash && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <HashDisplay 
                hash={block.lastCommitHash} 
                label="Last Commit Hash" 
                truncateLength={12}
              />
              <HashDisplay 
                hash={block.validatorHash} 
                label="Validator Hash" 
                truncateLength={12}
              />
            </div>
          )}
          
          {block.evidenceHash && (
            <HashDisplay 
              hash={block.evidenceHash} 
              label="Evidence Hash" 
              truncateLength={12}
            />
          )}
          {block.lastResultsHash && (
            <HashDisplay 
              hash={block.lastResultsHash} 
              label="Last Results Hash" 
              truncateLength={12}
            />
          )}
        </div>
      </div>
      
      {(block.txCount > 0 || (block.numTxs && block.numTxs > 0)) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Transactions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Transaction Hash
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {block.transactions.map((tx: string, index: number) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <HashDisplay 
                          hash={tx} 
                          truncateLength={16}
                          showCopyButton={true}
                        />
                        <Link href={`/tx/${tx}`} className="ml-3 text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
