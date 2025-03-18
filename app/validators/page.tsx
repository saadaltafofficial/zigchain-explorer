'use client';

import React, { useEffect, useState } from 'react';
import { getValidators } from '../services/api';
import { truncateString } from '../utils/format';
import Link from 'next/link';

// Define the validator interface based on Cosmos SDK staking module
interface Validator {
  operator_address: string;
  consensus_pubkey: {
    '@type': string;
    key: string;
  };
  jailed: boolean;
  status: string;
  tokens: string;
  delegator_shares: string;
  description: {
    moniker: string;
    identity: string;
    website: string;
    security_contact: string;
    details: string;
  };
  unbonding_height: string;
  unbonding_time: string;
  commission: {
    commission_rates: {
      rate: string;
      max_rate: string;
      max_change_rate: string;
    };
    update_time: string;
  };
  min_self_delegation: string;
}

export default function ValidatorsPage() {
  const [validators, setValidators] = useState<Validator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchValidators = async () => {
      try {
        setLoading(true);
        console.log('Fetching validators...');
        const validatorsData = await getValidators();
        console.log('Validators data received:', validatorsData);
        
        if (!validatorsData || validatorsData.length === 0) {
          console.warn('No validators returned from API');
        }
        
        if (!Array.isArray(validatorsData)) {
          console.error('Expected array of validators but got:', typeof validatorsData);
          setError('Invalid validators data format received');
          setLoading(false);
          return;
        }
        
        setValidators(validatorsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching validators:', err);
        setError(`Failed to load validators: ${err instanceof Error ? err.message : String(err)}`);
        setLoading(false);
      }
    };

    fetchValidators();
  }, []);

  // Function to format token amounts
  const formatTokens = (tokens: string): string => {
    const tokenAmount = parseInt(tokens) / 1000000; // Convert from uzig to ZIG
    return tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 6 });
  };

  // Function to get status display
  const getStatusDisplay = (status: string): string => {
    switch (status) {
      case 'BOND_STATUS_BONDED':
        return 'Active';
      case 'BOND_STATUS_UNBONDING':
        return 'Unbonding';
      case 'BOND_STATUS_UNBONDED':
        return 'Unbonded';
      default:
        return status;
    }
  };

  // Function to get status class
  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'BOND_STATUS_BONDED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'BOND_STATUS_UNBONDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'BOND_STATUS_UNBONDED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Validators</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse">
          <div className="h-12 bg-gray-200 dark:bg-gray-700"></div>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700"></div>
          ))}
        </div>
      ) : validators.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Validator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Voting Power
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {validators.map((validator, index) => (
                  <tr 
                    key={validator.operator_address || index} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => window.location.href = `/validators/${encodeURIComponent(validator.operator_address)}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            <Link 
                              href={`/validators/${encodeURIComponent(validator.operator_address)}`}
                              className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              {validator.description?.moniker || 'Unknown'}
                            </Link>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {truncateString(validator.operator_address, 10, 10)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatTokens(validator.tokens)} ZIG
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {(parseFloat(validator.commission?.commission_rates?.rate || '0') * 100).toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(validator.status)}`}>
                        {getStatusDisplay(validator.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p className="font-bold">No Validators Found</p>
          <p>
            No validators found. This could be because your node is still syncing,
            there are connection issues, or there are no validators in the network.
          </p>
        </div>
      )}
    </div>
  );
}
