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
        {onBack && (
          <button
            onClick={onBack}
            className="bg-white text-blue-600 dark:bg-gray-800 dark:text-white px-4 py-2 rounded-md hover:bg-blue-50 dark:hover:bg-gray-600"
          >
            Back to List
          </button>
        )}
        {!onBack && (
          <Link
            href="/transactions"
            className="bg-white text-blue-600 dark:bg-gray-800 dark:text-white px-4 py-2 rounded-md hover:bg-blue-50 dark:hover:bg-gray-600"
          >
            Back to List
          </Link>
        )}
      </div>

      <div className="p-6 dark:text-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Transaction Hash</h3>
              <div className="mt-1 flex items-center">
                <p className="text-sm text-gray-900 dark:text-gray-200 break-all font-mono mr-2">
                  {transaction.hash}
                </p>
                <CopyButton text={transaction.hash} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Block Height</h3>
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-200">
                <Link href={`/blocks/${transaction.height}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                  {transaction.height}
                </Link>
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Time</h3>
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-200">{formatDate(transaction.time)}</p>
            </div>

            {transaction.from && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Sender Address</h3>
                <div className="mt-1 flex items-center">
                  <p className="text-sm text-gray-900 dark:text-gray-200 break-all font-mono mr-2">
                    {transaction.from}
                  </p>
                  <CopyButton text={transaction.from} />
                </div>
              </div>
            )}

            {transaction.to && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Receiver Address</h3>
                <div className="mt-1 flex items-center">
                  <p className="text-sm text-gray-900 dark:text-gray-200 break-all font-mono mr-2">
                    {transaction.to}
                  </p>
                  <CopyButton text={transaction.to} />
                </div>
              </div>
            )}

            {transaction.amount && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</h3>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-200">{transaction.amount}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Fee</h3>
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-200">
                {transaction.tx_result.gas_used ? `${parseInt(transaction.tx_result.gas_used)} gas` : 'Unknown'}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
              <p className={`mt-1 text-sm ${transaction.status === 'success' ? 'text-green-500' : 'text-red-500'} font-semibold`}>
                {transaction.status === 'success' ? 'Success' : 'Failed'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Gas Wanted</h3>
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-200">{transaction.tx_result.gas_wanted}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Gas Used</h3>
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-200">{transaction.tx_result.gas_used}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Gas Efficiency</h3>
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-200">{gasEfficiency}%</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Transaction Data</h3>
          <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto">
            <pre className="text-xs text-gray-800 dark:text-gray-300 font-mono whitespace-pre-wrap break-all">
              {transaction.tx}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailView;
