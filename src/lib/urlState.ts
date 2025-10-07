import { FilterState } from '@/hooks/useFilters';
import { ListingFilters } from '@/types/listing';

export interface URLState {
  // Filters
  priceMin?: string;
  priceMax?: string;
  arvMin?: string;
  arvMax?: string;
  repairCostsMin?: string;
  repairCostsMax?: string;
  propertyTypes?: string;
  bedrooms?: string;
  bathrooms?: string;
  squareFeetMin?: string;
  squareFeetMax?: string;
  listingTypes?: string;
  propertyConditions?: string;
  occupancyStatuses?: string;
  financingOptions?: string;
  
  // Location search - stores only the search query string
  locationQuery?: string;
}

/**
 * Converts filter state to URL search parameters
 */
export function filtersToURLParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  
  // Simple string values
  if (filters.priceMin) params.set('priceMin', filters.priceMin);
  if (filters.priceMax) params.set('priceMax', filters.priceMax);
  if (filters.arvMin) params.set('arvMin', filters.arvMin);
  if (filters.arvMax) params.set('arvMax', filters.arvMax);
  if (filters.repairCostsMin) params.set('repairCostsMin', filters.repairCostsMin);
  if (filters.repairCostsMax) params.set('repairCostsMax', filters.repairCostsMax);
  if (filters.bedrooms) params.set('bedrooms', filters.bedrooms);
  if (filters.bathrooms) params.set('bathrooms', filters.bathrooms);
  if (filters.squareFeetMin) params.set('squareFeetMin', filters.squareFeetMin);
  if (filters.squareFeetMax) params.set('squareFeetMax', filters.squareFeetMax);
  
  // Array values - join with commas
  if (filters.propertyTypes.length > 0) {
    params.set('propertyTypes', filters.propertyTypes.join(','));
  }
  if (filters.listingTypes.length > 0) {
    params.set('listingTypes', filters.listingTypes.join(','));
  }
  if (filters.propertyConditions.length > 0) {
    params.set('propertyConditions', filters.propertyConditions.join(','));
  }
  if (filters.occupancyStatuses.length > 0) {
    params.set('occupancyStatuses', filters.occupancyStatuses.join(','));
  }
  if (filters.financingOptions.length > 0) {
    params.set('financingOptions', filters.financingOptions.join(','));
  }
  
  return params;
}

/**
 * Converts URL search parameters to filter state
 */
export function urlParamsToFilters(searchParams: URLSearchParams): Partial<FilterState> {
  const filters: Partial<FilterState> = {};
  
  // Simple string values
  const priceMin = searchParams.get('priceMin');
  const priceMax = searchParams.get('priceMax');
  const arvMin = searchParams.get('arvMin');
  const arvMax = searchParams.get('arvMax');
  const repairCostsMin = searchParams.get('repairCostsMin');
  const repairCostsMax = searchParams.get('repairCostsMax');
  const bedrooms = searchParams.get('bedrooms');
  const bathrooms = searchParams.get('bathrooms');
  const squareFeetMin = searchParams.get('squareFeetMin');
  const squareFeetMax = searchParams.get('squareFeetMax');
  
  if (priceMin) filters.priceMin = priceMin;
  if (priceMax) filters.priceMax = priceMax;
  if (arvMin) filters.arvMin = arvMin;
  if (arvMax) filters.arvMax = arvMax;
  if (repairCostsMin) filters.repairCostsMin = repairCostsMin;
  if (repairCostsMax) filters.repairCostsMax = repairCostsMax;
  if (bedrooms) filters.bedrooms = bedrooms;
  if (bathrooms) filters.bathrooms = bathrooms;
  if (squareFeetMin) filters.squareFeetMin = squareFeetMin;
  if (squareFeetMax) filters.squareFeetMax = squareFeetMax;
  
  // Array values - split by commas
  const propertyTypes = searchParams.get('propertyTypes');
  const listingTypes = searchParams.get('listingTypes');
  const propertyConditions = searchParams.get('propertyConditions');
  const occupancyStatuses = searchParams.get('occupancyStatuses');
  const financingOptions = searchParams.get('financingOptions');
  
  if (propertyTypes) filters.propertyTypes = propertyTypes.split(',').filter(Boolean);
  if (listingTypes) filters.listingTypes = listingTypes.split(',').filter(Boolean);
  if (propertyConditions) filters.propertyConditions = propertyConditions.split(',').filter(Boolean);
  if (occupancyStatuses) filters.occupancyStatuses = occupancyStatuses.split(',').filter(Boolean);
  if (financingOptions) filters.financingOptions = financingOptions.split(',').filter(Boolean);
  
  return filters;
}

/**
 * Converts location search query to URL search parameters
 */
export function locationQueryToURLParams(
  locationQuery?: string
): Record<string, string> {
  const params: Record<string, string> = {};
  
  if (locationQuery) {
    params.locationQuery = locationQuery;
  }
  
  return params;
}

/**
 * Converts URL search parameters to location query string
 */
export function urlParamsToLocationQuery(
  searchParams: URLSearchParams
): string | null {
  return searchParams.get('locationQuery') || null;
}

/**
 * Merges new URL parameters with existing search params
 */
export function mergeURLParams(
  currentParams: URLSearchParams,
  newParams: Record<string, string> | URLSearchParams
): URLSearchParams {
  const merged = new URLSearchParams(currentParams);
  
  if (newParams instanceof URLSearchParams) {
    newParams.forEach((value, key) => {
      merged.set(key, value);
    });
  } else {
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        merged.set(key, value);
      } else {
        merged.delete(key);
      }
    });
  }
  
  return merged;
}

/**
 * Remove specific parameters from URL search params
 */
export function removeURLParams(
  currentParams: URLSearchParams,
  keysToRemove: string[]
): URLSearchParams {
  const updated = new URLSearchParams(currentParams);
  keysToRemove.forEach(key => updated.delete(key));
  return updated;
}

