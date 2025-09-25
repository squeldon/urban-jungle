'use client'
import { useState, useRef, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { createListing, updateListing } from '@/lib/firestore/listings';
import { CreateListingData, PropertyListing, UpdateListingData } from '@/types/listing';
import { X, ChevronRight } from 'lucide-react';
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
  const [currentSection, setCurrentSection] = useState('basic-info');
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

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
  } = useListingForm(editListing, savedFormData);

  const isEditMode = !!editListing;

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


  // Save form data when it changes and form is open
  useEffect(() => {
    if (isOpen && !editListing && Object.keys(formData).length > 0) {
      // Don't save empty form data
      const hasContent = formData.title || formData.description || formData.price ||
                        formData.address.city || formData.address.state ||
                        formData.features.length > 0 || formData.images.length > 0;
      if (hasContent) {
        saveFormToStorage(cleanObject(formData));
      }
    }
  }, [formData, isOpen, editListing]);

  // Handle form close - clear storage only if intentionally closed
  const handleClose = (isIntentional: boolean) => {
    if (isIntentional) {
      clearFormFromStorage();
    }
    onClose();
  };

  // Check if form has content worth saving
  const hasFormContent = () => {
    return formData.title || formData.description || formData.price ||
           formData.address.city || formData.address.state ||
           formData.features.length > 0 || formData.images.length > 0;
  };

  // Show confirmation popup when trying to close
  const handleCloseWithConfirmation = () => {
    if (hasFormContent() && !isEditMode) {
      setShowCloseConfirmation(true);
    } else {
      handleClose(true);
    }
  };

  // Save draft function
  const handleSaveDraft = async () => {
    if (!hasFormContent()) {
      setError('Please add some content before saving as draft');
      return;
    }

    setSavingDraft(true);
    try {
      const cleanedData = cleanObject(formData);
      
      // Save to current draft storage
      saveFormToStorage(cleanedData);
      
      // Also save to drafts collection
      const DRAFTS_STORAGE_KEY = 'listing_drafts';
      const existingDrafts = JSON.parse(localStorage.getItem(DRAFTS_STORAGE_KEY) || '[]');
      const draftId = Date.now().toString();
      
      const newDraft = {
        id: draftId,
        ...cleanedData,
        lastModified: new Date().toISOString(),
      };
      
      existingDrafts.unshift(newDraft);
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(existingDrafts));
      
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000); // Hide success message after 3 seconds
    } catch (err) {
      setError('Failed to save draft');
    } finally {
      setSavingDraft(false);
    }
  };

  // Handle confirmation popup choices
  const handleConfirmationChoice = (choice: 'save' | 'discard' | 'cancel') => {
    setShowCloseConfirmation(false);
    
    switch (choice) {
      case 'save':
        handleSaveDraft();
        setTimeout(() => handleClose(false), 500); // Close after saving
        break;
      case 'discard':
        handleClose(true);
        break;
      case 'cancel':
        // Do nothing, just close the popup
        break;
    }
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
      
      // Clear drafts from collection when successfully creating a listing
      if (!isEditMode) {
        try {
          const DRAFTS_STORAGE_KEY = 'listing_drafts';
          localStorage.removeItem(DRAFTS_STORAGE_KEY);
        } catch (error) {
          console.warn('Failed to clear drafts collection:', error);
        }
      }
      
      onSuccess();
      handleClose(false); // Don't clear storage on successful submit
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
                {isEditMode ? 'Edit Listing' : 'Create Property Listing'}
              </h2>
              <button
                onClick={handleCloseWithConfirmation}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {draftSaved && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-green-800 dark:text-green-200">Draft saved successfully!</p>
                </div>
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
                  onClick={handleCloseWithConfirmation}
                  className="px-6 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                {!isEditMode && (
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={savingDraft || !hasFormContent()}
                    className="px-6 py-2 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {savingDraft ? 'Saving...' : 'Save as Draft'}
                  </button>
                )}
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
      </div>

      {/* Confirmation Popup */}
      {showCloseConfirmation && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Cancel without saving?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You have unsaved changes. Would you like to save your progress as a draft before closing?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => handleConfirmationChoice('cancel')}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Keep Editing
              </button>
              <button
                onClick={() => handleConfirmationChoice('discard')}
                className="px-4 py-2 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Discard Changes
              </button>
              <button
                onClick={() => handleConfirmationChoice('save')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}