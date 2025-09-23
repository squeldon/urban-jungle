import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import firebase_app from '@/firebase/config';
import { canUploadFile, recordFileUpload, recordFileDeletion } from '@/lib/firestore/userQuotas';

const storage = getStorage(firebase_app);

/**
 * Upload a media file (image or video) to Firebase Storage
 * @param file - The media file to upload
 * @param userId - The user ID for organizing uploads
 * @param listingId - Optional listing ID for organizing media
 * @returns Promise<string> - The download URL of the uploaded file
 */
export async function uploadFile(
  file: File, 
  userId: string, 
  listingId?: string
): Promise<string> {
  try {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    // Validate file type
    if (!isImage && !isVideo) {
      throw new Error('File must be an image or video');
    }

    // Validate file size - different limits for images vs videos
    const maxImageSize = 10 * 1024 * 1024; // 10MB for images
    const maxVideoSize = 100 * 1024 * 1024; // 100MB for videos
    
    if (isImage && file.size > maxImageSize) {
      throw new Error('Image size must be less than 10MB');
    }
    
    if (isVideo && file.size > maxVideoSize) {
      throw new Error('Video size must be less than 100MB');
    }

    // Check user's quota before uploading
    const quotaCheck = await canUploadFile(userId, file.size);
    if (!quotaCheck.canUpload) {
      throw new Error(quotaCheck.reason || 'Upload quota exceeded');
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Create storage path: listings/{userId}/{listingId?}/{fileName}
    const storagePath = listingId 
      ? `listings/${userId}/${listingId}/${fileName}`
      : `listings/${userId}/temp/${fileName}`;
    
    console.log(`Uploading ${isVideo ? 'video' : 'image'}: ${fileName} to path: ${storagePath}`);
    
    // Create a reference to the file location
    const fileRef = ref(storage, storagePath);
    
    // Upload the file
    console.log('Starting upload...');
    const snapshot = await uploadBytes(fileRef, file);
    console.log('Upload completed, getting download URL...');
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL obtained:', downloadURL);
    
    // Record the successful upload in user's quota
    await recordFileUpload(userId, file.size);
    
    return downloadURL;
  } catch (error) {
    console.error(`Error uploading ${file.type.startsWith('video/') ? 'video' : 'image'}:`, error);
    
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
      if (error.message.includes('quota exceeded') || error.message.includes('limit')) {
        throw new Error(error.message); // Pass through quota errors as-is
      }
      throw new Error(error.message);
    }
    
    throw new Error('Failed to upload file. Please check Firebase Storage configuration.');
  }
}

/**
 * Upload an image file to Firebase Storage (backward compatibility)
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
  // Validate it's actually an image
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }
  return uploadFile(file, userId, listingId);
}

/**
 * Upload multiple media files (images and/or videos) sequentially
 * @param files - Array of media files to upload
 * @param userId - The user ID for organizing uploads
 * @param listingId - Optional listing ID for organizing media
 * @param onProgress - Optional callback for upload progress
 * @returns Promise<string[]> - Array of download URLs
 */
export async function uploadMultipleFiles(
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
      
      const url = await uploadFile(file, userId, listingId);
      uploadedUrls.push(url);
    } catch (error) {
      console.error(`Failed to upload ${file.type.startsWith('video/') ? 'video' : 'image'} ${file.name}:`, error);
      // Continue with other uploads even if one fails
    }
  }
  
  if (onProgress) {
    onProgress(files.length, files.length);
  }
  
  return uploadedUrls;
}

/**
 * Upload multiple images sequentially (backward compatibility)
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
  // Filter to only images for backward compatibility
  const imageFiles = files.filter(file => file.type.startsWith('image/'));
  return uploadMultipleFiles(imageFiles, userId, listingId, onProgress);
}

/**
 * Delete a media file from Firebase Storage using its download URL
 * @param fileUrl - The download URL of the file to delete
 * @param userId - Optional user ID for quota tracking
 * @returns Promise<void>
 */
export async function deleteFile(fileUrl: string, userId?: string): Promise<void> {
  try {
    // Extract the storage path from the download URL
    const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/';
    if (!fileUrl.startsWith(baseUrl)) {
      throw new Error('Invalid Firebase Storage URL');
    }
    
    // Parse the URL to get the storage path
    const url = new URL(fileUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)/);
    if (!pathMatch) {
      throw new Error('Could not parse storage path from URL');
    }
    
    const storagePath = decodeURIComponent(pathMatch[1]);
    console.log(`Attempting to delete file at path: ${storagePath}`);
    const fileRef = ref(storage, storagePath);
    
    // Get file metadata to determine size for quota tracking
    let fileSize = 0;
    if (userId) {
      try {
        // For quota tracking, we'll estimate file size or store it separately
        // This is a limitation of Firebase Storage - we can't get size after upload easily
        // In production, you might want to store file sizes in Firestore
        fileSize = 0; // We'll implement proper tracking later
      } catch (error) {
        console.warn('Could not get file size for quota tracking:', error);
      }
    }
    
    try {
      await deleteObject(fileRef);
      console.log(`Successfully deleted file: ${storagePath}`);
    } catch (deleteError) {
      // Handle deleteObject specific errors first
      console.log('Raw delete error:', deleteError);
      console.log('Delete error type:', typeof deleteError);
      console.log('Delete error code:', (deleteError as any)?.code);
      console.log('Delete error message:', (deleteError as any)?.message);
      
      const errorCode = (deleteError as any)?.code;
      const errorMessage = (deleteError as any)?.message || String(deleteError);
      
      // Check for object-not-found in multiple ways
      if (errorCode === 'storage/object-not-found' || 
          errorMessage.includes('object-not-found') ||
          errorMessage.includes('does not exist')) {
        console.warn(`File already deleted or doesn't exist: ${storagePath}`);
        return; // Success - file doesn't exist
      }
      
      // Re-throw other errors to be handled by outer catch
      throw deleteError;
    }
    
    // Update user's quota if userId provided
    if (userId && fileSize > 0) {
      await recordFileDeletion(userId, fileSize);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    
    // Handle specific Firebase Storage errors
    if (error instanceof Error) {
      // Check for object-not-found error in multiple ways
      const errorMessage = error.message.toLowerCase();
      const errorCode = (error as any).code;
      
      // If the object doesn't exist, treat it as already deleted (success)
      if (errorCode === 'storage/object-not-found' || 
          errorMessage.includes('storage/object-not-found') || 
          errorMessage.includes('does not exist') ||
          errorMessage.includes('object-not-found')) {
        console.warn(`File already deleted or doesn't exist: ${fileUrl}`);
        return; // Don't throw error for already deleted files
      }
      
      // If unauthorized, provide helpful error
      if (errorCode === 'storage/unauthorized' || errorMessage.includes('storage/unauthorized')) {
        throw new Error('You do not have permission to delete this file');
      }
      
      // For other known Firebase errors, provide specific messages
      if (errorCode?.startsWith('storage/') || errorMessage.includes('storage/')) {
        console.warn(`Firebase Storage error (non-critical): ${error.message}`);
        return; // Treat other storage errors as non-critical for deletion
      }
      
      throw new Error(error.message);
    }
    
    // Handle any non-Error objects
    console.error('Unknown error type during file deletion:', error);
    return; // Don't throw for unknown errors during deletion
  }
}

/**
 * Delete an image from Firebase Storage using its download URL (backward compatibility)
 * @param imageUrl - The download URL of the image to delete
 * @param userId - Optional user ID for quota tracking
 * @returns Promise<void>
 */
export async function deleteImage(imageUrl: string, userId?: string): Promise<void> {
  return deleteFile(imageUrl, userId);
}

/**
 * Delete multiple media files from Firebase Storage
 * @param fileUrls - Array of download URLs to delete
 * @param userId - Optional user ID for quota tracking
 * @returns Promise<void>
 */
export async function deleteMultipleFiles(fileUrls: string[], userId?: string): Promise<void> {
  if (!fileUrls || fileUrls.length === 0) {
    return;
  }

  console.log(`Attempting to delete ${fileUrls.length} files from storage`);
  
  const deletePromises = fileUrls.map(async (url, index) => {
    try {
      await deleteFile(url, userId);
      console.log(`Successfully deleted file ${index + 1}/${fileUrls.length}`);
    } catch (error) {
      console.warn(`Failed to delete file ${index + 1}/${fileUrls.length} (${url}):`, error);
      // Continue with other deletions - individual deleteFile already handles most errors gracefully
    }
  });
  
  await Promise.all(deletePromises);
  console.log(`Completed deletion attempt for ${fileUrls.length} files`);
}

/**
 * Delete multiple images from Firebase Storage (backward compatibility)
 * @param imageUrls - Array of download URLs to delete
 * @param userId - Optional user ID for quota tracking
 * @returns Promise<void>
 */
export async function deleteMultipleImages(imageUrls: string[], userId?: string): Promise<void> {
  return deleteMultipleFiles(imageUrls, userId);
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

/**
 * Check if a file is an image based on its MIME type
 * @param file - The file to check
 * @returns boolean
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Check if a file is a video based on its MIME type
 * @param file - The file to check
 * @returns boolean
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/');
}

/**
 * Check if a file is a valid media file (image or video)
 * @param file - The file to check
 * @returns boolean
 */
export function isMediaFile(file: File): boolean {
  return isImageFile(file) || isVideoFile(file);
}

/**
 * Get file type from URL based on file extension (best effort)
 * @param url - The file URL
 * @returns 'image' | 'video' | 'unknown'
 */
export function getFileTypeFromUrl(url: string): 'image' | 'video' | 'unknown' {
  const path = extractStoragePath(url).toLowerCase();
  
  // Image extensions
  if (path.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i)) {
    return 'image';
  }
  
  // Video extensions
  if (path.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)$/i)) {
    return 'video';
  }
  
  return 'unknown';
}
