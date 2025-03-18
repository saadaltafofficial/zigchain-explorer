'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import TransactionCard from '../components/TransactionCard';

// RPC endpoint
const RPC_ENDPOINT = 'http://localhost:26657';

interface Transaction {
  hash: string;
  height: number;
  time: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching latest block height...');
      
      // Step 1: Get the latest block height
      const statusResponse = await axios.get(`${RPC_ENDPOINT}/status`);
      if (!statusResponse.data || !statusResponse.data.result || !statusResponse.data.result.sync_info) {
        throw new Error('Failed to fetch blockchain status');
      }
      
      const latestHeight = parseInt(statusResponse.data.result.sync_info.latest_block_height);
      const minHeight = Math.max(1, latestHeight - 500); // Get last 500 blocks or all if less than 500
      
      console.log(`Fetching blocks from height ${minHeight} to ${latestHeight}`);
      
      // Step 2: Get the block range
      const blockchainResponse = await axios.get(`${RPC_ENDPOINT}/blockchain`, {
        params: {
          minHeight: minHeight,
          maxHeight: latestHeight
        }
      });
      
      if (!blockchainResponse.data || !blockchainResponse.data.result || !blockchainResponse.data.result.block_metas) {
        throw new Error('Invalid blockchain data format');
      }
      
      const blockMetas = blockchainResponse.data.result.block_metas;
      console.log(`Received ${blockMetas.length} blocks from blockchain API`);
      
      // Step 3: Filter blocks with transactions
      const blocksWithTxs = blockMetas.filter((blockMeta: any) => 
        blockMeta.num_txs && parseInt(blockMeta.num_txs) > 0
      );
      
      console.log(`Found ${blocksWithTxs.length} blocks with transactions`);
      
      // Step 4: Fetch transaction details for blocks with transactions
      const txPromises = blocksWithTxs.map(async (blockMeta: any) => {
        const height = parseInt(blockMeta.header.height);
        
        try {
          // Get the block to get the raw transactions
          const blockResponse = await axios.get(`${RPC_ENDPOINT}/block`, {
            params: { height: height }
          });
          
          if (!blockResponse.data || !blockResponse.data.result || !blockResponse.data.result.block) {
            console.error(`Invalid block data for height ${height}`);
            return [];
          }
          
          const block = blockResponse.data.result.block;
          const txs = block.data.txs || [];
          const blockTime = blockMeta.header.time;
          
          // Map transactions to our format
          // Use the base64 encoded transaction data as the hash
          return txs.map((tx: string) => ({
            hash: tx,
            height: height,
            time: blockTime
          }));
        } catch (err) {
          console.error(`Error fetching transaction details for block ${height}:`, err);
          return [];
        }
      });
      
      // Wait for all transaction fetch promises to resolve
      const txArrays = await Promise.all(txPromises);
      
      // Flatten the array of arrays into a single array of transactions
      const allTransactions = txArrays.flat();
      
      console.log(`Loaded ${allTransactions.length} transactions`);
      setTransactions(allTransactions);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(`Failed to load transactions: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Latest Transactions</h1>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading transactions...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No transactions found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <div className="flex flex-col md:flex-row justify-between">
                <div className="mb-2 md:mb-0">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Transaction</div>
                  <Link href={`/tx/${encodeURIComponent(tx.hash)}`} className="text-blue-600 dark:text-blue-400 hover:underline break-all">
                    {tx.hash && tx.hash.length > 60 ? `${tx.hash.substring(0, 30)}...${tx.hash.substring(tx.hash.length - 30)}` : tx.hash || 'Unknown'}
                  </Link>
                </div>
                <div className="flex flex-col">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Block</div>
                  <Link href={`/blocks/${tx.height}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                    {tx.height}
                  </Link>
                </div>
                <div className="flex flex-col">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Time</div>
                  <div className="text-gray-700 dark:text-gray-300">
                    {tx.time ? new Date(tx.time).toLocaleString() : 'Unknown'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
