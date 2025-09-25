'use client'
import { useState, useRef, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { createListing, updateListing } from '@/lib/firestore/listings';
import { CreateListingData, PropertyListing, UpdateListingData, PropertyDraft, CreateDraftData } from '@/types/listing';
import { X, ChevronRight } from 'lucide-react';
import { useListingForm } from '@/hooks/useListingForm';
import { useDrafts } from '@/hooks/useDrafts';
import { usePresets } from '@/hooks/usePresets';
import ExitConfirmationModal from './ExitConfirmationModal';
import { PresetBubbles, SavePresetModal, ConfirmOverrideModal } from './presets';
import { Info, Save } from 'lucide-react';

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
  editDraft?: PropertyDraft; // Optional draft to edit
}

export default function CreateListingForm({ isOpen, onClose, onSuccess, editListing, editDraft }: CreateListingFormProps) {
  const { user } = useAuthContext() as { user: any };
  const { createDraft, updateDraft } = useDrafts();
  const { presets, savePreset, deletePreset, loading: presetsLoading } = usePresets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState('basic-info');
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [showConfirmOverride, setShowConfirmOverride] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<any>(null);
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  // LocalStorage utilities for form persistence
  const FORM_STORAGE_KEY = 'create_listing_draft';
  const FORM_OPEN_KEY = 'create_listing_open';

  const saveFormToStorage = (data: any) => {
    try {
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(FORM_OPEN_KEY, 'true');
    } catch (error) {
      console.warn('Failed to save form data to localStorage:', error);
    }
  };

  const loadFormFromStorage = () => {
    try {
      const savedData = localStorage.getItem(FORM_STORAGE_KEY);
      const isFormOpen = localStorage.getItem(FORM_OPEN_KEY) === 'true';
      return { data: savedData ? JSON.parse(savedData) : null, isFormOpen };
    } catch (error) {
      console.warn('Failed to load form data from localStorage:', error);
      return { data: null, isFormOpen: false };
    }
  };

  const clearFormFromStorage = () => {
    try {
      localStorage.removeItem(FORM_STORAGE_KEY);
      localStorage.removeItem(FORM_OPEN_KEY);
    } catch (error) {
      console.warn('Failed to clear form data from localStorage:', error);
    }
  };

  // Refs for each section
  const basicInfoRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const compsRef = useRef<HTMLDivElement>(null);
  const addressRef = useRef<HTMLDivElement>(null);
  const dealTermsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  
  // Refs for scroll container and header
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  
  // Convert draft to listing format for the form hook
  const convertDraftToListingFormat = (draft: PropertyDraft): PropertyListing | undefined => {
    if (!draft) return undefined;
    
    return {
      id: draft.id,
      title: draft.title || '',
      description: draft.description || '',
      price: draft.price,
      propertyType: draft.propertyType || 'house',
      listingType: draft.listingType || 'wholesale',
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
      address: {
        houseNumber: draft.address?.houseNumber || '',
        streetName: draft.address?.streetName || '',
        street: draft.address?.street || '',
        city: draft.address?.city || '',
        state: draft.address?.state || '',
        zipCode: draft.address?.zipCode || '',
        country: draft.address?.country || 'USA',
      },
      coordinates: draft.coordinates,
      features: draft.features || [],
      amenities: draft.amenities || [],
      images: draft.images || [],
      videos: draft.videos,
      media: draft.media,
      virtualTourUrl: draft.virtualTourUrl,
      contactInfo: {
        name: draft.contactInfo?.name || '',
        phone: draft.contactInfo?.phone,
        email: draft.contactInfo?.email || '',
        isOwner: draft.contactInfo?.isOwner ?? true,
        agencyName: draft.contactInfo?.agencyName,
        isWholesaler: draft.contactInfo?.isWholesaler,
      },
      dealTerms: draft.dealTerms,
      comps: draft.comps,
      status: 'active' as const,
      isVerified: false,
      views: 0,
      favorites: [],
      tags: [],
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
      createdBy: draft.createdBy,
    };
  };

  // Load saved form data if available
  const { data: savedFormData } = loadFormFromStorage();

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
    setFormData,
  } = useListingForm(editListing || (editDraft ? convertDraftToListingFormat(editDraft) : undefined), savedFormData);

  const isEditMode = !!editListing;
  const isDraftEditMode = !!editDraft;
  const isEditingMode = isEditMode || isDraftEditMode;

  // Navigation sections
  const sections = [
    { id: 'basic-info', label: 'Basic Info', ref: basicInfoRef },
    { id: 'address', label: 'Address', ref: addressRef },
    { id: 'images', label: 'Photos & Videos', ref: imagesRef },
    { id: 'pricing', label: 'Pricing & Analysis', ref: pricingRef },
    { id: 'comps', label: 'Comparables', ref: compsRef },
    { id: 'deal-terms', label: 'Deal Terms', ref: dealTermsRef },
    { id: 'features', label: 'Features', ref: featuresRef },
    { id: 'contact', label: 'Contact Info', ref: contactRef },
  ];

  const scrollToSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section?.ref.current) {
      section.ref.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      setCurrentSection(sectionId);
    }
  };

  // Scroll listener to track which section is closest to the top of the viewport
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const header = headerRef.current;
    
    if (!scrollContainer || !header) return;

    const handleScroll = () => {
      const headerHeight = header.offsetHeight;
      const scrollTop = scrollContainer.scrollTop;
      const containerTop = scrollContainer.getBoundingClientRect().top;
      
      let closestSection = sections[0].id;
      let closestDistance = Infinity;

      sections.forEach((section) => {
        if (section.ref.current) {
          const sectionTop = section.ref.current.getBoundingClientRect().top - containerTop;
          const distanceFromTop = Math.abs(sectionTop - headerHeight);
          
          if (distanceFromTop < closestDistance) {
            closestDistance = distanceFromTop;
            closestSection = section.id;
          }
        }
      });

      setCurrentSection(closestSection);
    };

    // Set initial section
    handleScroll();

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [sections]);


  // Helper function to check if form has content
  const hasFormContent = () => {
    return formData.title || formData.description || formData.price ||
           (formData.address && (formData.address.city || formData.address.state || formData.address.streetName)) ||
           formData.features.length > 0 || formData.images.length > 0;
  };

  // Save form data when it changes and form is open (only for new listings, not editing)
  useEffect(() => {
    if (isOpen && !isEditingMode && Object.keys(formData).length > 0) {
      if (hasFormContent()) {
        saveFormToStorage(cleanObject(formData));
      }
    }
  }, [formData, isOpen, isEditingMode]);

  // Handle saving as draft
  const handleSaveAsDraft = async () => {
    if (!user) {
      setError('You must be logged in to save drafts');
      return;
    }

    setIsSavingDraft(true);
    setError(null);

    try {
      const cleanFormData = cleanObject(formData);
      
      if (isDraftEditMode && editDraft) {
        // Update existing draft
        await updateDraft(editDraft.id, cleanFormData);
      } else {
        // Create new draft
        const draftData: CreateDraftData = {
          ...cleanFormData,
          createdBy: user.uid,
          draftName: formData.title || 'Untitled Draft',
        };
        await createDraft(draftData);
      }

      clearFormFromStorage();
      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Handle saving as preset
  const handleSaveAsPreset = async (name: string, description?: string) => {
    if (!user) {
      setError('You must be logged in to save presets');
      return;
    }

    setIsSavingPreset(true);
    setError(null);

    try {
      const cleanFormData = cleanObject(formData);
      
      // Remove fields that shouldn't be saved in presets (user-specific data)
      const presetData = { ...cleanFormData };
      delete presetData.createdBy;
      delete presetData.images; // Don't save images in presets
      delete presetData.videos; // Don't save videos in presets
      delete presetData.media; // Don't save media in presets
      
      // Create the preset object, only include description if it has a value
      const presetToSave: any = {
        name,
        presetData,
        createdBy: user.uid,
      };
      
      // Only add description if it's not empty/undefined
      if (description && description.trim()) {
        presetToSave.description = description.trim();
      }
      
      await savePreset(presetToSave);

      setShowSavePresetModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preset');
    } finally {
      setIsSavingPreset(false);
    }
  };

  // Handle loading a preset
  const handleLoadPreset = (preset: any) => {
    setSelectedPreset(preset);
    
    // Check if form has content to show confirmation
    if (hasFormContent()) {
      setShowConfirmOverride(true);
    } else {
      confirmLoadPreset(preset);
    }
  };

  // Confirm loading preset (override current form)
  const confirmLoadPreset = (presetToLoad?: any) => {
    const preset = presetToLoad || selectedPreset;
    
    if (!preset) {
      console.error('No preset provided');
      setError('No preset selected. Please try again.');
      return;
    }

    // Validate preset structure and get the data
    let presetData;
    if (preset.presetData) {
      presetData = preset.presetData;
    } else if (preset.data) {
      // Alternative structure in case data is nested differently
      presetData = preset.data;
    } else {
      console.error('Invalid preset structure:', { preset, keys: Object.keys(preset) });
      setError('Invalid preset format. This preset may be corrupted.');
      return;
    }

    try {
      // Safely merge preset data with current form structure
      const presetFormData = {
        ...formData, // Keep current structure
        ...presetData, // Override with preset values
        // Ensure arrays are properly handled with safe fallbacks
        features: Array.isArray(presetData.features) ? presetData.features : [],
        amenities: Array.isArray(presetData.amenities) ? presetData.amenities : [],
        images: [], // Reset images
        videos: [], // Reset videos
        media: [], // Reset media
      };
      
      setFormData(presetFormData);
      setShowConfirmOverride(false);
      setSelectedPreset(null);
    } catch (err) {
      console.error('Error loading preset:', err, { preset, presetData });
      setError('Failed to load preset. Please try again or contact support.');
    }
  };

  // Handle preset deletion
  const handleDeletePreset = async (presetId: string) => {
    if (!user) return;
    
    try {
      await deletePreset(presetId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete preset');
    }
  };

  // Handle form close - show confirmation if there are unsaved changes
  const handleClose = () => {
    // If editing a draft or listing, just close without confirmation
    if (isEditingMode) {
      onClose();
      return;
    }

    // If there's content, show confirmation modal
    if (hasFormContent()) {
      setShowExitConfirmation(true);
    } else {
      clearFormFromStorage();
      onClose();
    }
  };

  // Handle discard changes
  const handleDiscardChanges = () => {
    clearFormFromStorage();
    resetForm();
    setShowExitConfirmation(false);
    onClose();
  };

  // Handle save draft from exit confirmation
  const handleSaveDraftFromExit = async () => {
    await handleSaveAsDraft();
    setShowExitConfirmation(false);
  };

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
      setError(`You must be logged in to ${isEditMode ? 'update' : isDraftEditMode ? 'publish' : 'create'} a listing`);
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
      } else if (isDraftEditMode && editDraft) {
        // Convert draft to listing (publish draft)
        const listingData: CreateListingData = {
          ...cleanFormData,
          tags,
        };
        await createListing(listingData, user.uid);
        // Delete the draft after successful publishing
        // Note: This will be handled in the profile page or we could add delete draft functionality here
      } else {
        // Create new listing
        const listingData: CreateListingData = {
          ...cleanFormData,
          tags,
        };
        await createListing(listingData, user.uid);
      }
      
      onSuccess();
      clearFormFromStorage(); // Clear storage on successful submit
      resetForm();
      onClose();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : isDraftEditMode ? 'publish' : 'create'} listing`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden flex">
         {/* Left Navigation Panel */}
         <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
           <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                  currentSection === section.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {section.label}
                <ChevronRight className="w-4 h-4" />
              </button>
            ))}
          </nav>
        </div>

        {/* Right Content Panel */}
        <div className="flex-1 flex flex-col">
          <div ref={headerRef} className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isEditMode ? 'Edit Listing' : isDraftEditMode ? 'Edit Draft' : 'Create Property Listing'}
              </h2>
              <div className="flex items-center gap-3">
                {/* Save as Preset button - show for all authenticated users */}
                {user && (
                  <div className="relative flex items-center gap-2">
                    <button
                      onClick={() => setShowSavePresetModal(true)}
                      disabled={loading || isSavingDraft || isSavingPreset || !hasFormContent()}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save as Preset
                    </button>
                    
                    <div className="relative group">
                      <Info className="w-4 h-4 opacity-60 text-blue-600 dark:text-blue-400" />
                      
                      {/* Tooltip */}
                      <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <div className="font-medium mb-1">Save inputs as preset</div>
                        <div>Save your current form inputs (excluding images/videos) as a reusable preset. Perfect for similar properties or recurring listing types.</div>
                        <div className="absolute bottom-full right-1 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900 dark:border-b-gray-700"></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {/* Preset Bubbles - show for all authenticated users */}
              {user && (
                <PresetBubbles
                  presets={presets}
                  onPresetClick={handleLoadPreset}
                  onDeletePreset={handleDeletePreset}
                  loading={presetsLoading}
                />
              )}

              <div ref={basicInfoRef} className="scroll-mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Basic Information
                </h3>
                <BasicInfoSection 
                  formData={formData} 
                  onChange={handleInputChange} 
                />
              </div>

              <div ref={addressRef} className="scroll-mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Address
                </h3>
                <AddressSection 
                  formData={formData} 
                  onChange={handleInputChange} 
                />
              </div>

              <div ref={imagesRef} className="scroll-mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Photos & Videos
                </h3>
                <ImageUploadSection 
                  formData={formData} 
                  onImagesChange={handleImagesChange} 
                />
              </div>

              <div ref={pricingRef} className="scroll-mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Pricing & Analysis
                </h3>
                <PricingAnalysisSection 
                  formData={formData} 
                  onChange={handleInputChange} 
                />
              </div>

              <div ref={compsRef} className="scroll-mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Comparables
                </h3>
                <CompsSection 
                  formData={formData} 
                  onChange={handleInputChange}
                  onAddComp={addComp}
                  onRemoveComp={removeComp}
                  onUpdateComp={updateComp}
                />
              </div>

              <div ref={dealTermsRef} className="scroll-mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Deal Terms
                </h3>
                <DealTermsSection 
                  formData={formData} 
                  onChange={handleInputChange}
                  onToggleFinancingOption={toggleFinancingOption}
                />
              </div>

              <div ref={featuresRef} className="scroll-mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Features & Amenities
                </h3>
                <PropertyFeaturesSection 
                  formData={formData}
                  onAddFeature={addFeature}
                  onRemoveFeature={removeFeature}
                  onAddAmenity={addAmenity}
                  onRemoveAmenity={removeAmenity}
                />
              </div>

              <div ref={contactRef} className="scroll-mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Contact Information
                </h3>
                <ContactInfoSection 
                  formData={formData} 
                  onChange={handleInputChange} 
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                
                {/* Save as Draft button - only show for new listings or editing drafts */}
                {(!isEditMode) && (
                  <button
                    type="button"
                    onClick={handleSaveAsDraft}
                    disabled={loading || isSavingDraft}
                    className="px-6 py-2 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSavingDraft 
                      ? 'Saving Draft...' 
                      : (isDraftEditMode ? 'Update Draft' : 'Save as Draft')
                    }
                  </button>
                )}
                
                <button
                  type="submit"
                  disabled={loading || isSavingDraft}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading 
                    ? (isEditMode ? 'Updating...' : isDraftEditMode ? 'Publishing...' : 'Creating...') 
                    : (isEditMode ? 'Update Listing' : isDraftEditMode ? 'Publish Draft' : 'Create Listing')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      <ExitConfirmationModal
        isOpen={showExitConfirmation}
        onClose={() => setShowExitConfirmation(false)}
        onDiscardChanges={handleDiscardChanges}
        onSaveAsDraft={handleSaveDraftFromExit}
        isSaving={isSavingDraft}
      />

      {/* Save Preset Modal */}
      <SavePresetModal
        isOpen={showSavePresetModal}
        onClose={() => setShowSavePresetModal(false)}
        onSave={handleSaveAsPreset}
        loading={isSavingPreset}
      />

      {/* Confirm Override Modal */}
      <ConfirmOverrideModal
        isOpen={showConfirmOverride}
        onClose={() => {
          setShowConfirmOverride(false);
          setSelectedPreset(null);
        }}
        onConfirm={confirmLoadPreset}
        presetName={selectedPreset?.name || ''}
      />
    </div>
  );
}