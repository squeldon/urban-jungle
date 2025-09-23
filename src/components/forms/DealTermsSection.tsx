import React from 'react';
import { CreateListingData } from '@/types/listing';
import { FormField } from '@/components/ui/FormField';
import { CheckboxGroup } from '@/components/ui/CheckboxGroup';

interface DealTermsSectionProps {
  formData: CreateListingData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onToggleFinancingOption: (option: 'cash-only' | 'seller-financing' | 'hard-money' | 'conventional' | 'private-money') => void;
}

export function DealTermsSection({ formData, onChange, onToggleFinancingOption }: DealTermsSectionProps) {
  const financingOptions = [
    { value: 'cash-only', label: 'Cash Only' },
    { value: 'seller-financing', label: 'Seller Financing' },
    { value: 'hard-money', label: 'Hard Money' },
    { value: 'conventional', label: 'Conventional' },
    { value: 'private-money', label: 'Private Money' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Deal Terms</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Earnest Money Deposit ($)">
          <input
            type="number"
            name="dealTerms.earnestMoneyDeposit"
            value={formData.dealTerms?.earnestMoneyDeposit ?? ''}
            onChange={onChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="5000"
          />
        </FormField>

        <div className="flex flex-col justify-end">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="dealTerms.proofOfFundsRequired"
              checked={formData.dealTerms?.proofOfFundsRequired ?? false}
              onChange={onChange}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Proof of Funds Required</span>
          </label>
        </div>
      </div>

      <CheckboxGroup
        label="Financing Options (select all that apply)"
        options={financingOptions}
        selectedValues={formData.dealTerms?.financingOptions || []}
        onChange={(value) => onToggleFinancingOption(value as any)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Showing Instructions">
          <textarea
            name="dealTerms.showingInstructions"
            value={formData.dealTerms?.showingInstructions ?? ''}
            onChange={onChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="By appointment only - 48 hour notice required"
          />
        </FormField>

        <FormField label="Access Restrictions">
          <textarea
            name="dealTerms.accessRestrictions"
            value={formData.dealTerms?.accessRestrictions ?? ''}
            onChange={onChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Occupied property, must respect tenant privacy"
          />
        </FormField>
      </div>

      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="dealTerms.appointmentRequired"
            checked={formData.dealTerms?.appointmentRequired ?? false}
            onChange={onChange}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Appointment Required for Viewing</span>
        </label>
      </div>
    </div>
  );
}
