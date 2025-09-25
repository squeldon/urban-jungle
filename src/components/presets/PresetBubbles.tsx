import { ListingPreset } from '@/types/listing';
import { X } from 'lucide-react';

interface PresetBubblesProps {
  presets: ListingPreset[];
  onPresetClick: (preset: ListingPreset) => void;
  onDeletePreset: (presetId: string) => void;
  loading?: boolean;
}

export default function PresetBubbles({
  presets,
  onPresetClick,
  onDeletePreset,
  loading = false
}: PresetBubblesProps) {
  if (presets.length === 0 && !loading) return null;

  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Saved Presets
      </h4>
      
      {loading ? (
        <div className="flex gap-2">
          {/* Loading skeleton */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full h-8 w-24"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="relative flex items-center gap-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm group"
            >
              <button
                type="button"
                onClick={() => onPresetClick(preset)}
                className="hover:underline flex-1 text-left"
                title={preset.description || `Load preset: ${preset.name}`}
              >
                {preset.name}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePreset(preset.id);
                }}
                className="ml-1 hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete preset"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
