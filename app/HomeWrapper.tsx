"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import BlockCard from './components/BlockCard';
import TransactionCard from './components/TransactionCard';
import { ArrowRight } from 'lucide-react';

// Dynamic imports for heavy components
const DynamicPriceChart = dynamic(
  () => import('./components/PriceChart'),
  {
    loading: () => (
      <div className="w-full h-48 rounded-lg bg-gray-800 animate-pulse flex items-center justify-center">
        <span className="text-gray-500">Loading price chart...</span>
      </div>
    )
  }
);

const DynamicNetworkActivity = dynamic(
  () => import('./components/NetworkActivity'),
  {
    loading: () => (
      <div className="w-full rounded-lg bg-gray-800 animate-pulse p-4">
        <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
      </div>
    )
  }
);

const DynamicHomeStats = dynamic(
  () => import('./components/HomeStats'),
  {
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
            <div className="h-5 bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }
);

interface HomeWrapperProps {
  chainInfo: any;
  latestBlocks: any[];
  latestTransactions: any[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void; // Make this optional
}

export default function HomeWrapper({
  chainInfo,
  latestBlocks,
  latestTransactions,
  loading,
  error,
  onRetry
}: HomeWrapperProps) {
  // Internal retry handler that refreshes the page if no external handler is provided
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // If no external handler is provided, just refresh the page
      window.location.reload();
    }
  };
  // Import the components from page.tsx that need to be rendered
  const LoadingBlocks = () => (
    <div className=" dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="flex justify-between items-center px-6 py-4 border-b  dark:border-gray-700">
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
            <DynamicHomeStats chainInfo={chainInfo} isLoading={loading} />
          </div>
          
          {/* Price Chart and Network Activity */}
          {/* Only show charts on larger screens */}
          <div className="hidden md:block">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-[#131e2c] rounded-lg overflow-hidden shadow-lg h-full">
                <DynamicPriceChart coinId="zignaly" currency="usd" displayName="ZIG" />
              </div>
              <div className="bg-[#131e2c] rounded-lg overflow-hidden shadow-lg h-full">
                <DynamicNetworkActivity />
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
                <div className=" dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                  <div className="flex justify-between items-center px-6 py-4 border-b  dark:border-gray-700">
                    <h2 className="text-xl font-semibold">Latest Blocks</h2>
                    <a href="/blocks" className="text-blue-500 hover:text-blue-700 flex items-center">
                      View All <ArrowRight size={16} className="ml-1" />
                    </a>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {latestBlocks.map((block) => (
                      <div key={block.height} className="p-4">
                        <BlockCard
                          height={block.height}
                          hash={block.hash}
                          time={block.time}
                          txCount={block.numTxs}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Latest Transactions Column */}
            <div>
              {loading ? (
                <LoadingTransactions />
              ) : (
                <div className=" dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                  <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold">Latest Transactions</h2>
                    <a href="/transactions" className="text-blue-500 hover:text-blue-700 flex items-center">
                      View All <ArrowRight size={16} className="ml-1" />
                    </a>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {latestTransactions.map((tx) => (
                      <div key={tx.hash} className="p-4">
                        <TransactionCard
                          hash={tx.hash}
                          time={tx.created_at}
                          status={tx.status as 'success' | 'failed'}
                          from={tx.from_address}
                          to={tx.to_address}
                          blockHeight={tx.block_id}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
