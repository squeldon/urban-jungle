/**
 * Supabase implementation for filter presets data access
 * Maintains identical API to Firestore version for seamless migration
 */

import { supabase } from '@/supabase/client';
import { FilterState, sanitizeFilters } from '@/hooks/useFilters';

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: Date;
  updatedAt: Date;
}

// Helper to convert database row to FilterPreset
const convertToFilterPreset = (row: any): FilterPreset => {
  return {
    id: row.id,
    name: row.name || 'Unnamed Preset',
    filters: sanitizeFilters(row.filters || {}),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
};

export const getFilterPresets = async (userId: string): Promise<FilterPreset[]> => {
  try {
    const { data, error } = await supabase
      .from('filter_presets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(convertToFilterPreset);
  } catch (error) {
    console.error('Error fetching filter presets:', error);
    throw new Error('Failed to fetch filter presets');
  }
};

export const saveFilterPreset = async (
  userId: string,
  name: string,
  filters: FilterState,
  existingPresetId?: string
): Promise<string> => {
  try {
    const sanitizedFilters = sanitizeFilters(filters);

    if (existingPresetId) {
      // Update existing preset
      const { data: existing, error: fetchError } = await supabase
        .from('filter_presets')
        .select('user_id')
        .eq('id', existingPresetId)
        .single();

      if (fetchError || !existing) {
        throw new Error('Preset not found');
      }

      if (existing.user_id !== userId) {
        throw new Error('Unauthorized to update this preset');
      }

      const { error } = await supabase
        .from('filter_presets')
        .update({
          name,
          filters: sanitizedFilters,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPresetId)
        .eq('user_id', userId); // Double-check ownership

      if (error) throw error;
      return existingPresetId;
    } else {
      // Create new preset
      const { data, error } = await supabase
        .from('filter_presets')
        .insert({
          user_id: userId,
          name,
          filters: sanitizedFilters,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    }
  } catch (error) {
    console.error('Error saving filter preset:', error);
    throw new Error('Failed to save filter preset');
  }
};

export const findPresetByName = async (
  userId: string,
  name: string
): Promise<FilterPreset | null> => {
  try {
    const { data, error } = await supabase
      .from('filter_presets')
      .select('*')
      .eq('user_id', userId)
      .eq('name', name)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return convertToFilterPreset(data);
  } catch (error) {
    console.error('Error finding preset by name:', error);
    return null;
  }
};

export const deleteFilterPreset = async (
  userId: string,
  presetId: string
): Promise<void> => {
  try {
    // First verify the preset belongs to the user
    const { data: existing, error: fetchError } = await supabase
      .from('filter_presets')
      .select('user_id')
      .eq('id', presetId)
      .single();

    if (fetchError || !existing) {
      throw new Error('Preset not found');
    }

    if (existing.user_id !== userId) {
      throw new Error('Unauthorized to delete this preset');
    }

    const { error } = await supabase
      .from('filter_presets')
      .delete()
      .eq('id', presetId)
      .eq('user_id', userId); // Double-check ownership

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting filter preset:', error);
    throw new Error('Failed to delete filter preset');
  }
};
