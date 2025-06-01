import React, { useState, useEffect, useCallback } from 'react';
import { storageManager } from '../utils/storageManager';
import { HistoryEntry, ParsedField, AppView } from '../types';

interface HistoryProps {
  onNavigate: (view: AppView) => void;
}

const History: React.FC<HistoryProps> = ({ onNavigate }) => {
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = useCallback(() => {
    setIsLoading(true);
    try {
      const entries = storageManager.getAllScans();
      setHistoryEntries(entries);
    } catch (error) {
      console.error("Failed to load scan history:", error);
      setHistoryEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all scan history? This action cannot be undone.')) {
      const success = storageManager.clearAllScans();
      if (success) {
        setHistoryEntries([]);
      } else {
        alert('Failed to clear history. Please try again.');
      }
    }
  };

  const deleteEntry = (id: string) => {
    if (window.confirm('Delete this scan entry?')) {
      const success = storageManager.deleteScan(id);
      if (success) {
        loadHistory(); // Refresh the list
      } else {
        alert('Failed to delete entry. Please try again.');
      }
    }
  };

  const exportHistory = async () => {
    try {
      const blob = await storageManager.exportScans({ format: 'json', includeRawData: true });
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scan-history-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const findFieldValue = (fields: ParsedField[], fieldName: string): string => {
    const entry = fields.find((f) => f.field === fieldName || f.field === `Raw Code: ${fieldName}`);
    return entry ? entry.value : 'N/A';
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return { dateStr, timeStr };
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 flex flex-col items-center w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-slate-600 border-t-cyan-400 rounded-full animate-spin"></div>
          <span className="ml-3 text-slate-300">Loading scan history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 flex flex-col items-center w-full max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full mb-6">
        <div>
          <h1 className="text-3xl font-semibold mb-2 text-center sm:text-left text-sky-400">Scan History</h1>
          <p className="text-slate-300 text-center sm:text-left">
            {historyEntries.length} {historyEntries.length === 1 ? 'scan' : 'scans'} stored
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-8 justify-center w-full">
        <button
          className="btn-primary bg-[#06b6d4] text-[#0f172a] font-medium py-3 px-5 rounded-lg hover:bg-[#0891b2] transition-colors duration-200 flex items-center gap-2 touch-manipulation"
          onClick={() => onNavigate(AppView.Storage)}
        >
          <i className="fas fa-database"></i> 
          <span className="hidden sm:inline">Manage Storage</span>
          <span className="sm:hidden">Storage</span>
        </button>
        
        {historyEntries.length > 0 && (
          <>
            <button
              className="btn-success bg-green-600 text-white font-medium py-3 px-5 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2 touch-manipulation"
              onClick={exportHistory}
            >
              <i className="fas fa-download"></i> 
              <span className="hidden sm:inline">Export JSON</span>
              <span className="sm:hidden">Export</span>
            </button>
            
            <button
              className="btn-danger bg-red-600 text-white font-medium py-3 px-5 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center gap-2 touch-manipulation"
              onClick={clearHistory}
            >
              <i className="fas fa-trash"></i> 
              <span className="hidden sm:inline">Clear All</span>
              <span className="sm:hidden">Clear</span>
            </button>
          </>
        )}
        
        <button
          className="btn-secondary bg-slate-700 border border-cyan-500 text-cyan-400 font-medium py-3 px-5 rounded-lg hover:bg-slate-600 transition-colors duration-200 flex items-center gap-2 touch-manipulation"
          onClick={() => onNavigate(AppView.Main)}
        >
          <i className="fas fa-arrow-left"></i> 
          <span className="hidden sm:inline">Back to Scanner</span>
          <span className="sm:hidden">Back</span>
        </button>
      </div>

      {historyEntries.length === 0 ? (
        <div className="text-center text-slate-400 py-12">
          <i className="fas fa-history text-6xl mb-4 block text-slate-500"></i>
          <h3 className="text-xl font-medium mb-2">No scan history yet</h3>
          <p className="text-slate-500 mb-6">Start scanning driver's licenses to build your history</p>
          <button
            className="bg-[#06b6d4] text-[#0f172a] font-medium py-3 px-6 rounded-lg hover:bg-[#0891b2] transition-colors duration-200 flex items-center gap-2 mx-auto touch-manipulation"
            onClick={() => onNavigate(AppView.Main)}
          >
            <i className="fas fa-plus"></i>
            Start Scanning
          </button>
        </div>
      ) : (
        <div className="w-full space-y-4">
          {historyEntries.map((entry) => {
            const { dateStr, timeStr } = formatDate(entry.timestamp);
            const name = findFieldValue(entry.parsedData.fields, 'Full Name') 
                         || `${findFieldValue(entry.parsedData.fields, 'First Name')} ${findFieldValue(entry.parsedData.fields, 'Last Name')}`.trim();
            const dob = findFieldValue(entry.parsedData.fields, 'Date of Birth');
            const licenseNo = findFieldValue(entry.parsedData.fields, 'License Number');
            const state = findFieldValue(entry.parsedData.fields, 'State');

            return (
              <div key={entry.id} className="bg-[#1e293b] border border-slate-700 rounded-lg p-4 sm:p-6 shadow-lg text-slate-200 hover:shadow-cyan-500/20 transition-all duration-300 hover:border-cyan-500/30">
                {/* Header with actions */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-200">
                        {name !== "N/A N/A" ? name : "Unknown Person"}
                      </h3>
                      {state !== 'N/A' && (
                        <span className="text-xs bg-cyan-600 text-white px-2 py-1 rounded-full">
                          {state}
                        </span>
                      )}
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="hidden sm:flex gap-1">
                          {entry.tags.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="text-xs bg-slate-600 text-slate-300 px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-slate-400">
                      Scanned on: {dateStr} at {timeStr}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-900/20 transition-colors duration-200 touch-manipulation"
                      onClick={() => deleteEntry(entry.id!)}
                      title="Delete this scan"
                    >
                      <i className="fas fa-trash text-sm"></i>
                    </button>
                  </div>
                </div>

                {/* Main data grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Full Name</span>
                    <div className="text-slate-200 font-medium">
                      {name !== "N/A N/A" ? name : "N/A"}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Date of Birth</span>
                    <div className="text-slate-200">{dob}</div>
                  </div>
                  
                  <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">License Number</span>
                    <div className="text-slate-200 font-mono text-sm">{licenseNo}</div>
                  </div>
                </div>

                {/* Additional details (collapsible) */}
                <details className="text-sm">
                  <summary className="cursor-pointer text-sky-400 hover:text-sky-300 font-medium py-2 flex items-center gap-2 transition-colors duration-200">
                    <i className="fas fa-chevron-right transition-transform duration-200"></i>
                    View All Details ({entry.parsedData.fields.length} fields)
                  </summary>
                  <div className="mt-3 space-y-2 max-h-64 overflow-y-auto bg-slate-800/50 rounded-lg p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {entry.parsedData.fields.map((pf, idx) => (
                        <div key={idx} className="flex justify-between items-start gap-3">
                          <span className="font-medium text-slate-400 text-xs flex-shrink-0">
                            {pf.field}:
                          </span>
                          <span className="text-slate-300 text-right text-xs break-words">
                            {pf.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>

                {/* Notes section */}
                {entry.notes && (
                  <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border-l-4 border-cyan-500">
                    <div className="text-xs font-medium text-slate-400 mb-1">Notes:</div>
                    <div className="text-sm text-slate-300">{entry.notes}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;
