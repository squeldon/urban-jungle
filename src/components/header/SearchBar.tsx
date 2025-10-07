'use client'
import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { LocationSearchInput, LocationSearchInputRef } from '@/components/ui/LocationSearchInput';
import { SearchAreaResult } from '@/types/map';

interface SearchBarProps {
  onAreaSelect?: (area: SearchAreaResult, searchQuery?: string) => void;
  locationQuery?: string;
}

const SearchBar = forwardRef<LocationSearchInputRef, SearchBarProps>(({ onAreaSelect, locationQuery }, ref) => {
  const [searchQuery, setSearchQuery] = useState(locationQuery || '');
  const locationSearchRef = useRef<LocationSearchInputRef>(null);
  const [hasTriggeredInitialSearch, setHasTriggeredInitialSearch] = useState(false);
  const isInitialMount = useRef(true);

  // Expose the LocationSearchInput ref methods
  useImperativeHandle(ref, () => ({
    triggerSearch: (query: string, autoSelectFirst?: boolean) => {
      locationSearchRef.current?.triggerSearch(query, autoSelectFirst);
    }
  }));

  // Update search query when locationQuery prop changes
  useEffect(() => {
    if (locationQuery && locationQuery !== searchQuery) {
      setSearchQuery(locationQuery);
    }
  }, [locationQuery]);

  // Trigger initial search ONLY when locationQuery is provided from URL on mount
  // This effect should NOT run when locationQuery updates from a manual search
  useEffect(() => {
    // Only auto-trigger on initial mount if locationQuery is already in URL
    if (isInitialMount.current && locationQuery && !hasTriggeredInitialSearch && locationSearchRef.current) {
      setHasTriggeredInitialSearch(true);
      isInitialMount.current = false; // Mark as no longer initial mount ONLY after triggering search
      
      // Trigger search with auto-select first result
      setTimeout(() => {
        locationSearchRef.current?.triggerSearch(locationQuery, true);
      }, 100); // Small delay to ensure component is fully mounted
    }
  }, [locationQuery, hasTriggeredInitialSearch]);

  const handleAreaSelect = (area: SearchAreaResult) => {
    // Mark that we've done a search (prevents auto-trigger from running again)
    setHasTriggeredInitialSearch(true);
    
    // Pass the full OSM display name (e.g., "Reisterstown, Baltimore County, Maryland, 21136, United States")
    // instead of the short name or user's raw search query
    onAreaSelect?.(area, area.displayName);
  };

  return (
    <LocationSearchInput
      ref={locationSearchRef}
      value={searchQuery}
      onChange={setSearchQuery}
      onAreaSelect={handleAreaSelect}
      placeholder="Search location"
      className="flex-1"
      showSearchButton={true}
    />
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
