/**
 * Supabase implementation for listings data access
 * Maintains identical API to Firestore version for seamless migration
 */

import { supabase } from '@/supabase/client';
import { PropertyListing, CreateListingData, UpdateListingData, ListingFilters } from '@/types/listing';
import { deleteMultipleFiles, isSupabaseStorageUrl } from '@/supabase/storage';

// Helper to fetch favorites for listings
const fetchFavoritesForListings = async (listings: any[]): Promise<PropertyListing[]> => {
  if (listings.length === 0) return [];

  const listingIds = listings.map(listing => listing.id);
  
  // Get all favorites for these listings
  const { data: favoritesData, error: favoritesError } = await supabase
    .from('favorites')
    .select('listing_id, user_id')
    .in('listing_id', listingIds);

  if (favoritesError) {
    console.error('Error fetching favorites:', favoritesError);
    // Continue without favorites data
  }

  // Group favorites by listing_id
  const favoritesByListing: Record<string, string[]> = {};
  (favoritesData || []).forEach((fav: any) => {
    if (!favoritesByListing[fav.listing_id]) {
      favoritesByListing[fav.listing_id] = [];
    }
    favoritesByListing[fav.listing_id].push(fav.user_id);
  });

  // Convert listings and add favorites
  return listings.map(listing => {
    const converted = convertToListing(listing);
    converted.favorites = favoritesByListing[listing.id] || [];
    return converted;
  });
};

// Helper to convert database row to PropertyListing
const convertToListing = (row: any): PropertyListing => {
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
    createdBy: row.created_by || row.createdBy || row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    status: row.status,
    isVerified: row.is_verified || row.isVerified || false,
    contactInfo: row.contact_info || row.contactInfo,
    dealTerms: row.deal_terms || row.dealTerms,
    comps: row.comps || [],
    views: row.views || 0,
    favorites: row.favorites || [], // This will be populated separately
    tags: row.tags || [],
  };
};

// Create a new listing
export async function createListing(listingData: CreateListingData, userId: string): Promise<string> {
  try {
    const newListing = {
      created_by: userId,
      title: listingData.title,
      description: listingData.description,
      price: listingData.price,
      property_type: listingData.propertyType,
      listing_type: listingData.listingType,
      bedrooms: listingData.bedrooms,
      bathrooms: listingData.bathrooms,
      square_feet: listingData.squareFeet,
      lot_size: listingData.lotSize,
      year_built: listingData.yearBuilt,
      arv: listingData.arv,
      repair_costs: listingData.repairCosts,
      wholesale_fee: listingData.wholesaleFee,
      property_condition: listingData.propertyCondition,
      occupancy_status: listingData.occupancyStatus,
      monthly_rent: listingData.monthlyRent,
      address: listingData.address,
      coordinates: listingData.coordinates,
      features: listingData.features || [],
      amenities: listingData.amenities || [],
      images: listingData.images || [],
      videos: listingData.videos,
      media: listingData.media,
      virtual_tour_url: listingData.virtualTourUrl,
      contact_info: listingData.contactInfo,
      deal_terms: listingData.dealTerms,
      comps: listingData.comps || [],
      tags: listingData.tags || [],
      status: 'active',
      is_verified: false,
      views: 0,
    };

    const { data, error } = await supabase
      .from('listings')
      .insert(newListing)
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error creating listing:', error);
    throw new Error('Failed to create listing');
  }
}

// Get a single listing by ID
export async function getListing(listingId: string): Promise<PropertyListing | null> {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    const listings = await fetchFavoritesForListings([data]);
    return listings[0] || null;
  } catch (error) {
    console.error('Error getting listing:', error);
    throw new Error('Failed to get listing');
  }
}

// Pagination cursor type (opaque to match Firestore API)
export interface PaginationCursor {
  createdAt: string;
  id: string;
}

// =====================================================
// PostGIS Spatial Query Helpers
// =====================================================

/**
 * Get listing IDs within a radius using PostGIS
 * @param lat Center latitude
 * @param lng Center longitude
 * @param radiusMeters Radius in meters
 * @returns Array of listing IDs within the radius
 */
async function getListingIdsWithinRadius(
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<string[]> {
  try {
    const { data, error } = await supabase.rpc('get_listings_within_radius', {
      center_lat: lat,
      center_lng: lng,
      radius_meters: radiusMeters,
    });

    if (error) {
      console.error('Error calling get_listings_within_radius:', error);
      throw error;
    }

    return (data || []).map((row: any) => row.id);
  } catch (error) {
    console.error('Error getting listings within radius:', error);
    return [];
  }
}

/**
 * Get listings within radius with distance information
 * @param lat Center latitude
 * @param lng Center longitude
 * @param radiusMeters Radius in meters
 * @returns Array of objects with listing ID and distance in meters
 */
export async function getListingsWithinRadius(
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<{ id: string; distanceMeters: number }[]> {
  try {
    const { data, error } = await supabase.rpc('get_listings_within_radius', {
      center_lat: lat,
      center_lng: lng,
      radius_meters: radiusMeters,
    });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      distanceMeters: row.distance_meters,
    }));
  } catch (error) {
    console.error('Error getting listings within radius:', error);
    throw new Error('Failed to get listings within radius');
  }
}

/**
 * Get nearest listings to a point
 * @param lat Center latitude
 * @param lng Center longitude
 * @param maxResults Maximum number of results (default: 20)
 * @param maxDistanceMeters Maximum distance in meters (default: 50000)
 * @returns Array of objects with listing ID and distance in meters
 */
export async function getNearestListings(
  lat: number,
  lng: number,
  maxResults: number = 20,
  maxDistanceMeters: number = 50000
): Promise<{ id: string; distanceMeters: number }[]> {
  try {
    const { data, error } = await supabase.rpc('get_nearest_listings', {
      center_lat: lat,
      center_lng: lng,
      max_results: maxResults,
      max_distance_meters: maxDistanceMeters,
    });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      distanceMeters: row.distance_meters,
    }));
  } catch (error) {
    console.error('Error getting nearest listings:', error);
    throw new Error('Failed to get nearest listings');
  }
}

/**
 * Calculate distance between two points using PostGIS
 * @param lat1 First point latitude
 * @param lng1 First point longitude
 * @param lat2 Second point latitude
 * @param lng2 Second point longitude
 * @returns Distance in meters
 */
export async function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('calculate_distance', {
      lat1,
      lng1,
      lat2,
      lng2,
    });

    if (error) throw error;
    return data || 0;
  } catch (error) {
    console.error('Error calculating distance:', error);
    throw new Error('Failed to calculate distance');
  }
}

/**
 * Get listing IDs within a bounding box using PostGIS
 * @param north Northern boundary latitude
 * @param south Southern boundary latitude
 * @param east Eastern boundary longitude
 * @param west Western boundary longitude
 * @returns Array of listing IDs within the bounding box
 */
async function getListingIdsWithinBounds(
  north: number,
  south: number,
  east: number,
  west: number
): Promise<string[]> {
  try {
    const { data, error } = await supabase.rpc('get_listings_within_bounds', {
      north,
      south,
      east,
      west,
    });

    if (error) {
      console.error('Error calling get_listings_within_bounds:', error);
      throw error;
    }

    return (data || []).map((row: any) => row.id);
  } catch (error) {
    console.error('Error getting listings within bounds:', error);
    return [];
  }
}

/**
 * Get listing IDs within a polygon using PostGIS
 * @param polygon Array of [lat, lng] coordinates defining the polygon
 * @returns Array of listing IDs within the polygon
 */
async function getListingIdsWithinPolygon(
  polygon: [number, number][]
): Promise<string[]> {
  try {
    // Convert polygon to JSONB format for PostgreSQL
    const polygonJson = polygon;

    const { data, error } = await supabase.rpc('get_listings_within_polygon', {
      polygon_coords: polygonJson,
    });

    if (error) {
      console.error('Error calling get_listings_within_polygon:', error);
      throw error;
    }

    return (data || []).map((row: any) => row.id);
  } catch (error) {
    console.error('Error getting listings within polygon:', error);
    return [];
  }
}

/**
 * Get listings within bounding box
 * @param north Northern boundary latitude
 * @param south Southern boundary latitude
 * @param east Eastern boundary longitude
 * @param west Western boundary longitude
 * @returns Array of listing IDs
 */
export async function getListingsWithinBounds(
  north: number,
  south: number,
  east: number,
  west: number
): Promise<string[]> {
  return getListingIdsWithinBounds(north, south, east, west);
}

/**
 * Get listings within polygon
 * @param polygon Array of [lat, lng] coordinates
 * @returns Array of listing IDs
 */
export async function getListingsWithinPolygon(
  polygon: [number, number][]
): Promise<string[]> {
  return getListingIdsWithinPolygon(polygon);
}

// Get listings with filters and pagination
export async function getListings(
  filters?: ListingFilters,
  pageSize: number = 20,
  lastDoc?: any // Keep for API compatibility but use our own cursor
): Promise<{ listings: PropertyListing[]; lastDoc?: any }> {
  try {
    let query = supabase.from('listings').select('*');

    // Apply filters
    if (filters) {
      if (filters.propertyType && filters.propertyType.length > 0) {
        query = query.in('property_type', filters.propertyType);
      }

      if (filters.listingType) {
        query = query.eq('listing_type', filters.listingType);
      }

      if (filters.priceRange) {
        if (filters.priceRange.min > 0) {
          query = query.gte('price', filters.priceRange.min);
        }
        if (filters.priceRange.max < Number.MAX_SAFE_INTEGER) {
          query = query.lte('price', filters.priceRange.max);
        }
      }

      if (filters.arvRange) {
        if (filters.arvRange.min > 0) {
          query = query.gte('arv', filters.arvRange.min);
        }
        if (filters.arvRange.max < Number.MAX_SAFE_INTEGER) {
          query = query.lte('arv', filters.arvRange.max);
        }
      }

      if (filters.repairCostsRange) {
        if (filters.repairCostsRange.min > 0) {
          query = query.gte('repair_costs', filters.repairCostsRange.min);
        }
        if (filters.repairCostsRange.max < Number.MAX_SAFE_INTEGER) {
          query = query.lte('repair_costs', filters.repairCostsRange.max);
        }
      }

      if (filters.location?.city) {
        query = query.eq('address->>city', filters.location.city);
      }

      if (filters.location?.state) {
        query = query.eq('address->>state', filters.location.state);
      }

      if (filters.location?.zipCode) {
        query = query.eq('address->>zipCode', filters.location.zipCode);
      }
    }

    // Check if we should use PostGIS spatial filtering
    // Priority: polygon > bounds > radius
    let spatialListingIds: string[] | null = null;
    
    if (filters?.location?.polygon && filters.location.polygon.length >= 3) {
      // Use PostGIS polygon filter (highest priority - most precise)
      console.log('Using PostGIS polygon filter with', filters.location.polygon.length, 'points');
      spatialListingIds = await getListingIdsWithinPolygon(filters.location.polygon);
      
      if (spatialListingIds.length === 0) {
        return { listings: [], lastDoc: undefined };
      }
      
      query = query.in('id', spatialListingIds);
    } else if (filters?.location?.bounds) {
      // Use PostGIS bounding box filter
      const { north, south, east, west } = filters.location.bounds;
      console.log('Using PostGIS bounds filter:', { north, south, east, west });
      spatialListingIds = await getListingIdsWithinBounds(north, south, east, west);
      
      if (spatialListingIds.length === 0) {
        return { listings: [], lastDoc: undefined };
      }
      
      query = query.in('id', spatialListingIds);
    } else if (filters?.location?.center && filters?.location?.radius) {
      // Use PostGIS radius filter (fallback)
      const radiusMeters = (filters.location.radius || 10) * 1609.34; // Convert miles to meters
      console.log('Using PostGIS radius filter:', filters.location.radius, 'miles');
      spatialListingIds = await getListingIdsWithinRadius(
        filters.location.center.lat,
        filters.location.center.lng,
        radiusMeters
      );
      
      if (spatialListingIds.length === 0) {
        return { listings: [], lastDoc: undefined };
      }
      
      query = query.in('id', spatialListingIds);
    }

    // Filter to only show active listings
    query = query.in('status', ['active', 'pending', 'sold', 'rented']);

    // Pagination - use cursor-based pagination
    if (lastDoc?.createdAt && lastDoc?.id) {
      query = query.or(`created_at.lt.${lastDoc.createdAt},and(created_at.eq.${lastDoc.createdAt},id.lt.${lastDoc.id})`);
    }

    // Order by creation date (newest first)
    query = query.order('created_at', { ascending: false });
    query = query.order('id', { ascending: false }); // Secondary sort for stability

    // Limit results
    query = query.limit(pageSize);

    const { data, error } = await query;

    if (error) throw error;

    // Convert listings with favorites data
    let listings: PropertyListing[] = await fetchFavoritesForListings(data || []);

    // Apply client-side filters for complex queries
    if (filters) {
      listings = listings.filter((listing) => {
        // Filter by bedrooms
        if (filters.bedrooms && filters.bedrooms.min > 0) {
          if (!listing.bedrooms || listing.bedrooms < filters.bedrooms.min) return false;
        }
        if (filters.bedrooms && filters.bedrooms.max > 0 && filters.bedrooms.max < Number.MAX_SAFE_INTEGER) {
          if (!listing.bedrooms || listing.bedrooms > filters.bedrooms.max) return false;
        }

        // Filter by bathrooms
        if (filters.bathrooms && filters.bathrooms.min > 0) {
          if (!listing.bathrooms || listing.bathrooms < filters.bathrooms.min) return false;
        }
        if (filters.bathrooms && filters.bathrooms.max > 0 && filters.bathrooms.max < Number.MAX_SAFE_INTEGER) {
          if (!listing.bathrooms || listing.bathrooms > filters.bathrooms.max) return false;
        }

        // Filter by square feet
        if (filters.squareFeet && filters.squareFeet.min > 0) {
          if (!listing.squareFeet || listing.squareFeet < filters.squareFeet.min) return false;
        }
        if (filters.squareFeet && filters.squareFeet.max > 0 && filters.squareFeet.max < Number.MAX_SAFE_INTEGER) {
          if (!listing.squareFeet || listing.squareFeet > filters.squareFeet.max) return false;
        }

        // Filter by property condition
        if (filters.propertyCondition && filters.propertyCondition.length > 0) {
          if (!listing.propertyCondition || !filters.propertyCondition.includes(listing.propertyCondition)) return false;
        }

        // Filter by occupancy status
        if (filters.occupancyStatus && filters.occupancyStatus.length > 0) {
          if (!listing.occupancyStatus || !filters.occupancyStatus.includes(listing.occupancyStatus)) return false;
        }

        // Filter by financing options
        if (filters.financingOptions && filters.financingOptions.length > 0) {
          if (!listing.dealTerms?.financingOptions ||
            !filters.financingOptions.some(option => listing.dealTerms?.financingOptions?.includes(option as any))) {
            return false;
          }
        }

        // Filter by features
        if (filters.features && filters.features.length > 0) {
          if (!listing.features ||
            !filters.features.every(feature => listing.features.includes(feature))) {
            return false;
          }
        }

        // Filter by amenities
        if (filters.amenities && filters.amenities.length > 0) {
          if (!listing.amenities ||
            !filters.amenities.every(amenity => listing.amenities.includes(amenity))) {
            return false;
          }
        }

        return true;
      });
    }

    // Create pagination cursor from last item
    let paginationCursor: PaginationCursor | undefined;
    if (listings.length > 0) {
      const lastListing = listings[listings.length - 1];
      paginationCursor = {
        createdAt: lastListing.createdAt.toISOString(),
        id: lastListing.id,
      };
    }

    return { listings, lastDoc: paginationCursor };
  } catch (error) {
    console.error('Error getting listings:', error);
    throw new Error('Failed to get listings');
  }
}

// Get listings by user
export async function getUserListings(userId: string): Promise<PropertyListing[]> {
  try {
    console.log('[getUserListings] Fetching listings for user:', userId);
    
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getUserListings] Supabase error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        userId
      });
      throw error;
    }

    console.log('[getUserListings] Successfully fetched', data?.length || 0, 'listings');
    return await fetchFavoritesForListings(data || []);
  } catch (error: any) {
    console.error('[getUserListings] Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      userId
    });
    throw new Error(`Failed to get user listings: ${error?.message || 'Unknown error'}`);
  }
}

// Update a listing
export async function updateListing(
  listingId: string,
  updateData: UpdateListingData,
  userId: string
): Promise<void> {
  try {
    // First check if the user owns this listing
    const { data: existing, error: fetchError } = await supabase
      .from('listings')
      .select('created_by, images')
      .eq('id', listingId)
      .single();

    if (fetchError || !existing) {
      throw new Error('Listing not found');
    }

    if (existing.created_by !== userId) {
      throw new Error('Unauthorized: You can only update your own listings');
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
    if (updateData.tags !== undefined) dbUpdateData.tags = updateData.tags;
    if (updateData.status !== undefined) dbUpdateData.status = updateData.status;

    const { error } = await supabase
      .from('listings')
      .update(dbUpdateData)
      .eq('id', listingId)
      .eq('created_by', userId); // Double-check ownership

    if (error) throw error;
  } catch (error) {
    console.error('Error updating listing:', error);
    throw error;
  }
}

// Delete a listing
export async function deleteListing(listingId: string, userId: string): Promise<void> {
  try {
    // First check if the user owns this listing and get images
    const { data: existing, error: fetchError } = await supabase
      .from('listings')
      .select('created_by, images')
      .eq('id', listingId)
      .single();

    if (fetchError || !existing) {
      throw new Error('Listing not found');
    }

    if (existing.created_by !== userId) {
      throw new Error('Unauthorized: You can only delete your own listings');
    }

    // Delete images from Supabase Storage if they exist
    if (existing.images && Array.isArray(existing.images)) {
      const supabaseStorageImages = existing.images.filter((url: string) => isSupabaseStorageUrl(url));
      if (supabaseStorageImages.length > 0) {
        try {
          await deleteMultipleFiles(supabaseStorageImages, userId);
        } catch (error) {
          console.error('Error deleting images from storage:', error);
          // Continue with listing deletion even if image cleanup fails
        }
      }
    }

    // Delete the listing (cascade will handle related records)
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId)
      .eq('created_by', userId); // Double-check ownership

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting listing:', error);
    throw error;
  }
}

// Increment view count
export async function incrementViewCount(listingId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_listing_view_count', {
      listing_id: listingId,
    });

    if (error) {
      console.error('Error incrementing view count:', error);
      // Don't throw error for view count updates
    }
  } catch (error) {
    console.error('Error incrementing view count:', error);
    // Don't throw error for view count updates
  }
}

// Add/remove listing from favorites
export async function toggleFavorite(listingId: string, userId: string, isFavorite: boolean): Promise<void> {
  try {
    if (isFavorite) {
      // Add to favorites
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: userId,
          listing_id: listingId
        });

      if (error && error.code !== '23505') { // Ignore duplicate key error
        throw error;
      }
    } else {
      // Remove from favorites
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('listing_id', listingId);

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw new Error('Failed to update favorite status');
  }
}

// Get favorite listings for a user
export async function getFavoriteListings(userId: string): Promise<PropertyListing[]> {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        listing_id,
        listings!inner (*)
      `)
      .eq('user_id', userId)
      .eq('listings.status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => convertToListing(item.listings));
  } catch (error) {
    console.error('Error getting favorite listings:', error);
    throw new Error('Failed to get favorite listings');
  }
}

// Search listings by text
export async function searchListings(
  searchTerm: string,
  filters?: ListingFilters,
  pageSize: number = 20
): Promise<PropertyListing[]> {
  try {
    // Use text search on title and description
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .in('status', ['active', 'pending', 'sold', 'rented'])
      .order('created_at', { ascending: false })
      .limit(pageSize);

    if (error) throw error;

    return await fetchFavoritesForListings(data || []);
  } catch (error) {
    console.error('Error searching listings:', error);
    throw new Error('Failed to search listings');
  }
}

/**
 * Get listings within radius with full listing details and distance
 * This is useful for displaying listings on a map sorted by distance
 * @param lat Center latitude
 * @param lng Center longitude
 * @param radiusMiles Radius in miles
 * @param filters Optional additional filters
 * @param pageSize Maximum number of results
 * @returns Array of listings with distance property added
 */
export async function getListingsByLocation(
  lat: number,
  lng: number,
  radiusMiles: number = 10,
  filters?: Omit<ListingFilters, 'location'>,
  pageSize: number = 50
): Promise<(PropertyListing & { distance?: number })[]> {
  try {
    const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters
    
    // Get listing IDs and distances using PostGIS
    const spatialResults = await getListingsWithinRadius(lat, lng, radiusMeters);
    
    if (spatialResults.length === 0) {
      return [];
    }
    
    // Get the listing IDs
    const listingIds = spatialResults.map(r => r.id);
    
    // Build query for full listing details
    let query = supabase
      .from('listings')
      .select('*')
      .in('id', listingIds)
      .in('status', ['active', 'pending', 'sold', 'rented']);
    
    // Apply additional filters if provided
    if (filters) {
      if (filters.propertyType && filters.propertyType.length > 0) {
        query = query.in('property_type', filters.propertyType);
      }
      if (filters.listingType) {
        query = query.eq('listing_type', filters.listingType);
      }
      if (filters.priceRange) {
        if (filters.priceRange.min > 0) {
          query = query.gte('price', filters.priceRange.min);
        }
        if (filters.priceRange.max < Number.MAX_SAFE_INTEGER) {
          query = query.lte('price', filters.priceRange.max);
        }
      }
    }
    
    query = query.limit(pageSize);
    
    const { data, error } = await query;
    if (error) throw error;
    
    // Convert to PropertyListing with favorites
    let listings = await fetchFavoritesForListings(data || []);
    
    // Create a map of distances
    const distanceMap = new Map(
      spatialResults.map(r => [r.id, r.distanceMeters])
    );
    
    // Add distance to each listing and sort by distance
    const listingsWithDistance = listings
      .map(listing => ({
        ...listing,
        distance: distanceMap.get(listing.id),
      }))
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    
    return listingsWithDistance;
  } catch (error) {
    console.error('Error getting listings by location:', error);
    throw new Error('Failed to get listings by location');
  }
}
