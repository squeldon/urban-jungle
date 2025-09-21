import { useState } from 'react';

export interface FilterState {
  priceMin: string;
  priceMax: string;
  arvMin: string;
  arvMax: string;
  repairMin: string;
  repairMax: string;
  propertyTypes: string[];
  bedrooms: string;
  bathrooms: string;
  sqftMin: string;
  sqftMax: string;
  dealQualities: string[];
  propertyConditions: string[];
}

export interface ActiveFilter {
  key: string;
  label: string;
  type: 'range' | 'select' | 'checkbox';
}

export const useFilters = () => {
  const [filters, setFilters] = useState<FilterState>({
    priceMin: '',
    priceMax: '',
    arvMin: '',
    arvMax: '',
    repairMin: '',
    repairMax: '',
    propertyTypes: [],
    bedrooms: '',
    bathrooms: '',
    sqftMin: '',
    sqftMax: '',
    dealQualities: [],
    propertyConditions: [],
  });

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key as keyof typeof prev].includes(value)
        ? (prev[key as keyof typeof prev] as string[]).filter(item => item !== value)
        : [...(prev[key as keyof typeof prev] as string[]), value]
    }));
  };

  const clearFilter = (key: string) => {
    if (key === 'propertyTypes' || key === 'dealQualities' || key === 'propertyConditions') {
      setFilters(prev => ({ ...prev, [key]: [] }));
    } else if (key.includes('price') || key.includes('Price')) {
      setFilters(prev => ({ ...prev, priceMin: '', priceMax: '' }));
    } else if (key.includes('arv') || key.includes('ARV')) {
      setFilters(prev => ({ ...prev, arvMin: '', arvMax: '' }));
    } else if (key.includes('repair') || key.includes('Repair')) {
      setFilters(prev => ({ ...prev, repairMin: '', repairMax: '' }));
    } else if (key.includes('sqft') || key.includes('Sqft')) {
      setFilters(prev => ({ ...prev, sqftMin: '', sqftMax: '' }));
    } else {
      setFilters(prev => ({ ...prev, [key]: '' }));
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
    
    if (filters.repairMin || filters.repairMax) {
      const min = filters.repairMin ? `$${parseInt(filters.repairMin).toLocaleString()}` : '';
      const max = filters.repairMax ? `$${parseInt(filters.repairMax).toLocaleString()}` : '';
      const range = min && max ? `${min}-${max}` : min || max || '';
      if (range) active.push({ key: 'repair', label: `Repairs: ${range}`, type: 'range' });
    }
    
    if (filters.sqftMin || filters.sqftMax) {
      const min = filters.sqftMin ? `${parseInt(filters.sqftMin).toLocaleString()}` : '';
      const max = filters.sqftMax ? `${parseInt(filters.sqftMax).toLocaleString()}` : '';
      const range = min && max ? `${min}-${max}` : min || max || '';
      if (range) active.push({ key: 'sqft', label: `Sqft: ${range}`, type: 'range' });
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
    
    if (filters.dealQualities.length > 0) {
      active.push({ 
        key: 'dealQualities', 
        label: `Quality: ${filters.dealQualities.length === 1 ? filters.dealQualities[0] : `${filters.dealQualities.length} selected`}`, 
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
    
    return active;
  };

  const resetAllFilters = () => {
    setFilters({
      priceMin: '',
      priceMax: '',
      arvMin: '',
      arvMax: '',
      repairMin: '',
      repairMax: '',
      propertyTypes: [],
      bedrooms: '',
      bathrooms: '',
      sqftMin: '',
      sqftMax: '',
      dealQualities: [],
      propertyConditions: [],
    });
  };

  return {
    filters,
    updateFilter,
    toggleArrayFilter,
    clearFilter,
    getActiveFilters,
    resetAllFilters,
  };
};
