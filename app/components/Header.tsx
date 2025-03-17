import React from 'react';
import Link from 'next/link';
import SearchBar from './SearchBar';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Link href="/" className="text-2xl font-bold text-white hover:text-gray-300">
              ZigChain Explorer
            </Link>
            <span className="ml-4 px-2 py-1 text-xs bg-blue-600 rounded-md">Testnet</span>
          </div>
          
          <nav className="flex space-x-6">
            <Link href="/" className="text-gray-300 hover:text-white">
              Home
            </Link>
            <Link href="/blocks" className="text-gray-300 hover:text-white">
              Blocks
            </Link>
            <Link href="/transactions" className="text-gray-300 hover:text-white">
              Transactions
            </Link>
            <Link href="/validators" className="text-gray-300 hover:text-white">
              Validators
            </Link>
          </nav>
        </div>
        
        <div className="mt-4">
          <SearchBar />
        </div>
      </div>
    </header>
  );
};

export default Header;
