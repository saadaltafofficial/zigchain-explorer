'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLatestBlocks, getChainInfo } from './services/api';
import BlockCard from './components/BlockCard';
import StatCard from './components/StatCard';

export default function Home() {
  const [latestBlocks, setLatestBlocks] = useState<any[]>([]);
  const [chainInfo, setChainInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch latest blocks
        const blocks = await getLatestBlocks(5);
        setLatestBlocks(blocks);
        
        // Fetch chain info
        const info = await getChainInfo();
        setChainInfo(info);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load blockchain data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-6">ZigChain Explorer</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Explore the ZigChain blockchain - view blocks, transactions, validators, and more.
        </p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {chainInfo && (
              <>
                <StatCard 
                  title="Chain ID" 
                  value={chainInfo.chainId} 
                />
                <StatCard 
                  title="Latest Block" 
                  value={chainInfo.latestBlockHeight} 
                />
                <StatCard 
                  title="Network" 
                  value="Testnet" 
                />
              </>
            )}
          </div>
        )}
      </section>
      
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Latest Blocks</h2>
          <Link href="/blocks" className="text-blue-600 hover:text-blue-800">
            View All Blocks →
          </Link>
        </div>
        
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 animate-pulse">
                <div className="flex justify-between">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mt-3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {latestBlocks.map((block) => (
              <BlockCard 
                key={block.height}
                height={block.height}
                hash={block.hash}
                time={block.time}
                txCount={block.txCount}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
