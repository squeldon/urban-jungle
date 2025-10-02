import { ActiveFilter } from '@/hooks/useFilters';

interface FilterBubblesProps {
  activeFilters: ActiveFilter[];
  openDropdown: string | null;
  onFilterClick: (index: number) => void;
  onClearFilter: (key: string) => void;
  getDropdownContent: (filterKey: string) => React.ReactNode;
}

export default function FilterBubbles({
  activeFilters,
  openDropdown,
  onFilterClick,
  onClearFilter,
  getDropdownContent
}: FilterBubblesProps) {
  if (activeFilters.length === 0) return null;

  return (
    <div className="px-6 pb-3 overflow-x-auto [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0 hover:[&::-webkit-scrollbar]:w-2 hover:[&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
      <div className="inline-flex flex-nowrap gap-2">
        {activeFilters.map((filter, index) => (
          <div
            key={index}
              className="relative flex flex-shrink-0 items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"          >
            <button
              onClick={() => onFilterClick(index)}
              className="hover:underline"
            >
              {filter.label}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearFilter(filter.key);
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
                  onClick={() => onFilterClick(-1)} // Close dropdown
                />
                {getDropdownContent(filter.key)}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
