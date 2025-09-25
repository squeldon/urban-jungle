import { FilterState } from '@/hooks/useFilters';

interface FilterActionsProps {
  hasAuth: boolean;
  exceedsDisjunctionLimit: boolean;
  calculateDisjunctionRisk: number;
  isPresetNameFormOpen: boolean;
  presetNameInput: string;
  isSavingPreset: boolean;
  onOpenPresetForm: () => void;
  onCancelPresetForm: () => void;
  onSavePreset: (event: React.FormEvent<HTMLFormElement>) => void;
  onPresetNameChange: (value: string) => void;
  onResetFilters: () => void;
  onApplyFilters: () => void;
}

export default function FilterActions({
  hasAuth,
  exceedsDisjunctionLimit,
  calculateDisjunctionRisk,
  isPresetNameFormOpen,
  presetNameInput,
  isSavingPreset,
  onOpenPresetForm,
  onCancelPresetForm,
  onSavePreset,
  onPresetNameChange,
  onResetFilters,
  onApplyFilters
}: FilterActionsProps) {
  return (
    <div className="flex flex-col gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
      {/* Preset Name Form */}
      {isPresetNameFormOpen && (
        <div className="mb-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={onSavePreset} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Preset Name
              </label>
              <input
                type="text"
                value={presetNameInput}
                onChange={(e) => onPresetNameChange(e.target.value)}
                placeholder="Enter preset name..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancelPresetForm}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingPreset || !presetNameInput.trim()}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingPreset ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Warning message when too many filters are selected */}
      {exceedsDisjunctionLimit && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm text-amber-800 dark:text-amber-200 font-medium">
              Please select fewer filters to continue
            </span>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 ml-7">
            Too many filter combinations selected ({calculateDisjunctionRisk} combinations). Maximum is 25.
          </p>
        </div>
      )}
      
      <div className="flex gap-3">
        <button
          onClick={hasAuth ? onOpenPresetForm : undefined}
          className="flex-1 px-4 py-2 border border-blue-500 text-blue-600 dark:text-blue-300 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors font-semibold disabled:opacity-60"
          disabled={!hasAuth || exceedsDisjunctionLimit}
          title={!hasAuth ? 'Sign in to save options' : exceedsDisjunctionLimit ? 'Too many filters selected' : 'Save current filters'}
        >
          Save Options
        </button>
        <button
          onClick={onResetFilters}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
        >
          Reset Filters
        </button>
        <button
          onClick={onApplyFilters}
          disabled={exceedsDisjunctionLimit}
          className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
          title={exceedsDisjunctionLimit ? 'Too many filters selected - please reduce the number of selected options' : 'Apply current filters'}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
