import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDate, truncateString } from '../utils/format';
import HashDisplay from './HashDisplay';
import { CheckCircle, XCircle, Database, ArrowRight, Clock, Hash, User } from 'lucide-react';
import { formatExplorerDate, getTransactionBlockHeight } from '../services/apiClient';
import { getBlockTime } from '../services/apiClient';

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
  
  
  const safeStatus = status || 'success';
  const safeFrom = from || '';6
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
    <div className="px-4 py-3 sm:px-6 sm:py-3.5 hover:bg-gray-700/30 transition-colors rounded-lg">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center">
          <div className="mr-2 sm:mr-3 p-1.5 sm:p-2 bg-green-900/20 rounded-full">
            <Hash size={16} className="text-green-400" />
          </div>
          <div>
            <Link 
              href={`/tx/${encodeURIComponent(displayHash)}`} 
              className="text-blue-400 hover:text-blue-300 transition-colors text-base sm:text-lg font-semibold"
              onClick={setReferrer}
            >
              <span className="truncate max-w-[180px] sm:max-w-[220px] inline-block">
                {displayUppercaseHash.length > 16 ? 
                  `${displayUppercaseHash.substring(0, 6)}...${displayUppercaseHash.substring(displayUppercaseHash.length - 6)}` : 
                  displayUppercaseHash}
              </span>
            </Link>
            <div className="flex items-center text-gray-400 text-xs sm:text-sm">
              <Clock size={12} className="mr-1" />     
              <span>{time.slice(17)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 sm:gap-3 items-center mt-2 sm:mt-0">
          {safeStatus === 'success' ? (
            <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              Success
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-red-900/30 text-red-300">
              <XCircle className="h-3 w-3 mr-1" />
              Failed
            </span>
          )}
          
          {isLoadingHeight ? (
            <div className="inline-flex items-center text-xs text-gray-400 bg-gray-800 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
              <Database className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Loading block...</span>
              <span className="sm:hidden">Loading...</span>
            </div>
          ) : actualBlockHeight && actualBlockHeight !== '0' ? (
            <div className="inline-flex items-center text-xs text-gray-400 bg-gray-800 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
              <Database className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Block: {actualBlockHeight}</span>
              <span className="sm:hidden">#{actualBlockHeight}</span>
            </div>
          ) : null}
          
          
        </div>
      </div>
      
      {/* From and To details removed as requested */}
    </div>
  );
};

export default TransactionCard;
