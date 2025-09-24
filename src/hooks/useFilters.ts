import { useState, useEffect } from 'react';
import { ListingFilters } from '@/types/listing';

export interface FilterState {
  priceMin: string;
  priceMax: string;
  arvMin: string;
  arvMax: string;
  repairCostsMin: string;
  repairCostsMax: string;
  propertyTypes: string[];
  bedrooms: string;
  bathrooms: string;
  squareFeetMin: string;
  squareFeetMax: string;
  listingTypes: string[];
  propertyConditions: string[];
  occupancyStatuses: string[];
  financingOptions: string[];
}

export interface ActiveFilter {
  key: string;
  label: string;
  type: 'range' | 'select' | 'checkbox';
}

const FILTERS_STORAGE_KEY = 'urban-jungle-filters';

export const getDefaultFilters = (): FilterState => ({
  priceMin: '',
  priceMax: '',
  arvMin: '',
  arvMax: '',
  repairCostsMin: '',
  repairCostsMax: '',
  propertyTypes: [],
  bedrooms: '',
  bathrooms: '',
  squareFeetMin: '',
  squareFeetMax: '',
  listingTypes: [],
  propertyConditions: [],
  occupancyStatuses: [],
  financingOptions: [],
});

export const sanitizeFilters = (input: Partial<FilterState>): FilterState => {
  const defaults = getDefaultFilters();
  const sanitized: FilterState = { ...defaults };

  (Object.keys(defaults) as (keyof FilterState)[]).forEach((key) => {
    const defaultValue = defaults[key];
    const incoming = input[key];

    if (Array.isArray(defaultValue)) {
      (sanitized[key] as string[]) = Array.isArray(incoming)
        ? incoming.filter((value): value is string => typeof value === 'string')
        : [...defaultValue];
    } else {
      (sanitized[key] as string) = typeof incoming === 'string' ? incoming : defaultValue;
    }
  });

  return sanitized;
};

const loadFiltersFromStorage = (): FilterState => {
  if (typeof window === 'undefined') {
    return getDefaultFilters();
  }
  
  try {
    const stored = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return sanitizeFilters(parsed ?? {});
    }
  } catch (error) {
    console.warn('Error loading filters from localStorage:', error);
  }
  
  return getDefaultFilters();
};

const saveFiltersToStorage = (filters: FilterState) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify(sanitizeFilters(filters))
    );
  } catch (error) {
    console.warn('Error saving filters to localStorage:', error);
  }
};

export const useFilters = () => {
  const [filters, setFilters] = useState<FilterState>(getDefaultFilters);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load filters from localStorage on component mount
  useEffect(() => {
    const loadedFilters = loadFiltersFromStorage();
    setFilters(loadedFilters);
    setIsInitialized(true);
  }, []);

  // Save filters to localStorage whenever filters change (but not on initial load)
  useEffect(() => {
    if (isInitialized) {
      saveFiltersToStorage(filters);
    }
  }, [filters, isInitialized]);

  const updateFilter = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key as keyof typeof prev].includes(value)
        ? (prev[key as keyof typeof prev] as string[]).filter(item => item !== value)
        : [...(prev[key as keyof typeof prev] as string[]), value]
    }));
  };

  const clearFilter = (key: string) => {
    const arrayFilters = ['propertyTypes', 'listingTypes', 'propertyConditions', 'occupancyStatuses', 'financingOptions'];
    if (arrayFilters.includes(key)) {
      setFilters((prev) => ({ ...prev, [key]: [] }));
    } else if (key.includes('price') || key.includes('Price')) {
      setFilters((prev) => ({ ...prev, priceMin: '', priceMax: '' }));
    } else if (key.includes('arv') || key.includes('ARV')) {
      setFilters((prev) => ({ ...prev, arvMin: '', arvMax: '' }));
    } else if (key.includes('repair') || key.includes('Repair')) {
      setFilters((prev) => ({ ...prev, repairCostsMin: '', repairCostsMax: '' }));
    } else if (key.includes('squareFeet') || key.includes('Sqft')) {
      setFilters((prev) => ({ ...prev, squareFeetMin: '', squareFeetMax: '' }));
    } else {
      setFilters((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const getActiveFilters = (): ActiveFilter[] => {
    const active: ActiveFilter[] = [];
    
    if (filters.priceMin || filters.priceMax) {
      const min = filters.priceMin ? `$${parseInt(filters.priceMin).toLocaleString()}` : '';
      const max = filters.priceMax ? `$${parseInt(filters.priceMax).toLocaleString()}` : '';
      const range = min && max ? `${min}-${max}` : min || max || '';
      if (range) active.push({ key: 'price', label: `Price: ${range}`, type: 'range' });
    }
    
    if (filters.arvMin || filters.arvMax) {
      const min = filters.arvMin ? `$${parseInt(filters.arvMin).toLocaleString()}` : '';
      const max = filters.arvMax ? `$${parseInt(filters.arvMax).toLocaleString()}` : '';
      const range = min && max ? `${min}-${max}` : min || max || '';
      if (range) active.push({ key: 'arv', label: `ARV: ${range}`, type: 'range' });
    }
    
    if (filters.repairCostsMin || filters.repairCostsMax) {
      const min = filters.repairCostsMin ? `$${parseInt(filters.repairCostsMin).toLocaleString()}` : '';
      const max = filters.repairCostsMax ? `$${parseInt(filters.repairCostsMax).toLocaleString()}` : '';
      const range = min && max ? `${min}-${max}` : min || max || '';
      if (range) active.push({ key: 'repairCosts', label: `Repairs: ${range}`, type: 'range' });
    }
    
    if (filters.squareFeetMin || filters.squareFeetMax) {
      const min = filters.squareFeetMin ? `${parseInt(filters.squareFeetMin).toLocaleString()}` : '';
      const max = filters.squareFeetMax ? `${parseInt(filters.squareFeetMax).toLocaleString()}` : '';
      const range = min && max ? `${min}-${max}` : min || max || '';
      if (range) active.push({ key: 'squareFeet', label: `Sqft: ${range}`, type: 'range' });
    }
    
    if (filters.bedrooms) {
      active.push({ key: 'bedrooms', label: `Bed: ${filters.bedrooms}`, type: 'select' });
    }
    
    if (filters.bathrooms) {
      active.push({ key: 'bathrooms', label: `Bath: ${filters.bathrooms}`, type: 'select' });
    }
    
    if (filters.propertyTypes.length > 0) {
      active.push({ 
        key: 'propertyTypes', 
        label: `Type: ${filters.propertyTypes.length === 1 ? filters.propertyTypes[0] : `${filters.propertyTypes.length} selected`}`, 
        type: 'checkbox' 
      });
    }
    
    if (filters.listingTypes.length > 0) {
      active.push({ 
        key: 'listingTypes', 
        label: `Listing: ${filters.listingTypes.length === 1 ? filters.listingTypes[0] : `${filters.listingTypes.length} selected`}`, 
        type: 'checkbox' 
      });
    }
    
    
    if (filters.propertyConditions.length > 0) {
      active.push({ 
        key: 'propertyConditions', 
        label: `Condition: ${filters.propertyConditions.length === 1 ? filters.propertyConditions[0] : `${filters.propertyConditions.length} selected`}`, 
        type: 'checkbox' 
      });
    }
    
    if (filters.occupancyStatuses.length > 0) {
      active.push({ 
        key: 'occupancyStatuses', 
        label: `Occupancy: ${filters.occupancyStatuses.length === 1 ? filters.occupancyStatuses[0] : `${filters.occupancyStatuses.length} selected`}`, 
        type: 'checkbox' 
      });
    }
    
    if (filters.financingOptions.length > 0) {
      active.push({ 
        key: 'financingOptions', 
        label: `Financing: ${filters.financingOptions.length === 1 ? filters.financingOptions[0] : `${filters.financingOptions.length} selected`}`, 
        type: 'checkbox' 
      });
    }
    
    return active;
  };

  const resetAllFilters = () => {
    const defaultFilters = getDefaultFilters();
    setFilters(defaultFilters);
    // Clear from localStorage as well
    if (typeof window !== 'undefined') {
      localStorage.removeItem(FILTERS_STORAGE_KEY);
    }
  };
  
  const replaceFilters = (nextFilters: FilterState) => {
    setFilters(sanitizeFilters(nextFilters));
  };

  const getListingFilters = (): ListingFilters | undefined => {
    const hasActiveFilters = filters.priceMin || filters.priceMax || filters.arvMin || filters.arvMax ||
      filters.repairCostsMin || filters.repairCostsMax || filters.propertyTypes.length > 0 ||
      filters.bedrooms || filters.bathrooms || filters.squareFeetMin || filters.squareFeetMax ||
      filters.listingTypes.length > 0 || filters.propertyConditions.length > 0 ||
      filters.occupancyStatuses.length > 0 || filters.financingOptions.length > 0;

    if (!hasActiveFilters) return undefined;

    const listingFilters: ListingFilters = {};

    // Price range
    if (filters.priceMin || filters.priceMax) {
      listingFilters.priceRange = {
        min: filters.priceMin ? parseInt(filters.priceMin) : 0,
        max: filters.priceMax ? parseInt(filters.priceMax) : Number.MAX_SAFE_INTEGER,
      };
    }

    // ARV range
    if (filters.arvMin || filters.arvMax) {
      listingFilters.arvRange = {
        min: filters.arvMin ? parseInt(filters.arvMin) : 0,
        max: filters.arvMax ? parseInt(filters.arvMax) : Number.MAX_SAFE_INTEGER,
      };
    }

    // Repair costs range
    if (filters.repairCostsMin || filters.repairCostsMax) {
      listingFilters.repairCostsRange = {
        min: filters.repairCostsMin ? parseInt(filters.repairCostsMin) : 0,
        max: filters.repairCostsMax ? parseInt(filters.repairCostsMax) : Number.MAX_SAFE_INTEGER,
      };
    }

    // Square feet range
    if (filters.squareFeetMin || filters.squareFeetMax) {
      listingFilters.squareFeet = {
        min: filters.squareFeetMin ? parseInt(filters.squareFeetMin) : 0,
        max: filters.squareFeetMax ? parseInt(filters.squareFeetMax) : Number.MAX_SAFE_INTEGER,
      };
    }

    // Bedrooms range
    if (filters.bedrooms) {
      const bedroomNum = parseInt(filters.bedrooms);
      listingFilters.bedrooms = {
        min: bedroomNum,
        max: Number.MAX_SAFE_INTEGER,
      };
    }

    // Bathrooms range
    if (filters.bathrooms) {
      const bathroomNum = parseFloat(filters.bathrooms);
      listingFilters.bathrooms = {
        min: bathroomNum,
        max: Number.MAX_SAFE_INTEGER,
      };
    }

    // Array filters
    if (filters.propertyTypes.length > 0) {
      listingFilters.propertyType = filters.propertyTypes;
    }

    if (filters.listingTypes.length > 0 && filters.listingTypes.length === 1) {
      listingFilters.listingType = filters.listingTypes[0] as 'wholesale' | 'sale' | 'rent';
    }

    if (filters.propertyConditions.length > 0) {
      listingFilters.propertyCondition = filters.propertyConditions;
    }

    if (filters.occupancyStatuses.length > 0) {
      listingFilters.occupancyStatus = filters.occupancyStatuses;
    }

    if (filters.financingOptions.length > 0) {
      listingFilters.financingOptions = filters.financingOptions;
    }

    return listingFilters;
  };

  return {
    filters,
    updateFilter,
    toggleArrayFilter,
    clearFilter,
    getActiveFilters,
    resetAllFilters,
    getListingFilters,
    replaceFilters,
  };
};
