import React, { useState, useEffect } from 'react';
import { AppView } from '../types';

interface HeaderProps {
  onNavigate: (view: AppView) => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>(AppView.Main);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      return window.innerWidth <= 768 || 'ontouchstart' in window;
    };
    
    setIsMobile(checkMobile());
    
    const handleResize = () => setIsMobile(checkMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (menuOpen && !target.closest('header') && !target.closest('.mobile-menu-dropdown')) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobile && menuOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isMobile, menuOpen]);

  const handleNavClick = (viewName: AppView) => {
    setCurrentView(viewName);
    onNavigate(viewName);
    setMenuOpen(false);
    
    // Haptic feedback for mobile
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const toggleMenu = () => {
    setMenuOpen(prev => !prev);
    
    // Haptic feedback for mobile
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  // Helper function to get gradient colors
  const getGradientColor = (colorClass: string): string => {
    switch (colorClass) {
      case 'from-cyan-500 to-blue-600':
        return 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)';
      case 'from-purple-500 to-pink-600':
        return 'linear-gradient(135deg, #8b5cf6 0%, #db2777 100%)';
      case 'from-green-500 to-teal-600':
        return 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)';
      default:
        return 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)';
    }
  };

  const navItems = [
    { view: AppView.Main, label: 'Home', icon: 'fas fa-home' },
    { view: AppView.Storage, label: 'Storage', icon: 'fas fa-database' },
    { view: AppView.History, label: 'History', icon: 'fas fa-history' },
    { view: AppView.About, label: 'About', icon: 'fas fa-info-circle' }
  ];

  const mobileNavItems = [
    { 
      view: AppView.Main, 
      label: 'Scan', 
      icon: 'fas fa-qrcode',
      description: 'Scan driver\'s licenses and IDs',
      color: 'from-cyan-500 to-blue-600'
    },
    { 
      view: AppView.Storage, 
      label: 'Storage', 
      icon: 'fas fa-database',
      description: 'Manage scans and data storage',
      color: 'from-purple-500 to-pink-600'
    },
    { 
      view: AppView.About, 
      label: 'About', 
      icon: 'fas fa-info-circle',
      description: 'App information and settings',
      color: 'from-green-500 to-teal-600'
    }
  ];

  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-[#1e293b] flex items-center justify-between px-4 sm:px-6 z-50 border-b border-slate-700 backdrop-blur-md bg-opacity-95">
      {/* Logo and App Name */}
      <div className="flex items-center min-w-0 flex-1">
        <button
          onClick={() => handleNavClick(AppView.Main)}
          style={{
            display: 'flex',
            alignItems: 'center',
            minWidth: '0',
            touchAction: 'manipulation',
            backgroundColor: 'transparent',
            border: 'none',
            padding: '0',
            transition: 'opacity 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          aria-label="Go to home"
        >
          <div 
            style={{
              width: '40px',
              height: '40px',
              marginRight: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              const img = e.currentTarget.querySelector('img');
              if (img) img.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              const img = e.currentTarget.querySelector('img');
              if (img) img.style.transform = 'scale(1)';
            }}
          >
            <img 
              src="/scan1.ico" 
              alt="Scan ID Logo" 
              style={{
                width: '100%',
                height: '100%',
                transition: 'all 0.3s ease',
                objectFit: 'contain',
                backgroundColor: 'transparent',
                background: 'transparent',
                mixBlendMode: 'screen'
              }}
            />
          </div>
          <span className="text-white text-2xl sm:text-3xl font-bold truncate bg-gradient-to-r from-white via-cyan-100 to-cyan-200 bg-clip-text text-transparent">
            Scan ID
          </span>
        </button>
        
        {/* Mobile indicator for current view */}
        {isMobile && (
          <span className="ml-3 text-xs text-cyan-400 bg-cyan-900/30 px-3 py-1 rounded-full whitespace-nowrap font-medium">
            {navItems.find(item => item.view === currentView)?.label}
          </span>
        )}
      </div>

      {/* Hamburger Menu Button for Mobile */}
      <button
        style={{
          display: isMobile ? 'flex' : 'none',
          color: 'white',
          fontSize: '1.5rem',
          padding: '0.5rem',
          touchAction: 'manipulation',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '0.5rem',
          transition: 'background-color 0.2s ease',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#475569';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        aria-label={menuOpen ? 'Close Menu' : 'Open Menu'}
        aria-expanded={menuOpen}
        onClick={toggleMenu}
      >
        <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`} style={{
          transition: 'transform 0.2s ease',
          transform: menuOpen ? 'rotate(90deg)' : 'rotate(0deg)'
        }}></i>
      </button>

      {/* Desktop Navigation */}
      <nav 
        style={{
          display: isMobile ? 'none' : 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}
      >
        {navItems.map((item) => (
          <button
            key={item.view}
            style={{
              fontWeight: '500',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              touchAction: 'manipulation',
              backgroundColor: currentView === item.view ? '#0891b2' : 'transparent',
              color: currentView === item.view ? 'white' : '#cbd5e1',
              boxShadow: currentView === item.view ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)' : 'none',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              if (currentView !== item.view) {
                e.currentTarget.style.backgroundColor = '#475569';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (currentView !== item.view) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#cbd5e1';
              }
            }}
            onClick={() => handleNavClick(item.view)}
            aria-current={currentView === item.view ? 'page' : undefined}
          >
            <i className={`${item.icon}`} style={{ fontSize: '0.875rem' }}></i>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Mobile Navigation Overlay */}
      {menuOpen && (
        <div className="mobile-menu-dropdown">
          <nav className="mobile-nav-container">
            <div className="mobile-nav-content">
              <div className="mobile-nav-header">
                Quick Actions
              </div>
              {mobileNavItems.map((item, index) => (
                <button
                  key={item.view}
                  className={`mobile-nav-button ${
                    currentView === item.view ? 'mobile-nav-button-active' : 'mobile-nav-button-inactive'
                  }`}
                  onClick={() => handleNavClick(item.view)}
                  style={{ 
                    animationDelay: `${index * 75}ms`,
                    background: currentView === item.view 
                      ? getGradientColor(item.color)
                      : 'rgba(30, 41, 59, 0.4)'
                  }}
                >
                  <div className={`mobile-nav-icon ${currentView === item.view ? 'mobile-nav-icon-active' : 'mobile-nav-icon-inactive'}`}
                       style={{ 
                         background: currentView === item.view 
                           ? 'rgba(255, 255, 255, 0.2)' 
                           : getGradientColor(item.color)
                       }}>
                    <i className={`${item.icon}`} style={{ color: 'white', fontSize: '18px' }}></i>
                  </div>
                  
                  <div className="mobile-nav-text">
                    <div className="mobile-nav-label">{item.label}</div>
                    <div className="mobile-nav-description">
                      {item.description}
                    </div>
                  </div>
                  
                  {currentView === item.view && (
                    <div className="mobile-nav-check">
                      <i className="fas fa-check" style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}></i>
                    </div>
                  )}
                  
                  {currentView !== item.view && (
                    <div className="mobile-nav-arrow">
                      <i className="fas fa-arrow-right" style={{ color: '#94a3b8', fontSize: '14px' }}></i>
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            <div className="mobile-nav-footer">
              <div className="mobile-nav-footer-text">
                Scan ID • Tap to navigate
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
