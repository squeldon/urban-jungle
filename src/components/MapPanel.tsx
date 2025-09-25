'use client'
import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const ScaleControl = dynamic(() => import('react-leaflet').then(mod => mod.ScaleControl), { ssr: false });

interface MapPanelProps {
  isOpen: boolean;
  hasActiveFilters?: boolean;
  headerHeight: number;
  mapCenter?: [number, number] | null;
}

export default function MapPanel({ isOpen, hasActiveFilters = false, headerHeight, mapCenter }: MapPanelProps) {
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
