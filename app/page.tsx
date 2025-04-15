'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getLatestBlocks, getChainInfo } from './services/api';
import BlockCard from './components/BlockCard';
import TransactionCard from './components/TransactionCard';
import PriceChart from './components/PriceChart';
import NetworkActivity from './components/NetworkActivity';
import HomeStats from './components/HomeStats';
import { fetchTransactions } from './utils/transactionFetcher';
import { ArrowRight, TrendingUp } from 'lucide-react';



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
  const [loading, setLoading] = useState(true);
  const [latestBlocks, setLatestBlocks] = useState<Block[]>([]);
  const [latestTransactions, setLatestTransactions] = useState<Transaction[]>([]);
  const [chainInfo, setChainInfo] = useState<ChainInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  
  // Function to fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching initial data for home page...');
      
      // Fetch latest blocks
      const blocks = await getLatestBlocks(10);
      console.log('Received initial blocks:', blocks);
      setLatestBlocks(blocks);
      
      // Fetch latest transactions using the common utility
      const transactions = await fetchTransactions(200, 10); // Search in last 200 blocks, limit to 10 transactions
      console.log('Received initial transactions:', transactions);
      setLatestTransactions(transactions);
      
      // Fetch chain info
      const info = await getChainInfo();
      console.log('Received initial chain info:', info);
      setChainInfo(info);
      
      setLoading(false);
    } catch (err: unknown) {
      console.error('Error fetching initial data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load blockchain data. Please try again later.');
      setLoading(false);
    }
  }, []);

  // Fetch initial data on mount
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleRetry = () => {
    fetchInitialData();
  };

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

  const LatestBlocks = ({ blocks }: { blocks: Block[] }) => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <h2 className="text-xl font-bold flex items-center">
              <span className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mr-3">
                <TrendingUp size={18} className="text-blue-600 dark:text-blue-400" />
              </span>
              Latest Blocks
            </h2>
            <div className="ml-3">
          
            </div>
          </div>
          <Link 
            href="/blocks" 
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex items-center text-sm font-medium"
          >
            View All <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
        
        {blocks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No blocks found
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {blocks.slice(0, 5).map((block) => (
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold flex items-center">
            <span className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
            Latest Transactions
          </h2>
          <Link 
            href="/transactions" 
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex items-center text-sm font-medium"
          >
            View All <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
        
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No transactions found
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.slice(0, 5).map((tx, index) => (
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 animate-pulse">
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 animate-pulse">
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
          
          {/* Overview Stats Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-6">ZIGChain Explorer</h1>
            <HomeStats chainInfo={chainInfo} isLoading={loading} />
          </div>
          
          {/* Price Chart and Network Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Only show PriceChart on large screens and above */}
            <div className="hidden lg:block">
              <PriceChart coinId="zignaly" currency="usd" displayName="ZIG" />
            </div>
            <div className="block w-full">
              <NetworkActivity isLoading={false} />
            </div>
          </div>
          
          {/* Blocks and Transactions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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
