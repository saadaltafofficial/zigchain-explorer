'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLatestBlocks, getChainInfo } from './services/api';
import BlockCard from './components/BlockCard';
import TransactionCard from './components/TransactionCard';
import { fetchTransactions } from './utils/transactionFetcher';

// Define types for the state
interface Block {
  height: number;
  hash: string;
  time: string;
  proposer: string;
  numTxs: number;
}

interface Transaction {
  hash: string;
  height: string;
  time: string;
  from?: string;
  to?: string;
  amount?: string;
  denom?: string;
  status?: 'success' | 'failed';
  tx_result?: {
    code: number;
  };
}

interface ChainInfo {
  chainId: string;
  blockHeight: number;
  blockTime: number;
  validatorCount: number;
  bondedTokens: string;
  nodeInfo: {
    version: string;
  };
}

export default function Home() {
  const [latestBlocks, setLatestBlocks] = useState<Block[]>([]);
  const [latestTransactions, setLatestTransactions] = useState<Transaction[]>([]);
  const [chainInfo, setChainInfo] = useState<ChainInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching data for home page...');
      
      // Fetch latest blocks
      const blocks = await getLatestBlocks(5);
      console.log('Received blocks:', blocks);
      setLatestBlocks(blocks);
      
      // Fetch latest transactions using the common utility
      const transactions = await fetchTransactions(200, 5); // Search in last 20 blocks, limit to 5 transactions
      console.log('Received transactions:', transactions);
      setLatestTransactions(transactions);
      
      // Fetch chain info
      const info = await getChainInfo();
      console.log('Received chain info:', info);
      setChainInfo(info);
      
      setLoading(false);
    } catch (err: unknown) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load blockchain data. Please try again later.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRetry = () => {
    fetchData();
  };

  const LatestBlocks = ({ blocks }: { blocks: Block[] }) => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Latest Blocks</h2>
          <Link 
            href="/blocks" 
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            View All Blocks →
          </Link>
        </div>
        
        {blocks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No blocks found
          </div>
        ) : (
          <div className="space-y-4">
            {blocks.map((block) => (
              <BlockCard 
                key={block.height}
                height={block.height}
                time={formatBlockTime(block.time)}
                hash={block.hash}
                txCount={block.numTxs}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const LatestTransactions = ({ transactions }: { transactions: Transaction[] }) => {
    // Set referrer for transaction detail navigation
    const setTxReferrer = () => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('txReferrer', '/');
      }
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Latest Transactions</h2>
          <Link 
            href="/transactions" 
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            View All Transactions →
          </Link>
        </div>
        
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No transactions found
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx, index) => (
              <div key={tx.hash || index} onClick={setTxReferrer}>
                <TransactionCard 
                  hash={tx.hash}
                  time={tx.time}
                  status={tx.tx_result?.code === 0 ? 'success' : 'failed'}
                  from={tx.from || ''}
                  to={tx.to || ''}
                  blockHeight={tx.height.toString()}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const LoadingBlocks = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
      </div>
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 animate-pulse">
            <div className="flex justify-between items-start">
              <div>
                <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-24 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const LoadingTransactions = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
      </div>
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 animate-pulse">
            <div className="flex justify-between items-start">
              <div>
                <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-40 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const formatBlockTime = (time: string | number): string => {
    if (!time) return 'Unknown';
    
    const blockTime = typeof time === 'string' ? new Date(time) : new Date(time);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - blockTime.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    }
  };

  const safeParseFloat = (value: string | number): number => {
    if (typeof value === 'number') return value;
    try {
      return parseFloat(value);
    } catch {
      return 0;
    }
  };

  const formatNumber = (num: number | string): string => {
    const parsedNum = typeof num === 'string' ? safeParseFloat(num) : num;
    if (isNaN(parsedNum)) return '0';
      
    if (parsedNum >= 1000000) {
      return `${(parsedNum / 1000000).toFixed(2)}M`;
    } else if (parsedNum >= 1000) {
      return `${(parsedNum / 1000).toFixed(2)}K`;
    } else {
      return parsedNum.toString();
    }
  };

  const ChainStats = () => {
    if (!chainInfo) return null;
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Chain Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Chain ID</p>
            <p className="text-xl font-semibold">{chainInfo.chainId || 'Unknown'}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Latest Block</p>
            <p className="text-xl font-semibold">{formatNumber(chainInfo.blockHeight)}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Node Version</p>
            <p className="text-xl font-semibold">{chainInfo.nodeInfo?.version || 'Unknown'}</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Block Time</p>
            <p className="text-xl font-semibold">{formatNumber(chainInfo.blockTime)}s</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Validators</p>
            <p className="text-xl font-semibold">{formatNumber(chainInfo.validatorCount)}</p>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Bonded Tokens</p>
            <p className="text-xl font-semibold">{formatNumber(chainInfo.bondedTokens)} ZIG</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <section>
        <div className="container mx-auto px-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p className="font-bold">Error</p>
              <p>{error}</p>
              <button 
                onClick={handleRetry} 
                className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}
          
          {/* Chain Info Section */}
          {chainInfo && (
            <ChainStats />
          )}
          
          {/* Blocks and Transactions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Latest Blocks Column */}
            <div>
              {loading ? (
                <LoadingBlocks />
              ) : (
                <LatestBlocks blocks={latestBlocks} />
              )}
            </div>
            
            {/* Latest Transactions Column */}
            <div>
              {loading ? (
                <LoadingTransactions />
              ) : (
                <LatestTransactions transactions={latestTransactions} />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
