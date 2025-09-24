'use client'
import { useEffect } from 'react';
import { FilterState } from '@/hooks/useFilters';

interface FilterPopupProps {
  isOpen: boolean;
  filters: FilterState;
  onClose: () => void;
  onUpdateFilter: (key: string, value: any) => void;
  onToggleArrayFilter: (key: string, value: string) => void;
  onResetFilters: () => void;
}

export default function FilterPopup({
  isOpen,
  filters,
  onClose,
  onUpdateFilter,
  onToggleArrayFilter,
  onResetFilters,
}: FilterPopupProps) {
  // Prevent body scroll when popup is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Dark overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      ></div>

      {/* Filter Popup */}
      <div className="fixed top-[53%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-[600px] max-w-[90vw] h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Filter Properties
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Price Range */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Price Range
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Min"
                value={filters.priceMin}
                onChange={(e) => onUpdateFilter('priceMin', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <span className="text-gray-500 dark:text-gray-400">to</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.priceMax}
                onChange={(e) => onUpdateFilter('priceMax', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* ARV Range */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              ARV (After Repair Value)
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Min ARV"
                value={filters.arvMin}
                onChange={(e) => onUpdateFilter('arvMin', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <span className="text-gray-500 dark:text-gray-400">to</span>
              <input
                type="number"
                placeholder="Max ARV"
                value={filters.arvMax}
                onChange={(e) => onUpdateFilter('arvMax', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Repair Estimates */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Estimated Repairs
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Min Repairs"
                value={filters.repairCostsMin}
                onChange={(e) => onUpdateFilter('repairCostsMin', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <span className="text-gray-500 dark:text-gray-400">to</span>
              <input
                type="number"
                placeholder="Max Repairs"
                value={filters.repairCostsMax}
                onChange={(e) => onUpdateFilter('repairCostsMax', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Listing Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Listing Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'wholesale', label: 'Wholesale Deal' },
                { value: 'sale', label: 'For Sale' },
                { value: 'rent', label: 'For Rent' }
              ].map((type) => (
                <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.listingTypes.includes(type.value)}
                    onChange={() => onToggleArrayFilter('listingTypes', type.value)}
                    className="rounded text-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Property Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Property Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'house', label: 'Single Family House' },
                { value: 'duplex', label: 'Duplex' },
                { value: 'triplex', label: 'Triplex' },
                { value: 'fourplex', label: 'Fourplex' },
                { value: 'townhouse', label: 'Townhouse' },
                { value: 'condo', label: 'Condo' },
                { value: 'apartment', label: 'Apartment' },
                { value: 'land', label: 'Land' },
                { value: 'commercial', label: 'Commercial' }
              ].map((type) => (
                <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.propertyTypes.includes(type.value)}
                    onChange={() => onToggleArrayFilter('propertyTypes', type.value)}
                    className="rounded text-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{type.label}</span>
                </label>
              ))}
            </div>
          </div>


          {/* Bedrooms/Bathrooms */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Bedrooms
              </label>
              <select 
                value={filters.bedrooms}
                onChange={(e) => onUpdateFilter('bedrooms', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Bathrooms
              </label>
              <select 
                value={filters.bathrooms}
                onChange={(e) => onUpdateFilter('bathrooms', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="1.5">1.5+</option>
                <option value="2">2+</option>
                <option value="2.5">2.5+</option>
                <option value="3">3+</option>
              </select>
            </div>
          </div>

          {/* Square Footage */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Square Footage
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Min Sq Ft"
                value={filters.squareFeetMin}
                onChange={(e) => onUpdateFilter('squareFeetMin', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <span className="text-gray-500 dark:text-gray-400">to</span>
              <input
                type="number"
                placeholder="Max Sq Ft"
                value={filters.squareFeetMax}
                onChange={(e) => onUpdateFilter('squareFeetMax', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Property Condition */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Property Condition
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'excellent', label: 'Excellent' },
                { value: 'good', label: 'Good' },
                { value: 'fair', label: 'Fair' },
                { value: 'needs-cosmetic', label: 'Needs Cosmetic Work' },
                { value: 'needs-full-rehab', label: 'Needs Full Rehab' },
                { value: 'tear-down', label: 'Tear Down' }
              ].map((condition) => (
                <label key={condition.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.propertyConditions.includes(condition.value)}
                    onChange={() => onToggleArrayFilter('propertyConditions', condition.value)}
                    className="rounded text-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{condition.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Occupancy Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Occupancy Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'vacant', label: 'Vacant' },
                { value: 'owner-occupied', label: 'Owner Occupied' },
                { value: 'tenant-occupied', label: 'Tenant Occupied' },
                { value: 'partially-occupied', label: 'Partially Occupied' }
              ].map((status) => (
                <label key={status.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.occupancyStatuses.includes(status.value)}
                    onChange={() => onToggleArrayFilter('occupancyStatuses', status.value)}
                    className="rounded text-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{status.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Financing Options */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Financing Options
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'cash-only', label: 'Cash Only' },
                { value: 'seller-financing', label: 'Seller Financing' },
                { value: 'hard-money', label: 'Hard Money' },
                { value: 'conventional', label: 'Conventional' },
                { value: 'private-money', label: 'Private Money' }
              ].map((option) => (
                <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.financingOptions.includes(option.value)}
                    onChange={() => onToggleArrayFilter('financingOptions', option.value)}
                    className="rounded text-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Actions */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              onResetFilters();
              onClose();
            }}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
          >
            Reset Filters
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-semibold"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
