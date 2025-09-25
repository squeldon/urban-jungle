import { PropertyListing } from '@/types/listing';
import { MapPin, Eye } from 'lucide-react';

interface ListingCardContentProps {
  listing: PropertyListing;
  squareSize: number;
}

export default function ListingCardContent({ listing, squareSize }: ListingCardContentProps) {
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

  return (
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
  );
}
