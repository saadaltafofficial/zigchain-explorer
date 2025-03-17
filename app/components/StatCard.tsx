import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: {
    value: string | number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, change }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
      <div className="flex justify-between items-center">
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</h3>
        {icon && <div className="text-blue-600 dark:text-blue-400">{icon}</div>}
      </div>
      
      <div className="mt-2">
        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
        
        {change && (
          <p className={`mt-1 text-sm ${
            change.isPositive 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {change.isPositive ? '↑' : '↓'} {change.value}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
