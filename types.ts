export interface ParsedField {
  field: string;
  value: string;
}

export interface ParsedDLData {
  fields: ParsedField[];
}

export interface HistoryEntry {
  id?: string; // Unique identifier for each scan
  timestamp: string;
  parsedData: ParsedDLData;
  rawData: string;
  notes?: string; // User-added notes
  tags?: string[]; // Auto-generated and user-added tags
}

export interface AAMVAFieldDefinition {
  code: string;
  name: string;
  formatter?: (value: string) => string;
}

// Enum for view states, matching the strings used in App.tsx
export enum AppView {
  Main = 'main',
  History = 'history',
  About = 'about',
  Storage = 'storage', // New storage management view
}

// Storage management interfaces
export interface StorageSettings {
  autoBackup: boolean;
  maxStorageSize: number;
  retentionDays: number;
  autoExport: boolean;
  exportFormat: 'json' | 'csv' | 'pdf';
}

export interface ScanAnalytics {
  totalScans: number;
  scansThisMonth: number;
  scansToday: number;
  mostScannedState: string;
  averageScansPerDay: number;
  storageUsage: {
    used: number;
    total: number;
    percentage: number;
  };
}
