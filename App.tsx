import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Scanner from './components/Scanner';
import History from './components/History';
import About from './components/About';
import Storage from './components/Storage';
import ScanModal from './components/ScanModal';
import Loading from './components/Loading';
import { parseDLData } from './utils/parseUtils';
import { storageManager } from './utils/storageManager';
import { ParsedField, HistoryEntry, AppView } from './types';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<AppView>(AppView.Main);
  const [rawData, setRawData] = useState<string | null>(null);
  const [parsedFields, setParsedFields] = useState<ParsedField[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Initialize app and storage
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Test storage availability
        storageManager.getStorageStats();
        
        // Simulate realistic loading time for better UX
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Still allow the app to load even if storage has issues
      }
    };
    
    initializeApp();
  }, []);

  const handleLoadingComplete = useCallback(() => {
    // Add a small delay to ensure smooth transition
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  }, []);

  const handleRawResult = useCallback((text: string) => {
    // Prevent processing if modal is already open
    if (modalOpen) {
      console.log('Ignoring scan result - modal already open');
      return;
    }
    
    console.log('Processing new scan result');
    const parsed = parseDLData(text);
    setParsedFields(parsed);
    setRawData(text);
    setModalOpen(true);
  }, [modalOpen]);

  const handleModalClose = useCallback(() => {
    console.log('Closing modal');
    setModalOpen(false);
    setSaveStatus('idle');
    // Clear data when modal is closed without saving
    if (saveStatus !== 'success') {
      setRawData(null);
      setParsedFields([]);
    }
  }, [saveStatus]);

  const saveToHistory = useCallback(async () => {
    if (!parsedFields || parsedFields.length === 0 || !rawData) return;
    
    setSaveStatus('saving');
    
    try {
      const success = await storageManager.saveScan(
        { fields: parsedFields }, 
        rawData
      );
      
      if (success) {
        setSaveStatus('success');
        setModalOpen(false);
        
        // Show success feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
        
        // Auto-backup if enabled
        try {
          await storageManager.backupToIndexedDB();
        } catch (error) {
          console.warn('Auto-backup failed:', error);
        }
        
        // Reset form after successful save
        setTimeout(() => {
          setRawData(null);
          setParsedFields([]);
          setSaveStatus('idle');
        }, 1000);
        
      } else {
        setSaveStatus('error');
        console.error('Failed to save scan to storage');
      }
    } catch (error) {
      setSaveStatus('error');
      console.error('Error saving scan:', error);
    }
  }, [parsedFields, rawData]);

  const handleNavigation = useCallback((targetView: AppView) => {
    setView(targetView);
    if (targetView === AppView.Main) {
      setRawData(null);
      setParsedFields([]);
      setModalOpen(false);
      setSaveStatus('idle');
    }
  }, []);

  // Get save button text based on status
  const getSaveButtonText = () => {
    switch (saveStatus) {
      case 'saving': return 'Saving...';
      case 'success': return 'Saved!';
      case 'error': return 'Error - Retry';
      default: return 'Save to Storage';
    }
  };

  const getSaveButtonIcon = () => {
    switch (saveStatus) {
      case 'saving': return 'fas fa-spinner fa-spin';
      case 'success': return 'fas fa-check';
      case 'error': return 'fas fa-exclamation-triangle';
      default: return 'fas fa-save';
    }
  };

  // Show loading screen during initialization
  if (isLoading) {
    return <Loading onLoadingComplete={handleLoadingComplete} />;
  }

  // --color-navy-dark: #0f172a (main bg)
  // --header-height: 64px (pt-16 for content area)
  // --spacing-lg: 1.5rem (page title mb-6)
  // --color-cyan-bright: #0891b2 (page title color)

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] motion-safe:transition-all motion-safe:duration-300 contrast-more:border-2 contrast-more:border-transparent">
      <Header onNavigate={handleNavigation} />

      <main className="flex-1 pt-16 flex flex-col motion-safe:transition-margin duration-300 ease-in-out">
        <div className="flex-1 p-4 sm:p-6 w-full">
          {view === AppView.Main && (
            <>
              <h1 className="text-3xl sm:text-4xl font-semibold mb-6 text-center text-sky-400">
                Scan Driver license or ID card barcodes
              </h1>
              <div className="text-center mb-6">
                <p className="text-slate-300 mb-2">
                  Scan PDF417 barcodes and automatically save to secure storage
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <i className="fas fa-database text-cyan-400"></i>
                    Smart Storage
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="fas fa-search text-cyan-400"></i>
                    Advanced Search
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="fas fa-download text-cyan-400"></i>
                    Export Data
                  </span>
                </div>
              </div>
              <Scanner onResult={handleRawResult} />
            </>
          )}
          {view === AppView.History && <History onNavigate={handleNavigation} />}
          {view === AppView.Storage && <Storage onNavigate={handleNavigation} />}
          {view === AppView.About && <About />}
        </div>
      </main>

      <ScanModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSaveStatus('idle');
        }}
        parsedFields={parsedFields}
        rawData={rawData}
        onSave={saveToHistory}
        saveButtonText={getSaveButtonText()}
        saveButtonIcon={getSaveButtonIcon()}
        saveStatus={saveStatus}
      />
    </div>
  );
};

export default App;
