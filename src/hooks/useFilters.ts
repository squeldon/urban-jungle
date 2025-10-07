import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ListingFilters } from '@/types/listing';
import { filtersToURLParams, urlParamsToFilters, mergeURLParams } from '@/lib/urlState';

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

export const useFilters = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<FilterState>(() => {
    // Initialize from URL on first render
    if (typeof window !== 'undefined') {
      const urlFilters = urlParamsToFilters(searchParams);
      return sanitizeFilters(urlFilters);
    }
    return getDefaultFilters();
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Mark as initialized after mount
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Update URL whenever filters change (but not on initial load)
  useEffect(() => {
    if (isInitialized) {
      // Start with current URL params (to preserve location/map params)
      const params = new URLSearchParams(searchParams);
      
      // Remove all filter-related params first
      const filterKeys = [
        'priceMin', 'priceMax', 'arvMin', 'arvMax', 'repairCostsMin', 'repairCostsMax',
        'propertyTypes', 'bedrooms', 'bathrooms', 'squareFeetMin', 'squareFeetMax',
        'listingTypes', 'propertyConditions', 'occupancyStatuses', 'financingOptions'
      ];
      filterKeys.forEach(key => params.delete(key));
      
      // Add back only the active filters
      const filterParams = filtersToURLParams(filters);
      filterParams.forEach((value, key) => {
        params.set(key, value);
      });
      
      const queryString = params.toString();
      const newURL = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(newURL, { scroll: false });
    }
  }, [filters, isInitialized, searchParams, pathname, router]);

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
    
    setFilters((prev) => {
      let updated = { ...prev };
      
      if (arrayFilters.includes(key)) {
        updated = { ...prev, [key]: [] };
      } else if (key.includes('price') || key.includes('Price')) {
        updated = { ...prev, priceMin: '', priceMax: '' };
      } else if (key.includes('arv') || key.includes('ARV')) {
        updated = { ...prev, arvMin: '', arvMax: '' };
      } else if (key.includes('repair') || key.includes('Repair')) {
        updated = { ...prev, repairCostsMin: '', repairCostsMax: '' };
      } else if (key.includes('squareFeet') || key.includes('Sqft')) {
        updated = { ...prev, squareFeetMin: '', squareFeetMax: '' };
      } else {
        updated = { ...prev, [key]: '' };
      }
      
      return updated;
    });
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
    
    // Clear filter params from URL but keep location/map params
    const params = new URLSearchParams(searchParams);
    const filterKeys = [
      'priceMin', 'priceMax', 'arvMin', 'arvMax', 'repairCostsMin', 'repairCostsMax',
      'propertyTypes', 'bedrooms', 'bathrooms', 'squareFeetMin', 'squareFeetMax',
      'listingTypes', 'propertyConditions', 'occupancyStatuses', 'financingOptions'
    ];
    
    filterKeys.forEach(key => params.delete(key));
    
    const queryString = params.toString();
    const newURL = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(newURL, { scroll: false });
  };
  
  const replaceFilters = (nextFilters: FilterState) => {
    const sanitized = sanitizeFilters(nextFilters);
    setFilters(sanitized);
  };

  // Memoize the listing filters to prevent unnecessary re-renders
  const listingFilters = useMemo((): ListingFilters | undefined => {
    const hasActiveFilters = filters.priceMin || filters.priceMax || filters.arvMin || filters.arvMax ||
      filters.repairCostsMin || filters.repairCostsMax || filters.propertyTypes.length > 0 ||
      filters.bedrooms || filters.bathrooms || filters.squareFeetMin || filters.squareFeetMax ||
      filters.listingTypes.length > 0 || filters.propertyConditions.length > 0 ||
      filters.occupancyStatuses.length > 0 || filters.financingOptions.length > 0;

    if (!hasActiveFilters) return undefined;

    const result: ListingFilters = {};

    // Price range
    if (filters.priceMin || filters.priceMax) {
      result.priceRange = {
        min: filters.priceMin ? parseInt(filters.priceMin) : 0,
        max: filters.priceMax ? parseInt(filters.priceMax) : Number.MAX_SAFE_INTEGER,
      };
    }

    // ARV range
    if (filters.arvMin || filters.arvMax) {
      result.arvRange = {
        min: filters.arvMin ? parseInt(filters.arvMin) : 0,
        max: filters.arvMax ? parseInt(filters.arvMax) : Number.MAX_SAFE_INTEGER,
      };
    }

    // Repair costs range
    if (filters.repairCostsMin || filters.repairCostsMax) {
      result.repairCostsRange = {
        min: filters.repairCostsMin ? parseInt(filters.repairCostsMin) : 0,
        max: filters.repairCostsMax ? parseInt(filters.repairCostsMax) : Number.MAX_SAFE_INTEGER,
      };
    }

    // Square feet range
    if (filters.squareFeetMin || filters.squareFeetMax) {
      result.squareFeet = {
        min: filters.squareFeetMin ? parseInt(filters.squareFeetMin) : 0,
        max: filters.squareFeetMax ? parseInt(filters.squareFeetMax) : Number.MAX_SAFE_INTEGER,
      };
    }

    // Bedrooms range
    if (filters.bedrooms) {
      const bedroomNum = parseInt(filters.bedrooms);
      result.bedrooms = {
        min: bedroomNum,
        max: Number.MAX_SAFE_INTEGER,
      };
    }

    // Bathrooms range
    if (filters.bathrooms) {
      const bathroomNum = parseFloat(filters.bathrooms);
      result.bathrooms = {
        min: bathroomNum,
        max: Number.MAX_SAFE_INTEGER,
      };
    }

    // Array filters
    if (filters.propertyTypes.length > 0) {
      result.propertyType = filters.propertyTypes;
    }

    if (filters.listingTypes.length > 0 && filters.listingTypes.length === 1) {
      result.listingType = filters.listingTypes[0] as 'wholesale' | 'sale' | 'rent';
    }

    if (filters.propertyConditions.length > 0) {
      result.propertyCondition = filters.propertyConditions;
    }

    if (filters.occupancyStatuses.length > 0) {
      result.occupancyStatus = filters.occupancyStatuses;
    }

    if (filters.financingOptions.length > 0) {
      result.financingOptions = filters.financingOptions;
    }

    return result;
  }, [filters]);

  return {
    filters,
    updateFilter,
    toggleArrayFilter,
    clearFilter,
    getActiveFilters,
    resetAllFilters,
    listingFilters,
    replaceFilters,
  };
};
