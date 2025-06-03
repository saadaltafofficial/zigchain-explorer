"use client";

/**
 * Dynamic import wrapper for components
 * This file centralizes all dynamic imports to make them easier to manage
 */

import dynamic from 'next/dynamic';

// Dynamic import for PriceChart component
export const DynamicPriceChart = dynamic(
  () => import('./PriceChart'),
  {
    loading: () => (
      <div className="w-full h-48 rounded-lg bg-gray-800 animate-pulse flex items-center justify-center">
        <span className="text-gray-500">Loading price chart...</span>
      </div>
    ),
  }
);

// Dynamic import for TransactionDetailClient component
export const DynamicTransactionDetailView = dynamic(
  () => import('../tx/[hash]/TransactionDetailClient'),
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
    ),
  }
);

// Dynamic import for NetworkActivity component
export const DynamicNetworkActivity = dynamic(
  () => import('./NetworkActivity'),
  {
    loading: () => (
      <div className="w-full rounded-lg bg-gray-800 animate-pulse p-4">
        <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
      </div>
    ),
  }
);

// Dynamic import for HomeStats component
export const DynamicHomeStats = dynamic(
  () => import('./HomeStats'),
  {
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
            <div className="h-5 bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    ),
  }
);
