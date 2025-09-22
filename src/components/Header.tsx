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
  squareSize: number;
  onUserIconClick: () => void;
  onLoginOption: () => void;
  onToggleFilter: () => void;
  onToggleMap: () => void;
  onClearFilter: (key: string) => void;
  onUpdateFilter: (key: string, value: any) => void;
  onToggleArrayFilter: (key: string, value: string) => void;
  onLogout: () => void;
  onSquareSizeChange: (size: number) => void;
}

export default function Header({
  isLoggedIn,
  showFilterPopup,
  showMapPanel,
  activeFilters,
  filters,
  squareSize,
  onUserIconClick,
  onLoginOption,
  onToggleFilter,
  onToggleMap,
  onClearFilter,
  onUpdateFilter,
  onToggleArrayFilter,
  onLogout,
  onSquareSizeChange,
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
        <div className="flex-1 flex items-center">
          {/* Grid Size Buttons */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {/* Large squares */}
              <button
                onClick={() => onSquareSizeChange(430)}
                className={`p-2 rounded-lg transition-colors ${
                  squareSize == 430 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Large squares"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></rect>
                </svg>
              </button>
              
              {/* Medium squares */}
              <button
                onClick={() => onSquareSizeChange(265)}
                className={`p-2 rounded-lg transition-colors ${
                  squareSize == 265
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Medium squares"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 10.9023 26.0664 L 21.5898 26.0664 C 24.5663 26.0664 26.0663 24.5664 26.0663 21.4727 L 26.0663 10.9961 C 26.0663 7.9023 24.5663 6.4258 21.5898 6.4258 L 10.9023 6.4258 C 7.9257 6.4258 6.4257 7.9023 6.4257 10.9961 L 6.4257 21.4727 C 6.4257 24.5664 7.9257 26.0664 10.9023 26.0664 Z M 34.4335 26.0664 L 45.0976 26.0664 C 48.0976 26.0664 49.5743 24.5664 49.5743 21.4727 L 49.5743 10.9961 C 49.5743 7.9023 48.0976 6.4258 45.0976 6.4258 L 34.4335 6.4258 C 31.4570 6.4258 29.9570 7.9023 29.9570 10.9961 L 29.9570 21.4727 C 29.9570 24.5664 31.4570 26.0664 34.4335 26.0664 Z M 10.9492 22.7617 C 10.1288 22.7617 9.7304 22.3398 9.7304 21.4727 L 9.7304 10.9961 C 9.7304 10.1523 10.1288 9.7305 10.9492 9.7305 L 21.5195 9.7305 C 22.3398 9.7305 22.7617 10.1523 22.7617 10.9961 L 22.7617 21.4727 C 22.7617 22.3398 22.3398 22.7617 21.5195 22.7617 Z M 34.4804 22.7617 C 33.6601 22.7617 33.2617 22.3398 33.2617 21.4727 L 33.2617 10.9961 C 33.2617 10.1523 33.6601 9.7305 34.4804 9.7305 L 45.0742 9.7305 C 45.8710 9.7305 46.2695 10.1523 46.2695 10.9961 L 46.2695 21.4727 C 46.2695 22.3398 45.8710 22.7617 45.0742 22.7617 Z M 10.9023 49.5742 L 21.5898 49.5742 C 24.5663 49.5742 26.0663 48.0977 26.0663 45.0039 L 26.0663 34.5039 C 26.0663 31.4336 24.5663 29.9336 21.5898 29.9336 L 10.9023 29.9336 C 7.9257 29.9336 6.4257 31.4336 6.4257 34.5039 L 6.4257 45.0039 C 6.4257 48.0977 7.9257 49.5742 10.9023 49.5742 Z M 34.4335 49.5742 L 45.0976 49.5742 C 48.0976 49.5742 49.5743 48.0977 49.5743 45.0039 L 49.5743 34.5039 C 49.5743 31.4336 48.0976 29.9336 45.0976 29.9336 L 34.4335 29.9336 C 31.4570 29.9336 29.9570 31.4336 29.9570 34.5039 L 29.9570 45.0039 C 29.9570 48.0977 31.4570 49.5742 34.4335 49.5742 Z M 10.9492 46.2695 C 10.1288 46.2695 9.7304 45.8477 9.7304 45.0039 L 9.7304 34.5274 C 9.7304 33.6602 10.1288 33.2383 10.9492 33.2383 L 21.5195 33.2383 C 22.3398 33.2383 22.7617 33.6602 22.7617 34.5274 L 22.7617 45.0039 C 22.7617 45.8477 22.3398 46.2695 21.5195 46.2695 Z M 34.4804 46.2695 C 33.6601 46.2695 33.2617 45.8477 33.2617 45.0039 L 33.2617 34.5274 C 33.2617 33.6602 33.6601 33.2383 34.4804 33.2383 L 45.0742 33.2383 C 45.8710 33.2383 46.2695 33.6602 46.2695 34.5274 L 46.2695 45.0039 C 46.2695 45.8477 45.8710 46.2695 45.0742 46.2695 Z"></path>
                </svg>
              </button>
              
              {/* Small squares */}
              <button
                onClick={() => onSquareSizeChange(175)}
                className={`p-2 rounded-lg transition-colors ${
                  squareSize == 175
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Small squares"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 43.2646 27.6955 L 52.2405 27.6955 C 54.7402 27.6955 56.0000 26.4357 56.0000 23.8375 L 56.0000 15.0389 C 56.0000 12.4406 54.7402 11.2005 52.2405 11.2005 L 43.2646 11.2005 C 40.7648 11.2005 39.5051 12.4406 39.5051 15.0389 L 39.5051 23.8375 C 39.5051 26.4357 40.7648 27.6955 43.2646 27.6955 Z M 3.7596 27.6955 L 12.7353 27.6955 C 15.2351 27.6955 16.4949 26.4357 16.4949 23.8375 L 16.4949 15.0389 C 16.4949 12.4406 15.2351 11.2005 12.7353 11.2005 L 3.7596 11.2005 C 1.2598 11.2005 0 12.4406 0 15.0389 L 0 23.8375 C 0 26.4357 1.2598 27.6955 3.7596 27.6955 Z M 23.5220 27.6955 L 32.4781 27.6955 C 34.9976 27.6955 36.2378 26.4357 36.2378 23.8375 L 36.2378 15.0389 C 36.2378 12.4406 34.9976 11.2005 32.4781 11.2005 L 23.5220 11.2005 C 21.0222 11.2005 19.7624 12.4406 19.7624 15.0389 L 19.7624 23.8375 C 19.7624 26.4357 21.0222 27.6955 23.5220 27.6955 Z M 3.7989 24.9201 C 3.1100 24.9201 2.7754 24.5658 2.7754 23.8375 L 2.7754 15.0389 C 2.7754 14.3302 3.1100 13.9759 3.7989 13.9759 L 12.6763 13.9759 C 13.3652 13.9759 13.7195 14.3302 13.7195 15.0389 L 13.7195 23.8375 C 13.7195 24.5658 13.3652 24.9201 12.6763 24.9201 Z M 23.5613 24.9201 C 22.8725 24.9201 22.5378 24.5658 22.5378 23.8375 L 22.5378 15.0389 C 22.5378 14.3302 22.8725 13.9759 23.5613 13.9759 L 32.4584 13.9759 C 33.1276 13.9759 33.4623 14.3302 33.4623 15.0389 L 33.4623 23.8375 C 33.4623 24.5658 33.1276 24.9201 32.4584 24.9201 Z M 43.3041 24.9201 C 42.6151 24.9201 42.2806 24.5658 42.2806 23.8375 L 42.2806 15.0389 C 42.2806 14.3302 42.6151 13.9759 43.3041 13.9759 L 52.1816 13.9759 C 52.8899 13.9759 53.2245 14.3302 53.2245 15.0389 L 53.2245 23.8375 C 53.2245 24.5658 52.8899 24.9201 52.1816 24.9201 Z M 3.7596 47.4382 L 12.7353 47.4382 C 15.2351 47.4382 16.4949 46.1981 16.4949 43.5999 L 16.4949 34.7816 C 16.4949 32.2031 15.2351 30.9433 12.7353 30.9433 L 3.7596 30.9433 C 1.2598 30.9433 0 32.2031 0 34.7816 L 0 43.5999 C 0 46.1981 1.2598 47.4382 3.7596 47.4382 Z M 23.5220 47.4382 L 32.4781 47.4382 C 34.9976 47.4382 36.2378 46.1981 36.2378 43.5999 L 36.2378 34.7816 C 36.2378 32.2031 34.9976 30.9433 32.4781 30.9433 L 23.5220 30.9433 C 21.0222 30.9433 19.7624 32.2031 19.7624 34.7816 L 19.7624 43.5999 C 19.7624 46.1981 21.0222 47.4382 23.5220 47.4382 Z M 43.2646 47.4382 L 52.2405 47.4382 C 54.7402 47.4382 56.0000 46.1981 56.0000 43.5999 L 56.0000 34.7816 C 56.0000 32.2031 54.7402 30.9433 52.2405 30.9433 L 43.2646 30.9433 C 40.7648 30.9433 39.5051 32.2031 39.5051 34.7816 L 39.5051 43.5999 C 39.5051 46.1981 40.7648 47.4382 43.2646 47.4382 Z M 3.7989 44.6628 C 3.1100 44.6628 2.7754 44.3085 2.7754 43.5999 L 2.7754 34.8013 C 2.7754 34.0730 3.1100 33.7187 3.7989 33.7187 L 12.6763 33.7187 C 13.3652 33.7187 13.7195 34.0730 13.7195 34.8013 L 13.7195 43.5999 C 13.7195 44.3085 13.3652 44.6628 12.6763 44.6628 Z M 23.5613 44.6628 C 22.8725 44.6628 22.5378 44.3085 22.5378 43.5999 L 22.5378 34.8013 C 22.5378 34.0730 22.8725 33.7187 23.5613 33.7187 L 32.4584 33.7187 C 33.1276 33.7187 33.4623 34.0730 33.4623 34.8013 L 33.4623 43.5999 C 33.4623 44.3085 33.1276 44.6628 32.4584 44.6628 Z M 43.3041 44.6628 C 42.6151 44.6628 42.2806 44.3085 42.2806 43.5999 L 42.2806 34.8013 C 42.2806 34.0730 42.6151 33.7187 43.3041 33.7187 L 52.1816 33.7187 C 52.8899 33.7187 53.2245 34.0730 53.2245 34.8013 L 53.2245 43.5999 C 53.2245 44.3085 52.8899 44.6628 52.1816 44.6628 Z"></path>
                </svg>
              </button>
            </div>
          </div>
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
