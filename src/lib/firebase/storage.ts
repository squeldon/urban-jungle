import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import firebase_app from '@/firebase/config';

const storage = getStorage(firebase_app);

/**
 * Upload an image file to Firebase Storage
 * @param file - The image file to upload
 * @param userId - The user ID for organizing uploads
 * @param listingId - Optional listing ID for organizing images
 * @returns Promise<string> - The download URL of the uploaded image
 */
export async function uploadImage(
  file: File, 
  userId: string, 
  listingId?: string
): Promise<string> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size must be less than 10MB');
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Create storage path: listings/{userId}/{listingId?}/{fileName}
    const storagePath = listingId 
      ? `listings/${userId}/${listingId}/${fileName}`
      : `listings/${userId}/temp/${fileName}`;
    
    console.log(`Uploading image: ${fileName} to path: ${storagePath}`);
    
    // Create a reference to the file location
    const imageRef = ref(storage, storagePath);
    
    // Upload the file
    console.log('Starting upload...');
    const snapshot = await uploadBytes(imageRef, file);
    console.log('Upload completed, getting download URL...');
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL obtained:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('storage/unauthorized')) {
        throw new Error('Firebase Storage access denied. Please ensure Storage is enabled and rules are deployed.');
      }
      if (error.message.includes('storage/canceled')) {
        throw new Error('Upload was canceled.');
      }
      if (error.message.includes('storage/unknown')) {
        throw new Error('Firebase Storage is not properly configured. Please enable Storage in Firebase Console.');
      }
      throw new Error(error.message);
    }
    
    throw new Error('Failed to upload image. Please check Firebase Storage configuration.');
  }
}

/**
 * Upload multiple images sequentially
 * @param files - Array of image files to upload
 * @param userId - The user ID for organizing uploads
 * @param listingId - Optional listing ID for organizing images
 * @param onProgress - Optional callback for upload progress
 * @returns Promise<string[]> - Array of download URLs
 */
export async function uploadMultipleImages(
  files: File[],
  userId: string,
  listingId?: string,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const uploadedUrls: string[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      if (onProgress) {
        onProgress(i, files.length);
      }
      
      const url = await uploadImage(file, userId, listingId);
      uploadedUrls.push(url);
    } catch (error) {
      console.error(`Failed to upload image ${file.name}:`, error);
      // Continue with other uploads even if one fails
    }
  }
  
  if (onProgress) {
    onProgress(files.length, files.length);
  }
  
  return uploadedUrls;
}

/**
 * Delete an image from Firebase Storage using its download URL
 * @param imageUrl - The download URL of the image to delete
 * @returns Promise<void>
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Extract the storage path from the download URL
    const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/';
    if (!imageUrl.startsWith(baseUrl)) {
      throw new Error('Invalid Firebase Storage URL');
    }
    
    // Parse the URL to get the storage path
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)/);
    if (!pathMatch) {
      throw new Error('Could not parse storage path from URL');
    }
    
    const storagePath = decodeURIComponent(pathMatch[1]);
    const imageRef = ref(storage, storagePath);
    
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete image');
  }
}

/**
 * Delete multiple images from Firebase Storage
 * @param imageUrls - Array of download URLs to delete
 * @returns Promise<void>
 */
export async function deleteMultipleImages(imageUrls: string[]): Promise<void> {
  const deletePromises = imageUrls.map(url => 
    deleteImage(url).catch(error => {
      console.error(`Failed to delete image ${url}:`, error);
      // Don't throw - continue deleting other images
    })
  );
  
  await Promise.all(deletePromises);
}

/**
 * Get a resized image URL (if using Firebase Extensions or similar)
 * This is a placeholder for future implementation
 * @param originalUrl - The original image URL
 * @param size - The desired size (e.g., 'thumb', 'medium', 'large')
 * @returns string - The resized image URL or original if no resizing available
 */
export function getResizedImageUrl(originalUrl: string, size: 'thumb' | 'medium' | 'large'): string {
  // For now, return the original URL
  // In the future, you could implement automatic image resizing using Firebase Extensions
  return originalUrl;
}

/**
 * Validate if a URL is a valid Firebase Storage URL
 * @param url - The URL to validate
 * @returns boolean
 */
export function isFirebaseStorageUrl(url: string): boolean {
  return url.startsWith('https://firebasestorage.googleapis.com/v0/b/');
}

/**
 * Extract storage path from Firebase Storage URL
 * @param url - The Firebase Storage download URL
 * @returns string - The storage path
 */
export function extractStoragePath(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)/);
    if (!pathMatch) {
      throw new Error('Could not parse storage path from URL');
    }
    return decodeURIComponent(pathMatch[1]);
  } catch (error) {
    throw new Error('Invalid Firebase Storage URL');
  }
}
