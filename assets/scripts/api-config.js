/**
 * API Configuration
 * 
 * This file configures the backend API URL for different deployment scenarios:
 * 1. Local development (localhost:5000 backend, localhost:3000+ frontend)
 * 2. Netlify deployment - uses REACT_APP_API_URL or VITE_API_URL environment variables
 * 3. Same-domain deployment - auto-detects from current domain
 * 4. Docker/Network deployment - auto-detects from local network IPs
 * 5. Custom deployments - uses window.BACKEND_URL if set
 */

(function() {
  // Configuration object available globally
  window.API_CONFIG = {
    // Backend URL - Set by environment variables or auto-detected
    backendUrl: null,
    
    // Timeout for API requests (milliseconds)
    requestTimeout: 30000,
    
    // Enable debug logging
    debug: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    
    // Get the backend URL (with comprehensive fallback logic)
    getBackendUrl: function() {
      if (this.backendUrl) return this.backendUrl;
      
      // Priority 1: Check for window.BACKEND_URL (manually set)
      if (window.BACKEND_URL) {
        return window.BACKEND_URL;
      }
      
      // Priority 2: Check for environment variables injected by build tools
      // Netlify injects as window.__REACT_APP_* or window.__VITE_*
      if (window.__REACT_APP_API_URL) {
        return window.__REACT_APP_API_URL;
      }
      if (window.__VITE_API_URL) {
        return window.__VITE_API_URL;
      }
      
      // Priority 3: Check sessionStorage or localStorage for user-set backend URL
      const stored = sessionStorage.getItem('backendUrl') || localStorage.getItem('backendUrl');
      if (stored) {
        return stored;
      }
      
      // Priority 4: Auto-detect based on environment
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const port = window.location.port;
      
      // If on localhost/127.0.0.1, try port 5000 for backend
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Check if we're on port 3000 or similar frontend dev server
        if (port && port !== '80' && port !== '443' && parseInt(port) >= 3000) {
          // Frontend dev server, backend is on port 5000
          return `${protocol}//${hostname}:5000/api/v1`;
        }
        // Default localhost backend
        return `${protocol}//localhost:5000/api/v1`;
      }
      
      // If on local network IP (192.168.x.x, 10.x.x.x, 172.x.x.x), use port 5000
      if (/^(192\.168|10\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[01]\.)/.test(hostname)) {
        return `${protocol}//${hostname}:5000/api/v1`;
      }
      
      // Priority 5: Use same domain as frontend (production/Netlify setup)
      // This assumes backend is proxied through same domain
      const portString = port && (protocol === 'http:' ? port !== '80' : port !== '443') ? `:${port}` : '';
      return `${protocol}//${hostname}${portString}/api/v1`;
    },
    
    // Method to manually set backend URL (useful for runtime configuration)
    setBackendUrl: function(url) {
      this.backendUrl = url;
      sessionStorage.setItem('backendUrl', url);
      if (this.debug) {
        console.log('🔧 Backend URL updated:', url);
      }
    }
  };
  
  if (window.API_CONFIG.debug) {
    console.log('🔧 API Config initialized');
    console.log('   Environment:', {
      hostname: window.location.hostname,
      port: window.location.port,
      protocol: window.location.protocol
    });
    console.log('   Backend URL:', window.API_CONFIG.getBackendUrl());
  }
})();
