'use client'
import { useState, useEffect, useCallback } from 'react';
import { ListingPreset, CreatePresetData, UpdatePresetData } from '@/types/listing';
import { 
  getUserPresets, 
  createPreset, 
  updatePreset, 
  deletePreset 
} from '@/lib/firestore/presets';
import { useAuthContext } from '@/context/AuthContext';

export function usePresets() {
  const { user } = useAuthContext() as { user: any };
  const [presets, setPresets] = useState<ListingPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user presets
  const fetchPresets = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const userPresets = await getUserPresets(user.uid);
      setPresets(userPresets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load presets');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Save a new preset
  const savePreset = useCallback(async (presetData: CreatePresetData): Promise<string> => {
    if (!user) {
      throw new Error('You must be logged in to save presets');
    }

    try {
      const presetId = await createPreset(presetData, user.uid);
      await fetchPresets(); // Refresh the list
      return presetId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save preset';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user, fetchPresets]);

  // Update an existing preset
  const updateExistingPreset = useCallback(async (presetId: string, updateData: UpdatePresetData): Promise<void> => {
    if (!user) {
      throw new Error('You must be logged in to update presets');
    }

    try {
      await updatePreset(presetId, updateData, user.uid);
      await fetchPresets(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preset';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user, fetchPresets]);

  // Delete a preset
  const removePreset = useCallback(async (presetId: string): Promise<void> => {
    if (!user) {
      throw new Error('You must be logged in to delete presets');
    }

    try {
      await deletePreset(presetId, user.uid);
      await fetchPresets(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete preset';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user, fetchPresets]);

  // Refresh presets list
  const refresh = useCallback(() => {
    fetchPresets();
  }, [fetchPresets]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load presets when user changes
  useEffect(() => {
    if (user) {
      fetchPresets();
    } else {
      setPresets([]);
      setError(null);
    }
  }, [user, fetchPresets]);

  return {
    presets,
    loading,
    error,
    savePreset,
    updatePreset: updateExistingPreset,
    deletePreset: removePreset,
    refresh,
    clearError,
  };
}
