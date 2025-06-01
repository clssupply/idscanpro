import React from 'react';
import { ParsedField } from '../types';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsedFields: ParsedField[];
  rawData: string | null;
  onSave: () => void;
  saveButtonText?: string;
  saveButtonIcon?: string;
  saveStatus?: 'idle' | 'saving' | 'success' | 'error';
}

const ScanModal: React.FC<ScanModalProps> = ({ 
  isOpen, 
  onClose, 
  parsedFields, 
  rawData, 
  onSave,
  saveButtonText = 'Save to Storage',
  saveButtonIcon = 'fas fa-save',
  saveStatus = 'idle'
}) => {
  if (!isOpen) return null;

  const getStatusColor = () => {
    switch (saveStatus) {
      case 'saving': return 'bg-yellow-600 hover:bg-yellow-700';
      case 'success': return 'bg-green-600 hover:bg-green-700';
      case 'error': return 'bg-red-600 hover:bg-red-700';
      default: return 'bg-[#06b6d4] hover:bg-[#0891b2]';
    }
  };

  const getStatusTextColor = () => {
    switch (saveStatus) {
      case 'success': return 'text-white';
      case 'error': return 'text-white';
      default: return 'text-[#0f172a]';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50 modal-backdrop">
      <div className="bg-[#1e293b] border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <i className="fas fa-id-card text-white text-lg"></i>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Scan Results</h2>
              <p className="text-cyan-100 text-sm">Driver's License Data Extracted</p>
            </div>
          </div>
          <button
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors duration-200 touch-manipulation"
            onClick={onClose}
            aria-label="Close modal"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {parsedFields.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Field</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedFields.map((field, index) => (
                    <tr key={index} className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors duration-200">
                      <td className="py-3 px-4 text-slate-300 font-medium text-sm">
                        {field.field}
                      </td>
                      <td className="py-3 px-4 text-slate-200 break-words">
                        {field.value || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <i className="fas fa-exclamation-triangle text-4xl text-yellow-400 mb-4"></i>
              <p className="text-slate-300 text-lg">No data could be extracted from the scan.</p>
              <p className="text-slate-400 text-sm mt-2">Please try scanning again with better lighting or positioning.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-800 border-t border-slate-700 flex flex-col sm:flex-row gap-3 sm:justify-between">
          {/* Status indicator */}
          {saveStatus !== 'idle' && (
            <div className="flex items-center gap-2 text-sm">
              {saveStatus === 'saving' && (
                <>
                  <i className="fas fa-spinner fa-spin text-yellow-400"></i>
                  <span className="text-yellow-400">Saving to storage...</span>
                </>
              )}
              {saveStatus === 'success' && (
                <>
                  <i className="fas fa-check text-green-400"></i>
                  <span className="text-green-400">Successfully saved!</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <i className="fas fa-exclamation-triangle text-red-400"></i>
                  <span className="text-red-400">Save failed - please try again</span>
                </>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:ml-auto">
            <button
              className="bg-slate-700 border-2 border-slate-600 text-slate-300 font-medium py-3 px-6 rounded-lg hover:bg-slate-600 active:bg-slate-800 transition-all duration-200 flex items-center justify-center gap-2 touch-manipulation"
              onClick={onClose}
            >
              <i className="fas fa-times"></i>
              <span>Close</span>
            </button>
            
            {parsedFields.length > 0 && (
              <button
                className={`${getStatusColor()} ${getStatusTextColor()} font-semibold py-3 px-6 rounded-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]`}
                onClick={onSave}
                disabled={saveStatus === 'saving'}
              >
                <i className={saveButtonIcon}></i>
                <span>{saveButtonText}</span>
              </button>
            )}
          </div>
        </div>

        {/* Raw Data Section (collapsible) */}
        {rawData && (
          <details className="mx-6 mb-6">
            <summary className="cursor-pointer text-slate-400 hover:text-slate-300 text-sm font-medium py-2 transition-colors duration-200">
              <i className="fas fa-code mr-2"></i>
              View Raw Barcode Data
            </summary>
            <div className="mt-2 p-4 bg-slate-900 border border-slate-600 rounded-lg">
              <pre className="text-xs text-slate-300 whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                {rawData}
              </pre>
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

export default ScanModal;
