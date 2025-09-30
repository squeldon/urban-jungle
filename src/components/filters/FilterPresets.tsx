import { useState } from 'react';
import { FilterState } from '@/hooks/useFilters';
import { FilterPreset } from '@/lib/db/filterPresets';

interface FilterPresetsProps {
  hasAuth: boolean;
  presets: FilterPreset[];
  isLoadingPresets: boolean;
  onApplyPreset: (preset: FilterPreset) => void;
  onDeletePreset: (presetId: string) => void;
  onOpenPresetForm: () => void;
}

export default function FilterPresets({
  hasAuth,
  presets,
  isLoadingPresets,
  onApplyPreset,
  onDeletePreset,
  onOpenPresetForm
}: FilterPresetsProps) {
  if (!hasAuth) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Saved Filter Options
        </span>
        {isLoadingPresets && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Loading...
          </span>
        )}
      </div>
      {presets.length === 0 && !isLoadingPresets ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No presets saved yet.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="relative flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
            >
              <button
                onClick={() => onApplyPreset(preset)}
                className="hover:underline"
              >
                {preset.name}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePreset(preset.id);
                }}
                className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                title="Delete preset"
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
