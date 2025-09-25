import { FilterState } from '@/hooks/useFilters';

interface PriceFiltersProps {
  localFilters: FilterState;
  updateLocalFilter: (key: string, value: any) => void;
}

export default function PriceFilters({ localFilters, updateLocalFilter }: PriceFiltersProps) {
  return (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Price Range
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={localFilters.priceMin}
            onChange={(e) => updateLocalFilter('priceMin', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <span className="text-gray-500 dark:text-gray-400">to</span>
          <input
            type="number"
            placeholder="Max"
            value={localFilters.priceMax}
            onChange={(e) => updateLocalFilter('priceMax', e.target.value)}
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
            value={localFilters.arvMin}
            onChange={(e) => updateLocalFilter('arvMin', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <span className="text-gray-500 dark:text-gray-400">to</span>
          <input
            type="number"
            placeholder="Max ARV"
            value={localFilters.arvMax}
            onChange={(e) => updateLocalFilter('arvMax', e.target.value)}
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
            value={localFilters.repairCostsMin}
            onChange={(e) => updateLocalFilter('repairCostsMin', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <span className="text-gray-500 dark:text-gray-400">to</span>
          <input
            type="number"
            placeholder="Max Repairs"
            value={localFilters.repairCostsMax}
            onChange={(e) => updateLocalFilter('repairCostsMax', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
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
            value={localFilters.squareFeetMin}
            onChange={(e) => updateLocalFilter('squareFeetMin', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <span className="text-gray-500 dark:text-gray-400">to</span>
          <input
            type="number"
            placeholder="Max Sq Ft"
            value={localFilters.squareFeetMax}
            onChange={(e) => updateLocalFilter('squareFeetMax', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>
    </div>
  );
}
