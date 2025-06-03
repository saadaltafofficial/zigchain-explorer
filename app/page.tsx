import React from 'react';
import { getLatestBlocks, getLatestTransactions, getChainInfo } from './services/api';
import HomeWrapper from './HomeWrapper';

// Define types for the state
interface Block {
  height: number;
  hash: string;
  time: string;
  proposer: string;
  numTxs: number;
}

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

// Server component - fetches data on the server
export default async function Home() {
  // Initialize state for error handling
  let error: string | null = null;
  let latestBlocks: Block[] = [];
  let latestTransactions: Transaction[] = [];
  let chainInfo: ChainInfo | null = null;
  let loading = false;


  try {
    // Fetch data in parallel for better performance
    const [blocksPromise, transactionsPromise, chainInfoPromise] = await Promise.allSettled([
      getLatestBlocks(5),
      getLatestTransactions(5),
      getChainInfo()
    ]);

    // Handle blocks result
    if (blocksPromise.status === 'fulfilled' && blocksPromise.value) {
      latestBlocks = blocksPromise.value;
    }

    // Handle transactions result
    if (transactionsPromise.status === 'fulfilled' && transactionsPromise.value) {
      latestTransactions = transactionsPromise.value;
    }

    // Handle chain info result
    if (chainInfoPromise.status === 'fulfilled' && chainInfoPromise.value) {
      chainInfo = chainInfoPromise.value;
    }

    // Check if we have any data
    if (latestBlocks.length === 0 && latestTransactions.length === 0 && !chainInfo) {
      error = 'Failed to load blockchain data. Please try again.';
      loading = false;
    }
    console.log("latestBlocks", latestBlocks, "latestTransactions", latestTransactions, "chainInfo", chainInfo);
  } catch (err) {
    console.error('Error fetching data:', err);
    error = err instanceof Error ? err.message : 'Failed to load blockchain data. Please try again.';
    loading = false;


  }


  // We can't pass function props from server components to client components
  // The client component will handle retries internally

  // Render the client component with all the data
  return (
    <HomeWrapper
      chainInfo={chainInfo}
      latestBlocks={latestBlocks}
      latestTransactions={latestTransactions}
      loading={loading}
      error={error}
    />
  );
}


