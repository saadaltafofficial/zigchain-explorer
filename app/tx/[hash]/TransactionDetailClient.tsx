'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchTransactionByHash } from '../../utils/transactionFetcher';
import TransactionDetailView from '../../components/TransactionDetailView';
import Link from 'next/link';
import { formatDate } from '../../utils/format';
import HashDisplay from '../../components/HashDisplay';
import { decodeTransaction } from '../../utils/transactionDecoder';

export default function TransactionDetailClient() {
  const params = useParams();
  const hashParam = params.hash;
  // Convert to string if it's an array
  const hash = Array.isArray(hashParam) ? hashParam[0] : hashParam;
  
  const router = useRouter();
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [referrer, setReferrer] = useState<string>('/');

  useEffect(() => {
    // Get the referrer from document.referrer or sessionStorage
    if (typeof window !== 'undefined') {
      const savedReferrer = sessionStorage.getItem('txReferrer');
      
      if (savedReferrer) {
        setReferrer(savedReferrer);
      } else if (document.referrer) {
        const url = new URL(document.referrer);
        // Only use the referrer if it's from the same origin
        if (url.origin === window.location.origin) {
          const path = url.pathname;
          setReferrer(path);
          // Save it for future use
          sessionStorage.setItem('txReferrer', path);
        }
      }
    }
  }, []);

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!hash) {
        setError('Transaction hash is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const txData = await fetchTransactionByHash(hash.toString());
        
        if (!txData) {
          setError('Transaction not found');
        } else {
          setTransaction(txData);
        }
      } catch (err: any) {
        console.error('Error fetching transaction:', err);
        setError(err.message || 'Failed to load transaction details');
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [hash]);

  const handleBack = () => {
    // Navigate back to the referrer page
    router.push(referrer);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {loading && (
        <div className="flex justify-center items-center py-20 bg-gray-900 rounded-lg shadow-md">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-300">Loading transaction details...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-900 text-red-100 p-4 rounded-lg shadow-md">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
          <div className="mt-4">
            <button 
              onClick={handleBack}
              className="bg-white text-red-600 px-4 py-2 rounded-md hover:bg-red-50"
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      {!loading && !error && transaction && (
        <TransactionDetailView 
          transaction={transaction} 
          onBack={handleBack}
        />
      )}
    </div>
  );
}
