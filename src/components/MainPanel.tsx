'use client'
import { useState, useEffect } from 'react';
import ListingsPanel from './ListingsPanel';
import MapPanel from './MapPanel';

interface MainPanelProps {
  showMapPanel: boolean;
  activeFiltersCount: number;
  squareSize: number;
}

export default function MainPanel({ showMapPanel, activeFiltersCount, squareSize }: MainPanelProps) {
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
      />

      {/* Map Panel - positioned fixed, so doesn't affect layout */}
      <MapPanel 
        isOpen={showMapPanel} 
        hasActiveFilters={activeFiltersCount > 0}
        headerHeight={headerHeight}
      />
    </div>
  );
}
