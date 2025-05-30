'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
// Import from our new API client instead of the direct API
import { getLatestBlocks, getLatestTransactions, getChainInfo } from './services/apiClient';
import BlockCard from './components/BlockCard';
import TransactionCard from './components/TransactionCard';
import PriceChart from './components/PriceChart';
import NetworkActivity from './components/NetworkActivity';
import HomeStats from './components/HomeStats';
import { formatDate } from './services/apiClient';
// We no longer need this import as we're using our API client
// import { fetchTransactions } from './utils/transactionFetcher';
import { ArrowRight, TrendingUp } from 'lucide-react';



// Define types for the state
interface Block {
  height: number;
  hash: string;
  time: string;
  proposer: string;
  numTxs: number;
}

// {
//   "block_id": 1394346,
//   "to_address": "zig17xpfvakm2amg962yls6f84z3kell8c5l3nxjf4",
//   "amount": null,
//   "status": "success",
//   "hash": "5749F5C62D8E8DA205E430BAEC26E17193FA311E4F3D7C410A2DFC4843C3343F",
//   "id": 78928,
//   "from_address": "zig14hyccud258xg4ww30r47aaudcgzzu8qxaq3yq8",
//   "fee": "1938uzig",
//   "created_at": "2025-04-30T16:33:56.300320"
// },

interface Transaction {
  hash: string;
  block_id: number;
  from_address: string;
  to_address: string;
  amount: string | null;
  status: string;
  id: number;
  fee: string;
  created_at: string;
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
      
      // Fetching initial data for home page
      
      // Try to fetch data with error handling for each call
      try {
        // Fetch latest blocks using our new API client
        const blocks = await getLatestBlocks(10);
        if (blocks && blocks.length > 0) {
          setLatestBlocks(blocks);
        } else {
          // No blocks received from API
        }
      } catch (blockErr) {
        // Error fetching blocks
      }
      
      try {
        // Fetch latest transactions using our new API client
        const transactions = await getLatestTransactions(10);
        if (transactions && transactions.length > 0) {
          setLatestTransactions(transactions);
        } else {
          // No transactions received from API
        }
      } catch (txErr) {
        // Error fetching transactions
      }
      
      try {
        // Fetch chain info using our new API client
        const info = await getChainInfo();
        if (info) {
          setChainInfo(info);
        } else {
          // No chain info received from API
        }
      } catch (infoErr) {
        // Error fetching chain info
      }

      
      setLoading(false);
    } catch (err: unknown) {
      console.error('Error in fetchInitialData:', err);
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



  const LatestBlocks = ({ blocks }: { blocks: Block[] }) => {
    return (
      <div className=" dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b  dark:border-gray-700">
          <div className="flex items-center">
            <h2 className="text-xl font-bold flex items-center">
              <span className="dark:bg-blue-900/30 p-2 rounded-full mr-3">
                <TrendingUp size={18} className="text-blue-600 dark:text-blue-400" />
              </span>
              Blocks
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
                time={formatDate(block.time)}
                hash={block.hash}
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
      <div className="dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold flex items-center">
            <span className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
            Transactions
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
                  time={formatDate(tx.created_at)}
                  status={tx.status as 'success' | 'failed'}
                  from={tx.from_address}
                  to={tx.to_address}
                  blockHeight={tx.block_id.toString()}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const LoadingBlocks = () => (
    <div className="dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
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
    <div className=" dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
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
          <div className="mb-16">
            {/* <h1 className="text-3xl font-bold mb-6">ZIGChain Explorer</h1> */}
            <HomeStats chainInfo={chainInfo} isLoading={loading} />
          </div>
          
          {/* Price Chart and Network Activity */}
          {/* Only show charts on larger screens */}
          <div className="hidden md:block">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-[#131e2c] rounded-lg overflow-hidden shadow-lg h-full">
                <PriceChart coinId="zignaly" currency="usd" displayName="ZIG" />
              </div>
              <div className="bg-[#131e2c] rounded-lg overflow-hidden shadow-lg h-full">
                <NetworkActivity />
              </div>
            </div>
          </div>
          
          {/* Blocks and Transactions Grid - Responsive Layout */}
          <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-1 lg:grid-cols-2 md:gap-8 mb-8">
            {/* Latest Blocks Column */}
            <div className="mb-6 md:mb-0">
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
