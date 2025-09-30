import { supabase } from '@/supabase/client';

export interface MediaRecord {
  id: string;
  listingId?: string;
  draftId?: string;
  userId: string;
  storagePath: string;
  mimeType?: string;
  bytes: number;
  createdAt: Date;
}

export interface MediaUploadParams {
  userId: string;
  listingId?: string;
  draftId?: string;
  storagePath: string;
  mimeType?: string;
  bytes: number;
}

/**
 * Record a media upload in the listing_media table
 */
export async function recordMediaUpload(params: MediaUploadParams): Promise<MediaRecord> {
  try {
    const { data, error } = await supabase
      .from('listing_media')
      .insert({
        user_id: params.userId,
        listing_id: params.listingId || null,
        draft_id: params.draftId || null,
        storage_object_path: params.storagePath,
        mime_type: params.mimeType || null,
        bytes: params.bytes
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error recording media upload:', error);
      throw error;
    }
    
    return {
      id: data.id,
      listingId: data.listing_id,
      draftId: data.draft_id,
      userId: data.user_id,
      storagePath: data.storage_object_path,
      mimeType: data.mime_type,
      bytes: data.bytes,
      createdAt: new Date(data.created_at)
    };
  } catch (error) {
    console.error('Error recording media upload:', error);
    throw new Error('Failed to record media upload');
  }
}

/**
 * Record media deletion from the listing_media table
 */
export async function recordMediaDeletion(storagePath: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('listing_media')
      .delete()
      .eq('storage_object_path', storagePath);
    
    if (error) {
      console.error('Error recording media deletion:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error recording media deletion:', error);
    // Don't throw - deletion should be silent on errors
    console.warn('Failed to record media deletion, continuing...');
  }
}

/**
 * Get media records for a listing
 */
export async function getListingMedia(listingId: string): Promise<MediaRecord[]> {
  try {
    const { data, error } = await supabase
      .from('listing_media')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return (data || []).map(record => ({
      id: record.id,
      listingId: record.listing_id,
      draftId: record.draft_id,
      userId: record.user_id,
      storagePath: record.storage_object_path,
      mimeType: record.mime_type,
      bytes: record.bytes,
      createdAt: new Date(record.created_at)
    }));
  } catch (error) {
    console.error('Error fetching listing media:', error);
    throw new Error('Failed to fetch listing media');
  }
}

/**
 * Get media records for a draft
 */
export async function getDraftMedia(draftId: string): Promise<MediaRecord[]> {
  try {
    const { data, error } = await supabase
      .from('listing_media')
      .select('*')
      .eq('draft_id', draftId)
      .order('created_at', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return (data || []).map(record => ({
      id: record.id,
      listingId: record.listing_id,
      draftId: record.draft_id,
      userId: record.user_id,
      storagePath: record.storage_object_path,
      mimeType: record.mime_type,
      bytes: record.bytes,
      createdAt: new Date(record.created_at)
    }));
  } catch (error) {
    console.error('Error fetching draft media:', error);
    throw new Error('Failed to fetch draft media');
  }
}

/**
 * Get media record by storage path
 */
export async function getMediaByPath(storagePath: string): Promise<MediaRecord | null> {
  try {
    const { data, error } = await supabase
      .from('listing_media')
      .select('*')
      .eq('storage_object_path', storagePath)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw error;
    }
    
    return {
      id: data.id,
      listingId: data.listing_id,
      draftId: data.draft_id,
      userId: data.user_id,
      storagePath: data.storage_object_path,
      mimeType: data.mime_type,
      bytes: data.bytes,
      createdAt: new Date(data.created_at)
    };
  } catch (error) {
    console.error('Error fetching media by path:', error);
    return null;
  }
}

/**
 * Delete all media records for a listing
 */
export async function deleteListingMedia(listingId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('listing_media')
      .delete()
      .eq('listing_id', listingId);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting listing media records:', error);
    throw new Error('Failed to delete listing media records');
  }
}

/**
 * Delete all media records for a draft
 */
export async function deleteDraftMedia(draftId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('listing_media')
      .delete()
      .eq('draft_id', draftId);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting draft media records:', error);
    throw new Error('Failed to delete draft media records');
  }
}

/**
 * Update media record to associate with a listing (e.g., when publishing a draft)
 */
export async function associateMediaWithListing(
  storagePath: string,
  listingId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('listing_media')
      .update({
        listing_id: listingId,
        draft_id: null
      })
      .eq('storage_object_path', storagePath);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error associating media with listing:', error);
    throw new Error('Failed to associate media with listing');
  }
}

/**
 * Get total storage used by a user
 */
export async function getUserStorageUsed(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('listing_media')
      .select('bytes')
      .eq('user_id', userId);
    
    if (error) {
      throw error;
    }
    
    return (data || []).reduce((total, record) => total + (record.bytes || 0), 0);
  } catch (error) {
    console.error('Error getting user storage usage:', error);
    throw new Error('Failed to get user storage usage');
  }
}
