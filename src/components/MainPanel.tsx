'use client'
import { useState, useEffect } from 'react';
import ListingsPanel from './listings/ListingsPanel';
import MapPanel from './MapPanel';
import { ListingFilters } from '@/types/listing';
import { MapOverlay } from '@/types/map';

interface MainPanelProps {
  showMapPanel: boolean;
  activeFiltersCount: number;
  squareSize: number;
  filters?: ListingFilters;
  mapCenter?: [number, number] | null;
  mapOverlays?: MapOverlay[];
  onOverlayClick?: (overlay: MapOverlay) => void;
}

export default function MainPanel({ showMapPanel, activeFiltersCount, squareSize, filters, mapCenter, mapOverlays, onOverlayClick }: MainPanelProps) {
  const [headerHeight, setHeaderHeight] = useState(80); // Default fallback

  // Dynamically measure header height
  useEffect(() => {
    const measureHeaderHeight = () => {
      const header = document.querySelector('header');
      if (header) {
        const rect = header.getBoundingClientRect();
        setHeaderHeight(rect.height);
      }
    };

    // Measure initially
    measureHeaderHeight();

    // Measure on window resize
    window.addEventListener('resize', measureHeaderHeight);
    
    // Also measure when activeFiltersCount changes (header height changes)
    measureHeaderHeight();

    return () => {
      window.removeEventListener('resize', measureHeaderHeight);
    };
  }, [activeFiltersCount]); // Re-run when filter state changes

  return (
    <div className="relative w-full">
      {/* Listings Panel - main content that will scroll with the page */}
      <ListingsPanel
        isMapOpen={showMapPanel}
        squareSize={squareSize}
        headerHeight={headerHeight}
        filters={filters}
      />

      {/* Map Panel - positioned fixed, so doesn't affect layout */}
      <MapPanel 
        isOpen={showMapPanel} 
        hasActiveFilters={activeFiltersCount > 0}
        headerHeight={headerHeight}
        mapCenter={mapCenter}
        overlays={mapOverlays}
        onOverlayClick={onOverlayClick}
      />
    </div>
  );
}
