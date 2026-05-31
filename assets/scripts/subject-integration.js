/**
 * Subject Management Integration Script
 * This file should be included in subject.html and view-subject.html
 */

const api = new ApiService();

let currentCategoryId = 1;
let currentSubjectId = null;

// Initialize category ID from URL or session
function initializeCategoryId() {
  const params = new URLSearchParams(window.location.search);
  currentCategoryId = params.get('categoryId') || sessionStorage.getItem('selectedCategoryId') || 1;
  console.log('Current category ID:', currentCategoryId);
}

// Load subjects for current category
async function loadSubjectsForCategory() {
  try {
    console.log('Loading subjects for category', currentCategoryId);
    const subjects = await api.getSubjectsByCategory(currentCategoryId);
    
    if (subjects && subjects.length > 0) {
      console.log('✓ Subjects loaded:', subjects);
      populateSubjectCards(subjects);
    }
  } catch (error) {
    console.error('❌ Failed to load subjects:', error);
  }
}

// Populate subject cards in UI
function populateSubjectCards(subjects) {
  const grid = document.querySelector('.subjects-grid');
  if (!grid) return;
  
  // Keep existing subject cards but ensure they're up to date
  console.log('Subjects available:', subjects.length);
}

// Open subject details (for view-subject.html)
async function loadSubjectDetails(subjectId) {
  currentSubjectId = subjectId;
  
  try {
    console.log('Loading subject details for ID:', subjectId);
    const subject = await api.getSubjectById(subjectId);
    
    if (subject) {
      console.log('✓ Subject details loaded:', subject);
      
      // Update page title and info
      if (document.getElementById('subjectTitle')) {
        document.getElementById('subjectTitle').textContent = subject.name;
      }
      if (document.getElementById('quizCount')) {
        document.getElementById('quizCount').textContent = subject.quizzes || 0;
      }
      if (document.getElementById('moduleCount')) {
        document.getElementById('moduleCount').textContent = subject.modules || 0;
      }
      
      // Load modules and quizzes
      await loadModulesForSubject();
      await loadQuizzesForSubject();
    }
  } catch (error) {
    console.error('❌ Failed to load subject details:', error);
  }
}

// Load modules for current subject
async function loadModulesForSubject() {
  if (!currentSubjectId) return;
  
  try {
    console.log('Loading modules for subject', currentSubjectId);
    const modules = await api.getModules(currentSubjectId);
    
    if (modules && modules.length > 0) {
      console.log('✓ Modules loaded:', modules);
      populateModuleList(modules);
    }
  } catch (error) {
    console.error('❌ Failed to load modules:', error);
  }
}

// Populate module list
function populateModuleList(modules) {
  const container = document.getElementById('moduleList') || document.getElementById('modulesTabList');
  if (!container) return;
  
  container.innerHTML = modules.map(module => `
    <div class="module-item">
      <div class="module-content">
        <h4>${module.title}</h4>
        <p>${module.description || ''}</p>
        <small>Type: ${module.file_type || 'text'}</small>
      </div>
      <div class="module-actions">
        <button class="edit-btn" onclick="editModule(${module.id})">
          <i class="fa-solid fa-edit"></i>
        </button>
        <button class="delete-btn" onclick="deleteModule(${module.id})">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
  
  // Update counts
  document.querySelectorAll('[id*="moduleCount"]').forEach(el => {
    el.textContent = modules.length;
  });
}

// Load quizzes for current subject
async function loadQuizzesForSubject() {
  if (!currentSubjectId) return;
  
  try {
    console.log('Loading quizzes for subject', currentSubjectId);
    const quizzes = await api.getQuizzes(currentSubjectId);
    
    if (quizzes && quizzes.length > 0) {
      console.log('✓ Quizzes loaded:', quizzes);
      populateQuizTable(quizzes);
    }
  } catch (error) {
    console.error('❌ Failed to load quizzes:', error);
  }
}

// Populate quiz table
function populateQuizTable(quizzes) {
  const tableBody = document.getElementById('quizTableBody') || document.getElementById('quizzesTabBody');
  if (!tableBody) return;
  
  tableBody.innerHTML = quizzes.map(quiz => `
    <tr>
      <td>${quiz.title}</td>
      <td>${quiz.questions?.length || 0}</td>
      <td>${quiz.time_limit ? quiz.time_limit + ' min' : 'N/A'}</td>
      <td>${quiz.total_points || 0}</td>
      <td>
        <button class="edit-btn" onclick="editQuiz(${quiz.id})">Edit</button>
        <button class="delete-btn" onclick="deleteQuiz(${quiz.id})">Delete</button>
      </td>
    </tr>
  `).join('');
  
  // Update counts
  document.querySelectorAll('[id*="quizCount"]').forEach(el => {
    el.textContent = quizzes.length;
  });
}

// Create new module
async function createNewModule() {
  const title = document.getElementById('moduleTitleInput')?.value;
  const description = document.getElementById('moduleDescInput')?.value;
  
  if (!title || !currentSubjectId) {
    alert('Please fill in all required fields');
    return;
  }
  
  try {
    const module = await api.createModule({
      subject_id: currentSubjectId,
      title,
      description,
      content: '',
      file_type: 'text'
    });
    
    console.log('✓ Module created:', module);
    alert('Module created successfully');
    await loadModulesForSubject();
    closeModal('moduleModal');
  } catch (error) {
    console.error('❌ Failed to create module:', error);
    alert('Failed to create module: ' + error.message);
  }
}

// Create new quiz
async function createNewQuiz() {
  const title = document.getElementById('quizTitleInput')?.value;
  const timeLimit = document.getElementById('quizTimeLimitInput')?.value;
  
  if (!title || !currentSubjectId) {
    alert('Please fill in all required fields');
    return;
  }
  
  try {
    const quiz = await api.createQuiz({
      subject_id: currentSubjectId,
      title,
      description: '',
      time_limit: parseInt(timeLimit) || 30,
      passing_score: 70,
      total_points: 100,
      is_randomized: true,
      show_answers: true,
      question_ids: []
    });
    
    console.log('✓ Quiz created:', quiz);
    alert('Quiz created successfully');
    await loadQuizzesForSubject();
    closeModal('quizModal');
  } catch (error) {
    console.error('❌ Failed to create quiz:', error);
    alert('Failed to create quiz: ' + error.message);
  }
}

// Edit module
async function editModule(moduleId) {
  console.log('Editing module:', moduleId);
  // Implement edit modal
}

// Delete module
async function deleteModule(moduleId) {
  if (!confirm('Are you sure you want to delete this module?')) return;
  
  try {
    await api.deleteModule(moduleId);
    console.log('✓ Module deleted');
    await loadModulesForSubject();
  } catch (error) {
    console.error('❌ Failed to delete module:', error);
    alert('Failed to delete module: ' + error.message);
  }
}

// Edit quiz
async function editQuiz(quizId) {
  console.log('Editing quiz:', quizId);
  // Implement edit modal
}

// Delete quiz
async function deleteQuiz(quizId) {
  if (!confirm('Are you sure you want to delete this quiz?')) return;
  
  try {
    await api.deleteQuiz(quizId);
    console.log('✓ Quiz deleted');
    await loadQuizzesForSubject();
  } catch (error) {
    console.error('❌ Failed to delete quiz:', error);
    alert('Failed to delete quiz: ' + error.message);
  }
}

// Close modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('✓ Subject page initialized');
    
    // Determine which type of page this is
    if (window.location.pathname.includes('subject.html') && 
        !window.location.pathname.includes('view-subject')) {
      initializeCategoryId();
      loadSubjectsForCategory();
    } else if (window.location.pathname.includes('view-subject')) {
      const params = new URLSearchParams(window.location.search);
      const subjectId = params.get('subjectId') || 1;
      loadSubjectDetails(subjectId);
    }
  });
} else {
  console.log('✓ Subject page initialized');
  
  if (window.location.pathname.includes('subject.html') && 
      !window.location.pathname.includes('view-subject')) {
    initializeCategoryId();
    loadSubjectsForCategory();
  }
}

window.subjectApi = {
  loadSubjectsForCategory,
  loadSubjectDetails,
  loadModulesForSubject,
  loadQuizzesForSubject,
  createNewModule,
  createNewQuiz,
  editModule,
  deleteModule,
  editQuiz,
  deleteQuiz,
  closeModal,
  api
};
