/**
 * Supabase implementation for listing presets data access
 */

import { supabase } from '@/supabase/client';
import { ListingPreset, CreatePresetData, UpdatePresetData } from '@/types/listing';

// Helper to convert database row to ListingPreset
const convertToPreset = (row: any): ListingPreset => {
  return {
    id: row.id,
    name: row.name,
    data: row.data,
    createdBy: row.created_by || row.createdBy,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
};

// Create a new preset
export async function createPreset(presetData: CreatePresetData, userId: string): Promise<string> {
  try {
    const newPreset = {
      created_by: userId,
      name: presetData.name,
      data: presetData.data || {}, // Default to empty object if undefined
    };

    const { data, error } = await supabase
      .from('listing_presets')
      .insert(newPreset)
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error creating preset:', error);
    throw new Error('Failed to create preset');
  }
}

// Get all presets for a user
export async function getUserPresets(userId: string): Promise<ListingPreset[]> {
  try {
    console.log('[getUserPresets] Fetching presets for user:', userId);
    
    const { data, error } = await supabase
      .from('listing_presets')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getUserPresets] Supabase error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        userId
      });
      throw error;
    }

    console.log('[getUserPresets] Successfully fetched', data?.length || 0, 'presets');
    return (data || []).map(convertToPreset);
  } catch (error: any) {
    console.error('[getUserPresets] Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      userId
    });
    throw new Error(`Failed to fetch presets: ${error?.message || 'Unknown error'}`);
  }
}

// Get a single preset by ID
export async function getPreset(presetId: string): Promise<ListingPreset | null> {
  try {
    const { data, error } = await supabase
      .from('listing_presets')
      .select('*')
      .eq('id', presetId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return convertToPreset(data);
  } catch (error) {
    console.error('Error fetching preset:', error);
    throw new Error('Failed to fetch preset');
  }
}

// Update an existing preset
export async function updatePreset(
  presetId: string,
  updateData: UpdatePresetData,
  userId: string
): Promise<void> {
  try {
    // First verify the preset belongs to the user
    const { data: existing, error: fetchError } = await supabase
      .from('listing_presets')
      .select('created_by')
      .eq('id', presetId)
      .single();

    if (fetchError || !existing) {
      throw new Error('Preset not found');
    }

    if (existing.created_by !== userId) {
      throw new Error('Unauthorized to update this preset');
    }

    const dbUpdateData: any = { updated_at: new Date().toISOString() };

    if (updateData.name !== undefined) dbUpdateData.name = updateData.name;
    if (updateData.data !== undefined) dbUpdateData.data = updateData.data;

    const { error } = await supabase
      .from('listing_presets')
      .update(dbUpdateData)
      .eq('id', presetId)
      .eq('created_by', userId); // Double-check ownership

    if (error) throw error;
  } catch (error) {
    console.error('Error updating preset:', error);
    throw new Error('Failed to update preset');
  }
}

// Delete a preset
export async function deletePreset(presetId: string, userId: string): Promise<void> {
  try {
    // First verify the preset belongs to the user
    const { data: existing, error: fetchError } = await supabase
      .from('listing_presets')
      .select('created_by')
      .eq('id', presetId)
      .single();

    if (fetchError || !existing) {
      throw new Error('Preset not found');
    }

    if (existing.created_by !== userId) {
      throw new Error('Unauthorized to delete this preset');
    }

    const { error } = await supabase
      .from('listing_presets')
      .delete()
      .eq('id', presetId)
      .eq('created_by', userId); // Double-check ownership

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting preset:', error);
    throw new Error('Failed to delete preset');
  }
}
