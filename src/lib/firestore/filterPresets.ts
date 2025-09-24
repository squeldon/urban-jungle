import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
  updateDoc,
  query,
  where,
  getFirestore,
  orderBy,
} from 'firebase/firestore';
import firebase_app from '@/firebase/config';
import { FilterState, sanitizeFilters } from '@/hooks/useFilters';

const db = getFirestore(firebase_app);

const getPresetsCollection = (userId: string) =>
  collection(db, 'users', userId, 'filterPresets');

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: Date;
  updatedAt: Date;
}

export const getFilterPresets = async (userId: string): Promise<FilterPreset[]> => {
  const presetsRef = getPresetsCollection(userId);
  const presetsQuery = query(presetsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(presetsQuery);

  const presets: FilterPreset[] = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const filters = sanitizeFilters(data.filters || {});
    presets.push({
      id: docSnap.id,
      name: data.name || 'Unnamed Preset',
      filters,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    });
  });

  return presets;
};

export const saveFilterPreset = async (
  userId: string,
  name: string,
  filters: FilterState,
  existingPresetId?: string
): Promise<string> => {
  const sanitizedFilters = sanitizeFilters(filters);
  const presetsRef = getPresetsCollection(userId);
  const timestamp = Timestamp.now();

  if (existingPresetId) {
    const presetDocRef = doc(presetsRef, existingPresetId);
    await updateDoc(presetDocRef, {
      name,
      filters: sanitizedFilters,
      updatedAt: timestamp,
    });
    return existingPresetId;
  }

  const docRef = await addDoc(presetsRef, {
    name,
    filters: sanitizedFilters,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return docRef.id;
};

export const findPresetByName = async (
  userId: string,
  name: string
): Promise<FilterPreset | null> => {
  const presetsRef = getPresetsCollection(userId);
  const presetsQuery = query(presetsRef, where('name', '==', name));
  const snapshot = await getDocs(presetsQuery);

  if (snapshot.empty) {
    return null;
  }

  const docSnap = snapshot.docs[0];
  const data = docSnap.data();

  return {
    id: docSnap.id,
    name: data.name || name,
    filters: sanitizeFilters(data.filters || {}),
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
  };
};

export const deleteFilterPreset = async (
  userId: string,
  presetId: string
): Promise<void> => {
  const presetDocRef = doc(getPresetsCollection(userId), presetId);
  await deleteDoc(presetDocRef);
};

