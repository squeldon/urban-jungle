'use client'
import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { MapOverlay } from '@/types/map';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const ScaleControl = dynamic(() => import('react-leaflet').then(mod => mod.ScaleControl), { ssr: false });
const Polygon = dynamic(() => import('react-leaflet').then(mod => mod.Polygon), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false });
const Rectangle = dynamic(() => import('react-leaflet').then(mod => mod.Rectangle), { ssr: false });

interface MapPanelProps {
  isOpen: boolean;
  hasActiveFilters?: boolean;
  headerHeight: number;
  mapCenter?: [number, number] | null;
  overlays?: MapOverlay[];
  onOverlayClick?: (overlay: MapOverlay) => void;
}

export default function MapPanel({ isOpen, hasActiveFilters = false, headerHeight, mapCenter, overlays = [], onOverlayClick }: MapPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentCenter, setCurrentCenter] = useState<[number, number]>([40.7128, -74.0060]); // Default to NYC
  const mapRef = useRef<any>(null);

  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen);
    
    // Give the map a moment to adjust to the new size
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 300);
  };

  // Update map center when prop changes
  useEffect(() => {
    if (mapCenter && mapRef.current) {
      setCurrentCenter(mapCenter);
      mapRef.current.setView(mapCenter, 13);
    }
  }, [mapCenter]);

  // Adjust map view when overlays change
  useEffect(() => {
    if (overlays.length > 0 && mapRef.current) {
      // Calculate bounds to fit all overlays
      const bounds = calculateOverlayBounds(overlays);
      if (bounds) {
        mapRef.current.fitBounds([
          [bounds.south, bounds.west],
          [bounds.north, bounds.east]
        ], { padding: [20, 20] });
      }
    }
  }, [overlays]);

  // Helper function to calculate bounds for overlays
  const calculateOverlayBounds = (overlays: MapOverlay[]) => {
    if (overlays.length === 0) return null;

    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;

    overlays.forEach(overlay => {
      if (overlay.type === 'polygon') {
        overlay.coordinates.forEach(([lat, lng]) => {
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
        });
      } else if (overlay.type === 'circle') {
        const [lat, lng] = overlay.center;
        // Rough approximation for radius in degrees (not accurate but good enough for bounds)
        const radiusInDegrees = overlay.radius / 111320;
        minLat = Math.min(minLat, lat - radiusInDegrees);
        maxLat = Math.max(maxLat, lat + radiusInDegrees);
        minLng = Math.min(minLng, lng - radiusInDegrees);
        maxLng = Math.max(maxLng, lng + radiusInDegrees);
      } else if (overlay.type === 'rectangle') {
        const [[lat1, lng1], [lat2, lng2]] = overlay.bounds;
        minLat = Math.min(minLat, lat1, lat2);
        maxLat = Math.max(maxLat, lat1, lat2);
        minLng = Math.min(minLng, lng1, lng2);
        maxLng = Math.max(maxLng, lng1, lng2);
      }
    });

    return {
      north: maxLat,
      south: minLat,
      east: maxLng,
      west: minLng
    };
  };

  // Handle overlay click
  const handleOverlayClick = (overlay: MapOverlay) => {
    onOverlayClick?.(overlay);
  };

  // Default overlay styles
  const getOverlayStyle = (overlay: MapOverlay) => ({
    color: overlay.style?.color || '#3B82F6',
    fillColor: overlay.style?.fillColor || '#3B82F6',
    fillOpacity: overlay.style?.fillOpacity || 0.2,
    weight: overlay.style?.weight || 2,
    opacity: overlay.style?.opacity || 0.8,
  });

  // Render overlay based on type
  const renderOverlay = (overlay: MapOverlay) => {
    const style = getOverlayStyle(overlay);
    
    switch (overlay.type) {
      case 'polygon':
        return (
          <Polygon
            key={overlay.id}
            positions={overlay.coordinates}
            pathOptions={style}
            eventHandlers={{
              click: () => handleOverlayClick(overlay),
            }}
          >
            {/* Popup can be added here if needed */}
          </Polygon>
        );
      
      case 'circle':
        return (
          <Circle
            key={overlay.id}
            center={overlay.center}
            radius={overlay.radius}
            pathOptions={style}
            eventHandlers={{
              click: () => handleOverlayClick(overlay),
            }}
          />
        );
      
      case 'rectangle':
        return (
          <Rectangle
            key={overlay.id}
            bounds={overlay.bounds}
            pathOptions={style}
            eventHandlers={{
              click: () => handleOverlayClick(overlay),
            }}
          />
        );
      
      default:
        return null;
    }
  };

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
            : 'right-4 bottom-6 w-[calc(40vw-1.5rem)] lg:w-[calc(40vw-1.5rem)]'
          }
        `}
        style={{
          top: `${headerHeight + 16}px`,
          height: `calc(100vh - ${headerHeight + 16}px - 1.5rem)`,
        }}
      >
        <div className="relative w-full h-full bg-gray-100 dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Map Container - Always renders at full viewport size */}
          <div className="w-full h-full">
            <MapContainer
              center={currentCenter}
              zoom={13}
              ref={mapRef}
              className="w-full h-full z-0"
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <ScaleControl position="bottomright" />
              
              {/* Render overlays */}
              {overlays.map(overlay => renderOverlay(overlay))}
            </MapContainer>
            
            {/* Custom Attribution */}
            <div className="absolute bottom-1 left-2 text-[0.6rem] text-gray-400 z-10">
              © <a 
                href="https://www.openstreetmap.org/copyright" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
              >
                OpenStreetMap
              </a> contributors
            </div>
          </div>

          {/* Disclaimer */}
          <div className="absolute top-4 left-4 p-2 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-md z-10 max-w-48">
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
              <span className="text-gray-500 dark:text-gray-500">
                Boundaries may be inaccurate.
              </span>
            </p>
          </div>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={handleFullscreenToggle}
            className="absolute top-4 right-4 p-2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 rounded-lg shadow-md transition-colors z-10"
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
        </div>
      </div>
    </>
  );
}
