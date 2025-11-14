import { supabase } from './client';
import { canUploadFile, recordFileUpload, recordFileDeletion } from '@/lib/db/userQuotas';
import { recordMediaUpload, recordMediaDeletion } from '@/lib/db/listingMedia';

const STORAGE_BUCKET = 'listings';

/**
 * Upload a media file (image or video) to Supabase Storage
 * @param file - The media file to upload
 * @param userId - The user ID for organizing uploads
 * @param listingId - Optional listing ID for organizing media
 * @param draftId - Optional draft ID for organizing media
 * @returns Promise<string> - The public URL of the uploaded file
 */
export async function uploadFile(
  file: File, 
  userId: string, 
  listingId?: string,
  draftId?: string
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
    
    // Create storage path: listings/{userId}/{listingId|draftId|temp}/{fileName}
    let storagePath: string;
    if (listingId) {
      storagePath = `${userId}/${listingId}/${fileName}`;
    } else if (draftId) {
      storagePath = `${userId}/${draftId}/${fileName}`;
    } else {
      storagePath = `${userId}/temp/${fileName}`;
    }
    
    console.log(`Uploading ${isVideo ? 'video' : 'image'}: ${fileName} to path: ${storagePath}`);
    
    // Upload the file to Supabase Storage
    console.log('Starting upload...');
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });
    
    if (error) {
      console.error('Supabase Storage upload error:', error);
      throw new Error(error.message);
    }
    
    console.log('Upload completed, getting public URL...');
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);
    
    console.log('Public URL obtained:', publicUrl);
    
    // Record the file metadata in listing_media table
    await recordMediaUpload({
      userId,
      listingId,
      draftId,
      storagePath,
      mimeType: file.type,
      bytes: file.size
    });
    
    // Record the successful upload in user's quota
    await recordFileUpload(userId, file.size);
    
    return publicUrl;
  } catch (error) {
    console.error(`Error uploading ${file.type.startsWith('video/') ? 'video' : 'image'}:`, error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('unauthorized')) {
        throw new Error('Storage access denied. Please ensure you are logged in and have permission.');
      }
      if (error.message.includes('quota exceeded') || error.message.includes('limit')) {
        throw new Error(error.message); // Pass through quota errors as-is
      }
      throw new Error(error.message);
    }
    
    throw new Error('Failed to upload file. Please try again.');
  }
}

/**
 * Upload an image file to Supabase Storage (backward compatibility)
 * @param file - The image file to upload
 * @param userId - The user ID for organizing uploads
 * @param listingId - Optional listing ID for organizing images
 * @returns Promise<string> - The public URL of the uploaded image
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
 * @returns Promise<string[]> - Array of public URLs
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
 * @returns Promise<string[]> - Array of public URLs
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
 * Delete a media file from Supabase Storage using its public URL
 * @param fileUrl - The public URL of the file to delete
 * @param userId - Optional user ID for quota tracking
 * @returns Promise<void>
 */
export async function deleteFile(fileUrl: string, userId?: string): Promise<void> {
  try {
    // Extract the storage path from the public URL
    const storagePath = extractStoragePath(fileUrl);
    
    if (!storagePath) {
      throw new Error('Could not parse storage path from URL');
    }
    
    console.log(`Attempting to delete file at path: ${storagePath}`);
    
    // Get file metadata for quota tracking before deletion
    let fileSize = 0;
    if (userId) {
      try {
        // Fetch file metadata from listing_media table
        const mediaRecord = await getMediaRecordByPath(storagePath);
        if (mediaRecord) {
          fileSize = mediaRecord.bytes;
        }
      } catch (error) {
        console.warn('Could not get file size for quota tracking:', error);
      }
    }
    
    // Delete from Supabase Storage
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);
    
    if (error) {
      console.error('Supabase Storage delete error:', error);
      
      // If object doesn't exist, treat as already deleted (success)
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        console.warn(`File already deleted or doesn't exist: ${storagePath}`);
      } else {
        throw new Error(error.message);
      }
    } else {
      console.log(`Successfully deleted file: ${storagePath}`);
    }
    
    // Delete from listing_media table
    await recordMediaDeletion(storagePath);
    
    // Update user's quota if userId provided and we have file size
    if (userId && fileSize > 0) {
      await recordFileDeletion(userId, fileSize);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      // If the object doesn't exist, treat it as already deleted (success)
      if (errorMessage.includes('not found') || 
          errorMessage.includes('does not exist')) {
        console.warn(`File already deleted or doesn't exist: ${fileUrl}`);
        return; // Don't throw error for already deleted files
      }
      
      // If unauthorized, provide helpful error
      if (errorMessage.includes('unauthorized') || errorMessage.includes('permission')) {
        throw new Error('You do not have permission to delete this file');
      }
      
      throw new Error(error.message);
    }
    
    // Handle any non-Error objects
    console.error('Unknown error type during file deletion:', error);
    return; // Don't throw for unknown errors during deletion
  }
}

/**
 * Delete an image from Supabase Storage using its public URL (backward compatibility)
 * @param imageUrl - The public URL of the image to delete
 * @param userId - Optional user ID for quota tracking
 * @returns Promise<void>
 */
export async function deleteImage(imageUrl: string, userId?: string): Promise<void> {
  return deleteFile(imageUrl, userId);
}

/**
 * Delete multiple media files from Supabase Storage
 * @param fileUrls - Array of public URLs to delete
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
      // Continue with other deletions
    }
  });
  
  await Promise.all(deletePromises);
  console.log(`Completed deletion attempt for ${fileUrls.length} files`);
}

/**
 * Delete multiple images from Supabase Storage (backward compatibility)
 * @param imageUrls - Array of public URLs to delete
 * @param userId - Optional user ID for quota tracking
 * @returns Promise<void>
 */
export async function deleteMultipleImages(imageUrls: string[], userId?: string): Promise<void> {
  return deleteMultipleFiles(imageUrls, userId);
}

/**
 * Get a public URL for a file in storage
 * @param storagePath - The storage path of the file
 * @returns string - The public URL
 */
export function getPublicUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);
  
  return data.publicUrl;
}

/**
 * Validate if a URL is a valid Supabase Storage URL
 * @param url - The URL to validate
 * @returns boolean
 */
export function isSupabaseStorageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('supabase') && urlObj.pathname.includes('/storage/');
  } catch {
    return false;
  }
}

/**
 * Extract storage path from Supabase Storage public URL
 * @param url - The Supabase Storage public URL
 * @returns string - The storage path
 */
export function extractStoragePath(url: string): string {
  try {
    const urlObj = new URL(url);
    // Supabase Storage URLs format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
    if (!pathMatch) {
      throw new Error('Could not parse storage path from URL');
    }
    return decodeURIComponent(pathMatch[1]);
  } catch (error) {
    console.error('Error extracting storage path:', error);
    throw new Error('Invalid Supabase Storage URL');
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
  try {
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
  } catch {
    return 'unknown';
  }
}

/**
 * Helper function to get media record by storage path
 * @param storagePath - The storage path
 * @returns Promise<MediaRecord | null>
 */
async function getMediaRecordByPath(storagePath: string): Promise<{ bytes: number } | null> {
  const { data, error } = await supabase
    .from('listing_media')
    .select('bytes')
    .eq('storage_object_path', storagePath)
    .single();
  
  if (error) {
    console.warn('Error fetching media record:', error);
    return null;
  }
  
  return data;
}

/**
 * Get a resized image URL (placeholder for future implementation)
 * This is a placeholder for future implementation with image transformations
 * @param originalUrl - The original image URL
 * @param size - The desired size (e.g., 'thumb', 'medium', 'large')
 * @returns string - The resized image URL or original if no resizing available
 */
export function getResizedImageUrl(originalUrl: string, size: 'thumb' | 'medium' | 'large'): string {
  // For now, return the original URL
  // In the future, you could implement automatic image resizing using Supabase Image Transformations
  // https://supabase.com/docs/guides/storage/image-transformations
  return originalUrl;
}
