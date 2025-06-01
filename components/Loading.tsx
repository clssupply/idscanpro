import React, { useState, useEffect } from 'react';

interface LoadingProps {
  onLoadingComplete?: () => void;
}

const Loading: React.FC<LoadingProps> = ({ onLoadingComplete }) => {
  const [progress, setProgress] = useState(0);
  const [scanPhase, setScanPhase] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [scanningActive, setScanningActive] = useState(false);
  const [extractedData, setExtractedData] = useState<string[]>([]);

  const scanningStages = [
    { progress: 15, text: 'Initializing Scanner Array...', phase: 0 },
    { progress: 30, text: 'Detecting Document...', phase: 1 },
    { progress: 50, text: 'Laser Scan Active...', phase: 2 },
    { progress: 70, text: 'Extracting Data...', phase: 3 },
    { progress: 90, text: 'Processing Information...', phase: 4 },
    { progress: 100, text: 'Scan Complete', phase: 5 }
  ];

  const dataFields = [
    'Document Type: ID Card',
    'Scan Resolution: 300 DPI',
    'Barcode Format: PDF417',
    'Security Level: High',
    'Data Integrity: Verified'
  ];

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showContent) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const currentStage = scanningStages.find(stage => prev < stage.progress);
        if (currentStage) {
          setScanPhase(currentStage.phase);
          if (currentStage.phase >= 2) setScanningActive(true);
          if (currentStage.phase >= 3) {
            setExtractedData(dataFields.slice(0, currentStage.phase - 2));
          }
          return prev + 1;
        }
        return prev;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [showContent]);

  useEffect(() => {
    if (progress >= 100) {
      const completeTimer = setTimeout(() => {
        onLoadingComplete?.();
      }, 1500);
      return () => clearTimeout(completeTimer);
    }
  }, [progress, onLoadingComplete]);

  if (!showContent) {
    return (
      <div className="loading-container">
        <div className="loading-logo">
          <img 
            src="/scan1.ico" 
            alt="Scan ID Logo" 
            style={{ width: '72px', height: '72px', objectFit: 'contain' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="scanner-interface">
      {/* Scanner Frame */}
      <div className="scanner-frame">
        {/* Corner Brackets */}
        <div className="corner-bracket top-left"></div>
        <div className="corner-bracket top-right"></div>
        <div className="corner-bracket bottom-left"></div>
        <div className="corner-bracket bottom-right"></div>
        
        {/* Document Preview */}
        <div className="document-preview">
          <div className="document-content">
            <img 
              src="/scan1.ico" 
              alt="Document" 
              className="document-icon"
            />
          </div>
          
          {/* Scanning Laser Beams */}
          {scanningActive && (
            <>
              <div className="laser-beam horizontal" style={{
                animation: 'scanHorizontal 2s ease-in-out infinite',
                animationDelay: '0s'
              }}></div>
              <div className="laser-beam vertical" style={{
                animation: 'scanVertical 2.5s ease-in-out infinite',
                animationDelay: '0.5s'
              }}></div>
              <div className="scan-grid">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="grid-line" style={{
                    animationDelay: `${i * 0.1}s`
                  }}></div>
                ))}
              </div>
            </>
          )}
          
          {/* Scanner Overlay */}
          <div className="scanner-overlay">
            <div className="scan-line" style={{
              animation: scanningActive ? 'scanLine 3s ease-in-out infinite' : 'none'
            }}></div>
          </div>
        </div>
      </div>

      {/* Interface Panel */}
      <div className="interface-panel">
        <div className="status-header">
          <div className="status-indicator">
            <div className={`status-dot ${scanPhase >= 2 ? 'active' : ''}`}></div>
            <span>LASER SCANNER ACTIVE</span>
          </div>
          <div className="progress-value">{progress}%</div>
        </div>

        <div className="progress-bar-container">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
            <div className="progress-glow" style={{
              left: `${progress}%`,
              opacity: scanningActive ? 1 : 0
            }}></div>
          </div>
        </div>

        <div className="status-text">
          {scanningStages.find(stage => scanPhase === stage.phase)?.text || 'Standby...'}
        </div>

        {/* Data Extraction Panel */}
        <div className="data-panel">
          <div className="data-header">EXTRACTED DATA</div>
          <div className="data-list">
            {extractedData.map((item, index) => (
              <div 
                key={index} 
                className="data-item"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <span className="data-bullet">▶</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .scanner-interface {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: linear-gradient(135deg, #0f1419 0%, #1e293b 50%, #0f1419 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: 'Courier New', monospace;
          color: #06b6d4;
          overflow: hidden;
        }

        .scanner-frame {
          position: relative;
          width: 400px;
          height: 300px;
          margin-bottom: 40px;
          perspective: 1000px;
        }

        .corner-bracket {
          position: absolute;
          width: 40px;
          height: 40px;
          border: 3px solid #06b6d4;
          z-index: 10;
        }

        .top-left {
          top: 0;
          left: 0;
          border-right: none;
          border-bottom: none;
          box-shadow: -5px -5px 20px rgba(6, 182, 212, 0.3);
        }

        .top-right {
          top: 0;
          right: 0;
          border-left: none;
          border-bottom: none;
          box-shadow: 5px -5px 20px rgba(6, 182, 212, 0.3);
        }

        .bottom-left {
          bottom: 0;
          left: 0;
          border-right: none;
          border-top: none;
          box-shadow: -5px 5px 20px rgba(6, 182, 212, 0.3);
        }

        .bottom-right {
          bottom: 0;
          right: 0;
          border-left: none;
          border-top: none;
          box-shadow: 5px 5px 20px rgba(6, 182, 212, 0.3);
        }

        .document-preview {
          position: relative;
          width: 100%;
          height: 100%;
          background: linear-gradient(145deg, #1e2832 0%, #2a3441 100%);
          border: 2px solid #06b6d4;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 
            inset 0 0 50px rgba(6, 182, 212, 0.1),
            0 0 50px rgba(6, 182, 212, 0.2);
        }

        .document-content {
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5;
          width: 100%;
          height: 100%;
        }

        .document-icon {
          width: 180px;
          height: 180px;
          filter: drop-shadow(0 0 20px rgba(6, 182, 212, 0.8));
          transition: all 0.3s ease;
          object-fit: contain;
        }

        .laser-beam {
          position: absolute;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(6, 182, 212, 0.8) 50%, 
            transparent 100%);
          box-shadow: 0 0 20px rgba(6, 182, 212, 0.6);
          z-index: 15;
        }

        .laser-beam.horizontal {
          width: 100%;
          height: 2px;
          top: 50%;
          left: 0;
        }

        .laser-beam.vertical {
          width: 2px;
          height: 100%;
          top: 0;
          left: 50%;
          background: linear-gradient(0deg, 
            transparent 0%, 
            rgba(6, 182, 212, 0.8) 50%, 
            transparent 100%);
        }

        .scan-grid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-template-rows: repeat(3, 1fr);
          gap: 1px;
          z-index: 8;
        }

        .grid-line {
          border: 1px solid rgba(6, 182, 212, 0.3);
          animation: gridPulse 2s ease-in-out infinite;
        }

        .scanner-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 20;
        }

        .scan-line {
          position: absolute;
          width: 100%;
          height: 4px;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(6, 182, 212, 0.3) 20%,
            rgba(6, 182, 212, 0.8) 50%,
            rgba(6, 182, 212, 0.3) 80%,
            transparent 100%);
          box-shadow: 0 0 20px rgba(6, 182, 212, 0.8);
          filter: blur(1px);
        }

        .interface-panel {
          width: 500px;
          background: rgba(30, 41, 59, 0.9);
          border: 2px solid #06b6d4;
          border-radius: 12px;
          padding: 25px;
          backdrop-filter: blur(10px);
          box-shadow: 0 0 40px rgba(6, 182, 212, 0.2);
        }

        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: bold;
        }

        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #666;
          transition: all 0.3s ease;
        }

        .status-dot.active {
          background: #2563eb;
          box-shadow: 
            0 0 10px #2563eb,
            0 0 20px #2563eb,
            0 0 30px #2563eb;
          animation: pulse 1s ease-in-out infinite;
        }

        .progress-value {
          font-size: 24px;
          font-weight: bold;
          color: #06b6d4;
          text-shadow: 0 0 10px rgba(6, 182, 212, 0.8);
        }

        .progress-bar-container {
          position: relative;
          margin-bottom: 20px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(6, 182, 212, 0.2);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #06b6d4, #2563eb);
          border-radius: 4px;
          transition: width 0.3s ease;
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.6);
        }

        .progress-glow {
          position: absolute;
          top: -2px;
          width: 20px;
          height: 12px;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.8), transparent);
          border-radius: 50%;
          transform: translateX(-50%);
          transition: opacity 0.3s ease;
        }

        .status-text {
          text-align: center;
          font-size: 16px;
          margin-bottom: 25px;
          color: #06b6d4;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .data-panel {
          border-top: 1px solid rgba(6, 182, 212, 0.3);
          padding-top: 20px;
        }

        .data-header {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 15px;
          color: #06b6d4;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .data-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .data-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          opacity: 0;
          animation: fadeInUp 0.5s ease forwards;
          color: #67e8f9;
        }

        .data-bullet {
          color: #06b6d4;
          font-size: 10px;
        }

        .loading-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: linear-gradient(135deg, #0f1419 0%, #1e293b 50%, #0f1419 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-logo {
          animation: logoGlow 2s ease-in-out infinite;
        }

        @keyframes scanHorizontal {
          0%, 100% { transform: translateY(-150px) scaleX(0.5); opacity: 0.3; }
          50% { transform: translateY(0px) scaleX(1); opacity: 1; }
        }

        @keyframes scanVertical {
          0%, 100% { transform: translateX(-150px) scaleY(0.5); opacity: 0.3; }
          50% { transform: translateX(0px) scaleY(1); opacity: 1; }
        }

        @keyframes scanLine {
          0% { top: -4px; opacity: 1; }
          50% { top: 50%; opacity: 0.8; }
          100% { top: 100%; opacity: 0; }
        }

        @keyframes gridPulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.6; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes logoGlow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(6, 182, 212, 0.5)); }
          50% { filter: drop-shadow(0 0 40px rgba(6, 182, 212, 0.8)); }
        }

        @media (max-width: 640px) {
          .scanner-frame {
            width: 300px;
            height: 225px;
          }
          
          .interface-panel {
            width: 320px;
            padding: 20px;
          }
          
          .document-content {
            gap: 20px;
          }
          
          .document-icon {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </div>
  );
};

export default Loading; 