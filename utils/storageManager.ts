import { HistoryEntry, ParsedField, ParsedDLData } from '../types';

export interface StorageStats {
  totalScans: number;
  storageUsed: string;
  lastScan?: Date;
  oldestScan?: Date;
}

export interface SearchFilters {
  name?: string;
  licenseNumber?: string;
  state?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf';
  includeRawData?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

class StorageManager {
  private readonly STORAGE_KEY = 'idScanPro_scanHistory';
  private readonly SETTINGS_KEY = 'idScanPro_settings';
  private readonly MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB limit

  /**
   * Save a new scan to storage
   */
  async saveScan(parsedData: ParsedDLData, rawData: string): Promise<boolean> {
    try {
      const entry: HistoryEntry = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        parsedData,
        rawData,
        tags: this.extractTags(parsedData),
        notes: ''
      };

      const existingEntries = this.getAllScans();
      existingEntries.unshift(entry);

      // Check storage limits
      if (this.getStorageSize() > this.MAX_STORAGE_SIZE) {
        await this.cleanupOldEntries(existingEntries);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingEntries));
      
      // Update statistics
      this.updateStats();
      
      return true;
    } catch (error) {
      console.error('Failed to save scan:', error);
      return false;
    }
  }

  /**
   * Get all scans from storage
   */
  getAllScans(): HistoryEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const entries = JSON.parse(stored) as HistoryEntry[];
      
      // Migrate old entries that don't have IDs
      return entries.map(entry => ({
        ...entry,
        id: entry.id || this.generateId(),
        tags: entry.tags || this.extractTags(entry.parsedData),
        notes: entry.notes || ''
      }));
    } catch (error) {
      console.error('Failed to load scans:', error);
      return [];
    }
  }

  /**
   * Search scans with filters
   */
  searchScans(filters: SearchFilters): HistoryEntry[] {
    const allScans = this.getAllScans();
    
    return allScans.filter(entry => {
      const fields = entry.parsedData.fields;
      
      // Name filter
      if (filters.name) {
        const fullName = this.getFieldValue(fields, 'Full Name') || 
                         `${this.getFieldValue(fields, 'First Name')} ${this.getFieldValue(fields, 'Last Name')}`.trim();
        if (!fullName.toLowerCase().includes(filters.name.toLowerCase())) {
          return false;
        }
      }
      
      // License number filter
      if (filters.licenseNumber) {
        const licenseNo = this.getFieldValue(fields, 'License Number');
        if (!licenseNo?.toLowerCase().includes(filters.licenseNumber.toLowerCase())) {
          return false;
        }
      }
      
      // State filter
      if (filters.state) {
        const state = this.getFieldValue(fields, 'State');
        if (!state?.toLowerCase().includes(filters.state.toLowerCase())) {
          return false;
        }
      }
      
      // Date range filter
      if (filters.dateRange) {
        const entryDate = new Date(entry.timestamp);
        if (entryDate < filters.dateRange.start || entryDate > filters.dateRange.end) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Update scan notes and tags
   */
  updateScan(id: string, updates: Partial<Pick<HistoryEntry, 'notes' | 'tags'>>): boolean {
    try {
      const scans = this.getAllScans();
      const index = scans.findIndex(scan => scan.id === id);
      
      if (index === -1) return false;
      
      scans[index] = { ...scans[index], ...updates };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(scans));
      
      return true;
    } catch (error) {
      console.error('Failed to update scan:', error);
      return false;
    }
  }

  /**
   * Delete specific scan
   */
  deleteScan(id: string): boolean {
    try {
      const scans = this.getAllScans();
      const filteredScans = scans.filter(scan => scan.id !== id);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredScans));
      this.updateStats();
      
      return true;
    } catch (error) {
      console.error('Failed to delete scan:', error);
      return false;
    }
  }

  /**
   * Clear all scans
   */
  clearAllScans(): boolean {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this.updateStats();
      return true;
    } catch (error) {
      console.error('Failed to clear scans:', error);
      return false;
    }
  }

  /**
   * Export scans in various formats
   */
  async exportScans(options: ExportOptions): Promise<Blob | null> {
    try {
      let scans = this.getAllScans();
      
      // Apply date range filter if specified
      if (options.dateRange) {
        scans = scans.filter(scan => {
          const scanDate = new Date(scan.timestamp);
          return scanDate >= options.dateRange!.start && scanDate <= options.dateRange!.end;
        });
      }
      
      switch (options.format) {
        case 'json':
          return this.exportAsJSON(scans, options.includeRawData);
        case 'csv':
          return this.exportAsCSV(scans);
        case 'pdf':
          return await this.exportAsPDF(scans);
        default:
          throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Failed to export scans:', error);
      return null;
    }
  }

  /**
   * Import scans from file
   */
  async importScans(file: File): Promise<{ success: boolean; imported: number; skipped: number }> {
    try {
      const text = await file.text();
      const importedData = JSON.parse(text);
      
      if (!Array.isArray(importedData)) {
        throw new Error('Invalid import format');
      }
      
      const existingScans = this.getAllScans();
      const existingIds = new Set(existingScans.map(scan => scan.id));
      
      let imported = 0;
      let skipped = 0;
      
      for (const entry of importedData) {
        // Validate entry structure
        if (this.isValidHistoryEntry(entry)) {
          if (!existingIds.has(entry.id)) {
            existingScans.push({
              ...entry,
              id: entry.id || this.generateId(),
              tags: entry.tags || this.extractTags(entry.parsedData),
              notes: entry.notes || ''
            });
            imported++;
          } else {
            skipped++;
          }
        } else {
          skipped++;
        }
      }
      
      if (imported > 0) {
        // Sort by timestamp (newest first)
        existingScans.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingScans));
        this.updateStats();
      }
      
      return { success: true, imported, skipped };
    } catch (error) {
      console.error('Failed to import scans:', error);
      return { success: false, imported: 0, skipped: 0 };
    }
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): StorageStats {
    const scans = this.getAllScans();
    const timestamps = scans.map(scan => new Date(scan.timestamp));
    
    return {
      totalScans: scans.length,
      storageUsed: this.formatStorageSize(this.getStorageSize()),
      lastScan: timestamps.length > 0 ? new Date(Math.max(...timestamps.map(d => d.getTime()))) : undefined,
      oldestScan: timestamps.length > 0 ? new Date(Math.min(...timestamps.map(d => d.getTime()))) : undefined
    };
  }

  /**
   * Backup data to cloud storage (IndexedDB for offline-first approach)
   */
  async backupToIndexedDB(): Promise<boolean> {
    try {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('IDScanProDB', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['scans'], 'readwrite');
          const store = transaction.objectStore('scans');
          
          const scans = this.getAllScans();
          store.clear();
          store.add({ id: 'backup', data: scans, timestamp: new Date().toISOString() });
          
          transaction.oncomplete = () => resolve(true);
          transaction.onerror = () => reject(transaction.error);
        };
        
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('scans')) {
            db.createObjectStore('scans', { keyPath: 'id' });
          }
        };
      });
    } catch (error) {
      console.error('Failed to backup to IndexedDB:', error);
      return false;
    }
  }

  /**
   * Restore data from IndexedDB
   */
  async restoreFromIndexedDB(): Promise<boolean> {
    try {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('IDScanProDB', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['scans'], 'readonly');
          const store = transaction.objectStore('scans');
          const getRequest = store.get('backup');
          
          getRequest.onsuccess = () => {
            if (getRequest.result?.data) {
              localStorage.setItem(this.STORAGE_KEY, JSON.stringify(getRequest.result.data));
              this.updateStats();
              resolve(true);
            } else {
              resolve(false);
            }
          };
          
          getRequest.onerror = () => reject(getRequest.error);
        };
      });
    } catch (error) {
      console.error('Failed to restore from IndexedDB:', error);
      return false;
    }
  }

  // Private helper methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  private extractTags(parsedData: ParsedDLData): string[] {
    const tags: string[] = [];
    const fields = parsedData.fields;
    
    // Extract state
    const state = this.getFieldValue(fields, 'State');
    if (state) tags.push(`State: ${state}`);
    
    // Extract document type
    tags.push('Driver License');
    
    // Extract gender
    const gender = this.getFieldValue(fields, 'Gender');
    if (gender) tags.push(`Gender: ${gender}`);
    
    return tags;
  }

  private getFieldValue(fields: ParsedField[], fieldName: string): string | null {
    const field = fields.find(f => f.field === fieldName || f.field === `Raw Code: ${fieldName}`);
    return field?.value || null;
  }

  private getStorageSize(): number {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  }

  private formatStorageSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  private async cleanupOldEntries(entries: HistoryEntry[]): Promise<void> {
    // Keep only the most recent 1000 entries
    const maxEntries = 1000;
    if (entries.length > maxEntries) {
      entries.splice(maxEntries);
    }
  }

  private updateStats(): void {
    const stats = this.getStorageStats();
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify({
      ...this.getSettings(),
      lastUpdated: new Date().toISOString(),
      stats
    }));
  }

  private getSettings(): any {
    try {
      const settings = localStorage.getItem(this.SETTINGS_KEY);
      return settings ? JSON.parse(settings) : {};
    } catch {
      return {};
    }
  }

  private exportAsJSON(scans: HistoryEntry[], includeRawData = true): Blob {
    const exportData = scans.map(scan => ({
      ...scan,
      rawData: includeRawData ? scan.rawData : undefined
    }));
    
    return new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
  }

  private exportAsCSV(scans: HistoryEntry[]): Blob {
    const headers = [
      'ID', 'Timestamp', 'Full Name', 'First Name', 'Last Name', 'Date of Birth',
      'License Number', 'State', 'Address', 'City', 'ZIP', 'Gender', 'Height',
      'Weight', 'Eye Color', 'Hair Color', 'Notes', 'Tags'
    ];
    
    const rows = scans.map(scan => {
      const fields = scan.parsedData.fields;
      return [
        scan.id,
        scan.timestamp,
        this.getFieldValue(fields, 'Full Name') || '',
        this.getFieldValue(fields, 'First Name') || '',
        this.getFieldValue(fields, 'Last Name') || '',
        this.getFieldValue(fields, 'Date of Birth') || '',
        this.getFieldValue(fields, 'License Number') || '',
        this.getFieldValue(fields, 'State') || '',
        this.getFieldValue(fields, 'Street Address 1') || '',
        this.getFieldValue(fields, 'City') || '',
        this.getFieldValue(fields, 'ZIP Code') || '',
        this.getFieldValue(fields, 'Gender') || '',
        this.getFieldValue(fields, 'Height') || '',
        this.getFieldValue(fields, 'Weight (lbs)') || '',
        this.getFieldValue(fields, 'Eye Color') || '',
        this.getFieldValue(fields, 'Hair Color') || '',
        scan.notes || '',
        scan.tags?.join('; ') || ''
      ].map(cell => `"${String(cell).replace(/"/g, '""')}"`);
    });
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    return new Blob([csvContent], { type: 'text/csv' });
  }

  private async exportAsPDF(scans: HistoryEntry[]): Promise<Blob> {
    // For now, return a simple text-based PDF placeholder
    // In a real implementation, you'd use a library like jsPDF
    const content = scans.map(scan => {
      const fields = scan.parsedData.fields;
      const name = this.getFieldValue(fields, 'Full Name') || 
                   `${this.getFieldValue(fields, 'First Name')} ${this.getFieldValue(fields, 'Last Name')}`.trim();
      
      return `
Scan ID: ${scan.id}
Date: ${new Date(scan.timestamp).toLocaleString()}
Name: ${name}
License #: ${this.getFieldValue(fields, 'License Number') || 'N/A'}
State: ${this.getFieldValue(fields, 'State') || 'N/A'}
DOB: ${this.getFieldValue(fields, 'Date of Birth') || 'N/A'}
Notes: ${scan.notes || 'None'}
Tags: ${scan.tags?.join(', ') || 'None'}
----------------------------
`;
    }).join('\n');
    
    return new Blob([content], { type: 'application/pdf' });
  }

  private isValidHistoryEntry(entry: any): entry is HistoryEntry {
    return entry &&
           typeof entry.timestamp === 'string' &&
           entry.parsedData &&
           Array.isArray(entry.parsedData.fields) &&
           typeof entry.rawData === 'string';
  }
}

export const storageManager = new StorageManager(); 