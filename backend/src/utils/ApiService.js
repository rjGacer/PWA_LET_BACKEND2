/**
 * API Service Helper
 * Utility class for making API calls from the frontend
 */

class ApiService {
  constructor(baseURL = 'http://localhost:5000/api/v1') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('authToken');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(options.includeAuth !== false),
      ...options
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
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
    return this.request(endpoint, { includeAuth: false });
  }

  getSubjectById(id) {
    return this.request(`/subjects/${id}`, { includeAuth: false });
  }

  getSubjectsByCategory(categoryId) {
    return this.request(`/subjects/category/${categoryId}`, { includeAuth: false });
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
    return this.request(endpoint, { includeAuth: false });
  }

  getQuestionById(id) {
    return this.request(`/questions/${id}`, { includeAuth: false });
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
  getQuizzes(subjectId = null) {
    let endpoint = '/quizzes';
    if (subjectId) endpoint += `?subjectId=${subjectId}`;
    return this.request(endpoint, { includeAuth: false });
  }

  getQuizById(id) {
    return this.request(`/quizzes/${id}`, { includeAuth: false });
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
    return this.request(`/modules?subjectId=${subjectId}`, { includeAuth: false });
  }

  getModuleById(id) {
    return this.request(`/modules/${id}`, { includeAuth: false });
  }

  createModule(data) {
    return this.request('/modules', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateModule(id, data) {
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
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.ApiService = ApiService;
}
