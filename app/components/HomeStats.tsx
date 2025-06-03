'use client';
import React from 'react';
import StatCard from './StatCard';
import { Database, Clock, Users, Layers, BarChart2, Cpu, Activity, Award } from 'lucide-react';

interface HomeStatsProps {
  chainInfo: {
    chainId: string;
    blockHeight: number;
    blockTime: number;
    validatorCount: number;
    activeValidators?: number;
    votingPower?: number;
    uptime?: number;
    transactionsPerSecond?: number;
    bondedTokens: string;
    nodeInfo?: {
      version: string;
    };
  } | null;
  isLoading: boolean;
}

const HomeStats: React.FC<HomeStatsProps> = ({ chainInfo, isLoading }) => {
  const formatNumber = (num: number | string): string => {
    const parsedNum = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(parsedNum)) return '0';
      
    if (parsedNum >= 1000000) {
      return `${(parsedNum / 1000000).toFixed(2)}M`;
    } else if (parsedNum >= 1000) {
      return `${(parsedNum / 1000).toFixed(2)}K`;
    } else {
      return parsedNum.toFixed(2).replace(/\.?0+$/, '');
    }
  };

  console.log('HomeStats rendering with chainInfo:', chainInfo);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      <StatCard
        title="Latest Block"
        value={isLoading ? '...' : chainInfo?.blockHeight || 0}
        icon={<Layers size={20} />}
        color="blue"
        link="/blocks"
        isLoading={isLoading}
        tooltip="The most recent block added to the blockchain"
      />
      <StatCard
        title="Validators"
        value={isLoading ? '...' : formatNumber(chainInfo?.validatorCount || 0)}
        icon={<Users size={20} />}
        color="green"
        link="/validators"
        isLoading={isLoading}
        tooltip="Active validators securing the network"
      />
      <StatCard
        title="Chain ID"
        value={isLoading ? '...' : chainInfo?.chainId || 'Unknown'}
        icon={<Database size={20} />}
        color="orange"
        isLoading={isLoading}
        tooltip="The unique identifier for this blockchain network"
      />
      {/* <StatCard
        title="TPS"
        value={isLoading ? '...' : formatNumber(chainInfo?.transactionsPerSecond || 0)}
        icon={<BarChart2 size={20} />}
        color="purple"
        isLoading={isLoading}
        tooltip="Transactions Per Second"
      />
      <StatCard
        title="Active Validators"
        value={isLoading ? '...' : formatNumber(chainInfo?.activeValidators || 0)}
        icon={<Award size={20} />}
        color="orange"
        isLoading={isLoading}
        tooltip="Number of active validators securing the network"
      />
      <StatCard
        title="Network Uptime"
        value={isLoading ? '...' : `${chainInfo?.uptime}%`}
        icon={<Activity size={20} />}
        color="green"
        isLoading={isLoading}
        tooltip="Network uptime percentage"
      /> */}
    </div>
  );
};

export default HomeStats;
