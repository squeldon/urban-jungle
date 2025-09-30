'use client'
import { useEffect, useMemo, useState } from 'react';
import { FilterState } from '@/hooks/useFilters';
import { useAuthContext } from '@/context/AuthContext';
import {
  getFilterPresets,
  saveFilterPreset,
  deleteFilterPreset,
  FilterPreset,
} from '@/lib/db/filterPresets';

import FilterPresets from './FilterPresets';
import PriceFilters from './PriceFilters';
import PropertyTypeFilters from './PropertyTypeFilters';
import PropertySpecFilters from './PropertySpecFilters';
import ConditionFilters from './ConditionFilters';
import FinancingFilters from './FinancingFilters';
import FilterActions from './FilterActions';

interface FilterPopupProps {
  isOpen: boolean;
  filters: FilterState;
  onClose: () => void;
  onUpdateFilter: (key: string, value: any) => void;
  onToggleArrayFilter: (key: string, value: string) => void;
  onResetFilters: () => void;
  onReplaceFilters: (nextFilters: FilterState) => void;
}

export default function FilterPopup({
  isOpen,
  filters,
  onClose,
  onUpdateFilter,
  onToggleArrayFilter,
  onResetFilters,
  onReplaceFilters,
}: FilterPopupProps) {
  const { user } = useAuthContext() as { user: any };
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [isPresetNameFormOpen, setIsPresetNameFormOpen] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Local state for temporary filter changes
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  // Initialize local filters ONLY when popup opens (not on every filter change)
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen]);

  // Prevent body scroll when popup is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Preload filter presets when user is authenticated (not waiting for popup to open)
  useEffect(() => {
    let isMounted = true;

    async function loadPresets() {
      if (!user) {
        setPresets([]);
        return;
      }

      setIsLoadingPresets(true);
      setErrorMessage(null);
      try {
        const fetchedPresets = await getFilterPresets(user.id);
        if (isMounted) {
          setPresets(fetchedPresets);
        }
      } catch (error) {
        console.error('Failed to load filter presets:', error);
        if (isMounted) {
          setErrorMessage('Unable to load saved options right now.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingPresets(false);
        }
      }
    }

    loadPresets();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const hasAuth = useMemo(() => Boolean(user?.id), [user]);

  // Calculate if current filters would exceed Firebase disjunction limit
  const calculateDisjunctionRisk = useMemo(() => {
    let totalCombinations = 1;
    
    // Each array filter with selections multiplies the combinations
    if (localFilters.propertyTypes.length > 0) {
      totalCombinations *= localFilters.propertyTypes.length;
    }
    
    if (localFilters.propertyConditions.length > 0) {
      totalCombinations *= localFilters.propertyConditions.length;
    }
    
    if (localFilters.occupancyStatuses.length > 0) {
      totalCombinations *= localFilters.occupancyStatuses.length;
    }
    
    if (localFilters.financingOptions.length > 0) {
      totalCombinations *= localFilters.financingOptions.length;
    }
    
    // Also account for listing types if multiple selected
    if (localFilters.listingTypes.length > 1) {
      totalCombinations *= localFilters.listingTypes.length;
    }
    
    return totalCombinations;
  }, [localFilters]);

  // Check if we're at risk of exceeding the 30 disjunction limit
  const exceedsDisjunctionLimit = useMemo(() => {
    return calculateDisjunctionRisk > 25; // Use 25 as safety margin
  }, [calculateDisjunctionRisk]);

  // Local filter update functions
  const updateLocalFilter = (key: string, value: any) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleLocalArrayFilter = (key: string, value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: prev[key as keyof typeof prev].includes(value)
        ? (prev[key as keyof typeof prev] as string[]).filter(item => item !== value)
        : [...(prev[key as keyof typeof prev] as string[]), value]
    }));
  };

  const handleApplyPreset = (preset: FilterPreset) => {
    setLocalFilters(preset.filters);
  };

  const handleDeletePreset = async (presetId: string) => {
    try {
      await deleteFilterPreset(user.id, presetId);
      setPresets((current) => current.filter((preset) => preset.id !== presetId));
    } catch (error) {
      // Error handling is managed by the hook
    }
  };

  const handleOpenPresetForm = () => {
    setIsPresetNameFormOpen(true);
    setPresetNameInput('');
  };

  const handleCancelPresetForm = () => {
    setIsPresetNameFormOpen(false);
    setPresetNameInput('');
  };

  const handleSavePreset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user?.id) {
      setErrorMessage('You need an account to save presets.');
      return;
    }

    const presetName = presetNameInput.trim();
    if (!presetName) {
      return;
    }

    setIsSavingPreset(true);

    try {
      const existingPreset = presets.find(
        (preset) => preset.name.toLowerCase() === presetName.toLowerCase()
      );

      const presetId = await saveFilterPreset(user.id, presetName, localFilters, existingPreset?.id);
      const updatedPreset: FilterPreset = {
        id: presetId,
        name: presetName,
        filters: localFilters,
        createdAt: existingPreset?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      setPresets((current) => {
        if (existingPreset) {
          return current.map((preset) => (preset.id === existingPreset.id ? updatedPreset : preset));
        }
        return [updatedPreset, ...current];
      });
      setIsPresetNameFormOpen(false);
      setPresetNameInput('');
    } catch (error) {
      // Error handling is managed by the hook
    } finally {
      setIsSavingPreset(false);
    }
  };

  const handleApplyFilters = () => {
    onReplaceFilters(localFilters);
    onClose();
  };

  const handleResetFilters = () => {
    onResetFilters();
    onClose();
  };

  const handleCancelChanges = () => {
    // Reset local filters to the original filters (discard changes)
    setLocalFilters(filters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Dark overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={handleCancelChanges}
      ></div>

      {/* Filter Popup */}
      <div className="fixed top-[53%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 pt-2 w-[600px] max-w-[90vw] h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Filter Properties
          </h2>
          {errorMessage && (
            <span className="text-sm text-red-500 dark:text-red-400">{errorMessage}</span>
          )}
          <button
            onClick={handleCancelChanges}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Saved Presets */}
          <FilterPresets 
            hasAuth={hasAuth}
            presets={presets}
            isLoadingPresets={isLoadingPresets}
            onApplyPreset={handleApplyPreset}
            onDeletePreset={handleDeletePreset}
            onOpenPresetForm={handleOpenPresetForm}
          />

          {/* Price/ARV/Repair/Square Footage Filters */}
          <PriceFilters 
            localFilters={localFilters}
            updateLocalFilter={updateLocalFilter}
          />

          {/* Listing Type and Property Type */}
          <PropertyTypeFilters 
            localFilters={localFilters}
            toggleLocalArrayFilter={toggleLocalArrayFilter}
          />

          {/* Bedrooms/Bathrooms */}
          <PropertySpecFilters 
            localFilters={localFilters}
            updateLocalFilter={updateLocalFilter}
          />

          {/* Property Condition and Occupancy Status */}
          <ConditionFilters 
            localFilters={localFilters}
            toggleLocalArrayFilter={toggleLocalArrayFilter}
          />

          {/* Financing Options */}
          <FinancingFilters 
            localFilters={localFilters}
            toggleLocalArrayFilter={toggleLocalArrayFilter}
          />
        </div>

        {/* Filter Actions */}
        <FilterActions 
          hasAuth={hasAuth}
          exceedsDisjunctionLimit={exceedsDisjunctionLimit}
          calculateDisjunctionRisk={calculateDisjunctionRisk}
          isPresetNameFormOpen={isPresetNameFormOpen}
          presetNameInput={presetNameInput}
          isSavingPreset={isSavingPreset}
          onOpenPresetForm={handleOpenPresetForm}
          onCancelPresetForm={handleCancelPresetForm}
          onSavePreset={handleSavePreset}
          onPresetNameChange={setPresetNameInput}
          onResetFilters={handleResetFilters}
          onApplyFilters={handleApplyFilters}
        />
      </div>
    </>
  );
}
