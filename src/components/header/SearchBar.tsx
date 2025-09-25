'use client'
import { useState, useEffect, useRef } from 'react';
import { OpenStreetMapProvider } from 'leaflet-geosearch';

interface SearchBarProps {
  onLocationSelect: (lat: number, lng: number, name: string) => void;
}

export default function SearchBar({ onLocationSelect }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const searchRef = useRef<HTMLFormElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastSearchTime = useRef<number>(0);
  const searchCache = useRef<Map<string, any[]>>(new Map());
  
  // Create provider with proper User-Agent
  const provider = useRef(new OpenStreetMapProvider({
    params: {
      'User-Agent': 'Urban Jungle Real Estate App (contact: your-email@example.com)',
      format: 'json',
      addressdetails: 1,
      limit: 5
    }
  }));

  // Rate-limited search function (compliant with 1 req/sec limit)
  const handleSearch = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    if (searchCache.current.has(cacheKey)) {
      const cachedResults = searchCache.current.get(cacheKey)!;
      setSearchResults(cachedResults);
      setShowSearchResults(true);
      setSelectedIndex(cachedResults.length > 0 ? 0 : -1); // Auto-highlight first result
      setLastSearchQuery(query);
      return;
    }

    // Rate limiting: ensure at least 1 second between requests
    const now = Date.now();
    const timeSinceLastSearch = now - lastSearchTime.current;
    const minInterval = 1000; // 1 second

    if (timeSinceLastSearch < minInterval) {
      // Wait for the remaining time
      const waitTime = minInterval - timeSinceLastSearch;
      setTimeout(() => handleSearch(query), waitTime);
      return;
    }

    setIsSearching(true);
    lastSearchTime.current = now;

    try {
      const results = await provider.current.search({ query });
      const limitedResults = results.slice(0, 5);
      
      // Cache the results
      searchCache.current.set(cacheKey, limitedResults);
      
      setSearchResults(limitedResults);
      setShowSearchResults(true);
      setSelectedIndex(limitedResults.length > 0 ? 0 : -1); // Auto-highlight first result
      setLastSearchQuery(query);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search form submission (Enter key or search button)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleSearch(searchQuery.trim());
    }
  };

  // Handle search input change (no live search - policy compliant)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Don't search automatically - only on submit
  };

  // Handle keyboard navigation
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSearchResults || searchResults.length === 0) {
      if (e.key === 'Enter') {
        handleSearchSubmit(e as any);
      }
      return;
    }

    // Check if current query matches the query that generated current results
    const currentQueryMatches = searchQuery.trim().toLowerCase() === lastSearchQuery.toLowerCase();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        // If query has changed, search for new query instead of selecting result
        if (!currentQueryMatches) {
          handleSearchSubmit(e as any);
        } else if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleLocationSelect(searchResults[selectedIndex]);
        } else {
          handleSearchSubmit(e as any);
        }
        break;
      case 'Escape':
        setShowSearchResults(false);
        setSelectedIndex(-1);
        setLastSearchQuery(''); // Clear since we're closing results
        break;
    }
  };

  // Handle location selection
  const handleLocationSelect = (result: any) => {
    setSearchQuery(result.label);
    setShowSearchResults(false);
    setSelectedIndex(-1);
    setLastSearchQuery(''); // Clear since we're closing results
    onLocationSelect(result.y, result.x, result.label);
  };

  // Handle scroll to keep selected item visible
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

  // Handle click outside search to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
        setSelectedIndex(-1);
        setLastSearchQuery(''); // Clear since we're closing results
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <form onSubmit={handleSearchSubmit} className="relative flex-1" ref={searchRef}>
      <input
        type="text"
        placeholder="Search location (press Enter)"
        value={searchQuery}
        onChange={handleSearchChange}
        onKeyDown={handleSearchKeyDown}
        className="w-full px-4 py-2 pl-4 pr-20 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-1">
        <button
          type="submit"
          disabled={isSearching || searchQuery.length < 3}
          className="p-1.5 mr-1 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white transition-colors"
        >
          {isSearching ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </button>
      </div>
      
      {/* Search Results Dropdown */}
      {showSearchResults && searchResults.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-60 overflow-y-auto"
        >
          {/* Header */}
          <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
            Select location
          </div>
          
          {/* Results */}
          {searchResults.map((result, index) => (
            <button
              key={index}
              type="button"
              data-index={index}
              onClick={() => handleLocationSelect(result)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full text-left px-4 py-3 transition-colors border-b border-gray-100 dark:border-gray-600 last:border-b-0 ${
                selectedIndex === index
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className={`text-sm font-medium ${
                selectedIndex === index
                  ? 'text-blue-900 dark:text-blue-100'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {result.label}
              </div>
              {result.raw?.display_name && (
                <div className={`text-xs mt-1 truncate ${
                  selectedIndex === index
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {result.raw.display_name}
                </div>
              )}
            </button>
            ))}
        </div>
      )}
      
      {/* No Results Message */}
      {showSearchResults && searchResults.length === 0 && searchQuery.length >= 3 && !isSearching && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
            No locations found
          </div>
        </div>
      )}
    </form>
  );
}
