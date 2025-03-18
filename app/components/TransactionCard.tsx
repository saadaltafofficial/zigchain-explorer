import React from 'react';
import Link from 'next/link';
import { formatDate, truncateString } from '../utils/format';

interface TransactionCardProps {
  hash: string;
  time: string;
  status: 'success' | 'failed';
  from?: string;
  to?: string;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ 
  hash, 
  time, 
  status, 
  from, 
  to 
}) => {
  // Ensure hash is a string and handle potential undefined/null values
  const hashString = hash ? String(hash) : 'Unknown';
  const safeTime = time || new Date().toISOString();
  const safeStatus = status || 'success';
  const safeFrom = from || '';
  const safeTo = to || '';
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <Link href={`/tx/${encodeURIComponent(hashString)}`} className="text-blue-600 hover:text-blue-800 text-lg font-semibold">
            {truncateString(hashString, 10, 10)}
          </Link>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {formatDate(safeTime)}
          </p>
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
        <div className="mt-3 space-y-1">
          {safeFrom && (
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              <span className="font-medium">From:</span>{' '}
              <Link href={`/address/${safeFrom}`} className="text-blue-600 hover:text-blue-800">
                {truncateString(safeFrom, 8, 8)}
              </Link>
            </p>
          )}
          {safeTo && (
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              <span className="font-medium">To:</span>{' '}
              <Link href={`/address/${safeTo}`} className="text-blue-600 hover:text-blue-800">
                {truncateString(safeTo, 8, 8)}
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionCard;
