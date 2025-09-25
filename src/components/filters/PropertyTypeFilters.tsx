import { FilterState } from '@/hooks/useFilters';

interface PropertyTypeFiltersProps {
  localFilters: FilterState;
  toggleLocalArrayFilter: (key: string, value: string) => void;
}

export default function PropertyTypeFilters({ localFilters, toggleLocalArrayFilter }: PropertyTypeFiltersProps) {
  const listingTypes = [
    { value: 'wholesale', label: 'Wholesale Deal' },
    { value: 'sale', label: 'For Sale' },
    { value: 'rent', label: 'For Rent' }
  ];

  const propertyTypes = [
    { value: 'house', label: 'Single Family House' },
    { value: 'duplex', label: 'Duplex' },
    { value: 'triplex', label: 'Triplex' },
    { value: 'fourplex', label: 'Fourplex' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'condo', label: 'Condo' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'land', label: 'Land' },
    { value: 'commercial', label: 'Commercial' }
  ];

  return (
    <div className="space-y-6">
      {/* Listing Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Listing Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          {listingTypes.map((type) => (
            <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localFilters.listingTypes.includes(type.value)}
                onChange={() => toggleLocalArrayFilter('listingTypes', type.value)}
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
          {propertyTypes.map((type) => (
            <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localFilters.propertyTypes.includes(type.value)}
                onChange={() => toggleLocalArrayFilter('propertyTypes', type.value)}
                className="rounded text-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{type.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
