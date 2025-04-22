import React from 'react';
import { decodeTransaction } from '../utils/transactionDecoder';
import HashDisplay from './HashDisplay';
import Link from 'next/link';

interface TransactionDetailsProps {
  txHash: string;
  txData: string;
  timestamp?: string;
  blockHeight?: number;
}

const TransactionDetails: React.FC<TransactionDetailsProps> = ({
  txHash,
  txData,
  timestamp,
  blockHeight,
}) => {
  // Decode the transaction - ensure txData is a string
  const safeData = typeof txData === 'string' ? txData : JSON.stringify(txData);
  const decodedTx = decodeTransaction(safeData);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Transaction Details</h2>
        {timestamp && (
          <p className="text-gray-600 dark:text-gray-400">
            {new Date(timestamp).toLocaleString()}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-gray-200">Transaction Hash</h3>
          <HashDisplay hash={txHash} truncateLength={0} showCopyButton={true} />
        </div>

        {blockHeight && (
          <div>
            <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-gray-200">Block Height</h3>
            <Link href={`/blocks/${blockHeight}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
              {blockHeight}
            </Link>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-gray-200">Transaction Type</h3>
          <p className="text-gray-700 dark:text-gray-300">{decodedTx.type}</p>
        </div>

        {decodedTx.sender && (
          <div>
            <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-gray-200">From</h3>
            <span title="Address details coming soon" className="text-blue-600 dark:text-blue-400 cursor-not-allowed">
              <HashDisplay hash={decodedTx.sender} truncateLength={12} showCopyButton={true} />
            </span>
          </div>
        )}

        {decodedTx.recipient && (
          <div>
            <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-gray-200">To</h3>
            <span title="Address details coming soon" className="text-blue-600 dark:text-blue-400 cursor-not-allowed">
              <HashDisplay hash={decodedTx.recipient} truncateLength={12} showCopyButton={true} />
            </span>
          </div>
        )}

        {decodedTx.amount && decodedTx.denom && (
          <div>
            <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-gray-200">Amount</h3>
            <p className="text-gray-700 dark:text-gray-300">
              {decodedTx.amount} {decodedTx.denom}
            </p>
          </div>
        )}

        {decodedTx.delegator && (
          <div>
            <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-gray-200">Delegator</h3>
            <span title="Address details coming soon" className="text-blue-600 dark:text-blue-400 cursor-not-allowed">
              <HashDisplay hash={decodedTx.delegator} truncateLength={12} showCopyButton={true} />
            </span>
          </div>
        )}

        {decodedTx.validators && decodedTx.validators.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-gray-200">Validators</h3>
            <div className="space-y-2">
              {decodedTx.validators.map((validator, index) => (
                <Link key={index} href={`/validators/${validator}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 block">
                  <HashDisplay hash={validator} truncateLength={12} showCopyButton={true} />
                </Link>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-gray-200">Raw Transaction Data</h3>
          <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
            <pre className="text-xs text-gray-800 dark:text-gray-300 font-mono break-all whitespace-pre-wrap">
              {decodedTx.rawData}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetails;
