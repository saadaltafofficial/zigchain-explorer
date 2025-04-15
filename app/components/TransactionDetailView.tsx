import React, { useState } from 'react';
import Link from 'next/link';
import { Copy, Check } from 'lucide-react';
import { Transaction } from '../utils/transactionFetcher';

interface TransactionDetailViewProps {
  transaction: Transaction;
  onBack?: () => void;
}

const TransactionDetailView: React.FC<TransactionDetailViewProps> = ({ 
  transaction, 
  onBack 
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const copyToClipboard = async (text: string, setCopied: (copied: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);

    return (
      <button
        onClick={() => copyToClipboard(text, setCopied)}
        className="text-gray-500 hover:text-blue-500 transition-colors"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    );
  };

  // Calculate gas efficiency
  const gasEfficiency = transaction.tx_result.gas_wanted && transaction.tx_result.gas_used
    ? Math.round((parseInt(transaction.tx_result.gas_used) / parseInt(transaction.tx_result.gas_wanted)) * 10000) / 100
    : 0;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gray-800 dark:bg-gray-700 text-white px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Transaction Detail</h2>
        <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md ml-auto">Inspect Tx</button>
      </div>
      <div className="p-6 dark:text-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {/* Signature / Hash */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Signature</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">SUCCESS</span>
                <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Finalized</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-sm break-all">
                <span>{transaction.hash}</span>
                <CopyButton text={transaction.hash} />
              </div>
            </div>
            {/* Block & Timestamp */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Block:</span>
              <Link href={`/blocks/${transaction.height}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-mono">{transaction.height}</Link>
              <span className="mx-2">|</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(transaction.time)}</span>
            </div>
            {/* Result & Signer */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">Signer:</span>
              <span className="font-mono text-xs text-blue-700 dark:text-blue-300">{transaction.from || 'N/A'}</span>
              {transaction.from && <CopyButton text={transaction.from} />}
            </div>
            {/* Sponsored (placeholder) */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">Sponsored:</span>
              <span className="text-xs font-mono text-gray-700 dark:text-gray-300">-</span>
            </div>
            {/* Fee, Priority Fee, Compute Units, Tx Version */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Fee (Gas Used)</span>
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span>{transaction.tx_result && transaction.tx_result.gas_used ? `${parseInt(transaction.tx_result.gas_used)} gas` : 'N/A'}</span>
                </div>
              </div>
            </div>
            {/* Notes (editable) */}
            <div className="mt-4">
              <span className="text-xs text-gray-500 dark:text-gray-400">Your Notes</span>
              <textarea className="w-full mt-1 p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 resize-none" rows={2} placeholder="Add your notes here..." />
            </div>
          </div>
          {/* Technical Data Section */}
          <div className="mt-8 md:mt-0">
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Raw Transaction Data</h3>
              <pre className="text-xs text-gray-800 dark:text-gray-300 font-mono whitespace-pre-wrap break-all">
                {transaction.tx}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailView;
