/**
 * API Configuration
 * 
 * This file configures the backend API URL for different deployment scenarios:
 * 1. Local development (localhost:5000 backend, localhost:3000+ frontend)
 * 2. Netlify deployment - uses environment variables or URL parameters
 * 3. Same-domain deployment - auto-detects from current domain
 * 4. Docker/Network deployment - auto-detects from local network IPs
 * 5. Custom deployments - uses window.BACKEND_URL if set
 * 
 * For Netlify: Set BACKEND_URL in Netlify environment variables,
 * or pass ?backendUrl=https://... as query parameter
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
      
      // Priority 1: Check query parameter (?backendUrl=...)
      const params = new URLSearchParams(window.location.search);
      if (params.has('backendUrl')) {
        this.backendUrl = params.get('backendUrl');
        localStorage.setItem('backendUrl', this.backendUrl);
        return this.backendUrl;
      }
      
      // Priority 2: Check for window.BACKEND_URL (manually set)
      if (window.BACKEND_URL) {
        return window.BACKEND_URL;
      }
      
      // Priority 3: Check for meta tag (for Netlify/build environments)
      const metaTag = document.querySelector('meta[name="backend-url"]');
      if (metaTag && metaTag.content) {
        this.backendUrl = metaTag.content;
        localStorage.setItem('backendUrl', this.backendUrl);
        return this.backendUrl;
      }
      
      // Priority 4: Check sessionStorage or localStorage for user-set backend URL
      const stored = sessionStorage.getItem('backendUrl') || localStorage.getItem('backendUrl');
      if (stored) {
        this.backendUrl = stored;
        return stored;
      }
      
      // Priority 5: Auto-detect based on environment
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const port = window.location.port;
      
      // If on localhost/127.0.0.1, try port 5000 for backend
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Check if we're on port 3000 or similar frontend dev server
        if (port && port !== '80' && port !== '443' && parseInt(port) >= 3000) {
          // Frontend dev server, backend is on port 5000
          this.backendUrl = `${protocol}//${hostname}:5000/api/v1`;
        } else {
          // Default localhost backend on port 5000
          this.backendUrl = `${protocol}//localhost:5000/api/v1`;
        }
        return this.backendUrl;
      }
      
      // If on local network IP (192.168.x.x, 10.x.x.x, 172.x.x.x), use port 5000
      if (/^(192\.168|10\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[01]\.)/.test(hostname)) {
        this.backendUrl = `${protocol}//${hostname}:5000/api/v1`;
        return this.backendUrl;
      }
      
      // Priority 6: For Netlify/production, check if BACKEND_URL is in env
      // Since we can't directly access env vars in browser, user must set via:
      // - Meta tag in HTML
      // - Query parameter
      // - localStorage/sessionStorage
      // - Or configure via Netlify Functions/redirects
      
      // Default to same domain (production/proxied setup)
      const portString = port && (protocol === 'http:' ? port !== '80' : port !== '443') ? `:${port}` : '';
      this.backendUrl = `${protocol}//${hostname}${portString}/api/v1`;
      
      if (this.debug) {
        console.warn('⚠️ Backend URL not explicitly configured, using same-domain:', this.backendUrl);
      }
      
      return this.backendUrl;
    },
    
    // Method to manually set backend URL (useful for runtime configuration)
    setBackendUrl: function(url) {
      this.backendUrl = url;
      sessionStorage.setItem('backendUrl', url);
      localStorage.setItem('backendUrl', url);
      if (this.debug) {
        console.log('🔧 Backend URL configured:', url);
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
