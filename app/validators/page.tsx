'use client';

import React from 'react';

// Define Validator interface (kept for future reference)
interface Validator {
  operator_address: string;
  address: string;
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
  voting_power?: number;
  votingPower?: number;
}

export default function ValidatorsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-yellow-900/20 border-l-4 border-yellow-600 p-4 max-w-2xl w-full mb-8">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-400">
              The validators section is currently under maintenance. We're working on bringing you an improved experience soon.
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800 shadow-md rounded-lg p-6 max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-white mb-4">Validators</h1>
        <p className="text-gray-300 mb-6">
          This section will display information about ZigChain validators, including their status, voting power, and commission rates.
        </p>
        
        <div className="border border-gray-700 rounded-md p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-200 mb-2">Coming Soon</h2>
          <p className="text-gray-400">
            We're currently updating our validator data integration to provide you with more accurate and comprehensive information.
          </p>
        </div>
        
        <div className="flex justify-center">
          <button 
            className="px-4 py-2 bg-gray-700 text-gray-200 rounded-md cursor-not-allowed opacity-70"
            disabled
          >
            View Validators
          </button>
        </div>
      </div>
    </div>
  );
}
