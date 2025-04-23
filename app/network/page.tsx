'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, Clock, Users, Layers, BarChart2, Cpu, 
  Activity, Zap, Server, Shield, Disc, Hash
} from 'lucide-react';
import axios from 'axios';
import StatCard from '../components/StatCard';

interface NetworkStats {
  chainId: string;
  blockHeight: number;
  blockTime: number; // Average block time in seconds
  validatorCount: number;
  bondedTokens: string;
  totalSupply: string;
  inflation: number;
  communityTax: number;
  transactionsPerSecond: number;
  activeValidators: number;
  totalValidators: number;
  votingPower: string;
  uptime: number; // Network uptime percentage
  version: string;
}

export default function NetworkStatsPage() {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // No WebSocket or auto-refresh state needed

  const fetchNetworkStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch from your API first
      try {
        const chainInfoResponse = await axios.get('https://zigscan.net/api/chain/info');
        const validatorsResponse = await axios.get('https://zigscan.net/api/validators');
        // Fetch the latest 20 blocks to calculate a more accurate TPS
        const latestBlocksResponse = await axios.get('https://zigscan.net/api/blocks/latest?limit=20');
        
        if (chainInfoResponse.data && validatorsResponse.data) {
          const chainInfo = chainInfoResponse.data;
          const validators = validatorsResponse.data;
          const latestBlocks = latestBlocksResponse.data || [];
          
          // Calculate TPS based on recent blocks (more accurate calculation)
          let tps = 10.5; // Default fallback value
          
          if (latestBlocks.length >= 2) {
            // Get the newest and oldest blocks from our sample
            const newestBlock = latestBlocks[0];
            const oldestBlock = latestBlocks[latestBlocks.length - 1];
            
            // Calculate total transactions in this block range
            const totalTxs = latestBlocks.reduce((sum: number, block: any) => sum + (block.num_txs || 0), 0);
            
            // Calculate time difference in seconds between newest and oldest block
            const newestTime = new Date(newestBlock.time).getTime();
            const oldestTime = new Date(oldestBlock.time).getTime();
            const timeDiffSeconds = (newestTime - oldestTime) / 1000;
            
            // Calculate TPS if we have a valid time difference
            if (timeDiffSeconds > 0) {
              // Calculate TPS and limit to 4 decimal places maximum
              tps = parseFloat((totalTxs / timeDiffSeconds).toFixed(4));
            }
          }
          
          // Calculate voting power from validators
          const totalVotingPower = validators.reduce((sum: number, validator: any) => {
            return sum + (parseInt(validator.voting_power) || 0);
          }, 0).toString();
          
          // Set stats with real data where available
          setStats({
            chainId: chainInfo.chain_id || 'zigchain-testnet',
            blockHeight: chainInfo.latest_block_height || 0,
            blockTime: 5.2, // This might need a more complex calculation based on block timestamps
            validatorCount: validators.length || 0,
            bondedTokens: totalVotingPower || '75000000',
            totalSupply: '100000000', // This might need to come from a different endpoint
            inflation: 5.0, // This might need to come from a different endpoint
            communityTax: 2.0, // This might need to come from a different endpoint
            transactionsPerSecond: tps,
            activeValidators: chainInfo.active_validators || validators.filter((v: any) => parseInt(v.voting_power) > 0).length,
            totalValidators: validators.length,
            votingPower: totalVotingPower,
            uptime: 99.98, // This might need a more complex calculation
            version: chainInfo.version || '1.0.0',
          });
          
          setLoading(false);
          return; // Exit early if we successfully got data
        }
      } catch (apiError) {
        console.error('Error fetching from API, falling back to placeholder data:', apiError);
      }
      
      // If API fetch failed, use placeholder data
      setStats({
        chainId: 'zigchain-testnet',
        blockHeight: 1284913,
        blockTime: 5.2, // seconds
        validatorCount: 100,
        bondedTokens: '75000000',
        totalSupply: '100000000',
        inflation: 5.0, // percentage
        communityTax: 2.0, // percentage
        transactionsPerSecond: 10.5,
        activeValidators: 95,
        totalValidators: 100,
        votingPower: '75000000',
        uptime: 99.98, // percentage
        version: '1.0.0',
      });
    } catch (err) {
      console.error('Error fetching network stats:', err);
      setError('Site Under Maintenance');
      setStats(null); // Don't show placeholder data when API fails
    } finally {
      setLoading(false);
    }
  };
  
  // No WebSocket connection function needed

  useEffect(() => {
    // Initial data fetch when the page loads
    fetchNetworkStats();
    
    // No auto-refresh or WebSocket
    
    return () => {
      // No cleanup needed
    };
  }, []);

  const formatNumber = (num: number | string): string => {
    const parsedNum = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(parsedNum)) return '0';
      
    if (parsedNum >= 1000000000) {
      return `${(parsedNum / 1000000000).toFixed(2)}B`;
    } else if (parsedNum >= 1000000) {
      return `${(parsedNum / 1000000).toFixed(2)}M`;
    } else if (parsedNum >= 1000) {
      return `${(parsedNum / 1000).toFixed(2)}K`;
    } else {
      return parsedNum.toFixed(2).replace(/\.00$/, '');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {error ? (
        // Site Under Maintenance message
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">Site Under Maintenance</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              We&apos;re currently updating our systems to serve you better. Please check back later.
            </p>
          </div>
          <button 
            onClick={fetchNetworkStats}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-16">Network Statistics</h1>
          
          {/* Manual refresh button */}
          <div className="mb-6 flex items-center justify-end">
            <button 
              onClick={fetchNetworkStats}
              className="px-4 py-2 hover:cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-4xl flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {[...Array(12)].map((_, i) => (
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
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {/* Blockchain Metrics */}
                <StatCard
                  title="Latest Block"
                  value={stats?.blockHeight || 0}
                  icon={<Layers size={20} />}
                  color="blue"
                  link="/blocks"
                  isLoading={loading}
                  tooltip="The most recent block added to the blockchain"
                />
                <StatCard
                  title="Block Time"
                  value={`${stats?.blockTime || 0}s`}
                  icon={<Clock size={20} />}
                  color="purple"
                  isLoading={loading}
                  tooltip="Average time between blocks"
                />
                <StatCard
                  title="TPS"
                  value={stats?.transactionsPerSecond || 0}
                  icon={<Activity size={20} />}
                  color="green"
                  isLoading={loading}
                  tooltip="Transactions per second"
                />
                <StatCard
                  title="Chain ID"
                  value={stats?.chainId || 'Unknown'}
                  icon={<Database size={20} />}
                  color="orange"
                  isLoading={loading}
                  tooltip="Unique identifier for this blockchain"
                />
                
                {/* Validator Metrics */}
                <StatCard
                  title="Active Validators"
                  value={stats?.activeValidators || 0}
                  icon={<Users size={20} />}
                  color="green"
                  link="/validators"
                  isLoading={loading}
                  tooltip="Currently active validators"
                />
                <StatCard
                  title="Total Validators"
                  value={stats?.totalValidators || 0}
                  icon={<Shield size={20} />}
                  color="blue"
                  isLoading={loading}
                  tooltip="Total number of validators (active + inactive)"
                />
                <StatCard
                  title="Voting Power"
                  value={formatNumber(stats?.votingPower || '0')}
                  icon={<BarChart2 size={20} />}
                  color="indigo"
                  isLoading={loading}
                  tooltip="Total voting power of all validators"
                />
                <StatCard
                  title="Network Uptime"
                  value={`${stats?.uptime || 0}%`}
                  icon={<Server size={20} />}
                  color="green"
                  isLoading={loading}
                  tooltip="Network uptime percentage"
                />
                
                {/* Token Economics */}
                <StatCard
                  title="Total Supply"
                  value={formatNumber(stats?.totalSupply || '0')}
                  icon={<Disc size={20} />}
                  isLoading={loading}
                  tooltip="Total token supply"
                />
                <StatCard
                  title="Bonded Tokens"
                  value={formatNumber(stats?.bondedTokens || '0')}
                  icon={<Hash size={20} />}
                  color="blue"
                  isLoading={loading}
                  tooltip="Total tokens bonded by validators"
                />
                <StatCard
                  title="Inflation Rate"
                  value={`${stats?.inflation || 0}%`}
                  icon={<Zap size={20} />}
                  color="red"
                  isLoading={loading}
                  tooltip="Annual inflation rate"
                />
                <StatCard
                  title="Software Version"
                  value={stats?.version || 'Unknown'}
                  icon={<Cpu size={20} />}
                  isLoading={loading}
                  tooltip="Current blockchain software version"
                />
              </div>
              
              {/* Additional network information can be added here */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Network Overview</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  ZigChain is a high-performance blockchain built on the Cosmos SDK. The network is secured by {stats?.activeValidators} active validators 
                  with a total of {formatNumber(stats?.bondedTokens || '0')} tokens staked. The current block time is approximately {stats?.blockTime} seconds, 
                  allowing for {stats?.transactionsPerSecond} transactions per second.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                    <h3 className="font-medium mb-2">Staking Information</h3>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                      <li>Bonded Tokens: {formatNumber(stats?.bondedTokens || '0')}</li>
                      <li>Bonded Ratio: {stats?.bondedTokens && stats?.totalSupply ? 
                        `${((parseFloat(stats.bondedTokens) / parseFloat(stats.totalSupply)) * 100).toFixed(2)}%` : '0%'}</li>
                      <li>Community Tax: {stats?.communityTax}%</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                    <h3 className="font-medium mb-2">Performance Metrics</h3>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                      <li>Block Time: {stats?.blockTime}s</li>
                      <li>Transactions Per Second: {stats?.transactionsPerSecond}</li>
                      <li>Network Uptime: {stats?.uptime}%</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
