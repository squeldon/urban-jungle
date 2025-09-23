import { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { CreateListingData, PropertyListing } from '@/types/listing';

export function useListingForm(editListing?: PropertyListing) {
  const { user } = useAuthContext() as { user: any };
  
  const getInitialFormData = (): CreateListingData => ({
    title: '',
    description: '',
    price: 0,
    propertyType: 'house',
    listingType: 'wholesale',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
    },
    features: [],
    amenities: [],
    images: [],
    contactInfo: {
      name: user?.displayName || '',
      email: user?.email || '',
      isOwner: true,
      isWholesaler: true,
    },
    tags: [],
    dealTerms: {
      financingOptions: [],
      proofOfFundsRequired: false,
      showingInstructions: '',
      appointmentRequired: false,
      accessRestrictions: '',
    },
    status: 'active',
    isVerified: false,
    createdBy: '',
  });

  const initializeFormData = (listing?: PropertyListing): CreateListingData => {
    if (listing) {
      return {
        title: listing.title,
        description: listing.description,
        price: listing.price,
        propertyType: listing.propertyType,
        listingType: listing.listingType,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        squareFeet: listing.squareFeet,
        lotSize: listing.lotSize,
        yearBuilt: listing.yearBuilt,
        arv: listing.arv,
        repairCosts: listing.repairCosts,
        wholesaleFee: listing.wholesaleFee,
        investmentStrategy: listing.investmentStrategy,
        propertyCondition: listing.propertyCondition,
        occupancyStatus: listing.occupancyStatus,
        monthlyRent: listing.monthlyRent,
        address: { ...listing.address },
        coordinates: listing.coordinates,
        features: [...listing.features],
        amenities: [...listing.amenities],
        images: [...listing.images],
        virtualTourUrl: listing.virtualTourUrl,
        contactInfo: { ...listing.contactInfo },
        dealTerms: listing.dealTerms ? { ...listing.dealTerms } : {
          financingOptions: [],
          proofOfFundsRequired: false,
          showingInstructions: '',
          appointmentRequired: false,
          accessRestrictions: '',
        },
        tags: [...listing.tags],
        status: listing.status,
        isVerified: listing.isVerified,
        createdBy: listing.createdBy,
      };
    }
    return getInitialFormData();
  };

  const [formData, setFormData] = useState<CreateListingData>(getInitialFormData());

  useEffect(() => {
    setFormData(initializeFormData(editListing));
  }, [editListing, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof CreateListingData] as any,
          [child]: type === 'checkbox' ? checked : (
            ['earnestMoneyDeposit'].includes(child) ? 
              (value === '' ? null : Number(value) || null) : 
              (value === '' ? '' : value)
          ),
        },
      }));
    } else {
      const numericFields = ['price', 'bedrooms', 'bathrooms', 'squareFeet', 'yearBuilt', 'arv', 'repairCosts', 'wholesaleFee', 'monthlyRent'];
      if (numericFields.includes(name)) {
        const numValue = value === '' ? null : Number(value);
        setFormData(prev => ({
          ...prev,
          [name]: numValue,
        }));
      } else if (type === 'checkbox') {
        setFormData(prev => ({
          ...prev,
          [name]: checked,
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value === '' ? '' : value,
        }));
      }
    }
  };

  const addFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, feature],
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const addAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: [...prev.amenities, amenity],
    }));
  };

  const removeAmenity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index),
    }));
  };

  const toggleFinancingOption = (option: 'cash-only' | 'seller-financing' | 'hard-money' | 'conventional' | 'private-money') => {
    setFormData(prev => ({
      ...prev,
      dealTerms: {
        ...prev.dealTerms,
        financingOptions: prev.dealTerms?.financingOptions?.includes(option)
          ? prev.dealTerms.financingOptions.filter(opt => opt !== option)
          : [...(prev.dealTerms?.financingOptions || []), option],
      },
    }));
  };

  const resetForm = () => {
    setFormData(getInitialFormData());
  };

  return {
    formData,
    setFormData,
    handleInputChange,
    addFeature,
    removeFeature,
    addAmenity,
    removeAmenity,
    toggleFinancingOption,
    resetForm,
  };
}
