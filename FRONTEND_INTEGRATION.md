# Frontend Integration Guide

This guide shows how to integrate your teacher UI with the backend API.

## Quick Start

### 1. Copy API Service to Your Project

Copy `backend/src/utils/ApiService.js` to your frontend scripts folder:

```bash
cp backend/src/utils/ApiService.js assets/scripts/
```

### 2. Include API Service in Your HTML

Add to all teacher pages (dashboard, categories, subject, etc.):

```html
<script src="../assets/scripts/ApiService.js"></script>
```

### 3. Initialize API Service

Create a new file `assets/scripts/api.js`:

```javascript
// Initialize API Service
const api = new ApiService('http://localhost:5000/api/v1');

// Helper function to get auth token
function getAuthToken() {
  return localStorage.getItem('authToken');
}

// Helper function to set auth token
function setAuthToken(token) {
  api.setToken(token);
}

// Check if user is authenticated
function isAuthenticated() {
  return !!getAuthToken();
}
```

Add to your HTML pages:
```html
<script src="../assets/scripts/api.js"></script>
```

---

## Integration Examples

### Categories Page (categories.html)

```javascript
// Load categories when page loads
async function loadCategories() {
  try {
    const categories = await api.getCategories();
    console.log('Categories:', categories);
    // Update your UI with categories
  } catch (error) {
    console.error('Failed to load categories:', error);
  }
}

// Load on page load
window.addEventListener('DOMContentLoaded', loadCategories);
```

### Subject Page (subject.html)

```javascript
// Load subjects for a category
async function loadSubjects(categoryId = 1) {
  try {
    const subjects = await api.getSubjectsByCategory(categoryId);
    console.log('Subjects:', subjects);
    // Populate your subject grid
    subjects.forEach(subject => {
      // Create subject card
    });
  } catch (error) {
    console.error('Failed to load subjects:', error);
  }
}

// Create new subject
async function createNewSubject(formData) {
  if (!isAuthenticated()) {
    alert('Please login first');
    return;
  }

  try {
    const newSubject = await api.createSubject({
      category_id: parseInt(formData.categoryId),
      name: formData.name,
      description: formData.description,
      icon: formData.icon,
      color: formData.color
    });
    
    console.log('Subject created:', newSubject);
    loadSubjects(); // Refresh the list
  } catch (error) {
    console.error('Failed to create subject:', error);
  }
}

// Edit subject
async function editSubject(subjectId, formData) {
  try {
    const updated = await api.updateSubject(subjectId, {
      name: formData.name,
      description: formData.description,
      icon: formData.icon,
      color: formData.color
    });
    
    console.log('Subject updated:', updated);
    loadSubjects();
  } catch (error) {
    console.error('Failed to update subject:', error);
  }
}

// Delete subject
async function deleteSubject(subjectId) {
  if (!confirm('Are you sure?')) return;

  try {
    await api.deleteSubject(subjectId);
    console.log('Subject deleted');
    loadSubjects();
  } catch (error) {
    console.error('Failed to delete subject:', error);
  }
}
```

### View Subject Page (view-subject.html)

```javascript
let currentSubjectId = 1; // Get from URL params or session

// Load subject details
async function loadSubjectDetails() {
  try {
    const subject = await api.getSubjectById(currentSubjectId);
    document.getElementById('subjectTitle').textContent = subject.name;
    document.getElementById('quizCount').textContent = subject.quizzes;
    document.getElementById('moduleCount').textContent = subject.modules;
  } catch (error) {
    console.error('Failed to load subject:', error);
  }
}

// Load modules
async function loadModules() {
  try {
    const modules = await api.getModules(currentSubjectId);
    const moduleList = document.getElementById('moduleList');
    moduleList.innerHTML = '';
    
    modules.forEach(module => {
      const item = document.createElement('div');
      item.innerHTML = `
        <div class="module-item">
          <h4>${module.title}</h4>
          <p>${module.description}</p>
        </div>
      `;
      moduleList.appendChild(item);
    });
  } catch (error) {
    console.error('Failed to load modules:', error);
  }
}

// Load quizzes
async function loadQuizzes() {
  try {
    const quizzes = await api.getQuizzes(currentSubjectId);
    const quizTable = document.getElementById('quizTableBody');
    quizTable.innerHTML = '';
    
    quizzes.forEach(quiz => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${quiz.title}</td>
        <td>${quiz.questions?.length || 0}</td>
        <td>${quiz.time_limit} min</td>
        <td>${quiz.total_points}</td>
        <td>
          <button onclick="editQuiz(${quiz.id})">Edit</button>
          <button onclick="deleteQuiz(${quiz.id})">Delete</button>
        </td>
      `;
      quizTable.appendChild(row);
    });
  } catch (error) {
    console.error('Failed to load quizzes:', error);
  }
}

// Create module
async function createModule(formData) {
  try {
    const module = await api.createModule({
      subject_id: currentSubjectId,
      title: formData.title,
      description: formData.description,
      content: formData.content,
      file_type: formData.fileType,
      file_url: formData.fileUrl
    });
    
    console.log('Module created:', module);
    loadModules();
    closeModal('moduleModal');
  } catch (error) {
    console.error('Failed to create module:', error);
  }
}

// Create quiz
async function createQuiz(formData) {
  try {
    const quiz = await api.createQuiz({
      subject_id: currentSubjectId,
      title: formData.title,
      description: formData.description,
      time_limit: formData.timeLimit,
      passing_score: formData.passingScore,
      total_points: formData.totalPoints,
      is_randomized: formData.isRandomized,
      show_answers: formData.showAnswers,
      question_ids: formData.questionIds || []
    });
    
    console.log('Quiz created:', quiz);
    loadQuizzes();
    closeModal('quizModal');
  } catch (error) {
    console.error('Failed to create quiz:', error);
  }
}

// Delete quiz
async function deleteQuiz(quizId) {
  if (!confirm('Delete this quiz?')) return;

  try {
    await api.deleteQuiz(quizId);
    loadQuizzes();
  } catch (error) {
    console.error('Failed to delete quiz:', error);
  }
}

// Load on page init
window.addEventListener('DOMContentLoaded', () => {
  loadSubjectDetails();
  loadModules();
  loadQuizzes();
});
```

### Dashboard (dashboard.html)

```javascript
// Load dashboard statistics
async function loadDashboardStats() {
  try {
    const stats = await api.getStudentStats();
    document.querySelector('[data-stat="students"]').textContent = stats.total_students;
    document.querySelector('[data-stat="average"]').textContent = stats.average_score + '%';
    document.querySelector('[data-stat="attempts"]').textContent = stats.total_attempts;
    document.querySelector('[data-stat="active"]').textContent = stats.total_students; // or active users count
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

// Load category performance chart
async function loadCategoryPerformance() {
  try {
    const categories = await api.getAllCategoriesPerformance();
    
    // Update your chart with category data
    const labels = categories.map(c => c.name);
    const scores = categories.map(c => parseFloat(c.average_score) || 0);
    
    console.log('Category Performance:', { labels, scores });
    // Pass to your chart library (Chart.js, etc.)
  } catch (error) {
    console.error('Failed to load performance:', error);
  }
}

// Load recent activity
async function loadRecentActivity() {
  try {
    const activity = await api.getRecentActivity(10);
    const container = document.getElementById('recentActivityList');
    container.innerHTML = '';
    
    activity.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.student_name}</td>
        <td>${item.quiz_title}</td>
        <td>${item.percentage}%</td>
        <td>${new Date(item.submitted_at).toLocaleDateString()}</td>
      `;
      container.appendChild(row);
    });
  } catch (error) {
    console.error('Failed to load activity:', error);
  }
}

// Load dashboard on init
window.addEventListener('DOMContentLoaded', () => {
  loadDashboardStats();
  loadCategoryPerformance();
  loadRecentActivity();
});
```

### Bulk Question Upload

```javascript
async function handleQuestionUpload(fileInput) {
  const file = fileInput.files[0];
  if (!file) {
    alert('Please select a file');
    return;
  }

  const subjectId = document.getElementById('subjectSelect').value;
  if (!subjectId) {
    alert('Please select a subject');
    return;
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject_id', subjectId);

    const result = await api.uploadQuestions(formData);
    
    alert(`Upload complete!\nSuccessful: ${result.successful}\nFailed: ${result.failed}`);
    
    if (result.errors.length > 0) {
      console.log('Errors:', result.errors);
    }

    // Reload questions
    loadQuestions();
  } catch (error) {
    console.error('Upload failed:', error);
    alert('Upload failed: ' + error.message);
  }
}

// Download template
function downloadTemplate() {
  const templateUrl = api.downloadQuestionTemplate();
  window.location.href = templateUrl;
}
```

---

## Authentication Flow

For a complete authentication system:

```javascript
// Login (implement based on your backend)
async function login(email, password) {
  try {
    // Send credentials to your auth endpoint
    const response = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) throw new Error('Login failed');
    
    const data = await response.json();
    setAuthToken(data.token);
    
    // Redirect to dashboard
    window.location.href = '/teacher/dashboard.html';
  } catch (error) {
    console.error('Login error:', error);
  }
}

// Logout
function logout() {
  localStorage.removeItem('authToken');
  window.location.href = '/login.html';
}

// Check auth on page load
window.addEventListener('DOMContentLoaded', () => {
  if (!isAuthenticated()) {
    // Redirect to login for protected pages
    if (window.location.pathname.includes('/teacher/')) {
      window.location.href = '/login.html';
    }
  }
});
```

---

## Environment Configuration

Create `assets/scripts/config.js`:

```javascript
// API Configuration
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:5000/api/v1'
  },
  production: {
    baseURL: 'https://your-api-domain.com/api/v1'
  }
};

const environment = process.env.NODE_ENV || 'development';
const api = new ApiService(API_CONFIG[environment].baseURL);
```

---

## Error Handling Best Practices

```javascript
async function safeApiCall(apiMethod, ...args) {
  try {
    return await apiMethod(...args);
  } catch (error) {
    console.error('API Error:', error);
    
    // Handle specific error cases
    if (error.message.includes('401')) {
      // Unauthorized - redirect to login
      window.location.href = '/login.html';
    } else if (error.message.includes('403')) {
      // Forbidden
      alert('You do not have permission to perform this action');
    } else if (error.message.includes('404')) {
      // Not found
      alert('Resource not found');
    } else {
      // Generic error
      alert('An error occurred: ' + error.message);
    }
    
    return null;
  }
}
```

---

## Next Steps

1. Install backend: `npm install` in the backend directory
2. Set up MySQL database using `database/schema.sql`
3. Configure `.env` file
4. Start the server: `npm run dev`
5. Include `ApiService.js` in your HTML pages
6. Update your JavaScript to use the API methods
7. Test endpoints using Postman or your browser

For detailed API documentation, see `API_DOCUMENTATION.md`.
