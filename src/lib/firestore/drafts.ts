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
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import firebase_app from '@/firebase/config';
import { PropertyDraft, CreateDraftData, UpdateDraftData, CreateListingData } from '@/types/listing';
import { createListing } from './listings';
import { deleteMultipleImages, isFirebaseStorageUrl } from '@/lib/firebase/storage';

const db = getFirestore(firebase_app);
const DRAFTS_COLLECTION = 'drafts';

// Helper function to convert Firestore timestamp to Date
const convertTimestamps = (data: DocumentData): Omit<PropertyDraft, 'id'> => {
  const { id, ...cleanData } = data;
  return {
    ...cleanData,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as Omit<PropertyDraft, 'id'>;
};

// Create a new draft
export async function saveDraft(draftData: CreateDraftData, userId: string): Promise<string> {
  try {
    const newDraft = {
      ...draftData,
      createdBy: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, DRAFTS_COLLECTION), newDraft);
    return docRef.id;
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
    const docRef = doc(db, DRAFTS_COLLECTION, draftId);
    
    // First check if the user owns this draft
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Draft not found');
    }
    
    const draft = docSnap.data();
    if (draft.createdBy !== userId) {
      throw new Error('Unauthorized: You can only update your own drafts');
    }

    // If images are being updated, clean up removed images from storage
    if (updateData.images && draft.images) {
      const oldImages = draft.images || [];
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
    console.error('Error updating draft:', error);
    throw error;
  }
}

// Get all drafts for a user
export async function getUserDrafts(userId: string): Promise<PropertyDraft[]> {
  try {
    const q = query(
      collection(db, DRAFTS_COLLECTION),
      where('createdBy', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const drafts: PropertyDraft[] = [];
    
    querySnapshot.forEach((doc) => {
      drafts.push({
        id: doc.id,
        ...convertTimestamps(doc.data()),
      });
    });
    
    return drafts;
  } catch (error) {
    console.error('Error getting user drafts:', error);
    throw new Error('Failed to get user drafts');
   }
}

// Get a single draft by ID
export async function getDraft(draftId: string): Promise<PropertyDraft | null> {
  try {
    const docRef = doc(db, DRAFTS_COLLECTION, draftId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...convertTimestamps(docSnap.data()),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting draft:', error);
    throw new Error('Failed to get draft');
  }
}

// Delete a draft
export async function deleteDraft(draftId: string, userId: string): Promise<void> {
  try {
    const docRef = doc(db, DRAFTS_COLLECTION, draftId);
    
    // First check if the user owns this draft
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Draft not found');
    }
    
    const draft = docSnap.data();
    if (draft.createdBy !== userId) {
      throw new Error('Unauthorized: You can only delete your own drafts');
    }
    
    // Delete images from Firebase Storage if they exist
    if (draft.images && Array.isArray(draft.images)) {
      const firebaseStorageImages = draft.images.filter((url: string) => isFirebaseStorageUrl(url));
      if (firebaseStorageImages.length > 0) {
        try {
          await deleteMultipleImages(firebaseStorageImages);
        } catch (error) {
          console.error('Error deleting images from storage:', error);
          // Continue with draft deletion even if image cleanup fails
        }
      }
    }
    
    // Delete the draft document
    await deleteDoc(docRef);
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
      address: draft.address || {
        streetName: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US',
      },
      coordinates: draft.coordinates,
      features: draft.features || [],
      amenities: draft.amenities || [],
      images: draft.images || [],
      videos: draft.videos,
      media: draft.media,
      virtualTourUrl: draft.virtualTourUrl,
      contactInfo: draft.contactInfo || {
        name: '',
        email: '',
        isOwner: true,
      },
      dealTerms: draft.dealTerms,
      comps: draft.comps,
      tags: [], // Will be generated in createListing function
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
