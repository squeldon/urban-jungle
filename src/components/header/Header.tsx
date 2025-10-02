'use client'
import { useState } from 'react';
import { ActiveFilter, FilterState } from '@/hooks/useFilters';
import { SearchAreaResult } from '@/types/map';
import SearchBar from './SearchBar';
import UserMenu from './UserMenu';
import FilterBubbles from './FilterBubbles';
import FilterDropdowns from './FilterDropdowns';

interface HeaderProps {
  isLoggedIn: boolean;
  showFilterPopup: boolean;
  showMapPanel: boolean;
  activeFilters: ActiveFilter[];
  filters: FilterState;
  onUserIconClick: () => void;
  onLoginOption: () => void;
  onToggleFilter: () => void;
  onToggleMap: () => void;
  onClearFilter: (key: string) => void;
  onUpdateFilter: (key: string, value: any) => void;
  onToggleArrayFilter: (key: string, value: string) => void;
  onLogout: () => void;
  // onLocationSelect: (lat: number, lng: number, name: string) => void;
  onAreaSelect?: (area: SearchAreaResult) => void;
}

export default function Header({
  isLoggedIn,
  showFilterPopup,
  showMapPanel,
  activeFilters,
  filters,
  onUserIconClick,
  onLoginOption,
  onToggleFilter,
  onToggleMap,
  onClearFilter,
  onUpdateFilter,
  onToggleArrayFilter,
  onLogout,
  // onLocationSelect,
  onAreaSelect,
}: HeaderProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [tempFilters, setTempFilters] = useState<Partial<FilterState>>({});

  // Get current value (temp or actual)
  const getCurrentFilterValue = (key: string) => {
    return tempFilters[key as keyof FilterState] ?? filters[key as keyof FilterState];
  };

  // Update temporary filter value
  const updateTempFilter = (key: string, value: any) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  // Toggle array filter temporarily
  const toggleTempArrayFilter = (key: string, value: string) => {
    const currentArray = getCurrentFilterValue(key) as string[] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateTempFilter(key, newArray);
  };

  // Apply temporary filters
  const applyTempFilters = () => {
    Object.entries(tempFilters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // For array filters, we need to set the entire array
        const currentArray = filters[key as keyof FilterState] as string[] || [];
        value.forEach(item => {
          if (!currentArray.includes(item)) {
            onToggleArrayFilter(key, item);
          }
        });
        currentArray.forEach(item => {
          if (!value.includes(item)) {
            onToggleArrayFilter(key, item);
          }
        });
      } else {
        onUpdateFilter(key, value);
      }
    });
    setTempFilters({});
    setOpenDropdown(null);
  };

  const handleFilterClick = (index: number) => {
    if (index === -1) {
      setOpenDropdown(null);
      setTempFilters({});
      return;
    }

    if (openDropdown === `filter-${index}`) {
      setOpenDropdown(null);
      setTempFilters({});
    } else {
      setOpenDropdown(`filter-${index}`);
      setTempFilters({});
    }
  };

  const handleClearFilter = (key: string) => {
    onClearFilter(key);
    setOpenDropdown(null);
    setTempFilters({});
  };

  const { getDropdownContent } = FilterDropdowns({
    filters,
    getCurrentFilterValue,
    updateTempFilter,
    toggleTempArrayFilter,
    applyTempFilters
  });

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col bg-white/80 dark:bg-black/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center p-6">
        <div className="flex-1 flex items-center">
        </div>

        {/* Centered Search Bar */}
        <div className="flex justify-center flex-[2]">
          <div className="flex items-center gap-2 w-full">
            <SearchBar 
            // onLocationSelect={onLocationSelect} 
            onAreaSelect={onAreaSelect} 
            />
            
            {/* Filter Toggle Button */}
            <button
              onClick={onToggleFilter}
              className={`p-2 rounded-full transition-colors ${
                showFilterPopup 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <line x1="4" y1="8" x2="20" y2="8" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="8" cy="8" r="2" fill="currentColor"/>
                <line x1="4" y1="16" x2="20" y2="16" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="16" cy="16" r="2" fill="currentColor"/>
              </svg>
            </button>
            
            {/* Map Toggle Button */}
            <button
              onClick={onToggleMap}
              className={`p-2 rounded-full transition-colors ${
                showMapPanel 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-1 justify-end">
          <UserMenu 
            isLoggedIn={isLoggedIn}
            onUserIconClick={onUserIconClick}
            onLoginOption={onLoginOption}
            onLogout={onLogout}
          />
        </div>
      </div>

      {/* Filter Bubbles Row */}
      <FilterBubbles 
        activeFilters={activeFilters}
        openDropdown={openDropdown}
        onFilterClick={handleFilterClick}
        onClearFilter={handleClearFilter}
        getDropdownContent={getDropdownContent}
      />
    </header>
  );
}
