'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, getAuth } from 'firebase/auth';
import firebase_app from '@/firebase/config';
import { ActiveFilter, FilterState } from '@/hooks/useFilters';

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
}: HeaderProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const renderRangeDropdown = (filterKey: string, label: string, minKey: string, maxKey: string) => (
    <div className="absolute top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[280px] z-50">
      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{label}</div>
      <div className="flex gap-2 items-center">
        <input
          type="number"
          placeholder="Min"
          value={filters[minKey as keyof FilterState] as string}
          onChange={(e) => onUpdateFilter(minKey, e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
        />
        <span className="text-gray-500 dark:text-gray-400 text-sm">to</span>
        <input
          type="number"
          placeholder="Max"
          value={filters[maxKey as keyof FilterState] as string}
          onChange={(e) => onUpdateFilter(maxKey, e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
        />
      </div>
    </div>
  );

  const renderSelectDropdown = (filterKey: string, label: string, options: { value: string; label: string }[]) => (
    <div className="absolute top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[200px] z-50">
      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{label}</div>
      <select
        value={filters[filterKey as keyof FilterState] as string}
        onChange={(e) => onUpdateFilter(filterKey, e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );

  const renderCheckboxDropdown = (filterKey: string, label: string, options: string[]) => (
    <div className="absolute top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[250px] max-w-[300px] z-50">
      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{label}</div>
      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
        {options.map((option) => (
          <label key={option} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded">
            <input
              type="checkbox"
              checked={(filters[filterKey as keyof FilterState] as string[]).includes(option)}
              onChange={() => onToggleArrayFilter(filterKey, option)}
              className="rounded text-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const getDropdownContent = (filter: ActiveFilter) => {
    switch (filter.key) {
      case 'price':
        return renderRangeDropdown('price', 'Price Range', 'priceMin', 'priceMax');
      case 'arv':
        return renderRangeDropdown('arv', 'ARV Range', 'arvMin', 'arvMax');
      case 'repair':
        return renderRangeDropdown('repair', 'Repair Estimates', 'repairMin', 'repairMax');
      case 'sqft':
        return renderRangeDropdown('sqft', 'Square Footage', 'sqftMin', 'sqftMax');
      case 'bedrooms':
        return renderSelectDropdown('bedrooms', 'Bedrooms', [
          { value: '', label: 'Any' },
          { value: '1', label: '1+' },
          { value: '2', label: '2+' },
          { value: '3', label: '3+' },
          { value: '4', label: '4+' },
          { value: '5', label: '5+' }
        ]);
      case 'bathrooms':
        return renderSelectDropdown('bathrooms', 'Bathrooms', [
          { value: '', label: 'Any' },
          { value: '1', label: '1+' },
          { value: '1.5', label: '1.5+' },
          { value: '2', label: '2+' },
          { value: '2.5', label: '2.5+' },
          { value: '3', label: '3+' }
        ]);
      case 'propertyTypes':
        return renderCheckboxDropdown('propertyTypes', 'Property Types', 
          ['Single Family', 'Multi-Family', 'Townhouse', 'Condo', 'Mobile Home', 'Land']
        );
      case 'dealQualities':
        return renderCheckboxDropdown('dealQualities', 'Deal Quality', 
          ['Great Deal', 'Good Deal', 'Fair Deal']
        );
      case 'propertyConditions':
        return renderCheckboxDropdown('propertyConditions', 'Property Condition', 
          ['Move-in Ready', 'Cosmetic Repairs', 'Major Repairs', 'Tear Down']
        );
      default:
        return null;
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col bg-white/80 dark:bg-black/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center p-6">
        <div className="flex-1">
          {/* Left side - can add logo or title here later */}
        </div>

        {/* Centered Search Bar */}
        <div className="flex justify-center flex-1">
          <div className="flex items-center gap-2 w-full max-w-lg">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Location or Seller"
                className="w-full px-4 py-2 pl-4 pr-10 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-gray-400"
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
              </div>
            </div>
            
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
          {/* User icon */}
          <div className="relative group">
            <button
              onClick={onUserIconClick}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path stroke="currentColor" strokeWidth="2" fill="none" d="M4 20c0-3.3137 3.134-6 7-6s7 2.6863 7 6"/>
              </svg>
            </button>
          </div>

          {/* Menu stack icon (hamburger menu) */}
          <div className="relative group">
            <button
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200">
              <div className="py-1">
                {isLoggedIn ? (
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Log out
                  </button>
                ) : (
                  <button
                    onClick={onLoginOption}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Log in or sign up
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bubbles Row */}
      {activeFilters.length > 0 && (
        <div className="flex justify-center px-6 pb-3">
          <div className="flex flex-wrap gap-2 justify-center max-w-4xl">
            {activeFilters.map((filter, index) => (
              <div
                key={index}
                className="relative flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
              >
                <button
                  onClick={() => {
                    setOpenDropdown(openDropdown === `filter-${index}` ? null : `filter-${index}`);
                  }}
                  className="hover:underline"
                >
                  {filter.label}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearFilter(filter.key);
                    setOpenDropdown(null);
                  }}
                  className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                
                {/* Individual Filter Dropdown */}
                {openDropdown === `filter-${index}` && (
                  <>
                    {/* Click-away overlay */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setOpenDropdown(null)}
                    />
                    {getDropdownContent(filter)}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
