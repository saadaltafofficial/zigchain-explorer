'use client';

import React, { useEffect, useState } from 'react';
import { getLatestBlocks } from '../services/apiClient';
import BlockCard from '../components/BlockCard';

export default function BlocksPage() {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalBlocks, setTotalBlocks] = useState(0);
  const [latestHeight, setLatestHeight] = useState(0);
  
  // Block fetching state
  const [allFetchedBlocks, setAllFetchedBlocks] = useState<{
    height: number;
    time: string;
    proposer: string;
    numTxs: number;
    hash: string;
  }[]>([]);
  // Fixed number of blocks to fetch
  const BLOCKS_TO_FETCH = 50;
  
  const [blocks, setBlocks] = useState<{
    height: number;
    time: string;
    proposer: string;
    numTxs: number;
    hash: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[Blocks] Fetching ${BLOCKS_TO_FETCH} latest blocks from API...`);
      
      // Fetch blocks directly from the API
      const blocks = await getLatestBlocks(BLOCKS_TO_FETCH);
      console.log(`[Blocks] Found ${blocks.length} blocks`);
      
      // Ensure the blocks match the expected type
      const formattedBlocks = blocks.map((block: any) => ({
        height: block.height,
        time: block.time,
        proposer: block.proposer,
        numTxs: block.txCount || 0, // Use txCount from the API response
        hash: block.hash
      }));
      
      setAllFetchedBlocks(formattedBlocks);
      setTotalBlocks(formattedBlocks.length);
      
      // Set the latest height from the first block if available
      if (formattedBlocks.length > 0) {
        setLatestHeight(formattedBlocks[0].height);
      }
      
      // Save to sessionStorage for persistence
      sessionStorage.setItem('zigchain_blocks', JSON.stringify(formattedBlocks));
      sessionStorage.setItem('zigchain_blocks_page', currentPage.toString());
      sessionStorage.setItem('zigchain_blocks_per_page', itemsPerPage.toString());

      sessionStorage.setItem('zigchain_blocks_latest_height', latestHeight.toString());
      sessionStorage.setItem('zigchain_blocks_total', formattedBlocks.length.toString());
      
      // Update displayed blocks
      updateDisplayedBlocks(formattedBlocks);
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
              
              // Update the stored latest height and total blocks
              sessionStorage.setItem('zigchain_blocks_latest_height', initialBlocks[0].height.toString());
              sessionStorage.setItem('zigchain_blocks_total', initialBlocks[0].height.toString());
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

  // Update displayed blocks when page or items per page changes
  useEffect(() => {
    updateDisplayedBlocks();
  }, [currentPage, itemsPerPage]);

  // Add function to update displayed blocks based on pagination
  const updateDisplayedBlocks = (blocks = allFetchedBlocks) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedBlocks = blocks.slice(startIndex, endIndex);
    setBlocks(paginatedBlocks);
    setLoading(false);
  };

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    sessionStorage.setItem('zigchain_blocks_page', pageNumber.toString());
  };

  // Handle items per page change
  const handlePerPageChange = (perPage: number) => {
    setItemsPerPage(perPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    sessionStorage.setItem('zigchain_blocks_per_page', perPage.toString());
  };



  // Load blocks from sessionStorage on initial render
  useEffect(() => {
    const savedBlocks = sessionStorage.getItem('zigchain_blocks');
    const savedPage = sessionStorage.getItem('zigchain_blocks_page');
    const savedItemsPerPage = sessionStorage.getItem('zigchain_blocks_per_page');
    const savedMaxBlocks = sessionStorage.getItem('zigchain_blocks_max_fetch');
    const savedLatestHeight = sessionStorage.getItem('zigchain_blocks_latest_height');
    const savedTotalBlocks = sessionStorage.getItem('zigchain_blocks_total');
    
    if (savedBlocks) {
      try {
        const parsedBlocks = JSON.parse(savedBlocks);
        setAllFetchedBlocks(parsedBlocks);
        setTotalBlocks(parsedBlocks.length);
        updateDisplayedBlocks(parsedBlocks);
        console.log('[Blocks] Restored blocks from session storage');
        
        if (savedPage) setCurrentPage(parseInt(savedPage));
        if (savedItemsPerPage) setItemsPerPage(parseInt(savedItemsPerPage));

        if (savedLatestHeight) setLatestHeight(parseInt(savedLatestHeight));
      } catch (e) {
        console.error('[Blocks] Error parsing saved blocks:', e);
      }
    } else {
      fetchBlocks();
    }
  }, []); // Only fetch on initial load

  const handleRetry = () => {
    fetchBlocks();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-16">Latest Blocks</h1>
      
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
            <div className="mt-16">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className={`p-1 rounded ${
                        currentPage === 1 
                          ? 'text-gray-500 cursor-not-allowed' 
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                      aria-label="First page"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="11 17 6 12 11 7"></polyline>
                        <polyline points="18 17 13 12 18 7"></polyline>
                      </svg>
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`p-1 rounded ${
                        currentPage === 1 
                          ? 'text-gray-500 cursor-not-allowed' 
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                      aria-label="Previous page"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                    
                    <div className="flex items-center mx-3 px-3 py-1 bg-gray-700 rounded">
                      <span className="text-sm text-gray-200">
                        Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{Math.max(1, Math.ceil(totalBlocks / itemsPerPage))}</span>
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= Math.ceil(totalBlocks / itemsPerPage)}
                      className={`p-1 rounded ${
                        currentPage >= Math.ceil(totalBlocks / itemsPerPage)
                          ? 'text-gray-500 cursor-not-allowed' 
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                      aria-label="Next page"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                    <button
                      onClick={() => handlePageChange(Math.ceil(totalBlocks / itemsPerPage))}
                      disabled={currentPage >= Math.ceil(totalBlocks / itemsPerPage)}
                      className={`p-1 rounded ${
                        currentPage >= Math.ceil(totalBlocks / itemsPerPage)
                          ? 'text-gray-500 cursor-not-allowed' 
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                      aria-label="Last page"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="13 17 18 12 13 7"></polyline>
                        <polyline points="6 17 11 12 6 7"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-300">Items per page:</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePerPageChange(10)}
                      className={`px-2 py-1 text-xs hover:cursor-pointer rounded ${itemsPerPage === 10 ? 'bg-blue-600 text-white' : ' text-gray-300 hover:bg-gray-700'}`}
                    >
                      10
                    </button>
                    <button
                      onClick={() => handlePerPageChange(25)}
                      className={`px-2 py-1 text-xs hover:cursor-pointer rounded ${itemsPerPage === 25 ? 'bg-blue-600 text-white' : ' text-gray-300 hover:bg-gray-700'}`}
                    >
                      25
                    </button>
                    <button
                      onClick={() => handlePerPageChange(50)}
                      className={`px-2 py-1 text-xs hover:cursor-pointer rounded ${itemsPerPage === 50 ? 'bg-blue-600 text-white' : ' text-gray-300 hover:bg-gray-700'}`}
                    >
                      50
                    </button>
                  </div>
                </div>
                
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
