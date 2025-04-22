import React from 'react';
import StatCard from './StatCard';
import { Database, Clock, Users, Layers, BarChart2, Cpu } from 'lucide-react';

interface HomeStatsProps {
  chainInfo: {
    chainId: string;
    blockHeight: number;
    blockTime: number;
    validatorCount: number;
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
      return parsedNum.toString();
    }
  };

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
      />
      
    </div>
  );
};

export default HomeStats;
