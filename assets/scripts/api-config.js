/**
 * API Configuration
 * 
 * This file configures the backend API URL for different deployment scenarios:
 * 1. Local development (localhost:5000) - automatic detection
 * 2. Netlify deployment - uses environment variable injection
 * 3. Same-domain deployment - auto-detects from current domain
 * 4. Custom deployments - uses window.BACKEND_URL if set
 */

(function() {
  // Configuration object available globally
  window.API_CONFIG = {
    // Backend URL - Set by environment variables or auto-detected
    // For Netlify: This is injected via netlify.toml or Netlify UI
    // For local dev: Auto-detected as localhost:5000
    // For production: Auto-detected as same domain
    backendUrl: null,
    
    // Timeout for API requests (milliseconds)
    requestTimeout: 30000,
    
    // Enable debug logging
    debug: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    
    // Get the backend URL (with fallback logic)
    getBackendUrl: function() {
      if (this.backendUrl) return this.backendUrl;
      
      // Check for environment-injected URL (Netlify, Docker, etc.)
      if (window.BACKEND_URL) {
        return window.BACKEND_URL;
      }
      
      // Auto-detect based on environment
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return `${window.location.protocol}//localhost:5000/api/v1`;
      }
      
      // Use same domain (production)
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const port = window.location.port;
      const portString = port && (protocol === 'http:' ? port !== '80' : port !== '443') ? `:${port}` : '';
      return `${protocol}//${hostname}${portString}/api/v1`;
    }
  };
  
  if (window.API_CONFIG.debug) {
    console.log('🔧 API Config initialized');
    console.log('   Backend URL:', window.API_CONFIG.getBackendUrl());
  }
})();
