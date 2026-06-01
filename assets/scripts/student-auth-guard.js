/**
 * Student Auth Guard
 * Redirects unauthenticated users and teachers to login page
 * Ensures only authenticated students can access student pages
 */

(function() {
  // Check if user is authenticated
  const token = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole');

  // Get current page path
  const currentPath = window.location.pathname;

  // Student pages that require authentication
  const studentPages = [
    'studentDashboard.html',
    'studentModules.html',
    'studentQuiz.html',
    'studentHistory.html',
    'studentSettings.html',
    'studentViewModules.html',
    'studentQuizQuestions.html',
    'studentLeaderboard.html',
    'studentPractice.html'
  ];

  // Check if current page is a student page
  const isStudentPage = studentPages.some(page => currentPath.includes(page));

  // If on student page, verify authentication
  if (isStudentPage) {
    // If not authenticated, redirect to login
    if (!token) {
      console.log('❌ No authentication token found. Redirecting to login.');
      window.location.href = '../index.html';
      return;
    }

    // If user is teacher trying to access student pages
    if (userRole === 'teacher') {
      console.log('❌ Teachers cannot access student pages. Redirecting to login.');
      window.location.href = '../index.html';
      return;
    }

    // If user role is not student or not set, redirect
    if (userRole !== 'student') {
      console.log('❌ Invalid role for student pages. Redirecting to login.');
      window.location.href = '../index.html';
      return;
    }

    // Verify token is still valid
    verifyToken();
  }

  // Function to verify token with backend
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
        console.log('❌ Token verification failed. Logging out.');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('userId');
        localStorage.removeItem('deviceId');
        window.location.href = '../index.html';
      } else {
        console.log('✓ Token verified successfully');
      }
    } catch (error) {
      console.error('Token verification error:', error);
      console.warn('⚠️ Proceeding without verification (might be offline)');
      // On network error, allow user to continue (might be offline)
    }
  }

  // Add logout functionality globally
  window.logout = async function() {
    console.log('👋 Logging out...');
    
    // Record logout session
    try {
      const sessionId = sessionStorage.getItem('currentSessionId');
      if (sessionId) {
        const api = new ApiService();
        await api.recordLogout(sessionId);
        console.log('✓ Logout session recorded');
        sessionStorage.removeItem('currentSessionId');
      }
    } catch (err) {
      console.warn('Could not record logout session:', err);
    }

    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('deviceId');
    window.location.href = '../index.html';
  };

  // Add helper to check if user is authenticated
  window.isAuthenticated = function() {
    return !!localStorage.getItem('authToken') && localStorage.getItem('userRole') === 'student';
  };

  // Add helper to get current user info
  window.getCurrentUser = function() {
    return {
      id: localStorage.getItem('userId'),
      name: localStorage.getItem('userName'),
      role: localStorage.getItem('userRole'),
      token: localStorage.getItem('authToken'),
      deviceId: localStorage.getItem('deviceId')
    };
  };
})();
