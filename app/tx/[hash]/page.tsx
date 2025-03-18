'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDate } from '@/app/utils/format';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { decodeTransaction } from '@/app/utils/transactionDecoder';
import { fromBase64 } from "@cosmjs/encoding";

// RPC endpoint
const RPC_ENDPOINT = 'http://localhost:26657';

interface TransactionDetailPageProps {
  params: {
    hash: string;
  };
}

export default function TransactionDetailPage({ params }: TransactionDetailPageProps) {
  // Decode the URL-encoded hash - this is the base64 encoded transaction
  const encodedTx = decodeURIComponent(params.hash);
  
  const [transaction, setTransaction] = useState<any>(null);
  const [decodedTx, setDecodedTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!encodedTx) {
        setError('Transaction data is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log(`Fetching transaction details for encoded data`);
        
        try {
          // Decode the transaction using the new decoder
          const decoded = decodeTransaction(encodedTx);
          setDecodedTx(decoded);
          console.log('Decoded transaction:', decoded);
          
          // Try to fetch the transaction from the blockchain
          const formattedHash = encodedTx.startsWith('0x') ? encodedTx.substring(2) : encodedTx;
          
          try {
            const response = await axios.get(`${RPC_ENDPOINT}/tx`, {
              params: {
                hash: `0x${formattedHash}`
              }
            });
            
            if (response.data && response.data.result) {
              const txData = response.data.result;
              setTransaction({
                hash: txData.hash,
                height: txData.height,
                tx: txData.tx,
                tx_result: txData.tx_result,
                time: txData.time,
                gasUsed: parseInt(txData.tx_result.gas_used || '0'),
                gasWanted: parseInt(txData.tx_result.gas_wanted || '0'),
                logs: txData.tx_result.log ? JSON.parse(txData.tx_result.log) : []
              });
            }
          } catch (txError) {
            console.warn('Could not fetch transaction from blockchain:', txError);
            // We still have the decoded transaction, so we can continue
          }
        } catch (e) {
          console.error('Error decoding transaction:', e);
          setError(`Failed to decode transaction: ${e instanceof Error ? e.message : String(e)}`);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error in transaction processing:', err);
        setError(`Error processing transaction: ${err instanceof Error ? err.message : String(err)}`);
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [encodedTx]);

  // Format timestamp from RFC3339 format
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid timestamp';
    }
  };

  // Render transaction status based on code
  const renderStatus = (code: number = 0) => {
    if (code === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Success
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Failed (Code: {code})
        </span>
      );
    }
  };

  // Helper function to display transaction type in a user-friendly way
  const renderTransactionType = (type: string) => {
    if (!type) return 'Unknown';
    
    // If it's a very long string, it's likely not a proper type
    if (type.length > 100) {
      return (
        <div>
          <span className="font-medium">Unknown Transaction Type</span>
          <p className="text-xs text-gray-500 mt-1">
            The transaction type could not be properly decoded.
          </p>
        </div>
      );
    }
    
    return type;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/transactions" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Transactions
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">Transaction Details</h1>
      
      {loading ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-8">
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
            </div>
            <p className="mt-4 text-gray-600">Loading transaction details...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Transaction</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <Link href="/transactions" className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                    Return to Transactions
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {/* Transaction Header */}
          <div className="px-4 py-5 sm:px-6 bg-gray-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Transaction Hash
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 break-all">
              {transaction?.hash || 'Unknown'}
            </p>
          </div>
          
          {/* Transaction Details */}
          <div className="border-t border-gray-200">
            <dl>
              {transaction && (
                <>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Block</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <Link href={`/block/${transaction.height}`} className="text-blue-600 hover:text-blue-800">
                        {transaction.height}
                      </Link>
                    </dd>
                  </div>
                  
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Time</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {formatTimestamp(transaction.time)}
                    </dd>
                  </div>
                  
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {renderStatus(transaction.tx_result?.code)}
                    </dd>
                  </div>
                  
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Gas (Used / Wanted)</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {transaction.gasUsed} / {transaction.gasWanted}
                    </dd>
                  </div>
                </>
              )}
              
              {/* Decoded Transaction */}
              {decodedTx && (
                <>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Transaction Type</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 break-all">
                      {renderTransactionType(decodedTx.type)}
                    </dd>
                  </div>
                  
                  {decodedTx.sender && (
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Sender</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 break-all">
                        <Link href={`/account/${decodedTx.sender}`} className="text-blue-600 hover:text-blue-800">
                          {decodedTx.sender}
                        </Link>
                      </dd>
                    </div>
                  )}
                  
                  {decodedTx.recipient && (
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Recipient</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 break-all">
                        <Link href={`/account/${decodedTx.recipient}`} className="text-blue-600 hover:text-blue-800">
                          {decodedTx.recipient}
                        </Link>
                      </dd>
                    </div>
                  )}
                  
                  {decodedTx.amount && (
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Amount</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {decodedTx.amount} {decodedTx.denom}
                      </dd>
                    </div>
                  )}
                  
                  {decodedTx.validators && decodedTx.validators.length > 0 && (
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Validators</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                          {decodedTx.validators.map((validator: string, index: number) => (
                            <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                              <div className="w-0 flex-1 flex items-center break-all">
                                <Link href={`/validator/${validator}`} className="text-blue-600 hover:text-blue-800">
                                  {validator}
                                </Link>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  )}
                  
                  {decodedTx.publicKey && (
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Public Key</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 break-all">
                        {decodedTx.publicKey}
                      </dd>
                    </div>
                  )}
                </>
              )}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
