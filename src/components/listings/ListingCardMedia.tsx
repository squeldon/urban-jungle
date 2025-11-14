import { PropertyListing } from '@/types/listing';
import { getFileTypeFromUrl } from '@/supabase/media';
import { ChevronLeft, ChevronRight, Play, Home } from 'lucide-react';

interface ListingCardMediaProps {
  listing: PropertyListing;
  currentImageIndex: number;
  onImageNavigation: (direction: 'prev' | 'next') => void;
}

export default function ListingCardMedia({ 
  listing, 
  currentImageIndex, 
  onImageNavigation 
}: ListingCardMediaProps) {
  if (!listing.images || listing.images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Home className="w-6 h-6 text-gray-400" />
      </div>
    );
  }

  const currentMediaUrl = listing.images[currentImageIndex];
  const fileType = getFileTypeFromUrl(currentMediaUrl);
  const isVideo = fileType === 'video';

  return (
    <>
      {isVideo ? (
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
      )}
      
      {/* Media navigation - only show on hover and if multiple items */}
      {listing.images.length > 1 && (
        <>
          {/* Previous media button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onImageNavigation('prev');
            }}
            className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          
          {/* Next media button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onImageNavigation('next');
            }}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
          
          {/* Media counter - only visible on hover */}
          <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {currentImageIndex + 1} / {listing.images.length}
          </div>
        </>
      )}
    </>
  );
}
