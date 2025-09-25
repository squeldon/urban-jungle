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
import { ListingPreset, CreatePresetData, UpdatePresetData } from '@/types/listing';

const db = getFirestore(firebase_app);
const PRESETS_COLLECTION = 'listingPresets';

// Helper function to convert Firestore timestamp to Date
const convertTimestamps = (data: DocumentData): Omit<ListingPreset, 'id'> => {
  const { id, ...cleanData } = data;
  return {
    ...cleanData,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as Omit<ListingPreset, 'id'>;
};

// Create a new preset
export async function createPreset(presetData: CreatePresetData, userId: string): Promise<string> {
  try {
    const newPreset = {
      ...presetData,
      createdBy: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, PRESETS_COLLECTION), newPreset);
    return docRef.id;
  } catch (error) {
    console.error('Error creating preset:', error);
    throw new Error('Failed to create preset');
  }
}

// Get all presets for a user
export async function getUserPresets(userId: string): Promise<ListingPreset[]> {
  try {
    const q = query(
      collection(db, PRESETS_COLLECTION),
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const presets: ListingPreset[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = convertTimestamps(doc.data());
      presets.push({
        id: doc.id,
        ...data,
      });
    });
    
    return presets;
  } catch (error) {
    console.error('Error fetching user presets:', error);
    throw new Error('Failed to fetch presets');
  }
}

// Get a single preset by ID
export async function getPreset(presetId: string): Promise<ListingPreset | null> {
  try {
    const docRef = doc(db, PRESETS_COLLECTION, presetId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = convertTimestamps(docSnap.data());
      return {
        id: docSnap.id,
        ...data,
      };
    } else {
      return null;
    }
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
    const docRef = doc(db, PRESETS_COLLECTION, presetId);
    
    // First verify the preset belongs to the user
    const presetDoc = await getDoc(docRef);
    if (!presetDoc.exists()) {
      throw new Error('Preset not found');
    }
    
    const presetData = presetDoc.data();
    if (presetData.createdBy !== userId) {
      throw new Error('Unauthorized to update this preset');
    }
    
    const updates = {
      ...updateData,
      updatedAt: Timestamp.now(),
    };
    
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating preset:', error);
    throw new Error('Failed to update preset');
  }
}

// Delete a preset
export async function deletePreset(presetId: string, userId: string): Promise<void> {
  try {
    const docRef = doc(db, PRESETS_COLLECTION, presetId);
    
    // First verify the preset belongs to the user
    const presetDoc = await getDoc(docRef);
    if (!presetDoc.exists()) {
      throw new Error('Preset not found');
    }
    
    const presetData = presetDoc.data();
    if (presetData.createdBy !== userId) {
      throw new Error('Unauthorized to delete this preset');
    }
    
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting preset:', error);
    throw new Error('Failed to delete preset');
  }
}
