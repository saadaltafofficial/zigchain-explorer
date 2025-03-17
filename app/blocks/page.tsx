'use client';

import React, { useEffect, useState } from 'react';
import { getLatestBlocks } from '../services/api';
import BlockCard from '../components/BlockCard';

export default function BlocksPage() {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        setLoading(true);
        const latestBlocks = await getLatestBlocks(20);
        setBlocks(latestBlocks);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching blocks:', err);
        setError('Failed to load blocks. Please try again later.');
        setLoading(false);
      }
    };

    fetchBlocks();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Latest Blocks</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
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
          {blocks.map((block) => (
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
    </div>
  );
}
