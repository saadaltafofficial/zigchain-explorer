'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface SearchSuggestion {
  type: 'block' | 'transaction' | 'address' | 'recent' | 'popular';
  value: string;
  label?: string;
}

const popularSearches: string[] = [
  'latest blocks',
  'latest transactions',
  // Add more popular search terms if needed
];

const SearchBar: React.FC = () => {
  // Add a ref for the dropdown container
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<SearchSuggestion[]>([]);
  
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsContainerRef = useRef<HTMLDivElement>(null); // Renamed for clarity

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const storedSearches = localStorage.getItem('recentSearches');
    if (storedSearches) {
      try {
        const parsed = JSON.parse(storedSearches);
        if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
          setRecentSearches(parsed.slice(0, 5));
        }
      } catch (error) {
        console.error('Error parsing recent searches:', error);
      }
    }
  }, []);

  // Effect for click outside and scroll handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && !inputRef.current.contains(event.target as Node) &&
        suggestionsContainerRef.current && !suggestionsContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    const handleScroll = () => {
      setShowSuggestions(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const saveSearchTermToRecent = useCallback((term: string) => {
    if (!term.trim()) return;
    const newRecent = [term, ...recentSearches.filter(rs => rs.toLowerCase() !== term.toLowerCase())].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));
  }, [recentSearches]);

  // Effect for updating filtered suggestions
  useEffect(() => {
    const termLower = searchTerm.toLowerCase().trim();
    let suggestionsToShow: SearchSuggestion[] = [];

    if (!termLower) {
      // Empty search term: show recent or popular
      if (recentSearches.length > 0) {
        suggestionsToShow = recentSearches.map(rs => ({ type: 'recent', value: rs, label: rs }));
      } else {
        suggestionsToShow = popularSearches.map(ps => ({ type: 'popular', value: ps, label: ps }));
      }
    } else {
      // Non-empty search term: generate dynamic suggestions and filter recent/popular
      if (/^\d+$/.test(termLower)) {
        suggestionsToShow.push({ type: 'block', value: searchTerm, label: `Block #${searchTerm}` });
      }
      if (termLower.startsWith('zig1') || termLower.startsWith('zigvaloper1')) {
        suggestionsToShow.push({ 
          type: 'address', 
          value: searchTerm, // Keep original casing for navigation
          label: `${searchTerm.substring(0, 10)}...${searchTerm.substring(searchTerm.length - 6)}` 
        });
      }
      // Basic check for TX hash (hex string, typical length)
      if (/^[0-9a-fA-F]{20,64}$/.test(searchTerm) && !/^\d+$/.test(searchTerm) && !searchTerm.startsWith('zig')) {
        suggestionsToShow.push({ 
          type: 'transaction', 
          value: searchTerm, // Keep original casing
          label: `${searchTerm.substring(0, 8)}...${searchTerm.substring(searchTerm.length - 8)}` 
        });
      }

      const matchedRecent = recentSearches
        .filter(rs => rs.toLowerCase().includes(termLower) && !suggestionsToShow.some(s => s.value.toLowerCase() === rs.toLowerCase()))
        .map(rs => ({ type: 'recent' as const, value: rs, label: rs }));

      const matchedPopular = popularSearches
        .filter(ps => ps.toLowerCase().includes(termLower) && 
                       !suggestionsToShow.some(s => s.value.toLowerCase() === ps.toLowerCase()) && 
                       !matchedRecent.some(mr => mr.value.toLowerCase() === ps.toLowerCase()))
        .map(ps => ({ type: 'popular' as const, value: ps, label: ps }));
      
      suggestionsToShow = [...suggestionsToShow, ...matchedRecent, ...matchedPopular];
    }

    setFilteredSuggestions(suggestionsToShow.slice(0, 10));

  }, [searchTerm, recentSearches]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const termToSearch = searchTerm.trim();
    if (!termToSearch) return;

    setIsLoading(true);
    setShowSuggestions(false);
    saveSearchTermToRecent(termToSearch);

    if (/^\d+$/.test(termToSearch)) {
      router.push(`/blocks/${termToSearch}`);
    } else if (termToSearch.startsWith('zig1') || termToSearch.startsWith('zigvaloper1')) {
      router.push(`/address/${termToSearch}`);
    } else if (/^[0-9a-fA-F]{20,64}$/.test(termToSearch)) { 
      router.push(`/tx/${termToSearch}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(termToSearch)}`);
    }
    // setSearchTerm(''); // Optionally clear search term after search
    setIsLoading(false);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    // setSearchTerm(suggestion.value); // Set search term for consistency, then search
    setShowSuggestions(false);
    saveSearchTermToRecent(suggestion.value);

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
      case 'popular':
        // Handle special cases for popular searches
        if (suggestion.value === 'latest blocks') {
          router.push('/blocks');
        } else if (suggestion.value === 'latest transactions') {
          router.push('/transactions');
        } else if (/^\d+$/.test(suggestion.value)) {
          router.push(`/blocks/${suggestion.value}`);
        } else if (suggestion.value.startsWith('zig1') || suggestion.value.startsWith('zigvaloper1')) {
          router.push(`/address/${suggestion.value}`);
        } else if (/^[0-9a-fA-F]{20,64}$/.test(suggestion.value)) {
          router.push(`/tx/${suggestion.value}`);
        } else {
          router.push(`/search?q=${encodeURIComponent(suggestion.value)}`);
        }
        break;
      default:
        router.push(`/search?q=${encodeURIComponent(suggestion.value)}`);
    }
    // setSearchTerm(''); // Optionally clear search term after click
  };

  const getIconForSuggestion = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'block':
        return <svg className="w-5 h-5 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>;
      case 'transaction':
        return <svg className="w-5 h-5 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2A8.001 8.001 0 0019.419 15m0 0H15"></path></svg>;
      case 'address':
        return <svg className="w-5 h-5 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>;
      case 'recent':
      case 'popular':
        return <svg className="w-5 h-5 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
      default:
        return null;
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
    // After clearing, show popular searches if search term is empty
    if (!searchTerm.trim()) {
        setFilteredSuggestions(popularSearches.map(ps => ({ type: 'popular', value: ps, label: ps })));
        setShowSuggestions(true);
    } else {
        // If there's a search term, re-filter without recent searches
        const termLower = searchTerm.toLowerCase().trim();
        const dynamicSuggestions: SearchSuggestion[] = [];
        if (/^\d+$/.test(termLower)) dynamicSuggestions.push({ type: 'block', value: searchTerm, label: `Block #${searchTerm}` });
        if (termLower.startsWith('zig1') || termLower.startsWith('zigvaloper1')) dynamicSuggestions.push({ type: 'address', value: searchTerm, label: `${searchTerm.substring(0,10)}...${searchTerm.substring(searchTerm.length-6)}` });
        if (/^[0-9a-fA-F]{20,64}$/.test(searchTerm) && !/^\d+$/.test(searchTerm) && !searchTerm.startsWith('zig')) dynamicSuggestions.push({ type: 'transaction', value: searchTerm, label: `${searchTerm.substring(0,8)}...${searchTerm.substring(searchTerm.length-8)}` });
        
        const matchedPopular = popularSearches
            .filter(ps => ps.toLowerCase().includes(termLower) && !dynamicSuggestions.some(s => s.value.toLowerCase() === ps.toLowerCase()))
            .map(ps => ({ type: 'popular' as const, value: ps, label: ps }));
        setFilteredSuggestions([...dynamicSuggestions, ...matchedPopular].slice(0,10));
        setShowSuggestions(true);
    }
  };

  const handleInputFocus = () => {
    // The useEffect for searchTerm handles populating filteredSuggestions.
    // We just need to ensure the dropdown is shown if there's anything to show.
    if (searchTerm.trim() === '') {
        // If empty, useEffect would have set recent or popular
        if (recentSearches.length > 0 || popularSearches.length > 0) {
            setShowSuggestions(true);
        }
    } else if (filteredSuggestions.length > 0) {
        // If not empty and there are filtered suggestions from useEffect
        setShowSuggestions(true);
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto " ref={suggestionsContainerRef}>
      <form onSubmit={handleSearch} className="w-full">
        <div className="relative" style={{ zIndex: 100 }}>
          <div className="flex items-center bg-[#0d1520] border border-[#347FBF] rounded-full shadow-sm overflow-hidden pl-3 pr-1.5 py-1.5">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={handleInputFocus}
              placeholder={!searchTerm.trim() && recentSearches.length > 0 ? "Recent Searches" : "Search blocks, tx, address..."}
              className="w-full px-2 py-1 text-sm text-gray-300 bg-transparent focus:outline-none placeholder-gray-500"
              aria-label="Search"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')} // Clears the input, useEffect will update suggestions
                className="p-1.5 text-gray-400 hover:text-gray-300 focus:outline-none"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            )}
            <button
              type="submit"
              className="text-white bg-[#1e2939] border-l border-[#347FBF] rounded-full text-sm p-2.5 ml-1 transition-colors duration-200 hover:cursor-pointer hover:bg-[#283548] disabled:opacity-50"
              disabled={isLoading || !searchTerm.trim()}
              aria-label="Search"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              )}
            </button>
          </div>
        </div>
      </form>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div ref={dropdownRef} className="fixed w-full mt-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden" style={{ zIndex: 9999, width: suggestionsContainerRef.current?.offsetWidth + 'px', left: suggestionsContainerRef.current?.getBoundingClientRect().left + 'px' }}>
          <div className="py-2">
            <div className="text-xs font-medium text-gray-400 px-4 py-1 mb-1">
              {searchTerm.trim() ? 'Suggestions' : (recentSearches.length > 0 ? 'Recent Searches' : 'Popular Searches')}
            </div>
            <ul className="max-h-72 overflow-y-auto">
              {filteredSuggestions.map((suggestion, index) => (
                <li key={`${suggestion.type}-${suggestion.value}-${index}`}>
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-700 transition-colors duration-150"
                  >
                    <span className="mr-3 flex-shrink-0">{getIconForSuggestion(suggestion.type)}</span>
                    <div className="flex flex-col items-start text-left">
                      <span className="font-medium truncate block max-w-full">{suggestion.label || suggestion.value}</span>
                      <span className="text-xs text-gray-400 capitalize">
                        {suggestion.type}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            {!searchTerm.trim() && recentSearches.length > 0 && (
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
