import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import {
  getFilterPresets,
  saveFilterPreset,
  deleteFilterPreset,
  FilterPreset,
} from '@/lib/firestore/filterPresets';
import { FilterState } from '@/hooks/useFilters';

interface UseFilterPresetsReturn {
  presets: FilterPreset[];
  isLoadingPresets: boolean;
  errorMessage: string | null;
  savePreset: (name: string, filters: FilterState, existingPresetId?: string) => Promise<void>;
  deletePreset: (presetId: string) => Promise<void>;
  refreshPresets: () => Promise<void>;
}

export function useFilterPresets(): UseFilterPresetsReturn {
  const { user } = useAuthContext() as { user: { uid: string } | null };
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load presets when user authenticates
  const loadPresets = useCallback(async () => {
    if (!user?.uid) {
      setPresets([]);
      setIsLoadingPresets(false);
      return;
    }

    setIsLoadingPresets(true);
    setErrorMessage(null);
    
    try {
      const fetchedPresets = await getFilterPresets(user.uid);
      setPresets(fetchedPresets);
    } catch (error) {
      console.error('Failed to load filter presets:', error);
      setErrorMessage('Unable to load saved options right now.');
    } finally {
      setIsLoadingPresets(false);
    }
  }, [user?.uid]);

  // Load presets when user changes (authenticates/logs out)
  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  // Save preset function
  const savePreset = useCallback(async (
    name: string,
    filters: FilterState,
    existingPresetId?: string
  ) => {
    if (!user?.uid) {
      setErrorMessage('You need an account to save presets.');
      throw new Error('User not authenticated');
    }

    setErrorMessage(null);
    
    try {
      const existingPreset = presets.find(
        (preset) => preset.name.toLowerCase() === name.toLowerCase()
      );

      const presetId = await saveFilterPreset(user.uid, name, filters, existingPresetId);
      const updatedPreset: FilterPreset = {
        id: presetId,
        name: name,
        filters: filters,
        createdAt: existingPreset?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      setPresets((current) => {
        if (existingPreset) {
          return current.map((preset) => (preset.id === existingPreset.id ? updatedPreset : preset));
        }
        return [updatedPreset, ...current];
      });
    } catch (error) {
      console.error('Failed to save preset:', error);
      setErrorMessage('Unable to save preset. Try again later.');
      throw error;
    }
  }, [user?.uid, presets]);

  // Delete preset function
  const deletePreset = useCallback(async (presetId: string) => {
    if (!user?.uid) {
      setErrorMessage('You need an account to delete presets.');
      throw new Error('User not authenticated');
    }

    setErrorMessage(null);
    
    try {
      await deleteFilterPreset(user.uid, presetId);
      setPresets((current) => current.filter((preset) => preset.id !== presetId));
    } catch (error) {
      console.error('Failed to delete preset', error);
      setErrorMessage('Could not delete preset. Please try again.');
      throw error;
    }
  }, [user?.uid]);

  // Refresh presets function (for manual refresh if needed)
  const refreshPresets = useCallback(async () => {
    await loadPresets();
  }, [loadPresets]);

  return {
    presets,
    isLoadingPresets,
    errorMessage,
    savePreset,
    deletePreset,
    refreshPresets,
  };
}
