'use client';

import React, { useState, useEffect } from 'react';
import { getValidatorByAddress } from '@/app/services/api';
import { formatDate, formatNumber, formatPercentage, formatAddress } from '@/app/utils/format';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ValidatorDetailProps {
  params: {
    address: string;
  };
}

export default function ValidatorDetailPage({ params }: ValidatorDetailProps) {
  // Safely access the address parameter
  const address = params.address;
  
  const [validator, setValidator] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchValidator = async () => {
      if (!address) {
        setError('Validator address is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log(`Fetching validator with address: ${address}`);
        const validatorData = await getValidatorByAddress(address);
        
        if (validatorData) {
          console.log('Validator data:', validatorData);
          setValidator(validatorData);
        } else {
          setError(`Validator with address ${address} not found`);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching validator:', err);
        setError(`Failed to load validator details: ${err instanceof Error ? err.message : String(err)}`);
        setLoading(false);
      }
    };

    fetchValidator();
  }, [address]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/validators" className="flex items-center text-blue-500 hover:text-blue-700">
            <ArrowLeft className="mr-2" size={16} />
            Back to Validators
          </Link>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/validators" className="flex items-center text-blue-500 hover:text-blue-700">
            <ArrowLeft className="mr-2" size={16} />
            Back to Validators
          </Link>
        </div>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!validator) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/validators" className="flex items-center text-blue-500 hover:text-blue-700">
            <ArrowLeft className="mr-2" size={16} />
            Back to Validators
          </Link>
        </div>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <p>No validator data found.</p>
        </div>
      </div>
    );
  }

  // Extract validator data
  const { 
    description, 
    operator_address,
    jailed,
    status,
    tokens,
    delegator_shares,
    commission,
    min_self_delegation,
    unbonding_height,
    unbonding_time,
    consensus_pubkey
  } = validator;

  // Staking information
  const votingPower = tokens ? formatNumber(parseInt(tokens) / 1000000) : '0';
  const commissionRate = commission?.commission_rates?.rate ? formatPercentage(commission.commission_rates.rate) : '0%';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/validators" className="flex items-center text-blue-500 hover:text-blue-700">
          <ArrowLeft className="mr-2" size={16} />
          Back to Validators
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-2">{description?.moniker || 'Unknown Validator'}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {formatAddress(operator_address)}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Moniker</p>
              <p className="font-medium">{description?.moniker || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Identity</p>
              <p className="font-medium">{description?.identity || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Website</p>
              {description?.website ? (
                <a 
                  href={description.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700"
                >
                  {description.website}
                </a>
              ) : (
                <p className="font-medium">N/A</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                status === 'BOND_STATUS_BONDED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                status === 'BOND_STATUS_UNBONDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {status === 'BOND_STATUS_BONDED' ? 'Active' : 
                 status === 'BOND_STATUS_UNBONDING' ? 'Unbonding' : 
                 status === 'BOND_STATUS_UNBONDED' ? 'Inactive' : status}
              </span>
              {jailed && (
                <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  Jailed
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Staking Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Staking Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Voting Power</p>
              <p className="font-medium">{votingPower} ZIG</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Commission Rate</p>
              <p className="font-medium">{commissionRate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Self Delegation</p>
              <p className="font-medium">{min_self_delegation ? formatNumber(parseInt(min_self_delegation) / 1000000) : '0'} ZIG</p>
            </div>
            {unbonding_height && unbonding_height !== '0' && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Unbonding Info</p>
                <p className="font-medium">
                  Height: {unbonding_height}, Time: {formatDate(unbonding_time)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Technical Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Technical Information</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Operator Address</p>
            <p className="font-mono text-sm break-all">{operator_address}</p>
          </div>
          {consensus_pubkey && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Consensus Public Key</p>
              <p className="font-mono text-sm break-all">
                {consensus_pubkey['@type']}: {consensus_pubkey.key}
              </p>
            </div>
          )}
          {description?.details && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Details</p>
              <p className="text-sm">{description.details}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Delegations section could be added here */}
    </div>
  );
}
