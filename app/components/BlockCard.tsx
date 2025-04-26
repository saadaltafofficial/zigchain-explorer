import React from 'react';
import Link from 'next/link';
import { formatNumber } from '../utils/format';
import { Clock, Database, Hash } from 'lucide-react';

interface BlockCardProps {
  height: number;
  hash: string;
  time: string;
  txCount: number;
}

const BlockCard: React.FC<BlockCardProps> = ({ height, hash, time, txCount }) => {
  // Ensure we have valid values
  const safeHeight = height || 0;
  const safeHash = hash || 'Unknown';
  const safeTime = time || new Date().toISOString();
  const safeTxCount = txCount || 0;
  
  // Debug the timestamp format
  console.log(`Block #${height} timestamp:`, time);

  return (
    <div className="px-4 py-3 sm:px-6 sm:py-4 bg-[#1e2939] hover:bg-gray-700/30 transition-colors rounded-lg">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center">
          <div className="mr-2 sm:mr-3 p-1.5 sm:p-2 bg-blue-900/20 rounded-full">
            <Database size={16} className="text-blue-400" />
          </div>
          <div>
            <Link 
              href={`/blocks/${safeHeight}`} 
              className="text-blue-400 hover:text-blue-300 text-base sm:text-lg font-semibold transition-colors"
            >
              Block #{formatNumber(safeHeight)}
            </Link>
            <div className="flex items-center text-gray-400 text-xs sm:text-sm mt-0.5 sm:mt-1">
              <Clock size={12} className="mr-1" />
              <span>Just now</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <Hash size={16} className="mr-1 text-gray-400 dark:text-gray-500" />
            <span className="truncate max-w-[150px]">
              {safeHash.length > 16 ? `${safeHash.substring(0, 8)}...${safeHash.substring(safeHash.length - 8)}` : safeHash}
            </span>
          </div>
          
          <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-medium">
            {safeTxCount} {safeTxCount === 1 ? 'Tx' : 'Txs'}
          </div>
          
          
        </div>
      </div>
    </div>
  );
};

export default BlockCard;
