/**
 * Authentication Guard
 * Redirects unauthenticated users to login page
 */

(function() {
  // Check if user is authenticated
  const token = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole');

  // Get current page path
  const currentPath = window.location.pathname;

  // List of protected routes
  const protectedRoutes = [
    'dashboard.html',
    'categories.html',
    'subject.html',
    'view-subject.html',
    'performance.html',
    'settings.html'
  ];

  // Check if current page is protected
  const isProtectedPage = protectedRoutes.some(route => currentPath.includes(route));

  // If user is not authenticated and trying to access protected page
  if (isProtectedPage && !token) {
    window.location.href = '../index.html';
    return;
  }

  // If user is student trying to access teacher pages
  if (isProtectedPage && userRole === 'student') {
    window.location.href = '../index.html';
    return;
  }

  // Verify token is still valid (optional)
  async function verifyToken() {
    if (!token) return;

    try {
      // Use unified API config for endpoint URL
      let apiUrl;
      if (window.API_CONFIG && typeof window.API_CONFIG.getBackendUrl === 'function') {
        apiUrl = window.API_CONFIG.getBackendUrl() + '/auth/verify';
      } else {
        // Fallback if api-config.js hasn't loaded yet
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          apiUrl = `${protocol}//localhost:5000/api/v1/auth/verify`;
        } else {
          const portString = port && (protocol === 'http:' ? port !== '80' : port !== '443') ? `:${port}` : '';
          apiUrl = `${protocol}//${hostname}${portString}/api/v1/auth/verify`;
        }
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // Token is invalid, logout user
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        window.location.href = '../index.html';
      } else {
        console.log('✓ Teacher token verified successfully');
      }
    } catch (error) {
      console.error('Token verification error:', error);
      console.warn('⚠️ Proceeding without verification (might be offline)');
    }
  }

  // Verify token on page load
  if (isProtectedPage) {
    verifyToken();
  }

  // Add logout functionality
  window.logout = function() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    window.location.href = '../index.html';
  };
})();
