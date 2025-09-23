'use client'
import { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { createListing, updateListing } from '@/lib/firestore/listings';
import { CreateListingData, PropertyListing, UpdateListingData } from '@/types/listing';
import { X } from 'lucide-react';
import { useListingForm } from '@/hooks/useListingForm';

// Form section components
import { BasicInfoSection } from './forms/BasicInfoSection';
import { PricingAnalysisSection } from './forms/PricingAnalysisSection';
import { AddressSection } from './forms/AddressSection';
import { DealTermsSection } from './forms/DealTermsSection';
import { PropertyFeaturesSection } from './forms/PropertyFeaturesSection';
import { ContactInfoSection } from './forms/ContactInfoSection';
import { ImageUploadSection } from './forms/ImageUploadSection';
import { CompsSection } from './forms/CompsSection';

interface CreateListingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editListing?: PropertyListing; // Optional listing to edit
}

export default function CreateListingForm({ isOpen, onClose, onSuccess, editListing }: CreateListingFormProps) {
  const { user } = useAuthContext() as { user: any };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    formData,
    handleInputChange,
    addFeature,
    removeFeature,
    addAmenity,
    removeAmenity,
    toggleFinancingOption,
    handleImagesChange,
    addComp,
    removeComp,
    updateComp,
    resetForm,
  } = useListingForm(editListing);

  const isEditMode = !!editListing;

  const cleanObject = (obj: any): any => {
    const cleaned = { ...obj };
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === undefined) {
        delete cleaned[key];
      } else if (cleaned[key] && typeof cleaned[key] === 'object' && !Array.isArray(cleaned[key])) {
        cleaned[key] = cleanObject(cleaned[key]);
      }
    });
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError(`You must be logged in to ${isEditMode ? 'update' : 'create'} a listing`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate tags for search
      const tags = [
        formData.title.toLowerCase(),
        formData.propertyType,
        formData.listingType,
        formData.address.city.toLowerCase(),
        formData.address.state.toLowerCase(),
        formData.address.streetName.toLowerCase(),
        ...formData.features.map(f => f.toLowerCase()),
        ...formData.amenities.map(a => a.toLowerCase()),
      ].join(' ').split(' ').filter(tag => tag.length > 2);

      // Clean the form data to remove undefined values (Firebase doesn't accept undefined)
      const cleanFormData = cleanObject(formData);

      if (isEditMode && editListing) {
        // Update existing listing
        const updateData: UpdateListingData = {
          ...cleanFormData,
          tags,
        };
        await updateListing(editListing.id, updateData, user.uid);
      } else {
        // Create new listing
        const listingData: CreateListingData = {
          ...cleanFormData,
          tags,
        };
        await createListing(listingData, user.uid);
      }
      
      onSuccess();
      onClose();
      resetForm();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : 'create'} listing`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEditMode ? 'Edit Listing' : 'Create Wholesale Property Listing'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <BasicInfoSection 
            formData={formData} 
            onChange={handleInputChange} 
          />

          <ImageUploadSection 
            formData={formData} 
            onImagesChange={handleImagesChange} 
          />

          <PricingAnalysisSection 
            formData={formData} 
            onChange={handleInputChange} 
          />

          <CompsSection 
            formData={formData} 
            onChange={handleInputChange}
            onAddComp={addComp}
            onRemoveComp={removeComp}
            onUpdateComp={updateComp}
          />

          <AddressSection 
            formData={formData} 
            onChange={handleInputChange} 
          />

          <DealTermsSection 
            formData={formData} 
            onChange={handleInputChange}
            onToggleFinancingOption={toggleFinancingOption}
          />

          <PropertyFeaturesSection 
            formData={formData}
            onAddFeature={addFeature}
            onRemoveFeature={removeFeature}
            onAddAmenity={addAmenity}
            onRemoveAmenity={removeAmenity}
          />

          <ContactInfoSection 
            formData={formData} 
            onChange={handleInputChange} 
          />

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading 
                ? (isEditMode ? 'Updating...' : 'Creating...') 
                : (isEditMode ? 'Update Listing' : 'Create Listing')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}