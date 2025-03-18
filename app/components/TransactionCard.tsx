import React from 'react';
import Link from 'next/link';
import { formatDate, truncateString } from '../utils/format';
import HashDisplay from './HashDisplay';

interface TransactionCardProps {
  hash: string;
  time: string;
  status: 'success' | 'failed';
  from?: string;
  to?: string;
  blockHeight?: number;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ 
  hash, 
  time, 
  status, 
  from, 
  to,
  blockHeight
}) => {
  // Ensure hash is a string and handle potential undefined/null values
  const hashString = hash ? String(hash).toLowerCase() : 'Unknown';
  
  // Check if the hash is already in the correct format (32 bytes / 64 characters)
  // If not, it might be the full transaction data instead of just the hash
  const isCorrectHashFormat = /^[0-9a-f]{64}$/.test(hashString);
  
  // If the hash is not in the correct format and is very long, it might be the full transaction
  // In this case, we'll use a hash of the first 32 bytes as a fallback
  const displayHash = isCorrectHashFormat ? hashString : 
    (hashString.length > 128 ? hashString.substring(0, 64) : hashString);
  
  const safeTime = time || new Date().toISOString();
  const safeStatus = status || 'success';
  const safeFrom = from || '';
  const safeTo = to || '';
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <Link 
            href={`/tx/${encodeURIComponent(displayHash)}`} 
            className="text-blue-600 hover:text-blue-800 text-lg font-semibold"
          >
            <HashDisplay hash={displayHash} truncateLength={10} showCopyButton={true} />
          </Link>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {formatDate(safeTime)}
          </p>
          {blockHeight && (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Block: <Link href={`/blocks/${blockHeight}`} className="text-blue-600 hover:text-blue-800">
                {blockHeight}
              </Link>
            </p>
          )}
        </div>
        <div className={`px-3 py-1 rounded-full text-sm ${
          safeStatus === 'success' 
            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
        }`}>
          {safeStatus === 'success' ? 'Success' : 'Failed'}
        </div>
      </div>
      
      {(safeFrom || safeTo) && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {safeFrom && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">From</p>
              <p className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
                {truncateString(safeFrom, 16)}
              </p>
            </div>
          )}
          {safeTo && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">To</p>
              <p className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
                {truncateString(safeTo, 16)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionCard;
