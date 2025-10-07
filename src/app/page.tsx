'use client'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import signOut from '@/supabase/auth/signOut';
import { useFilters } from '@/hooks/useFilters';
import { useListings } from '@/hooks/useListings';
import { ListingFilters } from '@/types/listing';
import Header from '@/components/header/Header';
import FilterPopup from '@/components/filters/FilterPopup';
import AuthPopup from '@/components/auth/AuthPopup';
import MainPanel from '@/components/MainPanel';
import { SearchAreaResult, MapOverlay } from '@/types/map';
import { calculateZoomLevel } from '@/lib/geographic';
import { locationQueryToURLParams, urlParamsToLocationQuery } from '@/lib/urlState';
import { LocationSearchInputRef } from '@/components/ui/LocationSearchInput';

export default function Home() {
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showMapPanel, setShowMapPanel] = useState(true);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [squareSize, setSquareSize] = useState(265); // Default medium square size
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [mapOverlays, setMapOverlays] = useState<MapOverlay[]>([]);
  const [locationFilter, setLocationFilter] = useState<ListingFilters['location'] | null>(null);
  
  const searchBarRef = useRef<LocationSearchInputRef>(null);
  const { user } = useAuthContext() as { user: any };
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Initialize locationQuery and loading state from URL
  const [locationQuery, setLocationQuery] = useState<string | undefined>(() => {
    return urlParamsToLocationQuery(searchParams) || undefined;
  });
  const [isLocationInitialized, setIsLocationInitialized] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(() => {
    // If there's a location query in URL on mount, we'll be searching for it
    return !!urlParamsToLocationQuery(searchParams);
  });
  
  // Use the custom filter hook
  const {
    filters,
    updateFilter,
    toggleArrayFilter,
    clearFilter,
    getActiveFilters,
    resetAllFilters,
    listingFilters,
    replaceFilters,
  } = useFilters();

  // Mark as initialized when there's no location query in URL
  useEffect(() => {
    if (!isLocationInitialized && !locationQuery) {
      setIsLocationInitialized(true);
    }
  }, [isLocationInitialized, locationQuery]);

  // Check authentication status on component mount and user changes
  useEffect(() => {
    if (user) {
      setIsLoggedIn(true);
      setShowAuthPopup(false);
    } else {
      setIsLoggedIn(false);
    }
  }, [user]);

  const handleUserIconClick = () => {
    if (isLoggedIn) {
      router.push('/profile');
    } else {
      setShowAuthPopup(true);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLoginOption = () => {
    setShowAuthPopup(true);
  };

  const toggleMapPanel = () => {
    setShowMapPanel(!showMapPanel);
  };

  const toggleFilterPopup = () => {
    setShowFilterPopup(!showFilterPopup);
  };

  // const handleLocationSelect = (lat: number, lng: number, name: string) => {
  //   setMapCenter([lat, lng]);
  //   // Auto-open map panel when location is selected
  //   if (!showMapPanel) {
  //     setShowMapPanel(true);
  //   }
  // };

  const handleAreaSelect = useCallback((area: SearchAreaResult, fullLocationName?: string) => {
    // Set map center to the area center
    setMapCenter(area.center);

    // Calculate appropriate zoom level based on area bounds
    let calculatedZoom = 13; // Default zoom level
    if (area.bounds) {
      calculatedZoom = calculateZoomLevel(area.bounds);
    } else if (area.polygon && area.polygon.length > 0) {
      // For polygon areas, calculate bounds from the polygon
      const lats = area.polygon.map(([lat]) => lat);
      const lngs = area.polygon.map(([, lng]) => lng);
      const bounds = {
        north: Math.max(...lats),
        south: Math.min(...lats),
        east: Math.max(...lngs),
        west: Math.min(...lngs)
      };
      calculatedZoom = calculateZoomLevel(bounds);
    }
    setMapZoom(calculatedZoom);

    // Add area overlay to the map
    if (area.overlay) {
      setMapOverlays([area.overlay]);
    }
    
    // Convert SearchAreaResult to location filter using PostGIS
    // Priority: polygon > bounds (most precise to least precise)
    const newLocationFilter: ListingFilters['location'] = {};
    
    if (area.polygon && area.polygon.length >= 3) {
      // Use polygon for most precise filtering
      newLocationFilter.polygon = area.polygon;
      console.log('Location filter set to polygon with', area.polygon.length, 'points');
    } else if (area.bounds) {
      // Use bounding box as fallback
      newLocationFilter.bounds = area.bounds;
      console.log('Location filter set to bounds:', area.bounds);
    } else {
      // Fallback to radius search around center point (10 miles default)
      newLocationFilter.center = {
        lat: area.center[0],
        lng: area.center[1],
      };
      newLocationFilter.radius = 10; // 10 mile radius default
      console.log('Location filter set to radius:', newLocationFilter.center);
    }
    
    setLocationFilter(newLocationFilter);
    // Store the full OSM display name (e.g., "Reisterstown, Baltimore County, Maryland, 21136, United States")
    const locationNameToStore = fullLocationName || area.name;
    setLocationQuery(locationNameToStore);
    
    // Update URL with ONLY the full location display name (no coords or map state)
    const locationParams = locationQueryToURLParams(locationNameToStore);
    
    const params = new URLSearchParams(searchParams);
    
    // Remove old location-related params if they exist
    const oldLocationKeys = ['location', 'locationName', 'bounds', 'radius', 'mapLat', 'mapLng', 'mapZoom'];
    oldLocationKeys.forEach(key => params.delete(key));
    
    // Add the new location query
    Object.entries(locationParams).forEach(([key, value]) => {
      params.set(key, value);
    });
    
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    
    // Mark location as initialized and not searching anymore
    setIsLocationInitialized(true);
    setIsSearchingLocation(false);
  }, [searchParams, pathname, router]);

  const handleOverlayClick = (overlay: MapOverlay) => {
    // Handle clicks on map overlays
    console.log('Overlay clicked:', overlay.name);
    
    // If it's a listing marker, navigate to the listing detail page
    if (overlay.type === 'marker' && overlay.data?.listingId) {
      router.push(`/listings/${overlay.data.listingId}`);
    }
  };

  const clearLocationFilter = useCallback(() => {
    setLocationFilter(null);
    setLocationQuery(undefined);
    setMapOverlays([]);
    
    // Remove location-related params from URL
    const params = new URLSearchParams(searchParams);
    const locationKeys = ['locationQuery', 'location', 'locationName', 'bounds', 'radius', 'mapLat', 'mapLng', 'mapZoom'];
    locationKeys.forEach(key => params.delete(key));
    
    const queryString = params.toString();
    const newURL = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(newURL, { scroll: false });
  }, [searchParams, pathname, router]);

  // Combine regular filters with location filter
  const combinedFilters = useMemo(() => {
    // If we're still searching for location, don't apply any filters yet
    // This prevents UI jitter from showing listings with incomplete filters
    if (isSearchingLocation) {
      return undefined;
    }
    
    // If we have a location filter, merge it with base filters
    if (locationFilter && (locationFilter.polygon || locationFilter.bounds || locationFilter.center)) {
      return {
        ...listingFilters,
        location: locationFilter,
      };
    }
    
    return listingFilters;
  }, [listingFilters, locationFilter, isSearchingLocation]);

  // Fetch listings using the combined filters
  const { listings } = useListings(combinedFilters);

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        isLoggedIn={isLoggedIn}
        showFilterPopup={showFilterPopup}
        showMapPanel={showMapPanel}
        activeFilters={getActiveFilters()}
        filters={filters}
        onUserIconClick={handleUserIconClick}
        onLoginOption={handleLoginOption}
        onToggleFilter={toggleFilterPopup}
        onToggleMap={toggleMapPanel}
        onClearFilter={clearFilter}
        onUpdateFilter={updateFilter}
        onToggleArrayFilter={toggleArrayFilter}
        onLogout={handleLogout}
        onAreaSelect={handleAreaSelect}
        searchBarRef={searchBarRef}
        locationQuery={locationQuery}
      />

      <AuthPopup 
        isOpen={showAuthPopup} 
        onClose={() => setShowAuthPopup(false)} 
      />

      <FilterPopup
        isOpen={showFilterPopup}
        filters={filters}
        onClose={toggleFilterPopup}
        onUpdateFilter={updateFilter}
        onToggleArrayFilter={toggleArrayFilter}
        onResetFilters={resetAllFilters}
        onReplaceFilters={replaceFilters}
      />

      {/* Main content area below header */}
      <main className="flex-1">
        <MainPanel
          showMapPanel={showMapPanel}
          activeFiltersCount={getActiveFilters().length}
          squareSize={squareSize}
          filters={combinedFilters}
          mapCenter={mapCenter}
          mapZoom={mapZoom}
          mapOverlays={mapOverlays}
          listings={listings}
          onOverlayClick={handleOverlayClick}
          onSquareSizeChange={setSquareSize}
        />
      </main>
    </div>
  )
}
