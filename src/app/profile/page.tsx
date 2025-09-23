'use client'
import { useState } from 'react';
import { useAuthContext } from "@/context/AuthContext";
import { useUserListings } from "@/hooks/useListings";
import { useRouter } from "next/navigation";
import CreateListingForm from "@/components/CreateListingForm";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Plus, Home, Eye, Heart, Edit, Trash2, X } from 'lucide-react';
import { PropertyListing } from "@/types/listing";

function Page() {
  const { user } = useAuthContext() as { user: any };
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingListing, setEditingListing] = useState<PropertyListing | null>(null);
  const [deletingListing, setDeletingListing] = useState<PropertyListing | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  const { listings, loading, error, refresh, deleteListing } = useUserListings();

  if (user == null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Not logged in</h1>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number | undefined, listingType: string) => {
    if (price === undefined || price === null) return 'Price TBD';
    
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
    
    return listingType === 'rent' ? `${formatted}/mo` : formatted;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'sold': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'rented': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'withdrawn': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleEditListing = (listing: PropertyListing) => {
    setEditingListing(listing);
  };

  const handleDeleteListing = (listing: PropertyListing) => {
    setDeletingListing(listing);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!deletingListing) return;
    
    try {
      await deleteListing(deletingListing.id);
      setDeletingListing(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete listing');
    }
  };

  const handleFormSuccess = () => {
    refresh();
    setEditingListing(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                My Listings
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Welcome back, {user.displayName || user.email}
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Listing
            </button>
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600 dark:text-gray-400">Loading your listings...</div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 dark:text-red-400">Error: {error}</div>
            <button
              onClick={refresh}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <Home className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              No listings yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first property listing to get started
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <Plus className="w-5 h-5" />
              Create Your First Listing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                <div className="h-48 bg-gray-200 dark:bg-gray-700 relative">
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(listing.status)}`}>
                      {listing.status}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                      {listing.title}
                    </h3>
                    <div className="flex gap-1 ml-2">
                      <button 
                        onClick={() => handleEditListing(listing)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="Edit listing"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteListing(listing)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                    {listing.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <span>{listing.address.city}, {listing.address.state}</span>
                    {listing.bedrooms && (
                      <span>{listing.bedrooms}bd/{listing.bathrooms}ba</span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                      {formatPrice(listing.price, listing.listingType)}
                    </span>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {listing.views}
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {listing.favorites.length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Listing Form */}
        <CreateListingForm
          isOpen={showCreateForm || !!editingListing}
          onClose={() => {
            setShowCreateForm(false);
            setEditingListing(null);
          }}
          onSuccess={handleFormSuccess}
          editListing={editingListing || undefined}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={!!deletingListing}
          onClose={() => {
            setDeletingListing(null);
            setDeleteError(null);
          }}
          onConfirm={confirmDelete}
          title="Delete Listing"
          message={`Are you sure you want to delete "${deletingListing?.title}"? This action cannot be undone.`}
        />

        {/* Delete Error Display */}
        {deleteError && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
            <div className="flex items-center justify-between">
              <span>{deleteError}</span>
              <button 
                onClick={() => setDeleteError(null)}
                className="ml-4 text-red-700 hover:text-red-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Page;
