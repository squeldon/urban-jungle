// Geographic overlay types for map display

export interface GeographicBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface PolygonOverlay {
  type: 'polygon';
  id: string;
  name: string;
  coordinates: [number, number][]; // Array of [lat, lng] points
  bounds?: GeographicBounds;
  style?: {
    color?: string;
    fillColor?: string;
    fillOpacity?: number;
    weight?: number;
    opacity?: number;
  };
}

export interface CircleOverlay {
  type: 'circle';
  id: string;
  name: string;
  center: [number, number]; // [lat, lng]
  radius: number; // in meters
  style?: {
    color?: string;
    fillColor?: string;
    fillOpacity?: number;
    weight?: number;
    opacity?: number;
  };
}

export interface RectangleOverlay {
  type: 'rectangle';
  id: string;
  name: string;
  bounds: [[number, number], [number, number]]; // [[lat, lng], [lat, lng]]
  style?: {
    color?: string;
    fillColor?: string;
    fillOpacity?: number;
    weight?: number;
    opacity?: number;
  };
}

export type MapOverlay = PolygonOverlay | CircleOverlay | RectangleOverlay;

export interface SearchResultAddress {
  houseNumber?: string;
  street?: string;
  streetName?: string;
  neighbourhood?: string;
  city?: string;
  county?: string;
  state?: string;
  stateCode?: string;
  zipCode?: string;
  country?: string;
  countryCode?: string;
  raw?: Record<string, any>;
}

export interface SearchAreaResult {
  name: string;
  displayName: string;
  center: [number, number];
  bounds?: GeographicBounds;
  polygon?: [number, number][]; // Array of [lat, lng] coordinates for form-fitting boundary
  overlay?: MapOverlay;
  confidence: number; // 0-1, how confident we are about the area
  address: SearchResultAddress;
  raw?: any;
}

export interface MapPanelProps {
  isOpen: boolean;
  hasActiveFilters?: boolean;
  headerHeight: number;
  mapCenter?: [number, number] | null;
  overlays?: MapOverlay[];
  onOverlayClick?: (overlay: MapOverlay) => void;
}
