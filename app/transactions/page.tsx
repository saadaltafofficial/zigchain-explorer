'use client';

import React, { useEffect, useState } from 'react';
import { getLatestBlocks, getBlockByHeight } from '../services/api';
import TransactionCard from '../components/TransactionCard';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching transactions for transactions page...');
      
      // We'll get transactions from the latest blocks
      const blocks = await getLatestBlocks(5);
      console.log(`Received ${blocks.length} blocks to extract transactions from`);
      
      // Extract transactions from blocks
      const txs: any[] = [];
      for (const block of blocks) {
        if (block.txCount > 0) {
          try {
            // For blocks with transactions, fetch the full block to get transaction details
            console.log(`Fetching full block at height ${block.height} with ${block.txCount} transactions`);
            const fullBlock = await getBlockByHeight(block.height);
            
            // For each transaction in the block, create a transaction object
            if (fullBlock.transactions && fullBlock.transactions.length > 0) {
              console.log(`Processing ${fullBlock.transactions.length} transactions from block ${block.height}`);
              for (let i = 0; i <fullBlock.transactions.length; i++) {
                txs.push({
                  hash: fullBlock.transactions[i],
                  time: block.time,
                  status: 'success',
                  blockHeight: block.height
                });
              }
            }
          } catch (blockError) {
            console.error(`Error fetching block ${block.height}:`, blockError);
            // Continue with other blocks even if one fails
          }
        }
      }
      
      console.log(`Found a total of ${txs.length} transactions`);
      setTransactions(txs);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to load transactions. Please try again later.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleRetry = () => {
    fetchTransactions();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Latest Transactions</h1>
      
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
      ) : transactions.length > 0 ? (
        <div className="space-y-4">
          {transactions.map((tx, index) => (
            <TransactionCard 
              key={index}
              hash={tx.hash}
              time={tx.time}
              status={tx.status}
            />
          ))}
        </div>
      ) : (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p className="font-bold">No Transactions Found</p>
          <p>
            No transactions found in the latest blocks. This could be because your node is still syncing,
            there are connection issues, or there simply haven't been any transactions recently.
          </p>
        </div>
      )}
    </div>
  );
}
