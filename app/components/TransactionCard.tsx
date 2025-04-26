import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDate, truncateString } from '../utils/format';
import HashDisplay from './HashDisplay';
import { CheckCircle, XCircle, Database, ArrowRight, Clock, Hash, User } from 'lucide-react';
import { getTransactionBlockHeight } from '../services/apiClient';

// Format time to "X seconds/minutes/hours ago" format to match BlockCard
const formatTimeAgo = (time: string | number): string => {
  if (!time) return 'Unknown';
  
  const txTime = typeof time === 'string' ? new Date(time) : new Date(time);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - txTime.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  } else {
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  }
};

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
  // State for the actual block height (fetched from RPC if needed)
  const [actualBlockHeight, setActualBlockHeight] = useState<string | null>(blockHeight?.toString() || null);
  const [isLoadingHeight, setIsLoadingHeight] = useState(false);

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
  
  // Fetch block height from RPC if not provided or is zero
  useEffect(() => {
    const fetchBlockHeight = async () => {
      // Only fetch if we have a valid hash and no valid height yet
      if (displayHash && (!actualBlockHeight || actualBlockHeight === '0')) {
        try {
          setIsLoadingHeight(true);
          const height = await getTransactionBlockHeight(displayHash);
          if (height) {
            setActualBlockHeight(height);
          }
        } catch (error) {
          console.error('Error fetching block height:', error);
        } finally {
          setIsLoadingHeight(false);
        }
      }
    };
    
    fetchBlockHeight();
  }, [displayHash, actualBlockHeight]);
  
  // Set the referrer when clicking on a transaction
  const setReferrer = () => {
    if (typeof window !== 'undefined') {
      // Get the current path
      const currentPath = window.location.pathname;
      sessionStorage.setItem('txReferrer', currentPath);
    }
  };
  
  return (
    <div className="px-6 py-3.5 hover:bg-gray-700/30 transition-colors">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex items-center">
          <div className="mr-3 bg-green-50 dark:bg-green-900/20 rounded-full">
            <Hash size={18} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <Link 
              href={`/tx/${encodeURIComponent(displayHash)}`} 
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors text-lg font-semibold"
              onClick={setReferrer}
            >
              <span className="truncate max-w-[220px] inline-block">
                {displayUppercaseHash.length > 16 ? 
                  `${displayUppercaseHash.substring(0, 8)}...${displayUppercaseHash.substring(displayUppercaseHash.length - 8)}` : 
                  displayUppercaseHash}
              </span>
            </Link>
            <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm ">
              <Clock size={14} className="mr-1" />     
              <span>Just now</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          {safeStatus === 'success' ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              Success
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
              <XCircle className="h-3 w-3 mr-1" />
              Failed
            </span>
          )}
          
          {isLoadingHeight ? (
            <div className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
              <Database className="h-3 w-3 mr-1" />
              <span>Loading block...</span>
            </div>
          ) : actualBlockHeight && actualBlockHeight !== '0' ? (
            <div className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
              <Database className="h-3 w-3 mr-1" />
              <span>Block: {actualBlockHeight}</span>
            </div>
          ) : null}
          
          
        </div>
      </div>
      
      {/* From and To details removed as requested */}
    </div>
  );
};

export default TransactionCard;
