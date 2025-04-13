import React from 'react';
import Link from 'next/link';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: {
    value: string | number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
  link?: string;
  tooltip?: string;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  change, 
  color = 'blue',
  link,
  tooltip,
  isLoading = false
}) => {
  // Define color schemes based on the color prop
  const colorSchemes = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'text-blue-500 dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-800/30',
      hover: 'hover:bg-blue-100 dark:hover:bg-blue-800/30'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      icon: 'text-green-500 dark:text-green-400',
      border: 'border-green-100 dark:border-green-800/30',
      hover: 'hover:bg-green-100 dark:hover:bg-green-800/30'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      icon: 'text-purple-500 dark:text-purple-400',
      border: 'border-purple-100 dark:border-purple-800/30',
      hover: 'hover:bg-purple-100 dark:hover:bg-purple-800/30'
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      icon: 'text-orange-500 dark:text-orange-400',
      border: 'border-orange-100 dark:border-orange-800/30',
      hover: 'hover:bg-orange-100 dark:hover:bg-orange-800/30'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      icon: 'text-red-500 dark:text-red-400',
      border: 'border-red-100 dark:border-red-800/30',
      hover: 'hover:bg-red-100 dark:hover:bg-red-800/30'
    },
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      icon: 'text-indigo-500 dark:text-indigo-400',
      border: 'border-indigo-100 dark:border-indigo-800/30',
      hover: 'hover:bg-indigo-100 dark:hover:bg-indigo-800/30'
    }
  };

  const scheme = colorSchemes[color];
  
  const cardContent = (
    <>
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          {icon && <div className={`mr-2 ${scheme.icon}`}>{icon}</div>}
          <h3 className="text-gray-600 dark:text-gray-300 text-sm font-medium">{title}</h3>
        </div>
        {tooltip && (
          <div className="tooltip">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="tooltip-text">{tooltip}</span>
          </div>
        )}
      </div>
      
      <div className="mt-3">
        {isLoading ? (
          <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
        ) : (
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
        )}
        
        {change && !isLoading && (
          <p className={`mt-1 text-sm flex items-center ${
            change.isPositive 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {change.isPositive ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
            {change.value}
          </p>
        )}
      </div>
    </>
  );

  if (link) {
    return (
      <Link 
        href={link} 
        className={`block ${scheme.bg} ${scheme.hover} border ${scheme.border} rounded-lg p-4 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-md`}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={`${scheme.bg} border ${scheme.border} rounded-lg p-4`}>
      {cardContent}
    </div>
  );
};

export default StatCard;
