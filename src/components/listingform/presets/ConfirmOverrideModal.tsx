import { AlertTriangle, Download, X } from 'lucide-react';

interface ConfirmOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  presetName: string;
}

export default function ConfirmOverrideModal({
  isOpen,
  onClose,
  onConfirm,
  presetName
}: ConfirmOverrideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Override Current Changes?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This action cannot be undone
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300">
            You have unsaved changes in the form. Loading the preset &quot;{presetName}&quot; will replace all current field values.
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
            Consider saving your current changes as a draft or preset before proceeding.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4 inline mr-2" />
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm()}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Load Preset
          </button>
        </div>
      </div>
    </div>
  );
}
