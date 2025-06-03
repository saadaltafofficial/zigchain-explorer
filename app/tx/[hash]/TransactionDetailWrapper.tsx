"use client";

import React from 'react';
import dynamic from 'next/dynamic';

// Define the props interface
export interface TransactionDetailWrapperProps {
  hash: string;
}

// Dynamic import for TransactionDetailClient
const DynamicTransactionDetail = dynamic(
  () => import('./TransactionDetailClient'),
  {
    loading: () => (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        </div>
      </div>
    )
  }
);

// Client component wrapper for the transaction detail page
function TransactionDetailWrapper({ hash }: TransactionDetailWrapperProps) {
  return <DynamicTransactionDetail params={{ hash }} />;
}

// Export the component as default
export default TransactionDetailWrapper;
