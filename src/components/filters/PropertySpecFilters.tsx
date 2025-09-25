import { FilterState } from '@/hooks/useFilters';

interface PropertySpecFiltersProps {
  localFilters: FilterState;
  updateLocalFilter: (key: string, value: any) => void;
}

export default function PropertySpecFilters({ localFilters, updateLocalFilter }: PropertySpecFiltersProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Bedrooms
        </label>
        <select 
          value={localFilters.bedrooms}
          onChange={(e) => updateLocalFilter('bedrooms', e.target.value)}
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
          value={localFilters.bathrooms}
          onChange={(e) => updateLocalFilter('bathrooms', e.target.value)}
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
  );
}
