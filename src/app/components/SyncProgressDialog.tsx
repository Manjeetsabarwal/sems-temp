import React from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface SyncProgressDialogProps {
  isOpen: boolean;
  progress: number;
  current: number;
  total: number;
  currentStudent: string;
  isComplete: boolean;
  success: boolean;
  syncedCount: number;
  errorCount: number;
  onClose?: () => void;
}

export function SyncProgressDialog({
  isOpen,
  progress,
  current,
  total,
  currentStudent,
  isComplete,
  success,
  syncedCount,
  errorCount,
  onClose,
}: SyncProgressDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          {!isComplete ? (
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
          ) : success ? (
            <CheckCircle className="h-6 w-6 text-green-600" />
          ) : (
            <AlertCircle className="h-6 w-6 text-yellow-600" />
          )}
          <h3 className="text-lg font-semibold">
            {!isComplete ? 'Syncing Students...' : success ? 'Sync Complete!' : 'Sync Completed with Errors'}
          </h3>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{current} of {total} students</span>
            <span className="font-semibold text-blue-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isComplete 
                  ? success 
                    ? 'bg-green-600' 
                    : 'bg-yellow-600'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Student */}
        {!isComplete && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-600 mb-1">Currently syncing:</p>
            <p className="font-medium text-gray-900">{currentStudent}</p>
          </div>
        )}

        {/* Results */}
        {isComplete && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Successfully synced:</span>
              <span className="font-semibold text-green-600">{syncedCount} students</span>
            </div>
            {errorCount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Errors:</span>
                <span className="font-semibold text-red-600">{errorCount} students</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {isComplete && (
          <button
            onClick={() => onClose ? onClose() : window.location.reload()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        )}

        {!isComplete && (
          <p className="text-xs text-gray-500 text-center">
            Please wait... This may take a moment
          </p>
        )}
      </div>
    </div>
  );
}