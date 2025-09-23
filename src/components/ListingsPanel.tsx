'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useListings } from '@/hooks/useListings';
import { useAuthContext } from '@/context/AuthContext';
import { PropertyListing } from '@/types/listing';
import { Heart, Eye, MapPin, Home, Calendar } from 'lucide-react';

interface ListingsPanelProps {
  isMapOpen: boolean;
  squareSize: number;
  headerHeight: number;
  filters?: any; // You can type this better based on your existing filter types
}

export default function ListingsPanel({ isMapOpen, squareSize, headerHeight, filters }: ListingsPanelProps) {
  const [columns, setColumns] = useState(3);
  const { user } = useAuthContext() as { user: any };
  const router = useRouter();
  
  // Use the listings hook
  const { 
    listings, 
    loading, 
    error, 
    hasMore, 
    loadMore, 
    toggleListingFavorite, 
    incrementViews 
  } = useListings(filters);

  // Calculate how many columns can fit based on available width
  useEffect(() => {
    const calculateColumns = () => {
      // Get the available width
      const availableWidth = isMapOpen ? window.innerWidth * 0.6 : window.innerWidth;
      
      // Account for padding and margins (48px total padding + some buffer)
      const padding = 96; // 48px left + 48px right padding from p-6
      const gap = 8; // 0.5rem gap between items
      
      const usableWidth = availableWidth - padding;
      
      // Calculate how many squares can fit
      // Formula: (n * squareSize) + ((n - 1) * gap) <= usableWidth
      // Solving for n: n <= (usableWidth + gap) / (squareSize + gap)
      const maxColumns = Math.floor((usableWidth + gap) / (squareSize + gap));
      
      // Ensure at least 1 column and reasonable maximum
      const finalColumns = Math.max(1, Math.min(maxColumns, 12));
      setColumns(finalColumns);
    };

    calculateColumns();
    
    // Recalculate on window resize
    window.addEventListener('resize', calculateColumns);
    return () => window.removeEventListener('resize', calculateColumns);
  }, [isMapOpen, squareSize]);

  // Generate CSS class for the calculated number of columns
  const getGridCols = () => {
    const colsMap: { [key: number]: string } = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      7: 'grid-cols-7',
      8: 'grid-cols-8',
      9: 'grid-cols-9',
      10: 'grid-cols-10',
      11: 'grid-cols-11',
      12: 'grid-cols-12',
    };
    
    return colsMap[columns] || 'grid-cols-3';
  };

  const handleListingClick = (listing: PropertyListing) => {
    // Navigate to listing detail page
    router.push(`/listings/${listing.id}`);
  };

  const handleFavoriteClick = async (listing: PropertyListing, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      // Show login prompt
      return;
    }
    
    const isFavorite = listing.favorites.includes(user.uid);
    try {
      await toggleListingFavorite(listing.id, !isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const formatPrice = (price: number, listingType: string) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
    
    if (listingType === 'rent') return `${formatted}/mo`;
    if (listingType === 'wholesale') return `${formatted} (Wholesale)`;
    return formatted;
  };

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <div 
          className={`${isMapOpen ? 'w-[60vw]' : 'w-full'} transition-all duration-300`}
          style={{ paddingTop: `${headerHeight - 15}px` }}
        >
          <div className="p-6">
            <div className="text-center text-red-600 dark:text-red-400">
              <p>Error loading listings: {error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* Content container - width adjusts based on map state */}
      <div 
        className={`${isMapOpen ? 'w-[60vw]' : 'w-full'} transition-all duration-300`}
        style={{
          paddingTop: `${headerHeight - 15}px`, // Dynamic padding based on header height + spacing
        }}
      >
        <div className="p-6">
          <div className="mb-2">
            <p className="text-gray-600 dark:text-gray-400">
              {loading ? 'Loading...' : `${listings.length} properties found`}
            </p>
          </div>

          {/* Grid of listing cards */}
          {loading && listings.length === 0 ? (
            // Loading skeleton
            <div className={`grid justify-items-center ${getGridCols()} pr-3`} style={{ gap: '0.5rem' }}>
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
                  style={{
                    width: `${squareSize}px`,
                    height: `${squareSize}px`,
                  }}
                />
              ))}
            </div>
          ) : (
            <>
              <div className={`grid justify-items-center ${getGridCols()} pr-3`} style={{ gap: '0.5rem' }}>
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
                    style={{
                      width: `${squareSize}px`,
                      height: `${squareSize}px`,
                    }}
                    onClick={() => handleListingClick(listing)}
                  >
                    {/* Image container */}
                    <div className="relative h-1/2 bg-gray-200 dark:bg-gray-700">
                      {listing.images && listing.images.length > 0 ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Listing Type Badge */}
                      {listing.listingType === 'wholesale' && (
                        <div className="absolute top-2 left-2">
                          <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                            WHOLESALE
                          </span>
                        </div>
                      )}
                      
                      {/* Favorite button */}
                      <button
                        onClick={(e) => handleFavoriteClick(listing, e)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-white transition-colors"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            user && listing.favorites.includes(user.uid)
                              ? 'fill-red-500 text-red-500'
                              : 'text-gray-600'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-2 h-1/2 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {listing.title}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {listing.address.city}, {listing.address.state}
                        </p>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-green-600 dark:text-green-400">
                            {formatPrice(listing.price, listing.listingType)}
                          </p>
                          {listing.arv && (
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              ARV: {formatPrice(listing.arv, 'sale')}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        {listing.investmentStrategy && (
                          <div className="text-xs">
                            <span className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-1 py-0.5 rounded text-xs">
                              {listing.investmentStrategy.replace('-', ' ')}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {listing.views}
                          </div>
                          {listing.bedrooms && (
                            <div>
                              {listing.bedrooms}bd/{listing.bathrooms}ba
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load more button */}
              {hasMore && (
                <div className="mt-6 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
