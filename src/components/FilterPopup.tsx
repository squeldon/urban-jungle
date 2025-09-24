'use client'
import { useEffect, useMemo, useState } from 'react';
import { FilterState } from '@/hooks/useFilters';
import { useAuthContext } from '@/context/AuthContext';
import {
  getFilterPresets,
  saveFilterPreset,
  deleteFilterPreset,
  FilterPreset,
} from '@/lib/firestore/filterPresets';

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
  const { user } = useAuthContext() as { user: { uid: string } | null };
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPresetNameFormOpen, setIsPresetNameFormOpen] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  
  // Local state for temporary filter changes
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  // Initialize local filters when popup opens
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

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

  // Load presets when popup opens and user is authenticated
  useEffect(() => {
    let isMounted = true;

    async function loadPresets() {
      if (!user || !isOpen) {
        setPresets([]);
        return;
      }

      setIsLoadingPresets(true);
      setErrorMessage(null);
      try {
        const fetchedPresets = await getFilterPresets(user.uid);
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
  }, [user, isOpen]);

  const hasAuth = useMemo(() => Boolean(user?.uid), [user]);

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
    if (!user?.uid) {
      return;
    }

    try {
      await deleteFilterPreset(user.uid, presetId);
      setPresets((current) => current.filter((preset) => preset.id !== presetId));
    } catch (error) {
      console.error('Failed to delete preset', error);
      setErrorMessage('Could not delete preset. Please try again.');
    }
  };

  const handleOpenPresetForm = () => {
    setIsPresetNameFormOpen(true);
    setPresetNameInput('');
    setErrorMessage(null);
  };

  const handleCancelPresetForm = () => {
    setIsPresetNameFormOpen(false);
    setPresetNameInput('');
  };

  const handleSavePreset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user?.uid) {
      setErrorMessage('You need an account to save presets.');
      return;
    }

    const presetName = presetNameInput.trim();
    if (!presetName) {
      setErrorMessage('Preset name cannot be empty.');
      return;
    }

    setIsSavingPreset(true);
    setErrorMessage(null);

    try {
      const existingPreset = presets.find(
        (preset) => preset.name.toLowerCase() === presetName.toLowerCase()
      );

      const presetId = await saveFilterPreset(user.uid, presetName, localFilters, existingPreset?.id);
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
      console.error('Failed to save preset:', error);
      setErrorMessage('Unable to save preset. Try again later.');
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
          {hasAuth && (
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
                        onClick={() => handleApplyPreset(preset)}
                        className="hover:underline"
                      >
                        {preset.name}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePreset(preset.id);
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
          )}
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

          {/* Listing Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Listing Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'wholesale', label: 'Wholesale Deal' },
                { value: 'sale', label: 'For Sale' },
                { value: 'rent', label: 'For Rent' }
              ].map((type) => (
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
              {[
                { value: 'house', label: 'Single Family House' },
                { value: 'duplex', label: 'Duplex' },
                { value: 'triplex', label: 'Triplex' },
                { value: 'fourplex', label: 'Fourplex' },
                { value: 'townhouse', label: 'Townhouse' },
                { value: 'condo', label: 'Condo' },
                { value: 'apartment', label: 'Apartment' },
                { value: 'land', label: 'Land' },
                { value: 'commercial', label: 'Commercial' }
              ].map((type) => (
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


          {/* Bedrooms/Bathrooms */}
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

          {/* Property Condition */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Property Condition
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'excellent', label: 'Excellent' },
                { value: 'good', label: 'Good' },
                { value: 'fair', label: 'Fair' },
                { value: 'needs-cosmetic', label: 'Needs Cosmetic Work' },
                { value: 'needs-full-rehab', label: 'Needs Full Rehab' },
                { value: 'tear-down', label: 'Tear Down' }
              ].map((condition) => (
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
              {[
                { value: 'vacant', label: 'Vacant' },
                { value: 'owner-occupied', label: 'Owner Occupied' },
                { value: 'tenant-occupied', label: 'Tenant Occupied' },
                { value: 'partially-occupied', label: 'Partially Occupied' }
              ].map((status) => (
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

          {/* Financing Options */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Financing Options
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'cash-only', label: 'Cash Only' },
                { value: 'seller-financing', label: 'Seller Financing' },
                { value: 'hard-money', label: 'Hard Money' },
                { value: 'conventional', label: 'Conventional' },
                { value: 'private-money', label: 'Private Money' }
              ].map((option) => (
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
        </div>

        {/* Preset Name Form */}
        {isPresetNameFormOpen && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSavePreset} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Preset Name
                </label>
                <input
                  type="text"
                  value={presetNameInput}
                  onChange={(e) => setPresetNameInput(e.target.value)}
                  placeholder="Enter preset name..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelPresetForm}
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

        {/* Filter Actions */}
        <div className="flex flex-col gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
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
              onClick={hasAuth ? handleOpenPresetForm : undefined}
              className="flex-1 px-4 py-2 border border-blue-500 text-blue-600 dark:text-blue-300 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors font-semibold disabled:opacity-60"
              disabled={!hasAuth || exceedsDisjunctionLimit}
              title={!hasAuth ? 'Sign in to save options' : exceedsDisjunctionLimit ? 'Too many filters selected' : 'Save current filters'}
            >
              Save Options
            </button>
            <button
              onClick={handleResetFilters}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            >
              Reset Filters
            </button>
            <button
              onClick={handleApplyFilters}
              disabled={exceedsDisjunctionLimit}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
              title={exceedsDisjunctionLimit ? 'Too many filters selected - please reduce the number of selected options' : 'Apply current filters'}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
