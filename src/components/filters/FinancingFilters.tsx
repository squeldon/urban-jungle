import { FilterState } from '@/hooks/useFilters';

interface FinancingFiltersProps {
  localFilters: FilterState;
  toggleLocalArrayFilter: (key: string, value: string) => void;
}

export default function FinancingFilters({ localFilters, toggleLocalArrayFilter }: FinancingFiltersProps) {
  const financingOptions = [
    { value: 'cash-only', label: 'Cash Only' },
    { value: 'seller-financing', label: 'Seller Financing' },
    { value: 'hard-money', label: 'Hard Money' },
    { value: 'conventional', label: 'Conventional' },
    { value: 'private-money', label: 'Private Money' }
  ];

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Financing Options
      </label>
      <div className="grid grid-cols-2 gap-2">
        {financingOptions.map((option) => (
          <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localFilters.financingOptions.includes(option.value)}
              onChange={() => toggleLocalArrayFilter('financingOptions', option.value)}
              className="rounded text-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
