import React from 'react';
import Link from 'next/link';
import { getAccountBalance, getAddressTransactions } from '../../services/api';
import { formatTokenAmount, formatDate } from '../../utils/format';

interface AddressDetailPageProps {
  params: {
    address: string;
  };
}

export default async function AddressDetailPage({ params }: AddressDetailPageProps) {
  // Ensure params is properly awaited before destructuring
  const address = params?.address;
  
  let balances: any[] = [];
  let transactions: any[] = [];
  let error: string | null = null;
  
  try {
    // Fetch both balances and transactions in parallel
    const [balanceData, txData] = await Promise.all([
      getAccountBalance(address),
      getAddressTransactions(address)
    ]);
    
    // Convert readonly array to mutable array
    balances = [...balanceData];
    transactions = [...txData];
  } catch (err) {
    console.error(`Error fetching data for address ${address}:`, err);
    error = `Failed to load data for address ${address}. Please try again later.`;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          ← Back to Home
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-2">Address Details</h1>
      <p className="text-gray-500 dark:text-gray-400 break-all mb-6">{address}</p>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Balances</h2>
        
        {balances.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Denom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {balances.map((balance, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {balance.denom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatTokenAmount(balance.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No balances found for this address.</p>
        )}
      </div>
      
      {/* Transaction History Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
        
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tx Hash
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Block
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.map((tx, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/tx/${encodeURIComponent(tx.hash)}`} className="text-blue-600 hover:text-blue-800">
                        {tx.hash.substring(0, 10)}...
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <Link href={`/blocks/${tx.height}`} className="text-blue-600 hover:text-blue-800">
                        {tx.height}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(tx.time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${tx.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {tx.success ? 'Success' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No transactions found for this address.</p>
        )}
      </div>
    </div>
  );
}
