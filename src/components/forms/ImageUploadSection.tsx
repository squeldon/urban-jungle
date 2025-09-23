'use client'
import { useState, useRef } from 'react';
import { Upload, X, Camera, Image as ImageIcon } from 'lucide-react';
import { CreateListingData } from '@/types/listing';
import { uploadMultipleImages, deleteImage, isFirebaseStorageUrl } from '@/lib/firebase/storage';
import { useAuthContext } from '@/context/AuthContext';

interface ImageUploadSectionProps {
  formData: CreateListingData;
  onImagesChange: (images: string[]) => void;
}

export function ImageUploadSection({ formData, onImagesChange }: ImageUploadSectionProps) {
  const { user } = useAuthContext() as { user: any };
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;

    if (!user) {
      console.error('User must be logged in to upload images');
      return;
    }

    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    try {
      // Convert FileList to Array and filter valid images
      const validFiles: File[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          console.warn(`File ${file.name} is not an image`);
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          console.warn(`File ${file.name} is too large (max 10MB)`);
          continue;
        }

        validFiles.push(file);
      }

      if (validFiles.length === 0) {
        console.warn('No valid image files to upload');
        return;
      }

      // Upload images to Firebase Storage
      const uploadedUrls = await uploadMultipleImages(
        validFiles,
        user.uid,
        undefined, // No listing ID yet (this is during creation)
        (current, total) => {
          setUploadProgress({ current, total });
        }
      );

      // Update form data with new image URLs
      onImagesChange([...formData.images, ...uploadedUrls]);
    } catch (error) {
      console.error('Error uploading images:', error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload images';
      alert(`Upload failed: ${errorMessage}`);
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };

  const removeImage = async (index: number) => {
    const imageUrl = formData.images[index];
    
    // If it's a Firebase Storage URL, delete it from storage
    if (isFirebaseStorageUrl(imageUrl)) {
      try {
        await deleteImage(imageUrl);
      } catch (error) {
        console.error('Error deleting image from storage:', error);
        // Continue with removing from form even if storage deletion fails
      }
    }
    
    const newImages = formData.images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...formData.images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onImagesChange(newImages);
  };

  // Drag and drop handlers for reordering
  const handlePhotoDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handlePhotoDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handlePhotoDragLeave = () => {
    setDragOverIndex(null);
  };

  const handlePhotoDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handlePhotoDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveImage(draggedIndex, dropIndex);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Property Photos</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload high-quality photos of your property. The first image will be used as the cover photo.
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {formData.images.length}/20 photos
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="text-center">
          <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
            {uploading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            ) : (
              <Camera className="w-12 h-12" />
            )}
          </div>
          
          {uploading ? (
            <div className="text-gray-600 dark:text-gray-400">
              <p>Uploading photos...</p>
              {uploadProgress.total > 0 && (
                <p className="text-sm mt-1">
                  {uploadProgress.current} of {uploadProgress.total} uploaded
                </p>
              )}
            </div>
          ) : (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Drag and drop photos here, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  browse files
                </button>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Support JPG, PNG, WebP up to 10MB each
              </p>
            </>
          )}
        </div>
      </div>

      {/* Uploaded Images */}
      {formData.images.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Uploaded Photos</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {formData.images.map((image, index) => (
              <div 
                key={index} 
                className={`relative group cursor-move transition-all duration-200 ${
                  draggedIndex === index ? 'opacity-50 scale-95' : ''
                } ${
                  dragOverIndex === index && draggedIndex !== index ? 'ring-2 ring-blue-500 scale-105' : ''
                }`}
                draggable
                onDragStart={(e) => handlePhotoDragStart(e, index)}
                onDragOver={(e) => handlePhotoDragOver(e, index)}
                onDragLeave={handlePhotoDragLeave}
                onDragEnd={handlePhotoDragEnd}
                onDrop={(e) => handlePhotoDrop(e, index)}
              >
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <img
                    src={image}
                    alt={`Property photo ${index + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
                
                {/* Cover Photo Badge */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 text-xs rounded">
                    Cover Photo
                  </div>
                )}

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Move Controls */}
                <div className="absolute bottom-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => moveImage(index, index - 1)}
                      className="bg-black/50 text-white p-1 rounded text-xs hover:bg-black/70 z-10"
                    >
                      ←
                    </button>
                  )}
                  {index < formData.images.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveImage(index, index + 1)}
                      className="bg-black/50 text-white p-1 rounded text-xs hover:bg-black/70 z-10"
                    >
                      →
                    </button>
                  )}
                </div>

                {/* Image Number */}
                <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 text-xs rounded">
                  {index + 1}
                </div>

                {/* Drag indicator */}
                <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    Drag to reorder
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>• The first photo will be used as the cover photo on listing cards</p>
            <p>• Drag and drop photos to reorder them, or use the arrow buttons</p>
            <p>• Click the X button to remove unwanted photos</p>
          </div>
        </div>
      )}
    </div>
  );
}
