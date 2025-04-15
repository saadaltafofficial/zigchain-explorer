import React, { useState } from 'react';
import Link from 'next/link';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface NetworkActivityProps {
  dailyTransactions?: number[];
  dailyBlocks?: number[];
  dailyActiveAddresses?: number[];
  isLoading?: boolean;
}

const NetworkActivity: React.FC<NetworkActivityProps> = ({
  dailyTransactions = [],
  dailyBlocks = [],
  dailyActiveAddresses = [],
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'blocks' | 'addresses'>('transactions');

  // Generate mock data if none provided
  const generateMockData = (baseValue: number, days: number = 14) => {
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateStr = date.toISOString().split('T')[0];
      
      return {
        date: dateStr,
        value: Math.floor(baseValue * (0.8 + Math.random() * 0.4))
      };
    });
  };

  const transactionsData = dailyTransactions.length > 0 
    ? dailyTransactions.map((value, i) => ({ date: `Day ${i+1}`, value })) 
    : generateMockData(5000);

  const blocksData = dailyBlocks.length > 0 
    ? dailyBlocks.map((value, i) => ({ date: `Day ${i+1}`, value })) 
    : generateMockData(1000);

  const addressesData = dailyActiveAddresses.length > 0 
    ? dailyActiveAddresses.map((value, i) => ({ date: `Day ${i+1}`, value })) 
    : generateMockData(2000);

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full"></div>
      );
    }

    let data;
    let color;
    let title;

    switch (activeTab) {
      case 'transactions':
        data = transactionsData;
        color = "#3b82f6";
        title = "Daily Transactions";
        break;
      case 'blocks':
        data = blocksData;
        color = "#8b5cf6";
        title = "Daily Blocks";
        break;
      case 'addresses':
        data = addressesData;
        color = "#10b981";
        title = "Daily Active Addresses";
        break;
    }

    return (
      <div className="h-64 w-full">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'blocks' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                tickFormatter={(value) => value.split('-')[2] || value}
                stroke="#9ca3af"
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickFormatter={formatNumber}
                stroke="#9ca3af"
              />
              <Tooltip 
                formatter={(value: number) => [formatNumber(value), title.replace('Daily ', '')]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                tickFormatter={(value) => value.split('-')[2] || value}
                stroke="#9ca3af"
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickFormatter={formatNumber}
                stroke="#9ca3af"
              />
              <Tooltip 
                formatter={(value: number) => [formatNumber(value), title.replace('Daily ', '')]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Network Activity</h2>
        
      </div>

      <div className="flex space-x-2 mb-6">
        <button 
          onClick={() => setActiveTab('transactions')} 
          className={`px-3 py-1 text-sm rounded-md ${
            activeTab === 'transactions' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Transactions
        </button>
        <button 
          onClick={() => setActiveTab('blocks')} 
          className={`px-3 py-1 text-sm rounded-md ${
            activeTab === 'blocks' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Blocks
        </button>
        <button 
          onClick={() => setActiveTab('addresses')} 
          className={`px-3 py-1 text-sm rounded-md ${
            activeTab === 'addresses' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Active Addresses
        </button>
      </div>

      {renderTabContent()}
    </div>
  );
};

export default NetworkActivity;
