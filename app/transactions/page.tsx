'use client';

import React, { useEffect, useState } from 'react';
import { getLatestBlocks, getBlockByHeight } from '../services/api';
import TransactionCard from '../components/TransactionCard';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        // We'll get transactions from the latest blocks
        const blocks = await getLatestBlocks(5);
        
        // Extract transactions from blocks
        const txs: any[] = [];
        for (const block of blocks) {
          if (block.txCount > 0) {
            // For blocks with transactions, fetch the full block to get transaction details
            const fullBlock = await getBlockByHeight(block.height);
            
            // For each transaction in the block, create a transaction object
            if (fullBlock.transactions && fullBlock.transactions.length > 0) {
              for (let i = 0; i < fullBlock.transactions.length; i++) {
                txs.push({
                  hash: fullBlock.transactions[i],
                  time: block.time,
                  status: 'success',
                  blockHeight: block.height
                });
              }
            }
          }
        }
        
        setTransactions(txs);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transactions. Please try again later.');
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Latest Transactions</h1>
      
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No transactions found.</p>
        </div>
      )}
    </div>
  );
}
