'use client'
import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
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

interface BaseMapProps {
  center?: [number, number];
  zoom?: number;
  overlays?: MapOverlay[];
  onOverlayClick?: (overlay: MapOverlay) => void;
  className?: string;
  showScale?: boolean;
  showAttribution?: boolean;
  showDisclaimer?: boolean;
  zoomControl?: boolean;
}

export interface BaseMapRef {
  invalidateSize: () => void;
  setView: (center: [number, number], zoom?: number) => void;
}

export const BaseMap = forwardRef<BaseMapRef, BaseMapProps>(({ 
  center = [40.7128, -74.0060], // Default to NYC
  zoom = 13,
  overlays = [], 
  onOverlayClick,
  className = "w-full h-full",
  showScale = false,
  showAttribution = true,
  showDisclaimer = true,
  zoomControl = true
}, ref) => {
  const mapRef = useRef<any>(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    invalidateSize: () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    },
    setView: (center: [number, number], zoom?: number) => {
      if (mapRef.current) {
        mapRef.current.setView(center, zoom);
      }
    }
  }), []);

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

  // Update map center when prop changes
  useEffect(() => {
    if (center && mapRef.current) {
      mapRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

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
          />
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

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        ref={mapRef}
        className="w-full h-full z-0"
        zoomControl={zoomControl}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Scale control */}
        {showScale && <ScaleControl position="bottomright" />}
        
        {/* Render overlays */}
        {overlays.map(overlay => renderOverlay(overlay))}
      </MapContainer>
      
      {/* Custom Attribution */}
      {showAttribution && (
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
      )}

      {/* Disclaimer
      {showDisclaimer && (
        <div className="absolute top-4 left-4 p-2 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-md z-10 max-w-48">
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
            <span className="text-gray-500 dark:text-gray-500">
              Boundaries may be inaccurate.
            </span>
          </p>
        </div>
      )} */}
    </div>
  );
});

BaseMap.displayName = 'BaseMap';
