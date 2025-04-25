'use client';

import React from 'react';
import { ArrowLeft, Clock, Hash, User, DollarSign, FileText, Check, X } from 'lucide-react';
import { formatDate } from '../utils/format';

interface TransactionDetailViewProps {
  transaction: {
    hash: string;
    height: string;
    time?: string;
    timestamp?: string; // Added to support API response format
    from?: string;
    to?: string;
    amount?: string;
    fee?: string;
    status?: string;
    tx_result?: {
      code: number;
      log: string;
      gas_used: string;
      gas_wanted: string;
    };
  };
  onBack: () => void;
}

const TransactionDetailView: React.FC<TransactionDetailViewProps> = ({ transaction, onBack }) => {
  const isSuccess = transaction.status === 'success' || 
                   (transaction.tx_result?.code === 0);
                   
  return (
    <div className="bg-gray-900 rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-blue-500 hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Transactions
          </button>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-6">Transaction Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center text-gray-400 mb-1">
                <Hash className="h-4 w-4 mr-2" />
                <span>Transaction Hash</span>
              </div>
              <p className="text-white break-all font-mono text-sm">{transaction.hash}</p>
            </div>
            
            <div>
              <div className="flex items-center text-gray-400 mb-1">
                <Clock className="h-4 w-4 mr-2" />
                <span>Time</span>
              </div>
              <p className="text-white">{formatDate(transaction.time || transaction.timestamp || '')}</p>
            </div>
            
            <div>
              <div className="flex items-center text-gray-400 mb-1">
                <span className="mr-2">#</span>
                <span>Block</span>
              </div>
              <p className="text-white">{transaction.height}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center text-gray-400 mb-1">
                <span className="mr-2">Status</span>
              </div>
              <div className="flex items-center">
                {isSuccess ? (
                  <span className="flex items-center px-3 py-1 rounded-full bg-green-900 text-green-300">
                    <Check className="h-4 w-4 mr-1" />
                    Success
                  </span>
                ) : (
                  <span className="flex items-center px-3 py-1 rounded-full bg-red-900 text-red-300">
                    <X className="h-4 w-4 mr-1" />
                    Failed
                  </span>
                )}
              </div>
            </div>
            
            {transaction.fee && (
              <div>
                <div className="flex items-center text-gray-400 mb-1">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span>Fee</span>
                </div>
                <p className="text-white">{transaction.fee}</p>
              </div>
            )}
            
            {transaction.tx_result?.gas_used && (
              <div>
                <div className="flex items-center text-gray-400 mb-1">
                  <span className="mr-2">Gas</span>
                </div>
                <p className="text-white">
                  {transaction.tx_result.gas_used} / {transaction.tx_result.gas_wanted || 'unknown'}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-6 mt-6">
          <h3 className="text-xl font-semibold text-white mb-4">Transaction Data</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {transaction.from && (
              <div>
                <div className="flex items-center text-gray-400 mb-1">
                  <User className="h-4 w-4 mr-2" />
                  <span>From</span>
                </div>
                <p className="text-white break-all font-mono text-sm">{transaction.from}</p>
              </div>
            )}
            
            {transaction.to && (
              <div>
                <div className="flex items-center text-gray-400 mb-1">
                  <User className="h-4 w-4 mr-2" />
                  <span>To</span>
                </div>
                <p className="text-white break-all font-mono text-sm">{transaction.to}</p>
              </div>
            )}
          </div>
          
          {transaction.amount && (
            <div className="mt-4">
              <div className="flex items-center text-gray-400 mb-1">
                <DollarSign className="h-4 w-4 mr-2" />
                <span>Amount</span>
              </div>
              <p className="text-white">{transaction.amount}</p>
            </div>
          )}
          
          {transaction.tx_result?.log && (
            <div className="mt-6">
              <div className="flex items-center text-gray-400 mb-1">
                <FileText className="h-4 w-4 mr-2" />
                <span>Log</span>
              </div>
              <div className="bg-gray-800 p-4 rounded-md overflow-auto">
                <pre className="text-gray-300 text-sm whitespace-pre-wrap">{transaction.tx_result.log}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailView;
