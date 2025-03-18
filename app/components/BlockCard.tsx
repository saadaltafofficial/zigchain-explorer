import React from 'react';
import Link from 'next/link';
import { formatDate, formatNumber } from '../utils/format';

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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <Link href={`/blocks/${safeHeight}`} className="text-blue-600 hover:text-blue-800 text-lg font-semibold">
            Block #{formatNumber(safeHeight)}
          </Link>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {formatDate(safeTime)}
          </p>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
          {safeTxCount} {safeTxCount === 1 ? 'Tx' : 'Txs'}
        </div>
      </div>
      <div className="mt-3">
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          <span className="font-medium">Hash:</span> {safeHash.length > 20 ? `${safeHash.substring(0, 20)}...` : safeHash}
        </p>
      </div>
    </div>
  );
};

export default BlockCard;
