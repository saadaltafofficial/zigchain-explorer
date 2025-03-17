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
  // Ensure hash is a string
  const hashString = String(hash);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <Link href={`/tx/${hashString}`} className="text-blue-600 hover:text-blue-800 text-lg font-semibold">
            {truncateString(hashString, 10, 10)}
          </Link>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {formatDate(time)}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm ${
          status === 'success' 
            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
        }`}>
          {status === 'success' ? 'Success' : 'Failed'}
        </div>
      </div>
      
      {(from || to) && (
        <div className="mt-3 space-y-1">
          {from && (
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              <span className="font-medium">From:</span>{' '}
              <Link href={`/address/${from}`} className="text-blue-600 hover:text-blue-800">
                {truncateString(from, 8, 8)}
              </Link>
            </p>
          )}
          {to && (
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              <span className="font-medium">To:</span>{' '}
              <Link href={`/address/${to}`} className="text-blue-600 hover:text-blue-800">
                {truncateString(to, 8, 8)}
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionCard;
