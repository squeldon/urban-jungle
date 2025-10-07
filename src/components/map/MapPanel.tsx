'use client'
import { useState, useEffect, useRef, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapOverlay, MarkerOverlay } from '@/types/map';
import { PropertyListing } from '@/types/listing';
import { BaseMap, BaseMapRef } from '@/components/map/BaseMap';

interface MapPanelProps {
  isOpen: boolean;
  hasActiveFilters?: boolean;
  headerHeight: number;
  mapCenter?: [number, number] | null;
  mapZoom?: number;
  overlays?: MapOverlay[];
  listings?: PropertyListing[];
  onOverlayClick?: (overlay: MapOverlay) => void;
}

export default function MapPanel({ isOpen, hasActiveFilters = false, headerHeight, mapCenter, mapZoom = 13, overlays = [], listings = [], onOverlayClick }: MapPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentCenter, setCurrentCenter] = useState<[number, number]>([39.2904, -76.6122]); // Default to Baltimore
  const [currentZoom, setCurrentZoom] = useState<number>(mapZoom);
  const baseMapRef = useRef<BaseMapRef>(null);

  // Convert listings to marker overlays
  const listingMarkers = useMemo<MarkerOverlay[]>(() => {
    return listings
      .filter(listing => listing.coordinates?.lat && listing.coordinates?.lng)
      .map(listing => ({
        type: 'marker' as const,
        id: `listing-${listing.id}`,
        name: listing.title,
        position: [listing.coordinates!.lat, listing.coordinates!.lng] as [number, number],
        data: {
          listingId: listing.id,
          price: listing.price,
          address: `${listing.address.street}, ${listing.address.city}, ${listing.address.state}`,
          propertyType: listing.propertyType,
        }
      }));
  }, [listings]);

  // Combine area overlays with listing markers
  const allOverlays = useMemo<MapOverlay[]>(() => {
    return [...overlays, ...listingMarkers];
  }, [overlays, listingMarkers]);

  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen);
    
    // Give the map a moment to adjust to the new size, then invalidate size
    setTimeout(() => {
      if (baseMapRef.current) {
        baseMapRef.current.invalidateSize();
      }
    }, 300);
  };

  // Update map center and zoom when props change
  useEffect(() => {
    if (mapCenter) {
      setCurrentCenter(mapCenter);
    }
    if (mapZoom) {
      setCurrentZoom(mapZoom);
    }
  }, [mapCenter, mapZoom]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay for fullscreen mode */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={handleFullscreenToggle}
        />
      )}

      {/* Single Map Container - Always fullscreen sized but viewport is cropped */}
      <div
        className={`
          fixed z-40 transition-all duration-300 ease-in-out
          ${isFullscreen
            ? 'right-4 bottom-4 w-[calc(100vw-3rem)]'
            : 'right-4 bottom-4 w-[calc(40vw-3rem)] lg:w-[calc(40vw-2rem)]'
          }
        `}
        style={{
          top: `${headerHeight+16}px`,
        }}
      >
        <div className="relative w-full h-full bg-gray-100 dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <BaseMap
            ref={baseMapRef}
            center={currentCenter}
            zoom={currentZoom}
            overlays={allOverlays}
            onOverlayClick={onOverlayClick}
            className="w-full h-full"
            showScale={true}
            showAttribution={true}
            showDisclaimer={true}
            zoomControl={false}
          />

          {/* Map Controls Container */}
          <div className="absolute top-4 right-4 z-10 space-y-2">
            {/* Fullscreen Toggle Button */}
            <button
              onClick={handleFullscreenToggle}
              className="w-full p-2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 rounded-lg shadow-md transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              <svg
                className="w-5 h-5 text-gray-600 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isFullscreen ? (
                  // Exit fullscreen icon
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 15V19.5M15 15H19.5M15 15L20.5 20.5M9 15V19.5M9 15H4.5M9 15L3.5 20.5M15 9V4.5M15 9H19.5M15 9L20.5 3.5"
                  />
                ) : (
                  // Enter fullscreen icon
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                )}
              </svg>
            </button>

            {/* Zoom Controls */}
            <div className="flex flex-col">
              {/* Zoom In Button */}
              <button
                onClick={() => baseMapRef.current?.zoomIn()}
                className="p-2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 rounded-t-lg shadow-md transition-colors border-b border-gray-200 dark:border-gray-600"
                title="Zoom In"
              >
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>

              {/* Zoom Out Button */}
              <button
                onClick={() => baseMapRef.current?.zoomOut()}
                className="p-2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 rounded-b-lg shadow-md transition-colors"
                title="Zoom Out"
              >
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 12h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
