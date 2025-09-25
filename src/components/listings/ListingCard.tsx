import { useState } from 'react';
import { PropertyListing } from '@/types/listing';
import { Heart } from 'lucide-react';
import ListingCardMedia from './ListingCardMedia';
import ListingCardContent from './ListingCardContent';

interface ListingCardProps {
  listing: PropertyListing;
  squareSize: number;
  user: any;
  onListingClick: (listing: PropertyListing) => void;
  onFavoriteClick: (listing: PropertyListing, e: React.MouseEvent) => void;
}

export default function ListingCard({ 
  listing, 
  squareSize, 
  user, 
  onListingClick, 
  onFavoriteClick 
}: ListingCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleImageNavigation = (direction: 'prev' | 'next') => {
    if (!listing.images || listing.images.length <= 1) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = currentImageIndex + 1 >= listing.images.length ? 0 : currentImageIndex + 1;
    } else {
      newIndex = currentImageIndex - 1 < 0 ? listing.images.length - 1 : currentImageIndex - 1;
    }
    setCurrentImageIndex(newIndex);
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
      style={{
        width: `${squareSize}px`,
        height: `${squareSize}px`,
      }}
      onClick={() => onListingClick(listing)}
    >
      {/* Media container */}
      <div className="relative h-1/2 bg-gray-200 dark:bg-gray-700 group">
        <ListingCardMedia 
          listing={listing}
          currentImageIndex={currentImageIndex}
          onImageNavigation={handleImageNavigation}
        />
        
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
          onClick={(e) => onFavoriteClick(listing, e)}
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

      {/* Content */}
      <ListingCardContent 
        listing={listing}
        squareSize={squareSize}
      />
    </div>
  );
}
