import React from 'react';
import { CreateListingData } from '@/types/listing';
import { TagInput } from '@/components/ui/TagInput';

interface PropertyFeaturesSectionProps {
  formData: CreateListingData;
  onAddFeature: (feature: string) => void;
  onRemoveFeature: (index: number) => void;
  onAddAmenity: (amenity: string) => void;
  onRemoveAmenity: (index: number) => void;
}

export function PropertyFeaturesSection({ 
  formData, 
  onAddFeature, 
  onRemoveFeature,
  onAddAmenity,
  onRemoveAmenity 
}: PropertyFeaturesSectionProps) {
  return (
    <div className="space-y-6">
      <TagInput
        label="Property Features"
        tags={formData.features}
        onAddTag={onAddFeature}
        onRemoveTag={onRemoveFeature}
        placeholder="Add a feature (e.g., new roof, updated HVAC, hardwood floors, garage)"
      />
      
      <TagInput
        label="Amenities"
        tags={formData.amenities}
        onAddTag={onAddAmenity}
        onRemoveTag={onRemoveAmenity}
        placeholder="Add an amenity (e.g., pool, gym, parking, laundry)"
      />
    </div>
  );
}
