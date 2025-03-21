import React from 'react';
import Link from 'next/link';
import { formatDate, truncateString } from '../utils/format';
import HashDisplay from './HashDisplay';
import { CheckCircle, XCircle, Database, ArrowRight } from 'lucide-react';

interface TransactionCardProps {
  hash: string;
  time: string;
  status: 'success' | 'failed';
  from?: string;
  to?: string;
  blockHeight?: string | number;
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
  
  // Convert to uppercase for display
  const displayUppercaseHash = displayHash.toUpperCase();
  
  const safeTime = time || new Date().toISOString();
  const safeStatus = status || 'success';
  const safeFrom = from || '';
  const safeTo = to || '';
  
  // Set the referrer when clicking on a transaction
  const setReferrer = () => {
    if (typeof window !== 'undefined') {
      // Get the current path
      const currentPath = window.location.pathname;
      sessionStorage.setItem('txReferrer', currentPath);
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div className="w-full">
          <Link 
            href={`/tx/${encodeURIComponent(displayHash)}`} 
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors text-lg font-semibold"
            onClick={setReferrer}
          >
            <HashDisplay hash={displayUppercaseHash} truncateLength={10} showCopyButton={false} />
          </Link>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{formatDate(safeTime)}</p>
        </div>
        <div className="flex-shrink-0 ml-2">
          {safeStatus === 'success' ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              Success
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
              <XCircle className="h-3 w-3 mr-1" />
              Failed
            </span>
          )}
          {blockHeight && (
            <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
              <Database className="h-4 w-4 mr-1" />
              <span>Block: {blockHeight}</span>
            </div>
          )}
        </div>
      </div>
      {(safeFrom || safeTo) && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-0">
              {(safeFrom || safeTo) && (
                <span className="inline-flex items-center flex-wrap">
                  <ArrowRight className="h-4 w-4 mr-1" />
                  <span>
                    {safeFrom && (
                      <span className="mr-2">From: {truncateString(safeFrom, 8)} </span>
                    )}
                    {safeTo && (
                      <span>To: {truncateString(safeTo, 8)}</span>
                    )}
                  </span>
                </span>
              )} 
            </div>
            <Link 
              href={`/tx/${encodeURIComponent(displayHash)}`}
              className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              onClick={setReferrer}
            >
              View Details
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionCard;
