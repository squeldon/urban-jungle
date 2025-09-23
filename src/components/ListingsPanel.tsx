'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useListings } from '@/hooks/useListings';
import { useAuthContext } from '@/context/AuthContext';
import { PropertyListing } from '@/types/listing';
import { getFileTypeFromUrl } from '@/lib/firebase/storage';
import { Heart, Eye, MapPin, Home, Calendar, ChevronLeft, ChevronRight, Play } from 'lucide-react';

interface ListingsPanelProps {
  isMapOpen: boolean;
  squareSize: number;
  headerHeight: number;
  filters?: any; // You can type this better based on your existing filter types
}

export default function ListingsPanel({ isMapOpen, squareSize, headerHeight, filters }: ListingsPanelProps) {
  const [columns, setColumns] = useState(3);
  const [cardImageIndexes, setCardImageIndexes] = useState<{[key: string]: number}>({});
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

  const handleImageNavigation = (listingId: string, direction: 'prev' | 'next', imageCount: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = cardImageIndexes[listingId] || 0;
    let newIndex;
    
    if (direction === 'next') {
      newIndex = currentIndex + 1 >= imageCount ? 0 : currentIndex + 1;
    } else {
      newIndex = currentIndex - 1 < 0 ? imageCount - 1 : currentIndex - 1;
    }
    
    setCardImageIndexes(prev => ({
      ...prev,
      [listingId]: newIndex
    }));
  };

  const formatPrice = (price: number | undefined, listingType: string) => {
    if (price === undefined || price === null) return 'Price TBD';
    
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
                    {/* Media container */}
                    <div className="relative h-1/2 bg-gray-200 dark:bg-gray-700 group">
                      {listing.images && listing.images.length > 0 ? (
                        <>
                          {(() => {
                            const currentMediaUrl = listing.images[cardImageIndexes[listing.id] || 0];
                            const fileType = getFileTypeFromUrl(currentMediaUrl);
                            const isVideo = fileType === 'video';
                            
                            return isVideo ? (
                              <div className="relative w-full h-full">
                                <video
                                  src={currentMediaUrl}
                                  className="w-full h-full object-cover"
                                  muted
                                  preload="metadata"
                                />
                                {/* Video play overlay */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="bg-black/60 rounded-full p-3">
                                    <Play className="w-6 h-6 text-white" fill="currentColor" />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <img
                                src={currentMediaUrl}
                                alt={listing.title}
                                className="w-full h-full object-cover"
                              />
                            );
                          })()}
                          
                          {/* Media navigation - only show on hover and if multiple items */}
                          {listing.images.length > 1 && (
                            <>
                              {/* Previous media button */}
                              <button
                                onClick={(e) => handleImageNavigation(listing.id, 'prev', listing.images.length, e)}
                                className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                              
                              {/* Next media button */}
                              <button
                                onClick={(e) => handleImageNavigation(listing.id, 'next', listing.images.length, e)}
                                className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </button>
                              
                              {/* Media indicators - only visible on hover */}
                              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                {listing.images.map((mediaUrl, index) => {
                                  const fileType = getFileTypeFromUrl(mediaUrl);
                                  const isVideo = fileType === 'video';
                                  
                                  return (
                                    <div
                                      key={index}
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        index === (cardImageIndexes[listing.id] || 0)
                                          ? isVideo ? 'bg-purple-400' : 'bg-white'
                                          : isVideo ? 'bg-purple-400/50' : 'bg-white/50'
                                      }`}
                                    />
                                  );
                                })}
                              </div>
                              
                              {/* Media counter - only visible on hover */}
                              <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                {(cardImageIndexes[listing.id] || 0) + 1} / {listing.images.length}
                              </div>
                              
                              {/* Media type indicator */}
                              {(() => {
                                const currentMediaUrl = listing.images[cardImageIndexes[listing.id] || 0];
                                const fileType = getFileTypeFromUrl(currentMediaUrl);
                                const isVideo = fileType === 'video';
                                
                                return isVideo && (
                                  <div className="absolute top-2 right-16 bg-purple-600 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    Video
                                  </div>
                                );
                              })()}
                            </>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Listing Type Badge */}
                      {listing.listingType === 'wholesale' && (
                        <div className="absolute top-2 right-14">
                          <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                            WHOLESALE
                          </span>
                        </div>
                      )}
                      
                      {/* Favorite button */}
                      <button
                        onClick={(e) => handleFavoriteClick(listing, e)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-white transition-colors z-10"
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

                    {/* Content - Improved space management for all card sizes */}
                    <div className={`h-1/2 flex flex-col overflow-hidden ${
                      squareSize >= 265 ? 'p-2 gap-1.5' : 'p-1.5 gap-1'
                    }`}>
                      {/* Title */}
                      <h3 className={`font-semibold text-gray-900 dark:text-white leading-tight ${
                        squareSize >= 265 ? 'text-sm truncate' : 'text-xs truncate'
                      }`}>
                        {listing.title}
                      </h3>

                      {/* Address */}
                      <p className={`text-gray-600 dark:text-gray-400 truncate flex items-center ${
                        squareSize >= 265 ? 'text-xs' : 'text-xs'
                      }`}>
                        <MapPin className={`inline mr-1 flex-shrink-0 ${squareSize >= 265 ? 'w-3 h-3' : 'w-2.5 h-2.5'}`} />
                        <span className="truncate">
                          {squareSize >= 430 
                            ? `${listing.address.street}, ${listing.address.city}, ${listing.address.state}`
                            : `${listing.address.city}, ${listing.address.state}`
                          }
                        </span>
                      </p>

                      {/* Property specs - Only show on larger cards or compact form on smaller */}
                      {squareSize >= 200 && (
                        <div className={`flex items-center text-gray-600 dark:text-gray-400 ${
                          squareSize >= 265 ? 'gap-2 text-xs' : 'gap-1 text-xs'
                        }`}>
                          {listing.bedrooms && <span className="whitespace-nowrap">{listing.bedrooms}bd</span>}
                          {listing.bathrooms && <span className="whitespace-nowrap">{listing.bathrooms}ba</span>}
                          {squareSize >= 300 && listing.squareFeet && (
                            <span className="whitespace-nowrap">{listing.squareFeet.toLocaleString()} sq ft</span>
                          )}
                          {squareSize >= 430 && listing.yearBuilt && (
                            <span className="whitespace-nowrap">Built {listing.yearBuilt}</span>
                          )}
                        </div>
                      )}

                      {/* Price section - Improved spacing and priority */}
                      <div className={`flex flex-wrap text-xs ${squareSize >= 265 ? 'gap-1' : 'gap-0.5'}`}>
                        <span className={`bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded whitespace-nowrap ${
                          squareSize >= 265 ? 'px-2 py-1' : 'px-1 py-0.5'
                        }`}>
                          {squareSize >= 300 ? 'Asking: ' : ''}{formatPrice(listing.price, 'sale')}
                        </span>
                        {listing.arv && squareSize >= 200 && (
                          <span className={`bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded whitespace-nowrap ${
                            squareSize >= 265 ? 'px-2 py-1' : 'px-1 py-0.5'
                          }`}>
                            {squareSize >= 300 ? 'ARV: ' : 'ARV '}{formatPrice(listing.arv, 'sale')}
                          </span>
                        )}
                        {squareSize >= 300 && listing.repairCosts && (
                          <span className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded whitespace-nowrap">
                            Repairs: {formatPrice(listing.repairCosts, 'sale')}
                          </span>
                        )}
                        {squareSize >= 380 && listing.wholesaleFee && (
                          <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded whitespace-nowrap">
                            Fee: {formatPrice(listing.wholesaleFee, 'sale')}
                          </span>
                        )}
                        {squareSize >= 430 && listing.monthlyRent && (
                          <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded whitespace-nowrap">
                            Rent: {formatPrice(listing.monthlyRent, 'rent')}
                          </span>
                        )}
                      </div>

                      {/* Description - Only show if there's space */}
                      {squareSize >= 300 && listing.description && (
                        <p className={`text-xs text-gray-600 dark:text-gray-400 leading-tight ${
                          squareSize >= 430 ? 'line-clamp-2' : 'line-clamp-1'
                        }`}>
                          {listing.description}
                        </p>
                      )}

                      {/* Bottom row - Fixed to bottom with better space management */}
                      <div className="flex items-center justify-between mt-auto pt-1 min-h-0">
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          {squareSize < 200 && listing.bedrooms && (
                            <span className="text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                              {listing.bedrooms}bd/{listing.bathrooms}ba
                            </span>
                          )}
                        </div>
                        <div className={`flex items-center text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0 ${
                          squareSize >= 265 ? 'text-xs' : 'text-xs'
                        }`}>
                          <Eye className={`mr-1 ${squareSize >= 265 ? 'w-3 h-3' : 'w-2.5 h-2.5'}`} />
                          <span>{listing.views}</span>
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
