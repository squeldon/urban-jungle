'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useListings } from '@/hooks/useListings';
import { useAuthContext } from '@/context/AuthContext';
import { PropertyListing, ListingFilters } from '@/types/listing';
import ListingCard from './ListingCard';
import GridSizeControls from '../header/GridSizeControls';

interface ListingsPanelProps {
  isMapOpen: boolean;
  squareSize: number;
  onSquareSizeChange: (size: number) => void;
  filters?: ListingFilters;
}

export default function ListingsPanel({ 
  isMapOpen, 
  squareSize, 
  onSquareSizeChange, 
  filters 
}: ListingsPanelProps) {
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
    
    const isFavorite = listing.favorites.includes(user.id);
    try {
      await toggleListingFavorite(listing.id, !isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <div 
          className={`${isMapOpen ? 'w-[60vw]' : 'w-full'} transition-all duration-300`}
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
      >
        <div>
          <div className="mb-2 flex justify-between pl-7 pr-7 pt-2 pb-2">
            <div className="flex items-center gap-3">
              <GridSizeControls 
                squareSize={squareSize}
                onSquareSizeChange={onSquareSizeChange}
              />
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {loading ? 'Loading...' : `${listings.length} properties found`}
            </p>
          </div>

          {/* Grid of listing cards */}
          {loading && listings.length === 0 ? (
            // Loading skeleton
            <div className={`grid justify-items-center ${getGridCols()}`} style={{ gap: '0.5rem' }}>
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
              <div className={`grid justify-items-center ${getGridCols()}`} style={{ gap: '0.5rem' }}>
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    squareSize={squareSize}
                    user={user}
                    onListingClick={handleListingClick}
                    onFavoriteClick={handleFavoriteClick}
                  />
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
