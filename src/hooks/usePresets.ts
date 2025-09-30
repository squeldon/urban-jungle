'use client'
import { useState, useEffect, useCallback } from 'react';
import { ListingPreset, CreatePresetData, UpdatePresetData } from '@/types/listing';
import { useAuthContext } from '@/context/AuthContext';
import * as presetsDb from '@/lib/db/presets';

export function usePresets() {
  const { user } = useAuthContext() as { user: any };
  const [presets, setPresets] = useState<ListingPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user presets
  const fetchPresets = useCallback(async () => {
    if (!user) {
      console.log('[usePresets] No user logged in, skipping fetch');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[usePresets] Starting fetch for user:', user.id);
      const userPresets = await presetsDb.getUserPresets(user.id);
      console.log('[usePresets] Successfully loaded', userPresets.length, 'presets');
      setPresets(userPresets);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load presets';
      console.error('[usePresets] Error loading presets:', {
        error: err,
        message: errorMessage,
        userId: user?.id,
        stack: err?.stack
      });
      setError(errorMessage);
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
      const presetId = await presetsDb.createPreset(presetData, user.id);
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
      await presetsDb.updatePreset(presetId, updateData, user.id);
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
      await presetsDb.deletePreset(presetId, user.id);
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
