import React from 'react';
import { CreateListingData } from '@/types/listing';
import { FormField } from '@/components/ui/FormField';

interface AddressSectionProps {
  formData: CreateListingData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export function AddressSection({ formData, onChange }: AddressSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Address</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FormField label="House Number">
          <input
            type="text"
            name="address.houseNumber"
            value={formData.address.houseNumber || ''}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="12XX"
          />
        </FormField>

        <div className="md:col-span-3">
          <FormField label="Street Name" required>
            <input
              type="text"
              name="address.streetName"
              value={formData.address.streetName || ''}
              onChange={onChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Main Street"
            />
          </FormField>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="City" required>
          <input
            type="text"
            name="address.city"
            value={formData.address.city || ''}
            onChange={onChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Baltimore"
          />
        </FormField>

        <FormField label="State" required>
          <input
            type="text"
            name="address.state"
            value={formData.address.state || ''}
            onChange={onChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="MD"
          />
        </FormField>

        <FormField label="ZIP Code" required>
          <input
            type="text"
            name="address.zipCode"
            value={formData.address.zipCode || ''}
            onChange={onChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="21218"
          />
        </FormField>
      </div>
    </div>
  );
}
