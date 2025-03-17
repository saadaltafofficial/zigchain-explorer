'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

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
          className="w-full px-4 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-md hover:bg-blue-700 focus:outline-none"
        >
          Search
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
