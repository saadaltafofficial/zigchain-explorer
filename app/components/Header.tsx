'use client';

import React from 'react';
import Link from 'next/link';
import SearchBar from './SearchBar';
import ThemeSwitcher from './ThemeSwitcher';

const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
              ZIGChain
            </Link>
            <span className="ml-4 px-2 py-1 text-xs text-white bg-blue-600 dark:bg-blue-700 rounded-md">Testnet</span>
          </div>
          
          <div className="flex items-center space-x-6">
            <nav className="flex space-x-6">
              <Link href="/" className="font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/blocks" className="font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-white transition-colors">
                Blocks
              </Link>
              <Link href="/transactions" className="font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-white transition-colors">
                Transactions
              </Link>
              <Link href="/validators" className="font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-white transition-colors">
                Validators
              </Link>
            </nav>
            <ThemeSwitcher />
          </div>
        </div>
        
        <div className="mt-4">
          <SearchBar />
        </div>
      </div>
    </header>
  );
};

export default Header;
