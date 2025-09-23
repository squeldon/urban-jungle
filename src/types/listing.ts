export interface PropertyListing {
  id: string;
  title: string;
  description: string;
  price: number;
  propertyType: 'house' | 'apartment' | 'condo' | 'townhouse' | 'duplex' | 'triplex' | 'fourplex' | 'land' | 'commercial';
  listingType: 'wholesale' | 'sale' | 'rent';
  
  // Property details
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  lotSize?: number;
  yearBuilt?: number;
  
  // Wholesale-specific fields
  arv?: number; // After Repair Value
  repairCosts?: number; // Estimated repair costs
  wholesaleFee?: number; // Wholesaler fee
  investmentStrategy?: 'fix-flip' | 'buy-hold' | 'rental' | 'live-in-flip' | 'brrrr' | 'other';
  propertyCondition?: 'excellent' | 'good' | 'fair' | 'needs-cosmetic' | 'needs-full-rehab' | 'tear-down';
  occupancyStatus?: 'vacant' | 'owner-occupied' | 'tenant-occupied' | 'partially-occupied';
  monthlyRent?: number; // Current or projected rental income
  
  // Location
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
  
  // Features and amenities
  features: string[]; // e.g., ['garage', 'pool', 'garden', 'fireplace']
  amenities: string[]; // e.g., ['gym', 'parking', 'laundry', 'pet-friendly']
  
  // Media
  images: string[]; // URLs to images stored in Firebase Storage
  virtualTourUrl?: string;
  
  // Listing metadata
  createdBy: string; // User ID of the person who created the listing
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'inactive' | 'pending' | 'sold' | 'rented' | 'withdrawn';
  isVerified: boolean;
  
  // Contact information
  contactInfo: {
    name: string;
    phone?: string;
    email: string;
    isOwner: boolean; // true if owner, false if agent/broker
    agencyName?: string;
    isWholesaler?: boolean; // true if this is a wholesaler listing
  };
  
  // Deal terms (wholesale-specific)
  dealTerms?: {
    financingOptions?: ('cash-only' | 'seller-financing' | 'hard-money' | 'conventional' | 'private-money')[];
    earnestMoneyDeposit?: number;
    proofOfFundsRequired?: boolean;
    showingInstructions?: string;
    appointmentRequired?: boolean;
    accessRestrictions?: string;
  };
  
  // Additional metadata
  views: number;
  favorites: string[]; // Array of user IDs who favorited this listing
  tags: string[]; // For search optimization
}

// For filters in your existing filter system
export interface ListingFilters {
  propertyType?: string[];
  listingType?: 'wholesale' | 'sale' | 'rent';
  priceRange?: {
    min: number;
    max: number;
  };
  arvRange?: {
    min: number;
    max: number;
  };
  repairCostsRange?: {
    min: number;
    max: number;
  };
  bedrooms?: {
    min: number;
    max: number;
  };
  bathrooms?: {
    min: number;
    max: number;
  };
  squareFeet?: {
    min: number;
    max: number;
  };
  investmentStrategy?: string[];
  propertyCondition?: string[];
  occupancyStatus?: string[];
  financingOptions?: string[];
  features?: string[];
  amenities?: string[];
  location?: {
    city?: string;
    state?: string;
    zipCode?: string;
    radius?: number; // for geographic searches
    center?: {
      lat: number;
      lng: number;
    };
  };
}

// For creating new listings
export interface CreateListingData extends Omit<PropertyListing, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'favorites'> {
  // All fields except auto-generated ones
}

// For updating listings
export interface UpdateListingData extends Partial<Omit<PropertyListing, 'id' | 'createdBy' | 'createdAt'>> {
  // All fields except id, createdBy, and createdAt are optional for updates
}
