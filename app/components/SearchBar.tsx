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
      setSuggestions(recentSearches.slice(0, 5));
      setShowSuggestions(!!recentSearches.length);
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

  const handleSearch = async (e: React.FormEvent) => {
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
      } else if (searchTerm.startsWith('zig1') || searchTerm.startsWith('zigvaloper1')) {
        // If it starts with zig1 or zigvaloper1, assume it's an address
        searchType = 'address';
      } else if (searchTerm.length === 64) {
        // If it's 64 characters long, assume it's a transaction hash
        searchType = 'transaction';
      }

      // Save to recent searches
      saveToRecentSearches({
        type: searchType,
        value: searchValue,
        label: searchType === 'block' ? `Block #${searchValue}` : 
               (searchType === 'transaction' || searchType === 'address') ? 
               `${searchValue.substring(0, 8)}...${searchValue.substring(searchValue.length - 8)}` : 
               searchValue
      });

      // Navigate based on search type
      switch (searchType) {
        case 'block':
          router.push(`/blocks/${searchValue}`);
          break;
        case 'address':
          router.push(`/address/${searchValue}`);
          break;
        case 'transaction':
          router.push(`/transactions/${searchValue}`);
          break;
        default:
          router.push(`/search?q=${encodeURIComponent(searchValue)}`);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setShowSuggestions(false);
    saveToRecentSearches(suggestion);

    switch (suggestion.type) {
      case 'block':
        router.push(`/blocks/${suggestion.value}`);
        break;
      case 'address':
        router.push(`/address/${suggestion.value}`);
        break;
      case 'transaction':
        router.push(`/transactions/${suggestion.value}`);
        break;
      case 'recent':
        // For recent searches, we need to determine the type again
        if (/^\d+$/.test(suggestion.value)) {
          router.push(`/blocks/${suggestion.value}`);
        } else if (suggestion.value.startsWith('zig1') || suggestion.value.startsWith('zigvaloper1')) {
          router.push(`/address/${suggestion.value}`);
        } else if (suggestion.value.length === 64) {
          router.push(`/transactions/${suggestion.value}`);
        } else {
          router.push(`/search?q=${encodeURIComponent(suggestion.value)}`);
        }
        break;
    }
  };

  const getIconForSuggestion = (type: string) => {
    switch (type) {
      case 'block':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
          </svg>
        );
      case 'transaction':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
          </svg>
        );
      case 'address':
        return (
          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        );
      case 'recent':
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
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

  return (
    <div className="w-full max-w-3xl mx-auto relative" ref={suggestionsRef}>
      <form onSubmit={handleSearch} className="w-full">
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="search"
            id="default-search"
            className="block w-full py-3 pl-5 pr-24 text-base text-gray-900 border-0 rounded-full bg-white shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-400"
            placeholder="Search blocks, tx, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            required
          />
          <div className="absolute right-2 flex items-center space-x-1">
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
              className="text-white  focus:ring-2 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm p-1 mr-2 transition-colors duration-200 hover:cursor-pointer"
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
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-xl dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="py-2">
            {suggestions.length > 0 && (
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-1 mb-1">
                {searchTerm ? 'Suggestions' : 'Recent Searches'}
              </div>
            )}
            <ul className="max-h-72 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors duration-150"
                  >
                    <span className="mr-3 flex-shrink-0">{getIconForSuggestion(suggestion.type)}</span>
                    <div className="flex flex-col items-start">
                      <span className="font-medium truncate">{suggestion.label || suggestion.value}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
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
              <div className="mt-1 pt-2 border-t border-gray-200 dark:border-gray-700 px-4">
                <button 
                  onClick={clearRecentSearches}
                  className="w-full text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-center py-1.5"
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
