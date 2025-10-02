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
  onSquareSizeChange: (size: number) => void;
  mapCenter?: [number, number] | null;
  mapZoom?: number;
  mapOverlays?: MapOverlay[];
  onOverlayClick?: (overlay: MapOverlay) => void;
}

export default function MainPanel({ showMapPanel, activeFiltersCount, squareSize, filters, onSquareSizeChange, mapCenter, mapZoom, mapOverlays, onOverlayClick }: MainPanelProps) {
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
    <div className="relative w-full"
      style={{
        top: `${headerHeight}px`,
      }}
    >
      {/* Listings Panel - main content that will scroll with the page */}
      <ListingsPanel
        isMapOpen={showMapPanel}
        squareSize={squareSize}
        onSquareSizeChange={onSquareSizeChange}
        filters={filters}
      />

      {/* Map Panel - positioned fixed, so doesn't affect layout */}
      <MapPanel
        isOpen={showMapPanel}
        hasActiveFilters={activeFiltersCount > 0}
        headerHeight={headerHeight}
        mapCenter={mapCenter}
        mapZoom={mapZoom}
        overlays={mapOverlays}
        onOverlayClick={onOverlayClick}
      />
    </div>
  );
}
