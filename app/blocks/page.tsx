'use client';

import React, { useEffect, useState } from 'react';
import { getLatestBlocks } from '../services/api';
import BlockCard from '../components/BlockCard';

export default function BlocksPage() {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching blocks for blocks page...');
      
      const latestBlocks = await getLatestBlocks(20);
      console.log(`Received ${latestBlocks.length} blocks`);
      setBlocks(latestBlocks);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching blocks:', err);
      setError(err.message || 'Failed to load blocks. Please try again later.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  const handleRetry = () => {
    fetchBlocks();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Latest Blocks</h1>
      
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
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
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
          {blocks && blocks.length > 0 ? (
            blocks.map((block) => (
              <BlockCard 
                key={block.height}
                height={block.height}
                hash={block.hash}
                time={block.time}
                txCount={block.txCount}
              />
            ))
          ) : (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              No blocks found. This could be because your node is still syncing or there are connection issues.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
