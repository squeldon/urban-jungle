import { FilterState } from '@/hooks/useFilters';

interface ConditionFiltersProps {
  localFilters: FilterState;
  toggleLocalArrayFilter: (key: string, value: string) => void;
}

export default function ConditionFilters({ localFilters, toggleLocalArrayFilter }: ConditionFiltersProps) {
  const propertyConditions = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'needs-cosmetic', label: 'Needs Cosmetic Work' },
    { value: 'needs-full-rehab', label: 'Needs Full Rehab' },
    { value: 'tear-down', label: 'Tear Down' }
  ];

  const occupancyStatuses = [
    { value: 'vacant', label: 'Vacant' },
    { value: 'owner-occupied', label: 'Owner Occupied' },
    { value: 'tenant-occupied', label: 'Tenant Occupied' },
    { value: 'partially-occupied', label: 'Partially Occupied' }
  ];

  return (
    <div className="space-y-6">
      {/* Property Condition */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Property Condition
        </label>
        <div className="grid grid-cols-2 gap-2">
          {propertyConditions.map((condition) => (
            <label key={condition.value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localFilters.propertyConditions.includes(condition.value)}
                onChange={() => toggleLocalArrayFilter('propertyConditions', condition.value)}
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
          {occupancyStatuses.map((status) => (
            <label key={status.value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localFilters.occupancyStatuses.includes(status.value)}
                onChange={() => toggleLocalArrayFilter('occupancyStatuses', status.value)}
                className="rounded text-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{status.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
