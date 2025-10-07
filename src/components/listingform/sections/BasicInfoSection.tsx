import React from 'react';
import { CreateListingData } from '@/types/listing';
import { FormField } from '@/components/ui/FormField';

interface BasicInfoSectionProps {
  formData: CreateListingData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export function BasicInfoSection({ formData, onChange }: BasicInfoSectionProps) {
  return (
    <div className="space-y-4">
      <FormField label="Property Title" required>
        <input
          type="text"
          name="title"
          value={formData.title || ''}
          onChange={onChange}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="3BR/2BA Investment Property - Fix & Flip Opportunity"
        />
      </FormField>

      <FormField label="Property Description" required>
        <textarea
          name="description"
          value={formData.description || ''}
          onChange={onChange}
          required
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="Describe the property condition, potential, neighborhood highlights, and investment opportunity..."
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Property Type" required>
          <select
            name="propertyType"
            value={formData.propertyType}
            onChange={onChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="house">Single Family House</option>
            <option value="duplex">Duplex</option>
            <option value="triplex">Triplex</option>
            <option value="fourplex">Fourplex</option>
            <option value="townhouse">Townhouse</option>
            <option value="condo">Condo</option>
            <option value="apartment">Apartment</option>
            <option value="land">Land</option>
            <option value="commercial">Commercial</option>
          </select>
        </FormField>

        <FormField label="Listing Type" required>
          <select
            name="listingType"
            value={formData.listingType}
            onChange={onChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="wholesale">Wholesale Deal</option>
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <FormField label="Bedrooms">
          <input
            type="number"
            name="bedrooms"
            value={formData.bedrooms ?? ''}
            onChange={onChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </FormField>

        <FormField label="Bathrooms">
          <input
            type="number"
            name="bathrooms"
            value={formData.bathrooms ?? ''}
            onChange={onChange}
            min="0"
            step="0.5"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </FormField>

        <FormField label="Square Feet">
          <input
            type="number"
            name="squareFeet"
            value={formData.squareFeet ?? ''}
            onChange={onChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </FormField>

        <FormField label="Lot Size (sq ft)">
          <input
            type="number"
            name="lotSize"
            value={formData.lotSize ?? ''}
            onChange={onChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="7200"
          />
        </FormField>

        <FormField label="Year Built">
          <input
            type="number"
            name="yearBuilt"
            value={formData.yearBuilt ?? ''}
            onChange={onChange}
            max={new Date().getFullYear()}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Status" required>
          <select
            name="status"
            value={formData.status}
            onChange={onChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="active">Active (Publicly Listed)</option>
            <option value="inactive">Inactive (De-listed)</option>
            <option value="pending">Pending</option>
            <option value="sold">Sold</option>
            <option value="rented">Rented</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </FormField>
        
        <div className="flex items-center space-x-2 pt-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {formData.status === 'active' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Visible to buyers
              </span>
            )}
            {formData.status === 'inactive' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                Hidden from buyers
              </span>
            )}
            {formData.status === 'pending' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                Under contract
              </span>
            )}
            {(formData.status === 'sold' || formData.status === 'rented') && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Transaction complete
              </span>
            )}
            {formData.status === 'withdrawn' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                Removed from market
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
