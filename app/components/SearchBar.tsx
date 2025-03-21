'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

const SearchBar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    // Determine what type of search query this is
    if (/^\d+$/.test(searchQuery)) {
      // If it's a number, assume it's a block height
      router.push(`/blocks/${searchQuery}`);
    } else if (searchQuery.startsWith('zig') && searchQuery.length > 30) {
      // If it starts with 'zig' and is long, assume it's an address
      router.push(`/address/${searchQuery}`);
    } else if (searchQuery.length > 40) {
      // If it's a long string, assume it's a transaction hash
      router.push(`/tx/${searchQuery}`);
    } else {
      // Default to a general search page
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
    
    setSearchQuery('');
  };

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="relative">
        <input
          type="text"
          placeholder="Search by Address / Tx Hash / Block Height"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 shadow-sm transition-colors"
          aria-label="Search input"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 dark:bg-blue-700 text-white px-4 py-1 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 transition-colors duration-200"
          aria-label="Search"
        >
          <span className="flex items-center">
            <Search size={16} className="mr-1" />
            <span className="text-sm font-medium">Search</span>
          </span>
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
