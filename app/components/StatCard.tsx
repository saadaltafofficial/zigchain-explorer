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
      bg: 'bg-[#111928]', // Dark blue-gray background
      icon: 'text-blue-400',
      border: 'border-blue-800',
      hover: 'hover:bg-[#1a2436]'
    },
    green: {
      bg: 'bg-[#111928]', // Dark blue-gray background
      icon: 'text-green-400',
      border: 'border-green-800',
      hover: 'hover:bg-[#1a2436]'
    },
    purple: {
      bg: 'bg-[#111928]', // Dark blue-gray background
      icon: 'text-purple-400',
      border: 'border-purple-800',
      hover: 'hover:bg-[#1a2436]'
    },
    orange: {
      bg: 'bg-[#111928]', // Dark blue-gray background
      icon: 'text-orange-400',
      border: 'border-orange-800',
      hover: 'hover:bg-[#1a2436]'
    },
    red: {
      bg: 'bg-[#111928]', // Dark blue-gray background
      icon: 'text-red-400',
      border: 'border-red-800',
      hover: 'hover:bg-[#1a2436]'
    },
    indigo: {
      bg: 'bg-[#111928]', // Dark blue-gray background
      icon: 'text-indigo-400',
      border: 'border-indigo-800',
      hover: 'hover:bg-[#1a2436]'
    }
  };

  const scheme = colorSchemes[color];
  
  const cardContent = (
    <>
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          {icon && <div className={`mr-2 ${scheme.icon}`}>{icon}</div>}
          <h3 className="text-gray-300 text-sm font-medium">{title}</h3>
        </div>
        {tooltip && (
          <div className="relative inline-block cursor-help group">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 hover:text-white transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 w-48 p-2 bg-[#131e2c] text-white text-xs rounded shadow-lg z-50 pointer-events-none">
              {tooltip}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[#131e2c]"></div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-3">
        {isLoading ? (
          <div className="h-7 rounded animate-pulse w-3/4 bg-gray-700"></div>
        ) : (
          <p className="text-2xl font-semibold text-white">{value}</p>
        )}
        
        {change && !isLoading && (
          <p className={`mt-1 text-sm flex items-center ${
            change.isPositive 
              ? 'text-green-600' 
              : 'text-red-600'
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
