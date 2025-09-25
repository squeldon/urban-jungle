import { FilterState } from '@/hooks/useFilters';

interface FilterDropdownsProps {
  filters: FilterState;
  getCurrentFilterValue: (key: string) => any;
  updateTempFilter: (key: string, value: any) => void;
  toggleTempArrayFilter: (key: string, value: string) => void;
  applyTempFilters: () => void;
}

export default function FilterDropdowns({
  filters,
  getCurrentFilterValue,
  updateTempFilter,
  toggleTempArrayFilter,
  applyTempFilters
}: FilterDropdownsProps) {
  
  const renderRangeDropdown = (filterKey: string, label: string, minKey: string, maxKey: string) => (
    <div className="absolute top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[280px] z-50">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</div>
        <button
          onClick={applyTempFilters}
          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors"
        >
          Apply
        </button>
      </div>
      <div className="flex gap-2 items-center">
        <input
          type="number"
          placeholder="Min"
          value={getCurrentFilterValue(minKey) as string}
          onChange={(e) => updateTempFilter(minKey, e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
        />
        <span className="text-gray-500 dark:text-gray-400 text-sm">to</span>
        <input
          type="number"
          placeholder="Max"
          value={getCurrentFilterValue(maxKey) as string}
          onChange={(e) => updateTempFilter(maxKey, e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
        />
      </div>
    </div>
  );

  const renderSelectDropdown = (filterKey: string, label: string, options: { value: string; label: string }[]) => (
    <div className="absolute top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[200px] z-50">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</div>
        <button
          onClick={applyTempFilters}
          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors"
        >
          Apply
        </button>
      </div>
      <select
        value={getCurrentFilterValue(filterKey) as string}
        onChange={(e) => updateTempFilter(filterKey, e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );

  const renderCheckboxDropdown = (filterKey: string, label: string, options: { value: string; label: string }[]) => (
    <div className="absolute top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[250px] max-w-[300px] z-50">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</div>
        <button
          onClick={applyTempFilters}
          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors"
        >
          Apply
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
        {options.map((option) => (
          <label key={option.value} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded">
            <input
              type="checkbox"
              checked={(getCurrentFilterValue(filterKey) as string[])?.includes(option.value) || false}
              onChange={() => toggleTempArrayFilter(filterKey, option.value)}
              className="rounded text-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const getDropdownContent = (filterKey: string) => {
    switch (filterKey) {
      case 'price':
        return renderRangeDropdown('price', 'Price Range', 'priceMin', 'priceMax');
      case 'arv':
        return renderRangeDropdown('arv', 'ARV Range', 'arvMin', 'arvMax');
      case 'repairCosts':
        return renderRangeDropdown('repairCosts', 'Repair Estimates', 'repairCostsMin', 'repairCostsMax');
      case 'squareFeet':
        return renderRangeDropdown('squareFeet', 'Square Footage', 'squareFeetMin', 'squareFeetMax');
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
        return renderCheckboxDropdown('propertyTypes', 'Property Types', [
          { value: 'house', label: 'Single Family House' },
          { value: 'duplex', label: 'Duplex' },
          { value: 'triplex', label: 'Triplex' },
          { value: 'fourplex', label: 'Fourplex' },
          { value: 'townhouse', label: 'Townhouse' },
          { value: 'condo', label: 'Condo' },
          { value: 'apartment', label: 'Apartment' },
          { value: 'land', label: 'Land' },
          { value: 'commercial', label: 'Commercial' }
        ]);
      case 'listingTypes':
        return renderCheckboxDropdown('listingTypes', 'Listing Types', [
          { value: 'wholesale', label: 'Wholesale Deal' },
          { value: 'sale', label: 'For Sale' },
          { value: 'rent', label: 'For Rent' }
        ]);
      case 'propertyConditions':
        return renderCheckboxDropdown('propertyConditions', 'Property Condition', [
          { value: 'excellent', label: 'Excellent' },
          { value: 'good', label: 'Good' },
          { value: 'fair', label: 'Fair' },
          { value: 'needs-cosmetic', label: 'Needs Cosmetic Work' },
          { value: 'needs-full-rehab', label: 'Needs Full Rehab' },
          { value: 'tear-down', label: 'Tear Down' }
        ]);
      case 'occupancyStatuses':
        return renderCheckboxDropdown('occupancyStatuses', 'Occupancy Status', [
          { value: 'vacant', label: 'Vacant' },
          { value: 'owner-occupied', label: 'Owner Occupied' },
          { value: 'tenant-occupied', label: 'Tenant Occupied' },
          { value: 'partially-occupied', label: 'Partially Occupied' }
        ]);
      case 'financingOptions':
        return renderCheckboxDropdown('financingOptions', 'Financing Options', [
          { value: 'cash-only', label: 'Cash Only' },
          { value: 'seller-financing', label: 'Seller Financing' },
          { value: 'hard-money', label: 'Hard Money' },
          { value: 'conventional', label: 'Conventional' },
          { value: 'private-money', label: 'Private Money' }
        ]);
      default:
        return null;
    }
  };

  return { getDropdownContent };
}
