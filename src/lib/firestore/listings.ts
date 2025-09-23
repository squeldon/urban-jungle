import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  increment,
  arrayUnion,
  arrayRemove,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import firebase_app from '@/firebase/config';
import { PropertyListing, CreateListingData, UpdateListingData, ListingFilters } from '@/types/listing';
import { deleteMultipleImages, isFirebaseStorageUrl } from '@/lib/firebase/storage';

const db = getFirestore(firebase_app);
const LISTINGS_COLLECTION = 'listings';

// Helper function to convert Firestore timestamp to Date
const convertTimestamps = (data: DocumentData): Omit<PropertyListing, 'id'> => {
  const { id, ...cleanData } = data;
  return {
    ...cleanData,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as Omit<PropertyListing, 'id'>;
};

// Create a new listing
export async function createListing(listingData: CreateListingData, userId: string): Promise<string> {
  try {
    const newListing = {
      ...listingData,
      createdBy: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      views: 0,
      favorites: [],
      isVerified: false,
      status: 'active' as const,
    };

    const docRef = await addDoc(collection(db, LISTINGS_COLLECTION), newListing);
    return docRef.id;
  } catch (error) {
    console.error('Error creating listing:', error);
    throw new Error('Failed to create listing');
  }
}

// Get a single listing by ID
export async function getListing(listingId: string): Promise<PropertyListing | null> {
  try {
    const docRef = doc(db, LISTINGS_COLLECTION, listingId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...convertTimestamps(docSnap.data()),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting listing:', error);
    throw new Error('Failed to get listing');
  }
}

// Get listings with filters and pagination
export async function getListings(
  filters?: ListingFilters,
  pageSize: number = 20,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ listings: PropertyListing[]; lastDoc?: QueryDocumentSnapshot<DocumentData> }> {
  try {
    let q = query(collection(db, LISTINGS_COLLECTION));
    
    // Apply filters
    if (filters) {
      if (filters.propertyType && filters.propertyType.length > 0) {
        q = query(q, where('propertyType', 'in', filters.propertyType));
      }
      
      if (filters.listingType) {
        q = query(q, where('listingType', '==', filters.listingType));
      }
      
      if (filters.priceRange) {
        if (filters.priceRange.min > 0) {
          q = query(q, where('price', '>=', filters.priceRange.min));
        }
        if (filters.priceRange.max > 0) {
          q = query(q, where('price', '<=', filters.priceRange.max));
        }
      }
      
      if (filters.arvRange) {
        if (filters.arvRange.min > 0) {
          q = query(q, where('arv', '>=', filters.arvRange.min));
        }
        if (filters.arvRange.max > 0) {
          q = query(q, where('arv', '<=', filters.arvRange.max));
        }
      }
      
      if (filters.repairCostsRange) {
        if (filters.repairCostsRange.min > 0) {
          q = query(q, where('repairCosts', '>=', filters.repairCostsRange.min));
        }
        if (filters.repairCostsRange.max > 0) {
          q = query(q, where('repairCosts', '<=', filters.repairCostsRange.max));
        }
      }
      
      if (filters.location?.city) {
        q = query(q, where('address.city', '==', filters.location.city));
      }
      
      if (filters.location?.state) {
        q = query(q, where('address.state', '==', filters.location.state));
      }
      
      if (filters.location?.zipCode) {
        q = query(q, where('address.zipCode', '==', filters.location.zipCode));
      }
    }
    
    // Add status filter to only show active listings (exclude inactive and withdrawn)
    q = query(q, where('status', 'in', ['active', 'pending', 'sold', 'rented']));
    
    // Order by creation date (newest first)
    q = query(q, orderBy('createdAt', 'desc'));
    
    // Add pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    
    q = query(q, limit(pageSize));
    
    const querySnapshot = await getDocs(q);
    
    let listings: PropertyListing[] = [];
    let newLastDoc: QueryDocumentSnapshot<DocumentData> | undefined;
    
    querySnapshot.forEach((doc) => {
      listings.push({
        id: doc.id,
        ...convertTimestamps(doc.data()),
      });
      newLastDoc = doc;
    });

    // Apply client-side filters for complex queries
    if (filters) {
      listings = listings.filter((listing) => {
        // Filter by bedrooms
        if (filters.bedrooms && filters.bedrooms.min > 0) {
          if (!listing.bedrooms || listing.bedrooms < filters.bedrooms.min) return false;
        }
        if (filters.bedrooms && filters.bedrooms.max > 0) {
          if (!listing.bedrooms || listing.bedrooms > filters.bedrooms.max) return false;
        }

        // Filter by bathrooms
        if (filters.bathrooms && filters.bathrooms.min > 0) {
          if (!listing.bathrooms || listing.bathrooms < filters.bathrooms.min) return false;
        }
        if (filters.bathrooms && filters.bathrooms.max > 0) {
          if (!listing.bathrooms || listing.bathrooms > filters.bathrooms.max) return false;
        }

        // Filter by square feet
        if (filters.squareFeet && filters.squareFeet.min > 0) {
          if (!listing.squareFeet || listing.squareFeet < filters.squareFeet.min) return false;
        }
        if (filters.squareFeet && filters.squareFeet.max > 0) {
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
    
    return { listings, lastDoc: newLastDoc };
  } catch (error) {
    console.error('Error getting listings:', error);
    throw new Error('Failed to get listings');
  }
}

// Get listings by user
export async function getUserListings(userId: string): Promise<PropertyListing[]> {
  try {
    const q = query(
      collection(db, LISTINGS_COLLECTION),
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const listings: PropertyListing[] = [];
    
    querySnapshot.forEach((doc) => {
      listings.push({
        id: doc.id,
        ...convertTimestamps(doc.data()),
      });
    });
    
    return listings;
  } catch (error) {
    console.error('Error getting user listings:', error);
    throw new Error('Failed to get user listings');
   }
}

// Update a listing
export async function updateListing(
  listingId: string,
  updateData: UpdateListingData,
  userId: string
): Promise<void> {
  try {
    const docRef = doc(db, LISTINGS_COLLECTION, listingId);
    
    // First check if the user owns this listing
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Listing not found');
    }
    
    const listing = docSnap.data();
    if (listing.createdBy !== userId) {
      throw new Error('Unauthorized: You can only update your own listings');
    }
    
    // If images are being updated, clean up removed images from storage
    if (updateData.images && listing.images) {
      const oldImages = listing.images || [];
      const newImages = updateData.images || [];
      const removedImages = oldImages.filter((url: string) => !newImages.includes(url));
      
      if (removedImages.length > 0) {
        const firebaseStorageImages = removedImages.filter((url: string) => isFirebaseStorageUrl(url));
        if (firebaseStorageImages.length > 0) {
          try {
            await deleteMultipleImages(firebaseStorageImages);
          } catch (error) {
            console.error('Error deleting removed images from storage:', error);
            // Continue with update even if image cleanup fails
          }
        }
      }
    }
    
    const updatedData = {
      ...updateData,
      updatedAt: Timestamp.now(),
    };
    
    await updateDoc(docRef, updatedData);
  } catch (error) {
    console.error('Error updating listing:', error);
    throw error;
  }
}

// Delete a listing
export async function deleteListing(listingId: string, userId: string): Promise<void> {
  try {
    const docRef = doc(db, LISTINGS_COLLECTION, listingId);
    
    // First check if the user owns this listing
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Listing not found');
    }
    
    const listing = docSnap.data();
    if (listing.createdBy !== userId) {
      throw new Error('Unauthorized: You can only delete your own listings');
    }
    
    // Delete images from Firebase Storage if they exist
    if (listing.images && Array.isArray(listing.images)) {
      const firebaseStorageImages = listing.images.filter((url: string) => isFirebaseStorageUrl(url));
      if (firebaseStorageImages.length > 0) {
        try {
          await deleteMultipleImages(firebaseStorageImages);
        } catch (error) {
          console.error('Error deleting images from storage:', error);
          // Continue with listing deletion even if image cleanup fails
        }
      }
    }
    
    // Delete the listing document
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting listing:', error);
    throw error;
  }
}

// Increment view count
export async function incrementViewCount(listingId: string): Promise<void> {
  try {
    const docRef = doc(db, LISTINGS_COLLECTION, listingId);
    await updateDoc(docRef, {
      views: increment(1),
    });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    // Don't throw error for view count updates
  }
}

// Add/remove listing from favorites
export async function toggleFavorite(listingId: string, userId: string, isFavorite: boolean): Promise<void> {
  try {
    const docRef = doc(db, LISTINGS_COLLECTION, listingId);
    
    if (isFavorite) {
      await updateDoc(docRef, {
        favorites: arrayUnion(userId),
      });
    } else {
      await updateDoc(docRef, {
        favorites: arrayRemove(userId),
      });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw new Error('Failed to update favorite status');
  }
}

// Get favorite listings for a user
export async function getFavoriteListings(userId: string): Promise<PropertyListing[]> {
  try {
    const q = query(
      collection(db, LISTINGS_COLLECTION),
      where('favorites', 'array-contains', userId),
      where('status', 'in', ['active', 'pending', 'sold', 'rented']),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const listings: PropertyListing[] = [];
    
    querySnapshot.forEach((doc) => {
      listings.push({
        id: doc.id,
        ...convertTimestamps(doc.data()),
      });
    });
    
    return listings;
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
    // For text search, we'll use a simple approach with tags
    // In production, you might want to use Algolia or another search service
    const q = query(
      collection(db, LISTINGS_COLLECTION),
      where('tags', 'array-contains-any', searchTerm.toLowerCase().split(' ')),
      where('status', 'in', ['active', 'pending', 'sold', 'rented']),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
    
    const querySnapshot = await getDocs(q);
    const listings: PropertyListing[] = [];
    
    querySnapshot.forEach((doc) => {
      listings.push({
        id: doc.id,
        ...convertTimestamps(doc.data()),
      });
    });
    
    return listings;
  } catch (error) {
    console.error('Error searching listings:', error);
    throw new Error('Failed to search listings');
  }
}
