import React from 'react';
import { CreateListingData } from '@/types/listing';
import { FormField } from '@/components/ui/FormField';

interface PricingAnalysisSectionProps {
  formData: CreateListingData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export function PricingAnalysisSection({ formData, onChange }: PricingAnalysisSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FormField label="Asking Price ($)" required>
          <input
            type="number"
            name="price"
            value={formData.price ?? ''}
            onChange={onChange}
            required
            min="0"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="150000"
          />
        </FormField>

        <FormField label="ARV ($)">
          <input
            type="number"
            name="arv"
            value={formData.arv ?? ''}
            onChange={onChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="250000"
          />
        </FormField>

        <FormField label="Repair Costs ($)">
          <input
            type="number"
            name="repairCosts"
            value={formData.repairCosts ?? ''}
            onChange={onChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="50000"
          />
        </FormField>

        <FormField label="Wholesale Fee ($)">
          <input
            type="number"
            name="wholesaleFee"
            value={formData.wholesaleFee ?? ''}
            onChange={onChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="15000"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Property Condition" required>
          <select
            name="propertyCondition"
            value={formData.propertyCondition ?? ''}
            onChange={onChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select condition...</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="needs-cosmetic">Needs Cosmetic Work</option>
            <option value="needs-full-rehab">Needs Full Rehab</option>
            <option value="tear-down">Tear Down</option>
          </select>
        </FormField>

        <FormField label="Occupancy Status">
          <select
            name="occupancyStatus"
            value={formData.occupancyStatus ?? ''}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select status...</option>
            <option value="vacant">Vacant</option>
            <option value="owner-occupied">Owner Occupied</option>
            <option value="tenant-occupied">Tenant Occupied</option>
            <option value="partially-occupied">Partially Occupied</option>
          </select>
        </FormField>
      </div>

      <FormField label="Monthly Rent (Current/Projected) ($)">
        <input
          type="number"
          name="monthlyRent"
          value={formData.monthlyRent ?? ''}
          onChange={onChange}
          min="0"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="1800"
        />
      </FormField>
    </div>
  );
}
