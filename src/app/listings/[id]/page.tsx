'use client'
import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { PropertyListing } from '@/types/listing';
import { getListing, toggleFavorite, incrementViewCount } from '@/lib/firestore/listings';
import { ArrowLeft, Heart, Eye, MapPin, Calendar, User, Phone, Mail, Building, DollarSign, Wrench, TrendingUp, Home, Bed, Bath, Square, Car, Star } from 'lucide-react';

interface ListingDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ListingDetailPage({ params }: ListingDetailPageProps) {
  const [listing, setListing] = useState<PropertyListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  
  const router = useRouter();
  const { user } = useAuthContext() as { user: any };
  
  // Unwrap the params Promise using React.use()
  const { id } = use(params);

  const loadListing = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const listingData = await getListing(id);
      if (listingData) {
        setListing(listingData);
        // Increment view count
        await incrementViewCount(id);
      } else {
        setError('Listing not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadListing();
  }, [loadListing]);

  const handleFavoriteClick = async () => {
    if (!user || !listing) return;
    
    const isFavorite = listing.favorites.includes(user.uid);
    try {
      await toggleFavorite(listing.id, user.uid, !isFavorite);
      setListing(prev => prev ? {
        ...prev,
        favorites: isFavorite 
          ? prev.favorites.filter(id => id !== user.uid)
          : [...prev.favorites, user.uid]
      } : null);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Listings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Listings
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-500 dark:text-gray-400">
                <Eye className="w-4 h-4 mr-1" />
                {listing.views}
              </div>
              
              {user && (
                <button
                  onClick={handleFavoriteClick}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Heart 
                    className={`w-4 h-4 ${
                      listing.favorites.includes(user.uid)
                        ? 'fill-red-500 text-red-500'
                        : 'text-gray-400'
                    }`}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {listing.favorites.includes(user.uid) ? 'Favorited' : 'Add to Favorites'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              {listing.images && listing.images.length > 0 ? (
                <div className="relative">
                  <img
                    src={listing.images[imageIndex]}
                    alt={listing.title}
                    className="w-full h-96 object-cover"
                  />
                  {listing.images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {listing.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setImageIndex(index)}
                          className={`w-3 h-3 rounded-full ${
                            index === imageIndex 
                              ? 'bg-white' 
                              : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-96 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Home className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* Property Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {listing.title}
                  </h1>
                  <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
                    <MapPin className="w-5 h-5 mr-2" />
                    <span>
                      {listing.address.street}, {listing.address.city}, {listing.address.state} {listing.address.zipCode}
                    </span>
                  </div>
                </div>
                
                {listing.listingType === 'wholesale' && (
                  <div className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-sm font-semibold">
                    WHOLESALE DEAL
                  </div>
                )}
              </div>

              {/* Price Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg flex flex-col aspect-[5/4]">
                  <div className="flex items-center mb-auto">
                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Asking Price</span>
                  </div>
                    <p className="text-lg font-bold text-green-700 dark:text-green-300">
                      {formatPrice(listing.price)}
                    </p>
                </div>

                {listing.arv && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex flex-col aspect-[5/4]">
                    <div className="flex items-center mb-auto">
                      <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">ARV</span>
                    </div>
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                        {formatPrice(listing.arv)}
                      </p>
                  </div>
                )}

                {listing.repairCosts && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg flex flex-col aspect-[5/4]">
                    <div className="flex items-center mb-auto">
                      <Wrench className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-2" />
                      <span className="text-sm font-medium text-orange-600 dark:text-orange-400">Repair Costs</span>
                    </div>
                      <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
                        {formatPrice(listing.repairCosts)}
                      </p>
                  </div>
                )}

                {listing.wholesaleFee && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg flex flex-col aspect-[5/4]">
                    <div className="flex items-center mb-auto">
                      <Star className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
                      <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Wholesale Fee</span>
                    </div>
                      <p className="text-lg  font-bold text-purple-700 dark:text-purple-300">
                        {formatPrice(listing.wholesaleFee)}
                      </p>
                  </div>
                )}
              </div>

              {/* Property Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {listing.bedrooms && (
                  <div className="text-center">
                    <Bed className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Bedrooms</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{listing.bedrooms}</p>
                  </div>
                )}

                {listing.bathrooms && (
                  <div className="text-center">
                    <Bath className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Bathrooms</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{listing.bathrooms}</p>
                  </div>
                )}

                {listing.squareFeet && (
                  <div className="text-center">
                    <Square className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Square Feet</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{listing.squareFeet.toLocaleString()}</p>
                  </div>
                )}

                {listing.yearBuilt && (
                  <div className="text-center">
                    <Building className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Year Built</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{listing.yearBuilt}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {listing.description}
                </p>
              </div>
            </div>

            {/* Investment Details */}
            {(listing.investmentStrategy || listing.propertyCondition || listing.occupancyStatus || listing.monthlyRent) && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Investment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {listing.investmentStrategy && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Investment Strategy</p>
                      <p className="text-gray-900 dark:text-white capitalize">{listing.investmentStrategy.replace('-', ' ')}</p>
                    </div>
                  )}

                  {listing.propertyCondition && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Property Condition</p>
                      <p className="text-gray-900 dark:text-white capitalize">{listing.propertyCondition.replace('-', ' ')}</p>
                    </div>
                  )}

                  {listing.occupancyStatus && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Occupancy Status</p>
                      <p className="text-gray-900 dark:text-white capitalize">{listing.occupancyStatus.replace('-', ' ')}</p>
                    </div>
                  )}

                  {listing.monthlyRent && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Rent</p>
                      <p className="text-gray-900 dark:text-white">{formatPrice(listing.monthlyRent)}/month</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Features */}
            {listing.features.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Features</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Deal Terms */}
            {listing.dealTerms && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Deal Terms</h3>
                <div className="space-y-4">
                  {listing.dealTerms.financingOptions && listing.dealTerms.financingOptions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Financing Options</p>
                      <div className="flex flex-wrap gap-2">
                        {listing.dealTerms.financingOptions.map((option, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm capitalize"
                          >
                            {option.replace('-', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {listing.dealTerms.earnestMoneyDeposit && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Earnest Money Deposit</p>
                      <p className="text-gray-900 dark:text-white">{formatPrice(listing.dealTerms.earnestMoneyDeposit)}</p>
                    </div>
                  )}

                  {listing.dealTerms.proofOfFundsRequired && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                      <p className="text-yellow-800 dark:text-yellow-200 font-medium">⚠️ Proof of Funds Required</p>
                    </div>
                  )}

                  {listing.dealTerms.showingInstructions && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Showing Instructions</p>
                      <p className="text-gray-900 dark:text-white">{listing.dealTerms.showingInstructions}</p>
                    </div>
                  )}

                  {listing.dealTerms.accessRestrictions && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Access Restrictions</p>
                      <p className="text-gray-900 dark:text-white">{listing.dealTerms.accessRestrictions}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Contact Info */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{listing.contactInfo.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {listing.contactInfo.isWholesaler ? 'Wholesaler' : listing.contactInfo.isOwner ? 'Property Owner' : 'Agent'}
                    </p>
                  </div>
                </div>

                {listing.contactInfo.agencyName && (
                  <div className="flex items-center">
                    <Building className="w-5 h-5 text-gray-400 mr-3" />
                    <p className="text-gray-900 dark:text-white">{listing.contactInfo.agencyName}</p>
                  </div>
                )}

                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-gray-400 mr-3" />
                  <a 
                    href={`mailto:${listing.contactInfo.email}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {listing.contactInfo.email}
                  </a>
                </div>

                {listing.contactInfo.phone && (
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-gray-400 mr-3" />
                    <a 
                      href={`tel:${listing.contactInfo.phone}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {listing.contactInfo.phone}
                    </a>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Contact About This Property
                  </button>
                  <a 
                    href={`mailto:${listing.contactInfo.email}?subject=Interest in ${listing.title}&body=Hi ${listing.contactInfo.name},%0D%0A%0D%0AI'm interested in learning more about the property at ${listing.address.street}, ${listing.address.city}, ${listing.address.state}.%0D%0A%0D%0APlease contact me with more details.%0D%0A%0D%0AThank you!`}
                    className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium text-center block"
                  >
                    Send Email
                  </a>
                  {listing.contactInfo.phone && (
                    <a 
                      href={`tel:${listing.contactInfo.phone}`}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium text-center block"
                    >
                      Call Now
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Listing Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Listing Information</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Property Type</span>
                  <span className="text-gray-900 dark:text-white capitalize">{listing.propertyType.replace('-', ' ')}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Listing Type</span>
                  <span className="text-gray-900 dark:text-white capitalize">{listing.listingType}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Listed On</span>
                  <span className="text-gray-900 dark:text-white">{formatDate(listing.createdAt)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Views</span>
                  <span className="text-gray-900 dark:text-white">{listing.views}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Favorites</span>
                  <span className="text-gray-900 dark:text-white">{listing.favorites.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
