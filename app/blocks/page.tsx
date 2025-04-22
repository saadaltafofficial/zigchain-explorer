'use client';

import React, { useEffect, useState } from 'react';
import { getLatestBlocks } from '../services/apiClient';
import BlockCard from '../components/BlockCard';

export default function BlocksPage() {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBlocks, setTotalBlocks] = useState(0);
  const [latestHeight, setLatestHeight] = useState(0);
  const PAGE_SIZE = 5; // Number of blocks per page
  
  const [blocks, setBlocks] = useState<{
    height: number;
    time: string;
    proposer: string;
    numTxs: number;
    hash: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlocks = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[Blocks] Fetching blocks for page ${page} with page size ${PAGE_SIZE}...`);
      
      // First request to get latest block height (if we don't have it yet)
      if (latestHeight === 0) {
        console.log('[Blocks] Getting latest block height...');
        const initialBlocks = await getLatestBlocks(1);
        if (initialBlocks.length > 0) {
          console.log(`[Blocks] Latest block height: ${initialBlocks[0].height}`);
          setLatestHeight(initialBlocks[0].height);
          setTotalBlocks(initialBlocks[0].height); // Assuming height is sequential from 1
        } else {
          console.warn('[Blocks] No blocks returned when fetching latest height');
        }
      }
      
      // Calculate block range for the requested page
      const startHeight = latestHeight - ((page - 1) * PAGE_SIZE);
      const blocksToFetch = Math.min(PAGE_SIZE, startHeight);
      
      if (blocksToFetch <= 0) {
        console.log('[Blocks] No blocks to fetch for this page');
        setBlocks([]);
        setLoading(false);
        return;
      }
      
      // Fetch blocks for this specific page - our new API client only takes count
      console.log(`[Blocks] Fetching ${blocksToFetch} blocks from API...`);
      const latestBlocks = await getLatestBlocks(blocksToFetch);
      console.log(`[Blocks] Received ${latestBlocks.length} blocks for page ${page}`);
      
      // Ensure the blocks match the expected type
      const formattedBlocks = latestBlocks.map((block: any) => ({
        height: block.height,
        time: block.time,
        proposer: block.proposer,
        numTxs: block.txCount || 0, // Use txCount from the API response
        hash: block.hash
      }));
      
      setBlocks(formattedBlocks);
      setLoading(false);
    } catch (err: unknown) {
      console.error('[Blocks] Error fetching blocks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load blocks. Please try again later.');
      setLoading(false);
    }
    
    // Check if we need to refresh the latest height periodically
    // This helps keep the pagination accurate if new blocks are being added
    const refreshTimer = setTimeout(() => {
      if (!loading) {
        // Refresh the latest block height every 30 seconds
        const refreshLatestHeight = async () => {
          try {
            const initialBlocks = await getLatestBlocks(1);
            if (initialBlocks.length > 0 && initialBlocks[0].height > latestHeight) {
              console.log(`[Blocks] Updated latest block height: ${initialBlocks[0].height}`);
              setLatestHeight(initialBlocks[0].height);
              setTotalBlocks(initialBlocks[0].height);
            }
          } catch (error) {
            console.error('[Blocks] Error refreshing latest height:', error);
          }
        };
        refreshLatestHeight();
      }
    }, 30000); // 30 seconds
    
    return () => clearTimeout(refreshTimer);
  };

  // Change page handler
  const changePage = (newPage: number) => {
    if (newPage < 1 || (totalBlocks > 0 && (newPage - 1) * PAGE_SIZE >= totalBlocks)) {
      return; // Invalid page
    }
    setCurrentPage(newPage);
    fetchBlocks(newPage);
  };

  useEffect(() => {
    fetchBlocks(currentPage);
  }, []); // Only fetch on initial load

  const handleRetry = () => {
    fetchBlocks(currentPage);
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
        <div>
          <div className="space-y-4 mb-6">
            {blocks && blocks.length > 0 ? (
              blocks.map((block) => (
                <BlockCard 
                  key={block.height}
                  height={block.height}
                  hash={block.hash}
                  time={block.time}
                  txCount={block.numTxs}
                />
              ))
            ) : (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                No blocks found. This could be because your node is still syncing or there are connection issues.
              </div>
            )}
          </div>
          
          {/* Pagination controls */}
          {blocks && blocks.length > 0 && (
            <div className="flex items-center justify-between py-4 border-t dark:border-gray-700">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing blocks <span className="font-medium">{blocks[blocks.length-1]?.height || 0}</span> to <span className="font-medium">{blocks[0]?.height || 0}</span> 
                {totalBlocks > 0 && (
                  <span> of <span className="font-medium">{totalBlocks}</span> total</span>
                )}
              </div>
              
              <nav className="inline-flex rounded-md shadow-sm">
                <button
                  onClick={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-l-md ${currentPage === 1 ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  Previous
                </button>
                <div className="relative inline-flex items-center px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 border-x dark:border-gray-700">
                  Page {currentPage}
                </div>
                <button
                  onClick={() => changePage(currentPage + 1)}
                  disabled={blocks.length < PAGE_SIZE || (totalBlocks > 0 && currentPage * PAGE_SIZE >= totalBlocks)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-r-md ${blocks.length < PAGE_SIZE ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
