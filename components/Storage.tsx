import React, { useState, useEffect, useCallback, useRef } from 'react';
import { storageManager, SearchFilters, ExportOptions } from '../utils/storageManager';
import { HistoryEntry, AppView } from '../types';

interface StorageProps {
  onNavigate: (view: AppView) => void;
}

const Storage: React.FC<StorageProps> = ({ onNavigate }) => {
  const [scans, setScans] = useState<HistoryEntry[]>([]);
  const [filteredScans, setFilteredScans] = useState<HistoryEntry[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [storageStats, setStorageStats] = useState<any>(null);
  const [selectedScans, setSelectedScans] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'search' | 'manage' | 'backup'>('overview');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(() => {
    const allScans = storageManager.getAllScans();
    setScans(allScans);
    setFilteredScans(allScans);
    setStorageStats(storageManager.getStorageStats());
  }, []);

  // Apply search filters
  useEffect(() => {
    if (Object.keys(searchFilters).length === 0) {
      setFilteredScans(scans);
    } else {
      const filtered = storageManager.searchScans(searchFilters);
      setFilteredScans(filtered);
    }
  }, [searchFilters, scans]);

  const handleSearch = (filters: Partial<SearchFilters>) => {
    setSearchFilters(prev => ({ ...prev, ...filters }));
  };

  const clearSearch = () => {
    setSearchFilters({});
  };

  const handleExport = async (format: 'json' | 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      const options: ExportOptions = {
        format,
        includeRawData: format === 'json'
      };
      
      const blob = await storageManager.exportScans(options);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `id-scan-export-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const result = await storageManager.importScans(file);
      if (result.success) {
        alert(`Import completed: ${result.imported} scans imported, ${result.skipped} skipped.`);
        loadData();
      } else {
        alert('Import failed. Please check the file format.');
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please try again.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedScans.size === 0) return;
    
    if (confirm(`Delete ${selectedScans.size} selected scans? This action cannot be undone.`)) {
      for (const id of selectedScans) {
        storageManager.deleteScan(id);
      }
      setSelectedScans(new Set());
      loadData();
    }
  };

  const handleBackup = async () => {
    try {
      const success = await storageManager.backupToIndexedDB();
      if (success) {
        alert('Backup completed successfully!');
      } else {
        alert('Backup failed. Please try again.');
      }
    } catch (error) {
      console.error('Backup failed:', error);
      alert('Backup failed. Please try again.');
    }
  };

  const handleRestore = async () => {
    if (confirm('Restore from backup? This will replace your current data.')) {
      try {
        const success = await storageManager.restoreFromIndexedDB();
        if (success) {
          alert('Restore completed successfully!');
          loadData();
        } else {
          alert('No backup found or restore failed.');
        }
      } catch (error) {
        console.error('Restore failed:', error);
        alert('Restore failed. Please try again.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFieldValue = (scan: HistoryEntry, fieldName: string) => {
    const field = scan.parsedData.fields.find(f => f.field === fieldName);
    return field?.value || 'N/A';
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-sky-400 mb-2">Storage Management</h1>
          <p className="text-slate-300">Manage your scan data, search, export, and backup</p>
        </div>
        <button
          className="mt-4 sm:mt-0 bg-slate-700 border border-cyan-500 text-cyan-400 font-medium py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors duration-200 flex items-center gap-2"
          onClick={() => onNavigate(AppView.Main)}
        >
          <i className="fas fa-arrow-left"></i> Back to Scanner
        </button>
      </div>

      {/* Stats Overview */}
      {storageStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Scans</p>
                <p className="text-2xl font-bold text-cyan-400">{storageStats.totalScans}</p>
              </div>
              <i className="fas fa-database text-cyan-400 text-2xl"></i>
            </div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Storage Used</p>
                <p className="text-2xl font-bold text-yellow-400">{storageStats.storageUsed}</p>
              </div>
              <i className="fas fa-hard-drive text-yellow-400 text-2xl"></i>
            </div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Last Scan</p>
                <p className="text-sm font-medium text-green-400">
                  {storageStats.lastScan ? formatDate(storageStats.lastScan.toISOString()) : 'None'}
                </p>
              </div>
              <i className="fas fa-clock text-green-400 text-2xl"></i>
            </div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Filtered Results</p>
                <p className="text-2xl font-bold text-purple-400">{filteredScans.length}</p>
              </div>
              <i className="fas fa-filter text-purple-400 text-2xl"></i>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-700">
        {[
          { key: 'overview', label: 'Overview', icon: 'fas fa-chart-bar' },
          { key: 'search', label: 'Search & Filter', icon: 'fas fa-search' },
          { key: 'manage', label: 'Manage Data', icon: 'fas fa-cogs' },
          { key: 'backup', label: 'Backup & Restore', icon: 'fas fa-cloud' }
        ].map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 rounded-t-lg transition-colors duration-200 flex items-center gap-2 ${
              activeTab === tab.key
                ? 'bg-cyan-600 text-white border-b-2 border-cyan-400'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            onClick={() => setActiveTab(tab.key as any)}
          >
            <i className={tab.icon}></i>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-200 mb-4">Recent Scans</h3>
            {filteredScans.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-inbox text-4xl text-slate-400 mb-4"></i>
                <p className="text-slate-400">No scans found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredScans.slice(0, 10).map((scan) => (
                  <div key={scan.id} className="bg-slate-700 border border-slate-600 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-slate-200">
                            {getFieldValue(scan, 'Full Name') || 
                             `${getFieldValue(scan, 'First Name')} ${getFieldValue(scan, 'Last Name')}`.trim()}
                          </h4>
                          <span className="text-xs bg-cyan-600 text-white px-2 py-1 rounded">
                            {getFieldValue(scan, 'State')}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-slate-400">
                          <span>License: {getFieldValue(scan, 'License Number')}</span>
                          <span>DOB: {getFieldValue(scan, 'Date of Birth')}</span>
                          <span>Scanned: {formatDate(scan.timestamp)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="text-cyan-400 hover:text-cyan-300 p-1">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="text-red-400 hover:text-red-300 p-1"
                          onClick={() => {
                            if (confirm('Delete this scan?')) {
                              storageManager.deleteScan(scan.id!);
                              loadData();
                            }
                          }}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-200 mb-4">Search & Filter</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Search by name..."
                className="bg-slate-700 border border-slate-600 text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-400"
                onChange={(e) => handleSearch({ name: e.target.value || undefined })}
              />
              <input
                type="text"
                placeholder="License number..."
                className="bg-slate-700 border border-slate-600 text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-400"
                onChange={(e) => handleSearch({ licenseNumber: e.target.value || undefined })}
              />
              <input
                type="text"
                placeholder="State..."
                className="bg-slate-700 border border-slate-600 text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-400"
                onChange={(e) => handleSearch({ state: e.target.value || undefined })}
              />
              <button
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
                onClick={clearSearch}
              >
                Clear Filters
              </button>
            </div>

            <div className="border-t border-slate-600 pt-4">
              <p className="text-slate-300 mb-4">Found {filteredScans.length} results</p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredScans.map((scan) => (
                  <div key={scan.id} className="bg-slate-700 border border-slate-600 rounded p-3 flex justify-between items-center">
                    <div>
                      <span className="font-medium text-slate-200">
                        {getFieldValue(scan, 'Full Name') || 
                         `${getFieldValue(scan, 'First Name')} ${getFieldValue(scan, 'Last Name')}`.trim()}
                      </span>
                      <span className="text-slate-400 ml-2">({getFieldValue(scan, 'State')})</span>
                    </div>
                    <span className="text-xs text-slate-400">{formatDate(scan.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-200 mb-4">Data Management</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                className="btn-success bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2"
                onClick={() => handleExport('json')}
                disabled={isExporting}
              >
                <i className="fas fa-download"></i>
                Export JSON
              </button>
              <button
                className="btn-blue bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
                onClick={() => handleExport('csv')}
                disabled={isExporting}
              >
                <i className="fas fa-file-csv"></i>
                Export CSV
              </button>
              <button
                className="btn-orange bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors duration-200 flex items-center justify-center gap-2"
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
              >
                <i className="fas fa-file-pdf"></i>
                Export PDF
              </button>
            </div>

            <div className="border-t border-slate-600 pt-6">
              <h4 className="text-lg font-medium text-slate-200 mb-4">Import Data</h4>
              <div className="flex items-center gap-4">
                <button
                  className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors duration-200 flex items-center gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                >
                  <i className="fas fa-upload"></i>
                  {isImporting ? 'Importing...' : 'Import JSON'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
                <span className="text-slate-400 text-sm">Import scans from JSON file</span>
              </div>
            </div>

            <div className="border-t border-slate-600 pt-6">
              <h4 className="text-lg font-medium text-slate-200 mb-4">Danger Zone</h4>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center gap-2"
                onClick={() => {
                  if (confirm('Delete ALL scans? This action cannot be undone.')) {
                    storageManager.clearAllScans();
                    loadData();
                  }
                }}
              >
                <i className="fas fa-trash"></i>
                Clear All Data
              </button>
            </div>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-200 mb-4">Backup & Restore</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-slate-200">Local Backup</h4>
                <p className="text-slate-400 text-sm">
                  Create a local backup using IndexedDB for offline storage
                </p>
                <button
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
                  onClick={handleBackup}
                >
                  <i className="fas fa-save"></i>
                  Create Backup
                </button>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-slate-200">Restore Data</h4>
                <p className="text-slate-400 text-sm">
                  Restore from local backup (replaces current data)
                </p>
                <button
                  className="w-full bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors duration-200 flex items-center justify-center gap-2"
                  onClick={handleRestore}
                >
                  <i className="fas fa-undo"></i>
                  Restore Backup
                </button>
              </div>
            </div>

            <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
              <h4 className="text-lg font-medium text-slate-200 mb-2">Backup Status</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <p>• Local storage: Active</p>
                <p>• IndexedDB backup: Available</p>
                <p>• Auto-backup: Enabled after each scan</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Storage; 