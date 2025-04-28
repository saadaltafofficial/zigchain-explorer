'use client'
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

type SearchSuggestion = {
  type: 'block' | 'transaction' | 'address' | 'recent';
  value: string;
  label?: string;
};

const SearchBar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchSuggestion[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load recent searches from localStorage
    const storedSearches = localStorage.getItem('recentSearches');
    if (storedSearches) {
      try {
        const parsedSearches = JSON.parse(storedSearches);
        setRecentSearches(parsedSearches.slice(0, 5)); // Limit to 5 recent searches
      } catch (error) {
        console.error('Error parsing recent searches:', error);
      }
    }

    // Handle clicks outside of the suggestions dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Generate suggestions based on search term
    if (searchTerm.trim()) {
      const newSuggestions: SearchSuggestion[] = [];

      // Block height suggestion
      if (/^\d+$/.test(searchTerm)) {
        newSuggestions.push({ type: 'block', value: searchTerm, label: `Block #${searchTerm}` });
      }

      // Address suggestion
      if (searchTerm.startsWith('zig1') || searchTerm.startsWith('zigvaloper1')) {
        newSuggestions.push({ 
          type: 'address', 
          value: searchTerm, 
          label: `${searchTerm.substring(0, 8)}...${searchTerm.substring(searchTerm.length - 8)}` 
        });
      }

      // Transaction hash suggestion
      if (searchTerm.length > 20 && searchTerm.length <= 64) {
        newSuggestions.push({ 
          type: 'transaction', 
          value: searchTerm, 
          label: `${searchTerm.substring(0, 8)}...${searchTerm.substring(searchTerm.length - 8)}` 
        });
      }

      // Add recent searches that match the current search term
      const matchingRecentSearches = recentSearches.filter(search => 
        search.value.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !newSuggestions.some(s => s.value === search.value)
      ).slice(0, 3);

      setSuggestions([...newSuggestions, ...matchingRecentSearches]);
      setShowSuggestions(true);
    } else {
      // Only set suggestions, but don't show them automatically on page load
      setSuggestions(recentSearches.slice(0, 5));
      // Don't set showSuggestions to true here - we'll handle that on focus
    }
  }, [searchTerm, recentSearches]);

  const saveToRecentSearches = (suggestion: SearchSuggestion) => {
    const newRecentSearches = [
      suggestion,
      ...recentSearches.filter(s => s.value !== suggestion.value)
    ].slice(0, 5);
    
    setRecentSearches(newRecentSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setShowSuggestions(false);
    
    try {
      // Determine if the search term is a block height, transaction hash, or address
      let searchType: 'block' | 'transaction' | 'address' | 'recent' = 'recent';
      let searchValue = searchTerm;

      if (/^\d+$/.test(searchTerm)) {
        // If it's a number, assume it's a block height
        searchType = 'block';
        router.push(`/blocks/${searchTerm}`);
      } else if (searchTerm.startsWith('zig1') || searchTerm.startsWith('zigvaloper1')) {
        // If it starts with zig1 or zigvaloper1, assume it's an address
        searchType = 'address';
        router.push(`/address/${searchTerm}`);
      } else {
        // Otherwise, assume it's a transaction hash
        searchType = 'transaction';
        router.push(`/tx/${searchTerm}`);
      }

      // Save the search to recent searches
      saveToRecentSearches({
        type: searchType,
        value: searchValue,
        label: searchType === 'block' ? `Block #${searchValue}` : 
               searchType === 'transaction' || searchType === 'address' ? 
               `${searchValue.substring(0, 8)}...${searchValue.substring(searchValue.length - 8)}` : 
               searchValue
      });
      
      // Clear the search input after search
      setSearchTerm('');
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setShowSuggestions(false);
    setIsLoading(true);

    try {
      // Navigate based on suggestion type
      switch (suggestion.type) {
        case 'block':
          router.push(`/blocks/${suggestion.value}`);
          break;
        case 'transaction':
          router.push(`/tx/${suggestion.value}`);
          break;
        case 'address':
          router.push(`/address/${suggestion.value}`);
          break;
        case 'recent':
          // For recent searches, determine the type again
          if (/^\d+$/.test(suggestion.value)) {
            router.push(`/blocks/${suggestion.value}`);
          } else if (suggestion.value.startsWith('zig1') || suggestion.value.startsWith('zigvaloper1')) {
            router.push(`/address/${suggestion.value}`);
          } else {
            router.push(`/tx/${suggestion.value}`);
          }
          break;
      }

      // Save to recent searches
      saveToRecentSearches(suggestion);
      
      // Clear the search input after clicking a suggestion
      setSearchTerm('');
    } catch (error) {
      console.error('Error navigating to suggestion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIconForSuggestion = (type: string) => {
    switch (type) {
      case 'block':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case 'transaction':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case 'address':
        return (
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'recent':
        return (
          <svg className="w-5 h-5 text-gray-500 " fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Handle input focus to show recent searches
  const handleInputFocus = () => {
    if (!searchTerm.trim() && recentSearches.length > 0) {
      setSuggestions(recentSearches.slice(0, 5));
      setShowSuggestions(true);
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={suggestionsRef} style={{ position: 'relative', zIndex: 1000 }}>
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <div className="flex items-center bg-gray-800 rounded-full shadow-md overflow-hidden hover:border-[#347FBF] transition-all duration-200 ">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={handleInputFocus}
              placeholder="Search blocks, tx, address..."
              className="w-full px-5 py-2 text-gray-300 bg-transparent focus:outline-none"
              aria-label="Search"
              required
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSuggestions(recentSearches.slice(0, 5));
                }}
                className="p-1.5 text-gray-400 hover:text-gray-500 focus:outline-none"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            )}
            <button
              type="submit"
              className="text-white bg-[#1e2939] border-l border-[#347FBF] font-medium rounded-full text-sm p-3  transition-colors duration-200 hover:cursor-pointer"
              disabled={isLoading}
              aria-label="Search"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Search suggestions dropdown */}
      {showSuggestions && (
        <div className="fixed w-full max-w-2xl mt-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden" style={{ zIndex: 9999, left: '50%', transform: 'translateX(-50%)' }}>
          <div className="py-2">
            <div className="text-xs font-medium text-gray-400 px-4 py-1 mb-1">
              {searchTerm ? 'Suggestions' : 'Recent Searches'}
            </div>
            <ul className="max-h-72 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-700 transition-colors duration-150"
                  >
                    <span className="mr-3 flex-shrink-0">{getIconForSuggestion(suggestion.type)}</span>
                    <div className="flex flex-col items-start">
                      <span className="font-medium truncate">{suggestion.label || suggestion.value}</span>
                      <span className="text-xs text-gray-400">
                        {suggestion.type === 'block' ? 'Block' : 
                         suggestion.type === 'address' ? 'Address' : 
                         suggestion.type === 'transaction' ? 'Transaction' : 'Recent Search'}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            {recentSearches.length > 0 && searchTerm === '' && (
              <div className="mt-1 pt-2 border-t border-gray-700 px-4">
                <button 
                  onClick={clearRecentSearches}
                  className="w-full text-xs text-blue-400 hover:text-blue-300 text-center py-1.5"
                >
                  Clear recent searches
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
