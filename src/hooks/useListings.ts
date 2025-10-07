import { useState, useEffect, useCallback, useRef } from 'react';
import { PropertyListing, ListingFilters } from '@/types/listing';
import { useAuthContext } from '@/context/AuthContext';
import * as listingsDb from '@/lib/db/listings';

interface UseListingsReturn {
  listings: PropertyListing[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  toggleListingFavorite: (listingId: string, isFavorite: boolean) => Promise<void>;
  incrementViews: (listingId: string) => Promise<void>;
}

export function useListings(filters?: ListingFilters, pageSize: number = 20): UseListingsReturn {
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<any | undefined>(undefined);
  
  const { user } = useAuthContext() as { user: any };

  const loadListings = useCallback(async (isLoadMore: boolean = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
        setError(null);
      }

      const result = await listingsDb.getListings(
        filters, 
        pageSize, 
        isLoadMore ? lastDocRef.current : undefined
      );
      
      if (isLoadMore) {
        setListings(prev => [...prev, ...result.listings]);
      } else {
        setListings(result.listings);
      }
      
      lastDocRef.current = result.lastDoc;
      setHasMore(result.listings.length === pageSize);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, [filters, pageSize]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await loadListings(true);
  }, [hasMore, loading, loadListings]);

  const refresh = useCallback(async () => {
    lastDocRef.current = undefined;
    setHasMore(true);
    await loadListings(false);
  }, [loadListings]);

  const toggleListingFavorite = useCallback(async (listingId: string, isFavorite: boolean) => {
    if (!user) throw new Error('Must be logged in to favorite listings');
    
    try {
      await listingsDb.toggleFavorite(listingId, user.id, isFavorite);
      
      // Update local state
      setListings(prev => prev.map(listing => {
        if (listing.id === listingId) {
          const newFavorites = isFavorite 
            ? [...listing.favorites, user.id]
            : listing.favorites.filter(id => id !== user.id);
          return { ...listing, favorites: newFavorites };
        }
        return listing;
      }));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update favorite');
    }
  }, [user]);

  const incrementViews = useCallback(async (listingId: string) => {
    try {
      await listingsDb.incrementViewCount(listingId);
      
      // Update local state
      setListings(prev => prev.map(listing => 
        listing.id === listingId 
          ? { ...listing, views: listing.views + 1 }
          : listing
      ));
    } catch (err) {
      console.error('Failed to increment view count:', err);
      // Don't throw error for view count updates
    }
  }, []);

  // Load initial data
  useEffect(() => {
    // Skip loading if filters is explicitly undefined (waiting for location search)
    if (filters === undefined) {
      setLoading(true); // Keep in loading state
      setListings([]); // Clear any existing listings
      return;
    }
    
    lastDocRef.current = undefined; // Reset pagination when filters change
    setHasMore(true);
    loadListings(false);
  }, [filters, loadListings]); // Reload when filters change

  return {
    listings,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    toggleListingFavorite,
    incrementViews,
  };
}

// Hook for user's own listings
export function useUserListings() {
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuthContext() as { user: any };

  const loadUserListings = useCallback(async () => {
    if (!user) {
      console.log('[useUserListings] No user logged in, skipping fetch');
      setListings([]);
      setLoading(false);
      return;
    }

    try {
      console.log('[useUserListings] Starting fetch for user:', user.id);
      setLoading(true);
      setError(null);
      const userListings = await listingsDb.getUserListings(user.id);
      console.log('[useUserListings] Successfully loaded', userListings.length, 'listings');
      setListings(userListings);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user listings';
      console.error('[useUserListings] Error loading listings:', {
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

  useEffect(() => {
    loadUserListings();
  }, [loadUserListings]);

  const handleDeleteListing = useCallback(async (listingId: string) => {
    if (!user) throw new Error('Must be logged in to delete listings');
    
    try {
      await listingsDb.deleteListing(listingId, user.id);
      
      // Update local state by removing the deleted listing
      setListings(prev => prev.filter(listing => listing.id !== listingId));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete listing');
    }
  }, [user]);

  return {
    listings,
    loading,
    error,
    refresh: loadUserListings,
    deleteListing: handleDeleteListing,
  };
}

// Hook for user's favorite listings
export function useFavoriteListings() {
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuthContext() as { user: any };

  const loadFavoriteListings = useCallback(async () => {
    if (!user) {
      setListings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const favoriteListings = await listingsDb.getFavoriteListings(user.id);
      setListings(favoriteListings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favorite listings');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFavoriteListings();
  }, [loadFavoriteListings]);

  return {
    listings,
    loading,
    error,
    refresh: loadFavoriteListings,
  };
}
