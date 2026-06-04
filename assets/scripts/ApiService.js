/**
 * API Service Helper
 * Utility class for making API calls from the frontend
 */

class ApiService {
  constructor(baseURL = null) {
    // If baseURL not provided, dynamically determine it based on configuration
    if (!baseURL) {
      // Priority 1: Use unified API_CONFIG helper if available (recommended)
      if (window.API_CONFIG && typeof window.API_CONFIG.getBackendUrl === 'function') {
        baseURL = window.API_CONFIG.getBackendUrl();
        console.log('📍 Using unified API_CONFIG.getBackendUrl():', baseURL);
      }
      // Priority 2: Check for environment-injected backend URL (from Netlify or hosting platform)
      else if (window.BACKEND_URL) {
        baseURL = window.BACKEND_URL;
        console.log('📍 Using environment-injected backend URL:', baseURL);
      } 
      // Priority 3: Check for API config backendUrl property
      else if (window.API_CONFIG && window.API_CONFIG.backendUrl) {
        baseURL = window.API_CONFIG.backendUrl;
        console.log('📍 Using API_CONFIG.backendUrl:', baseURL);
      }
      // Priority 4: Manual fallback detection (if api-config.js hasn't loaded)
      else {
        baseURL = this.detectBackendUrl();
        console.log('📍 Using manual fallback detection:', baseURL);
      }
    }
    
    this.baseURL = baseURL;
    this.token = localStorage.getItem('authToken');
    console.log('🔐 ApiService initialized:', {
      baseURL,
      tokenExists: !!this.token,
      tokenValue: this.token ? this.token.substring(0, 20) + '...' : 'NO TOKEN'
    });
  }

  // Manual fallback for API URL detection (if api-config.js hasn't loaded)
  detectBackendUrl() {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // Detect if on local network IP
    if (this.isLocalNetworkIP(hostname) && port && ['8080', '3000', '5173', '5000', '5001', '8000', '8081'].includes(port.toString())) {
      return `${protocol}//${hostname}:5000/api/v1`;
    }
    // Development server detection on localhost
    else if (port && ['8080', '3000', '5173', '5000', '5001', '8000', '8081'].includes(port.toString()) && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      return `${protocol}//localhost:5000/api/v1`;
    }
    // Local network IP detection
    else if (this.isLocalNetworkIP(hostname)) {
      return `${protocol}//${hostname}:5000/api/v1`;
    }
    // Localhost development
    else if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//localhost:5000/api/v1`;
    }
    // Production: use same-domain backend
    else {
      const portString = port && (protocol === 'http:' ? port !== '80' : port !== '443') ? `:${port}` : '';
      return `${protocol}//${hostname}${portString}/api/v1`;
    }
  }

  // Helper method to detect if IP is on local network
  isLocalNetworkIP(hostname) {
    // Check if it's a local network IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    const localIPPattern = /^(192\.168|10\.|172\.(1[6-9]|2[0-9]|3[0-1]))\./;
    return localIPPattern.test(hostname);
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  getHeaders(includeAuth = true, skipContentType = false) {
    const headers = {};
    
    if (!skipContentType) {
      headers['Content-Type'] = 'application/json';
    }

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      console.log('✅ Auth header added');
    } else {
      console.log('⚠️ Auth header NOT added:', { includeAuth, hasToken: !!this.token });
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Add cache-busting for dynamic content endpoints
    const isDynamicEndpoint = /\/(quizzes|modules|questions|subjects|students)[\/?]/.test(endpoint);
    let finalUrl = url;
    if (isDynamicEndpoint && (!options.method || options.method === 'GET')) {
      // Add timestamp to bypass caches
      const separator = url.includes('?') ? '&' : '?';
      finalUrl = `${url}${separator}t=${Date.now()}`;
    }
    
    const headers = this.getHeaders(options.includeAuth !== false, options.skipContentType);
    
    // Add cache-control headers for dynamic endpoints
    if (isDynamicEndpoint) {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    }
    
    console.log(`📡 API Request: ${options.method || 'GET'} ${finalUrl}`, { 
      token: !!this.token,
      headers: headers,
      authHeader: headers['Authorization'] ? 'YES' : 'NO'
    });
    const config = {
      ...options,
      headers
    };
    
    // Remove skipContentType from config before passing to fetch
    delete config.skipContentType;

    try {
      const response = await fetch(finalUrl, config);

      if (!response.ok) {
        let error;
        try {
          error = await response.json();
        } catch (e) {
          error = { error: `HTTP ${response.status}` };
        }
        console.error(`❌ API Error Response:`, error);
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`✅ API Response:`, data);
        return data;
      }
      return null;
    } catch (error) {
      console.error(`API Error: ${error.message}`);
      throw error;
    }
  }

  // Categories
  getCategories() {
    return this.request('/categories', { includeAuth: false });
  }

  getCategoryById(id) {
    return this.request(`/categories/${id}`, { includeAuth: false });
  }

  createCategory(data) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateCategory(id, data) {
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  deleteCategory(id) {
    return this.request(`/categories/${id}`, {
      method: 'DELETE'
    });
  }

  // Subjects
  getSubjects(categoryId = null) {
    let endpoint = '/subjects';
    if (categoryId) endpoint += `?categoryId=${categoryId}`;
    return this.request(endpoint);
  }

  getSubjectById(id) {
    return this.request(`/subjects/${id}`);
  }

  getSubjectsByCategory(categoryId) {
    return this.request(`/subjects/category/${categoryId}`);
  }

  createSubject(data) {
    return this.request('/subjects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateSubject(id, data) {
    return this.request(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  deleteSubject(id) {
    return this.request(`/subjects/${id}`, {
      method: 'DELETE'
    });
  }

  // Questions
  getQuestions(subjectId = null) {
    let endpoint = '/questions';
    if (subjectId) endpoint += `?subjectId=${subjectId}`;
    return this.request(endpoint);
  }

  getQuestionById(id) {
    return this.request(`/questions/${id}`);
  }

  createQuestion(data) {
    return this.request('/questions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateQuestion(id, data) {
    return this.request(`/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  deleteQuestion(id) {
    return this.request(`/questions/${id}`, {
      method: 'DELETE'
    });
  }

  // Quizzes
  getQuizzes(subjectId = null, mode = 'exam') {
    let endpoint = '/quizzes';
    const params = [];
    if (subjectId) params.push(`subjectId=${subjectId}`);
    if (mode) params.push(`mode=${mode}`);
    if (params.length > 0) endpoint += `?${params.join('&')}`;
    return this.request(endpoint);
  }

  getQuizById(id, mode = 'exam') {
    return this.request(`/quizzes/${id}?mode=${mode}`);
  }

  createQuiz(data) {
    return this.request('/quizzes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateQuiz(id, data) {
    return this.request(`/quizzes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  deleteQuiz(id) {
    return this.request(`/quizzes/${id}`, {
      method: 'DELETE'
    });
  }

  addQuestionToQuiz(quizId, data) {
    return this.request(`/quizzes/${quizId}/add-question`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  removeQuestionFromQuiz(quizId, data) {
    return this.request(`/quizzes/${quizId}/remove-question`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Modules
  getModules(subjectId) {
    return this.request(`/modules?subjectId=${subjectId}`);
  }

  getModuleById(id) {
    return this.request(`/modules/${id}`);
  }

  createModule(data) {
    // Check if data is FormData (contains files)
    if (data instanceof FormData) {
      return this.request('/modules', {
        method: 'POST',
        body: data,
        skipContentType: true  // Let browser set content-type for FormData
      });
    }
    return this.request('/modules', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateModule(id, data) {
    // Check if data is FormData (contains files)
    if (data instanceof FormData) {
      return this.request(`/modules/${id}`, {
        method: 'PUT',
        body: data,
        skipContentType: true  // Let browser set content-type for FormData
      });
    }
    return this.request(`/modules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  deleteModule(id) {
    return this.request(`/modules/${id}`, {
      method: 'DELETE'
    });
  }

  deleteModuleFile(fileId) {
    return this.request(`/modules/file/${fileId}`, {
      method: 'DELETE'
    });
  }

  // Performance
  getStudentStats() {
    return this.request('/performance/stats');
  }

  getAllCategoriesPerformance() {
    return this.request('/performance/categories');
  }

  getCategoryPerformance(categoryId) {
    return this.request(`/performance/category/${categoryId}`);
  }

  getSubjectPerformance(subjectId) {
    return this.request(`/performance/subject/${subjectId}`);
  }

  getQuizPerformance(quizId) {
    return this.request(`/performance/quiz/${quizId}`);
  }

  getTopPerformingSubjects(limit = 5) {
    return this.request(`/performance/top-subjects?limit=${limit}`);
  }

  getRecentActivity(limit = 10) {
    return this.request(`/performance/recent-activity?limit=${limit}`);
  }

  getStudentRecentActivity(limit = 10) {
    return this.request(`/performance/student-activity?limit=${limit}`);
  }

  getLeaderboard(options = {}) {
    let endpoint = '/performance/leaderboard';
    const params = new URLSearchParams();
    if (options.category) params.append('category', options.category);
    if (options.period) params.append('period', options.period);
    if (options.limit) params.append('limit', options.limit);
    if (params.toString()) endpoint += `?${params.toString()}`;
    return this.request(endpoint);
  }

  recordPerformance(data) {
    return this.request('/performance/record-attempt', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  recordBulkPerformance(attempts) {
    return this.request('/performance/bulk-record', {
      method: 'POST',
      body: JSON.stringify({ attempts })
    });
  }

  getStudentDashboardStats() {
    return this.request('/performance/student-stats');
  }

  getWeeklyProgressStats() {
    return this.request('/performance/weekly-progress');
  }

  // Get specific student profile by ID (for leaderboard)
  getStudentProfileById(studentId) {
    return this.request(`/students/${studentId}/profile`);
  }

  // Student Attempts
  getStudentAttempts(studentId) {
    return this.request(`/quizzes/student/${studentId}/attempts`, { includeAuth: false });
  }

  getAttemptDetails(attemptId) {
    return this.request(`/quizzes/attempts/${attemptId}`, { includeAuth: true });
  }

  submitQuizAttempt(quizId, data) {
    return this.request(`/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Upload
  uploadQuestions(formData) {
    return fetch(`${this.baseURL}/upload/questions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    }).then(res => {
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    });
  }

  downloadQuestionTemplate() {
    return `${this.baseURL}/upload/template`;
  }

  // Sync
  getSyncSettings() {
    return this.request('/sync/settings');
  }

  updateAutoSync(autoSyncEnabled) {
    return this.request('/sync/settings', {
      method: 'PUT',
      body: JSON.stringify({ auto_sync_enabled: autoSyncEnabled })
    });
  }

  getSyncStatus() {
    return this.request('/sync/status');
  }

  syncNow() {
    return this.request('/sync/sync-now', {
      method: 'POST',
      body: JSON.stringify({})
    });
  }

  // Sessions
  recordLogin() {
    return this.request('/sessions/login', {
      method: 'POST',
      body: JSON.stringify({})
    });
  }

  recordLogout(sessionId) {
    return this.request('/sessions/logout', {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    });
  }

  getActiveSession() {
    return this.request('/sessions/active');
  }

  // Performance & History
  /**
   * Save a quiz attempt to the backend
   */
  saveQuizAttempt(attemptData) {
    return this.request('/performance/quiz-attempts', {
      method: 'POST',
      body: JSON.stringify(attemptData)
    });
  }

  /**
   * Get student's quiz history from the backend
   */
  getStudentQuizHistory(limit = 100, mode = null) {
    let endpoint = `/performance/student-history?limit=${limit}`;
    if (mode) {
      endpoint += `&mode=${mode}`;
    }
    return this.request(endpoint);
  }
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.ApiService = ApiService;
}
