/**
 * Supabase implementation for drafts data access
 * Maintains identical API to Firestore version for seamless migration
 */

import { supabase } from '@/supabase/client';
import { PropertyDraft, CreateDraftData, UpdateDraftData, CreateListingData } from '@/types/listing';
import { createListing } from './listings';
import { deleteMultipleFiles, isSupabaseStorageUrl } from '@/supabase/media';

// Helper to convert database row to PropertyDraft
const convertToDraft = (row: any): PropertyDraft => {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price,
    propertyType: row.property_type || row.propertyType,
    listingType: row.listing_type || row.listingType,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    squareFeet: row.square_feet || row.squareFeet,
    lotSize: row.lot_size || row.lotSize,
    yearBuilt: row.year_built || row.yearBuilt,
    arv: row.arv,
    repairCosts: row.repair_costs || row.repairCosts,
    wholesaleFee: row.wholesale_fee || row.wholesaleFee,
    propertyCondition: row.property_condition || row.propertyCondition,
    occupancyStatus: row.occupancy_status || row.occupancyStatus,
    monthlyRent: row.monthly_rent || row.monthlyRent,
    address: row.address,
    coordinates: row.coordinates,
    features: row.features || [],
    amenities: row.amenities || [],
    images: row.images || [],
    videos: row.videos,
    media: row.media,
    virtualTourUrl: row.virtual_tour_url || row.virtualTourUrl,
    createdBy: row.created_by || row.createdBy,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    contactInfo: row.contact_info || row.contactInfo,
    dealTerms: row.deal_terms || row.dealTerms,
    comps: row.comps || [],
  };
};

// Create a new draft
export async function saveDraft(draftData: CreateDraftData, userId: string): Promise<string> {
  try {
    const newDraft = {
      created_by: userId,
      title: draftData.title,
      description: draftData.description,
      price: draftData.price,
      property_type: draftData.propertyType,
      listing_type: draftData.listingType,
      bedrooms: draftData.bedrooms,
      bathrooms: draftData.bathrooms,
      square_feet: draftData.squareFeet,
      lot_size: draftData.lotSize,
      year_built: draftData.yearBuilt,
      arv: draftData.arv,
      repair_costs: draftData.repairCosts,
      wholesale_fee: draftData.wholesaleFee,
      property_condition: draftData.propertyCondition,
      occupancy_status: draftData.occupancyStatus,
      monthly_rent: draftData.monthlyRent,
      address: draftData.address,
      coordinates: draftData.coordinates,
      features: draftData.features || [],
      amenities: draftData.amenities || [],
      images: draftData.images || [],
      videos: draftData.videos,
      media: draftData.media,
      virtual_tour_url: draftData.virtualTourUrl,
      contact_info: draftData.contactInfo,
      deal_terms: draftData.dealTerms,
      comps: draftData.comps || [],
    };

    const { data, error } = await supabase
      .from('drafts')
      .insert(newDraft)
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error saving draft:', error);
    throw new Error('Failed to save draft');
  }
}

// Update an existing draft
export async function updateDraft(
  draftId: string,
  updateData: UpdateDraftData,
  userId: string
): Promise<void> {
  try {
    // First check if the user owns this draft
    const { data: existing, error: fetchError } = await supabase
      .from('drafts')
      .select('created_by, images')
      .eq('id', draftId)
      .single();

    if (fetchError || !existing) {
      throw new Error('Draft not found');
    }

    if (existing.created_by !== userId) {
      throw new Error('Unauthorized: You can only update your own drafts');
    }

    // If images are being updated, clean up removed images from storage
    if (updateData.images && existing.images) {
      const oldImages = existing.images || [];
      const newImages = updateData.images || [];
      const removedImages = oldImages.filter((url: string) => !newImages.includes(url));

      if (removedImages.length > 0) {
        const supabaseStorageImages = removedImages.filter((url: string) => isSupabaseStorageUrl(url));
        if (supabaseStorageImages.length > 0) {
          try {
            await deleteMultipleFiles(supabaseStorageImages, userId);
          } catch (error) {
            console.error('Error deleting removed images from storage:', error);
            // Continue with update even if image cleanup fails
          }
        }
      }
    }

    // Convert field names to snake_case for database
    const dbUpdateData: any = { updated_at: new Date().toISOString() };

    if (updateData.title !== undefined) dbUpdateData.title = updateData.title;
    if (updateData.description !== undefined) dbUpdateData.description = updateData.description;
    if (updateData.price !== undefined) dbUpdateData.price = updateData.price;
    if (updateData.propertyType !== undefined) dbUpdateData.property_type = updateData.propertyType;
    if (updateData.listingType !== undefined) dbUpdateData.listing_type = updateData.listingType;
    if (updateData.bedrooms !== undefined) dbUpdateData.bedrooms = updateData.bedrooms;
    if (updateData.bathrooms !== undefined) dbUpdateData.bathrooms = updateData.bathrooms;
    if (updateData.squareFeet !== undefined) dbUpdateData.square_feet = updateData.squareFeet;
    if (updateData.lotSize !== undefined) dbUpdateData.lot_size = updateData.lotSize;
    if (updateData.yearBuilt !== undefined) dbUpdateData.year_built = updateData.yearBuilt;
    if (updateData.arv !== undefined) dbUpdateData.arv = updateData.arv;
    if (updateData.repairCosts !== undefined) dbUpdateData.repair_costs = updateData.repairCosts;
    if (updateData.wholesaleFee !== undefined) dbUpdateData.wholesale_fee = updateData.wholesaleFee;
    if (updateData.propertyCondition !== undefined) dbUpdateData.property_condition = updateData.propertyCondition;
    if (updateData.occupancyStatus !== undefined) dbUpdateData.occupancy_status = updateData.occupancyStatus;
    if (updateData.monthlyRent !== undefined) dbUpdateData.monthly_rent = updateData.monthlyRent;
    if (updateData.address !== undefined) dbUpdateData.address = updateData.address;
    if (updateData.coordinates !== undefined) dbUpdateData.coordinates = updateData.coordinates;
    if (updateData.features !== undefined) dbUpdateData.features = updateData.features;
    if (updateData.amenities !== undefined) dbUpdateData.amenities = updateData.amenities;
    if (updateData.images !== undefined) dbUpdateData.images = updateData.images;
    if (updateData.videos !== undefined) dbUpdateData.videos = updateData.videos;
    if (updateData.media !== undefined) dbUpdateData.media = updateData.media;
    if (updateData.virtualTourUrl !== undefined) dbUpdateData.virtual_tour_url = updateData.virtualTourUrl;
    if (updateData.contactInfo !== undefined) dbUpdateData.contact_info = updateData.contactInfo;
    if (updateData.dealTerms !== undefined) dbUpdateData.deal_terms = updateData.dealTerms;
    if (updateData.comps !== undefined) dbUpdateData.comps = updateData.comps;

    const { error } = await supabase
      .from('drafts')
      .update(dbUpdateData)
      .eq('id', draftId)
      .eq('created_by', userId); // Double-check ownership

    if (error) throw error;
  } catch (error) {
    console.error('Error updating draft:', error);
    throw error;
  }
}

// Get all drafts for a user
export async function getUserDrafts(userId: string): Promise<PropertyDraft[]> {
  try {
    console.log('[getUserDrafts] Fetching drafts for user:', userId);
    
    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('created_by', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[getUserDrafts] Supabase error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        userId
      });
      throw error;
    }

    console.log('[getUserDrafts] Successfully fetched', data?.length || 0, 'drafts');
    return (data || []).map(convertToDraft);
  } catch (error: any) {
    console.error('[getUserDrafts] Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      userId
    });
    throw new Error(`Failed to get user drafts: ${error?.message || 'Unknown error'}`);
  }
}

// Get a single draft by ID
export async function getDraft(draftId: string): Promise<PropertyDraft | null> {
  try {
    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('id', draftId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return convertToDraft(data);
  } catch (error) {
    console.error('Error getting draft:', error);
    throw new Error('Failed to get draft');
  }
}

// Delete a draft
export async function deleteDraft(draftId: string, userId: string): Promise<void> {
  try {
    // First check if the user owns this draft and get images
    const { data: existing, error: fetchError } = await supabase
      .from('drafts')
      .select('created_by, images')
      .eq('id', draftId)
      .single();

    if (fetchError || !existing) {
      throw new Error('Draft not found');
    }

    if (existing.created_by !== userId) {
      throw new Error('Unauthorized: You can only delete your own drafts');
    }

    // Delete images from Supabase Storage if they exist
    if (existing.images && Array.isArray(existing.images)) {
      const supabaseStorageImages = existing.images.filter((url: string) => isSupabaseStorageUrl(url));
      if (supabaseStorageImages.length > 0) {
        try {
          await deleteMultipleFiles(supabaseStorageImages, userId);
        } catch (error) {
          console.error('Error deleting images from storage:', error);
          // Continue with draft deletion even if image cleanup fails
        }
      }
    }

    // Delete the draft
    const { error } = await supabase
      .from('drafts')
      .delete()
      .eq('id', draftId)
      .eq('created_by', userId); // Double-check ownership

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting draft:', error);
    throw error;
  }
}

// Publish a draft as a listing
export async function publishDraft(draftId: string, userId: string): Promise<string> {
  try {
    const draft = await getDraft(draftId);
    if (!draft) {
      throw new Error('Draft not found');
    }

    if (draft.createdBy !== userId) {
      throw new Error('Unauthorized: You can only publish your own drafts');
    }

    // Validate required fields for publishing
    if (!draft.title || !draft.description || !draft.propertyType || !draft.listingType) {
      throw new Error('Missing required fields: title, description, property type, and listing type are required to publish');
    }

    if (!draft.address?.city || !draft.address?.state || !draft.address?.streetName) {
      throw new Error('Missing required address fields: city, state, and street name are required to publish');
    }

    if (!draft.contactInfo?.name || !draft.contactInfo?.email) {
      throw new Error('Missing required contact information: name and email are required to publish');
    }

    // Convert draft to listing data
    const listingData: CreateListingData = {
      title: draft.title,
      description: draft.description,
      price: draft.price,
      propertyType: draft.propertyType,
      listingType: draft.listingType,
      bedrooms: draft.bedrooms,
      bathrooms: draft.bathrooms,
      squareFeet: draft.squareFeet,
      lotSize: draft.lotSize,
      yearBuilt: draft.yearBuilt,
      arv: draft.arv,
      repairCosts: draft.repairCosts,
      wholesaleFee: draft.wholesaleFee,
      propertyCondition: draft.propertyCondition,
      occupancyStatus: draft.occupancyStatus,
      monthlyRent: draft.monthlyRent,
      address: {
        houseNumber: draft.address?.houseNumber || '',
        streetName: draft.address?.streetName || '',
        street: draft.address?.street || '',
        city: draft.address?.city || '',
        state: draft.address?.state || '',
        zipCode: draft.address?.zipCode || '',
        country: draft.address?.country || 'US',
      },
      coordinates: draft.coordinates,
      features: draft.features || [],
      amenities: draft.amenities || [],
      images: draft.images || [],
      videos: draft.videos,
      media: draft.media,
      virtualTourUrl: draft.virtualTourUrl,
      contactInfo: {
        name: draft.contactInfo?.name || '',
        phone: draft.contactInfo?.phone,
        email: draft.contactInfo?.email || '',
        isOwner: draft.contactInfo?.isOwner ?? true,
        agencyName: draft.contactInfo?.agencyName,
        isWholesaler: draft.contactInfo?.isWholesaler,
      },
      dealTerms: draft.dealTerms,
      comps: draft.comps || [],
      tags: [], // Will be generated in createListing function
      createdBy: '', // Will be overridden in createListing function
      status: 'active' as const,
      isVerified: false
    };

    // Create the listing
    const listingId = await createListing(listingData, userId);

    // Delete the draft after successful publishing
    await deleteDraft(draftId, userId);

    return listingId;
  } catch (error) {
    console.error('Error publishing draft:', error);
    throw error;
  }
}
