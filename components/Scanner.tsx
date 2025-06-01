import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  BrowserPDF417Reader,
  DecodeHintType,
  BarcodeFormat,
  NotFoundException,
  Result,
  Exception,
} from '@zxing/library';

interface ScannerProps {
  onResult: (rawText: string) => void;
}

const Scanner: React.FC<ScannerProps> = ({ onResult }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [codeReader, setCodeReader] = useState<BrowserPDF417Reader | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [videoTransformClass, setVideoTransformClass] = useState('');
  const [controlsId, setControlsId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [hasDetectedResult, setHasDetectedResult] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'tablet'];
      return mobileKeywords.some(keyword => userAgent.includes(keyword)) || 
             window.innerWidth <= 768 ||
             'ontouchstart' in window;
    };
    
    setIsMobile(checkMobile());
    
    const handleResize = () => setIsMobile(checkMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const stopScanner = useCallback(() => {
    if (codeReader && controlsId) {
      try {
        codeReader.reset();
      } catch (error) {
        console.warn('Error resetting scanner:', error);
      }
    }
    stopCamera();
    setIsScanning(false);
    setScanError(null);
    setControlsId(null);
    setHasDetectedResult(false);
  }, [codeReader, stopCamera, controlsId]);

  useEffect(() => {
    const reader = new BrowserPDF417Reader();
    setCodeReader(reader);
    
    return () => {
      if (reader) {
        try {
          reader.reset();
        } catch (error) {
          console.warn('Error cleaning up scanner:', error);
        }
      }
      stopCamera();
    };
  }, [stopCamera]);

  const checkBrowserSupport = (): boolean => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setScanError('Your browser does not support camera access. Please use a modern browser (Chrome, Safari, Edge).');
      return false;
    }
    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setScanError('Camera access requires a secure context (HTTPS), except for localhost.');
      return false;
    }
    return true;
  };
  
  const handleSuccess = useCallback((rawText: string) => {
    // Prevent duplicate processing with a more robust check
    if (hasDetectedResult) {
      console.log('Ignoring duplicate detection');
      return;
    }
    
    console.log('Processing successful detection');
    setHasDetectedResult(true);
    
    // Enhanced mobile feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]); // Success pattern
    }
    
    // Audio feedback for mobile
    if (isMobile) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (error) {
        console.warn('Audio feedback not available:', error);
      }
    }
    
    // Stop scanner first to prevent further detections
    stopScanner();
    
    // Delay the callback to ensure scanner is fully stopped
    setTimeout(() => {
      onResult(rawText);
    }, 150);
  }, [hasDetectedResult, onResult, stopScanner, isMobile]);

  const getMobileOptimizedConstraints = () => {
    if (!isMobile) {
      return [
        { video: { facingMode: cameraFacing, width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: { facingMode: cameraFacing, width: { ideal: 640 }, height: { ideal: 480 } } },
        { video: { facingMode: cameraFacing } },
        { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: true }
      ];
    }

    // Mobile-optimized constraints
    return [
      { 
        video: { 
          facingMode: cameraFacing,
          width: { ideal: 1920, max: 1920 }, 
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 30 }
        } 
      },
      { 
        video: { 
          facingMode: cameraFacing,
          width: { ideal: 1280, max: 1280 }, 
          height: { ideal: 720, max: 720 },
          frameRate: { ideal: 30, max: 30 }
        } 
      },
      { 
        video: { 
          facingMode: cameraFacing,
          width: { ideal: 640, max: 640 }, 
          height: { ideal: 480, max: 480 }
        } 
      },
      { video: { facingMode: cameraFacing } },
      { video: true }
    ];
  };

  const startScanner = async () => {
    if (!checkBrowserSupport() || !codeReader || !videoRef.current) return;
    
    setScanError(null);
    setIsScanning(true);
    setHasDetectedResult(false);

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.PDF_417]);
    if (isMobile) {
      hints.set(DecodeHintType.TRY_HARDER, true);
    }

    const constraintsList = getMobileOptimizedConstraints();

    let streamStarted = false;
    for (const constraints of constraintsList) {
      try {
        console.log('Trying camera constraints:', constraints);
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Mobile-specific video setup
          if (isMobile) {
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.setAttribute('webkit-playsinline', 'true');
            videoRef.current.muted = true;
          }
          
          await videoRef.current.play();
          
          // Use a ref to track detection state within the callback
          let isProcessing = false;
          
          // Start the decode process with proper debouncing
          const controls = await codeReader.decodeFromVideoDevice(
            undefined,
            videoRef.current,
            (result: Result | undefined, error: Exception | undefined) => {
              // Prevent multiple simultaneous processing
              if (isProcessing) {
                return;
              }
              
              if (result && !hasDetectedResult) {
                isProcessing = true;
                console.log('Barcode detected:', result.getText());
                setScanError(null);
                
                // Immediately update the state to prevent further detections
                setHasDetectedResult(true);
                
                // Stop the scanner immediately
                if (codeReader && controls) {
                  try {
                    codeReader.reset();
                  } catch (resetError) {
                    console.warn('Error resetting scanner:', resetError);
                  }
                }
                
                // Handle the success after a small delay
                setTimeout(() => {
                  handleSuccess(result.getText());
                }, 50);
              }
              
              if (error && !(error instanceof NotFoundException)) {
                console.warn('Decode error:', error);
              }
            }
          );
          
          setControlsId(controls);
          streamStarted = true;
          console.log('Camera started successfully');
          break;
        }
      } catch (err) {
        console.warn('Failed to start camera with constraints:', constraints, err);
        if (err instanceof Error && err.name === 'NotAllowedError') {
          setScanError('Camera permission denied. Please allow camera access and try again.');
          setIsScanning(false);
          return;
        }
      }
    }

    if (!streamStarted) {
      setScanError('Unable to start camera. Please check permissions and ensure no other app is using the camera.');
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!codeReader) return;
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanError(null);
    setHasDetectedResult(false);

    try {
      const image = new Image();
      image.onload = async () => {
        try {
          const result = await codeReader.decodeFromImageElement(image);
          handleSuccess(result.getText());
        } catch (err) {
          console.error('Error decoding image:', err);
          setScanError('Could not decode barcode from image. Please try a clearer image of the PDF417 barcode.');
          setIsScanning(false);
        }
      };
      image.onerror = () => {
        setScanError('Failed to load image file.');
        setIsScanning(false);
      };
      image.src = URL.createObjectURL(file);
    } catch (err) {
      console.error('File upload error:', err);
      setScanError('An error occurred during file upload.');
      setIsScanning(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const toggleOrientation = () => {
    setVideoTransformClass(prev => prev === '' ? 'rotate-90' : '');
  };

  const switchCamera = () => {
    setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment');
    if (isScanning) {
      stopScanner();
      setTimeout(() => startScanner(), 100);
    }
  };

  // Touch to focus (mobile enhancement)
  const handleVideoTouch = (event: React.TouchEvent) => {
    if (!isMobile || !isScanning) return;
    
    event.preventDefault();
    const touch = event.touches[0];
    const rect = videoRef.current?.getBoundingClientRect();
    
    if (rect && touch) {
      const x = ((touch.clientX - rect.left) / rect.width) * 100;
      const y = ((touch.clientY - rect.top) / rect.height) * 100;
      
      // Visual feedback for touch
      const focusPoint = document.createElement('div');
      focusPoint.className = 'absolute w-16 h-16 border-2 border-cyan-400 rounded-full pointer-events-none animate-ping';
      focusPoint.style.left = `${x}%`;
      focusPoint.style.top = `${y}%`;
      focusPoint.style.transform = 'translate(-50%, -50%)';
      
      containerRef.current?.appendChild(focusPoint);
      setTimeout(() => focusPoint.remove(), 1000);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 lg:p-6">
      {!isScanning && (
        <div className="flex flex-col items-center text-[#0891b2] mb-4 px-4">
          <i className="fas fa-id-card text-4xl sm:text-5xl mb-3"></i>
          
          {/* Barcode visual guide */}
          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-600/30 mb-4 max-w-md">
            <p className="text-xs text-cyan-400 text-center mb-3 font-medium">
              SCAN THIS TYPE OF BARCODE:
            </p>
            <div className="flex justify-center">
              <img 
                src="/barcode.png" 
                alt="Example of PDF417 barcode to scan" 
                className="max-w-full h-auto rounded border border-slate-500/30 bg-slate-900 p-3"
                style={{ 
                  maxHeight: '160px',
                  minWidth: '320px',
                  width: '100%',
                  objectFit: 'contain',
                  filter: 'invert(1) brightness(1.2) contrast(1.1)'
                }}
              />
            </div>
            <p className="text-xs text-slate-400 text-center mt-3">
              Look for this pattern on your ID
            </p>
          </div>
          
          {isMobile && (
            <p className="text-xs text-center text-cyan-400 mt-2 bg-cyan-900/20 px-3 py-1 rounded-full">
              📱 Optimized for mobile • Tap video to focus
            </p>
          )}
        </div>
      )}

      <div 
        ref={containerRef}
        className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto relative"
      >
        <video
          ref={videoRef}
          className={`w-full h-auto max-h-[70vh] sm:max-h-[60vh] rounded-lg bg-black overflow-hidden transition-transform duration-300 ease-in-out ${isScanning ? 'block' : 'hidden'} ${videoTransformClass} ${videoTransformClass === 'rotate-90' ? 'object-contain aspect-[9/16]' : 'object-cover aspect-video'}`}
          playsInline
          muted
          autoPlay
          onTouchStart={handleVideoTouch}
        />
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-11/12 h-3/5 border-4 border-dashed border-cyan-400 opacity-75 rounded-lg animate-pulse"></div>
            <div className="absolute top-4 left-4 bg-black/70 text-cyan-400 px-2 py-1 rounded text-xs">
              {cameraFacing === 'environment' ? '📷 Back Camera' : '🤳 Front Camera'}
            </div>
          </div>
        )}
      </div>

      {scanError && (
        <div className="mt-4 text-red-400 text-center font-medium p-4 bg-red-900/20 border border-red-500/30 rounded-lg max-w-md mx-4">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          {scanError}
        </div>
      )}
      
      {isScanning && !scanError && (
        <div className="mt-4 text-cyan-400 text-center font-medium px-4">
          <div className="w-12 h-12 border-4 border-slate-600 border-t-[#06b6d4] rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm sm:text-base">Scanning for PDF417 barcode...</p>
          {isMobile && (
            <p className="text-xs text-slate-400 mt-1">Tap video to focus • Hold steady</p>
          )}
        </div>
      )}

      {/* Mobile-optimized button layout */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full max-w-md px-4">
        {!isScanning ? (
          <button
            className="btn-primary w-full sm:w-auto bg-[#06b6d4] text-[#0f172a] font-semibold py-4 px-6 rounded-xl shadow-lg hover:bg-[#0891b2] active:bg-[#0e7490] transition-all duration-200 flex items-center justify-center gap-3 text-lg touch-manipulation"
            onClick={startScanner}
          >
            <i className="fas fa-camera text-xl"></i> 
            <span>Start Scanner</span>
          </button>
        ) : (
          <button
            className="btn-secondary w-full sm:w-auto bg-slate-700 border-2 border-[#06b6d4] text-[#06b6d4] font-semibold py-4 px-6 rounded-xl hover:bg-slate-600 active:bg-slate-800 transition-all duration-200 flex items-center justify-center gap-3 text-lg touch-manipulation"
            onClick={stopScanner}
          >
            <i className="fas fa-stop text-xl"></i>
            <span>Stop Scanner</span>
          </button>
        )}
        
        <button
          className="btn-secondary w-full sm:w-auto bg-slate-700 border-2 border-[#06b6d4] text-[#06b6d4] font-semibold py-4 px-6 rounded-xl hover:bg-slate-600 active:bg-slate-800 transition-all duration-200 flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
        >
          <i className="fas fa-upload text-xl"></i>
          <span>Upload Image</span>
        </button>
        
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileUpload}
        />
      </div>
      
      {/* Mobile control buttons */}
      {isScanning && (
        <div className="flex flex-wrap gap-2 mt-4 justify-center px-4">
          <button
            className="btn-small bg-slate-700 border border-slate-500 text-slate-300 font-medium py-3 px-4 rounded-lg hover:bg-slate-600 active:bg-slate-800 transition-all duration-200 flex items-center gap-2 text-sm touch-manipulation"
            onClick={toggleOrientation}
          >
            <i className="fas fa-sync-alt"></i> 
            <span className="hidden sm:inline">Toggle Orientation</span>
            <span className="sm:hidden">Rotate</span>
          </button>
          
          {isMobile && (
            <button
              className="btn-small bg-slate-700 border border-slate-500 text-slate-300 font-medium py-3 px-4 rounded-lg hover:bg-slate-600 active:bg-slate-800 transition-all duration-200 flex items-center gap-2 text-sm touch-manipulation"
              onClick={switchCamera}
            >
              <i className="fas fa-camera-rotate"></i>
              <span className="hidden sm:inline">Switch Camera</span>
              <span className="sm:hidden">Switch</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Scanner;
