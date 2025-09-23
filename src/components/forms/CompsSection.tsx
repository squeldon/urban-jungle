import React from 'react';
import { CreateListingData } from '@/types/listing';
import { FormField } from '@/components/ui/FormField';
import { Plus, X } from 'lucide-react';

interface CompsSectionProps {
  formData: CreateListingData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onAddComp: () => void;
  onRemoveComp: (index: number) => void;
  onUpdateComp: (index: number, field: string, value: string | number | undefined) => void;
}

export function CompsSection({ 
  formData, 
  onChange, 
  onAddComp, 
  onRemoveComp, 
  onUpdateComp 
}: CompsSectionProps) {
  const comps = formData.comps || [];

  const handleCompChange = (index: number, field: string, value: string) => {
    const numericFields = ['salePrice', 'squareFeet', 'bedrooms', 'bathrooms', 'daysonMarket', 'distanceFromSubject'];
    const requiredNumericFields = ['salePrice']; // Only salePrice is required, others can be undefined
    
    let finalValue: string | number | undefined;
    if (numericFields.includes(field)) {
      if (value === '') {
        finalValue = requiredNumericFields.includes(field) ? 0 : undefined;
      } else {
        finalValue = Number(value);
      }
    } else {
      finalValue = value;
    }
    
    onUpdateComp(index, field, finalValue);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Comparable Sales (Optional)</h3>
        <button
          type="button"
          onClick={onAddComp}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Comp
        </button>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Add comparable sales to support your pricing analysis. Include recent sales of similar properties in the area.
      </p>

      {comps.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">No comparable sales added yet</p>
          <button
            type="button"
            onClick={onAddComp}
            className="mt-2 inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add your first comp
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {comps.map((comp, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  Comp #{index + 1}
                </h4>
                <button
                  type="button"
                  onClick={() => onRemoveComp(index)}
                  className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField label="Address" required>
                  <input
                    type="text"
                    value={comp.address || ''}
                    onChange={(e) => handleCompChange(index, 'address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="123 Comparable St, Baltimore, MD"
                  />
                </FormField>

                <FormField label="Sale Price ($)" required>
                  <input
                    type="number"
                    value={comp.salePrice || ''}
                    onChange={(e) => handleCompChange(index, 'salePrice', e.target.value)}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="250000"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <FormField label="Sale Date" required>
                  <input
                    type="date"
                    value={comp.saleDate || ''}
                    onChange={(e) => handleCompChange(index, 'saleDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </FormField>

                <FormField label="Square Feet">
                  <input
                    type="number"
                    value={comp.squareFeet || ''}
                    onChange={(e) => handleCompChange(index, 'squareFeet', e.target.value)}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="1500"
                  />
                </FormField>

                <FormField label="Bedrooms">
                  <input
                    type="number"
                    value={comp.bedrooms || ''}
                    onChange={(e) => handleCompChange(index, 'bedrooms', e.target.value)}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="3"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <FormField label="Bathrooms">
                  <input
                    type="number"
                    value={comp.bathrooms || ''}
                    onChange={(e) => handleCompChange(index, 'bathrooms', e.target.value)}
                    min="0"
                    step="0.5"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="2"
                  />
                </FormField>

                <FormField label="Days on Market">
                  <input
                    type="number"
                    value={comp.daysonMarket || ''}
                    onChange={(e) => handleCompChange(index, 'daysonMarket', e.target.value)}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="30"
                  />
                </FormField>

                <FormField label="Distance (miles)">
                  <input
                    type="number"
                    value={comp.distanceFromSubject || ''}
                    onChange={(e) => handleCompChange(index, 'distanceFromSubject', e.target.value)}
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="0.5"
                  />
                </FormField>
              </div>

              <FormField label="Notes">
                <textarea
                  value={comp.notes || ''}
                  onChange={(e) => handleCompChange(index, 'notes', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </FormField>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
