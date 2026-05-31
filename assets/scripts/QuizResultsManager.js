/**
 * QuizResultsManager.js
 * Manages independent storage of Quiz and Practice mode results locally
 * No backend calls - fully client-side storage
 * 
 * Shared Data Fields:
 * - question: question text and ID
 * - answer: selected option
 * - explanation: answer explanation
 */

class QuizResultsManager {
  constructor() {
    this.DB_NAME = 'LearnIQ-QuizResults';
    this.VERSION = 3;  // BUMPED to 3: Force database upgrade to ensure module_results store exists
    this.db = null;
    this.dbReady = this.initDB(); // Store the promise so we can wait for it
  }

  /**
   * Wait for database to be ready
   */
  async ensureReady() {
    await this.dbReady;
  }

  /**
   * Initialize IndexedDB for better storage management
   */
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.VERSION);

      request.onerror = () => {
        console.warn('❌ IndexedDB failed, falling back to localStorage');
        resolve(false);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized');
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Module results store - for subject/module quizzes (NEW)
        if (!db.objectStoreNames.contains('module_results')) {
          const moduleStore = db.createObjectStore('module_results', { keyPath: 'id', autoIncrement: true });
          moduleStore.createIndex('quizId', 'quizId', { unique: false });
          moduleStore.createIndex('studentId', 'studentId', { unique: false });
          moduleStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Quiz results store - for subject quizzes
        if (!db.objectStoreNames.contains('quiz_results')) {
          const quizStore = db.createObjectStore('quiz_results', { keyPath: 'id', autoIncrement: true });
          quizStore.createIndex('quizId', 'quizId', { unique: false });
          quizStore.createIndex('studentId', 'studentId', { unique: false });
          quizStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Practice results store - for practice mode
        if (!db.objectStoreNames.contains('practice_results')) {
          const practiceStore = db.createObjectStore('practice_results', { keyPath: 'id', autoIncrement: true });
          practiceStore.createIndex('quizId', 'quizId', { unique: false });
          practiceStore.createIndex('studentId', 'studentId', { unique: false });
          practiceStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Exam simulation results
        if (!db.objectStoreNames.contains('exam_results')) {
          const examStore = db.createObjectStore('exam_results', { keyPath: 'id', autoIncrement: true });
          examStore.createIndex('studentId', 'studentId', { unique: false });
          examStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Random quiz results
        if (!db.objectStoreNames.contains('random_results')) {
          const randomStore = db.createObjectStore('random_results', { keyPath: 'id', autoIncrement: true });
          randomStore.createIndex('studentId', 'studentId', { unique: false });
          randomStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Save a quiz result (for subject/module quizzes)
   * CRITICAL: Each quiz result gets a UNIQUE ID with 'quiz_' prefix
   * Result is stored separately from practice/exam/random results
   * @param {Object} resultData - Quiz result data
   *   - studentId: numeric student ID
   *   - quizId: numeric quiz ID (may be null for random quizzes)
   *   - quizTitle: title of the quiz
   *   - score: percentage score (0-100)
   *   - questions: array with shared fields (questionText, selectedOptionText, explanation)
   * @returns {string} - Unique result ID like "quiz_123_456_1234567890"
   */
  async saveQuizResult(resultData) {
    // ✅ CRITICAL: Wait for database to be ready before using it
    await this.ensureReady();
    
    const result = {
      ...resultData,
      mode: 'quiz',
      timestamp: Date.now(),
      // UNIQUE ID format: quiz_{studentId}_{quizId}_{timestamp}
      id: `quiz_${resultData.studentId}_${resultData.quizId}_${Date.now()}`
    };

    console.log(`💾 [QUIZ_RESULT] Saving to 'quiz_results' store:`, {
      id: result.id,
      studentId: result.studentId,
      quizId: result.quizId,
      score: result.score
    });

    // Try IndexedDB first, fall back to localStorage
    if (this.db) {
      try {
        await this.saveToIndexedDB('quiz_results', result);
      } catch (e) {
        console.warn('❌ IndexedDB save failed, using localStorage:', e);
        this.saveToLocalStorage('quiz_results', result);
      }
    } else {
      // Fallback to localStorage
      this.saveToLocalStorage('quiz_results', result);
    }

    // Sync to backend
    await this.syncResultToBackend(result);
    return result.id;
  }

  /**
   * Save a module result (for subject/module quizzes - NEW MODE)
   * CRITICAL: Module results ARE stored locally for quick retrieval on View Modules page
   * Result is also synced to backend for persistent storage
   * @param {Object} resultData - Module result data
   *   - studentId: numeric student ID
   *   - quizId: numeric quiz ID
   *   - quizTitle: title of the quiz
   *   - score: percentage score (0-100)
   *   - questions: array with shared fields (questionText, selectedOptionText, explanation)
   *   - subjectId: ID of the subject
   *   - subjectName: name of the subject
   * @returns {string} - Unique result ID like "module_123_456_1234567890"
   */
  async saveModuleResult(resultData) {
    const result = {
      ...resultData,
      mode: 'module',
      timestamp: Date.now(),
      // UNIQUE ID format: module_{studentId}_{quizId}_{timestamp}
      id: `module_${resultData.studentId}_${resultData.quizId}_${Date.now()}`
    };

    console.log(`\n💾 [MODULE_RESULT] Saving module result to local storage`);
    console.log(`   ID: ${result.id}`);
    console.log(`   StudentId: ${result.studentId}`);
    console.log(`   QuizId: ${result.quizId}`);
    console.log(`   Score: ${result.score}%`);
    console.log(`   Subject: ${result.subjectName}`);

    // Save to IndexedDB/localStorage for quick retrieval
    if (this.db) {
      try {
        await this.saveToIndexedDB('module_results', result);
        console.log(`✅ Saved to IndexedDB 'module_results' store`);
      } catch (e) {
        console.warn('❌ IndexedDB save failed, using localStorage:', e);
        this.saveToLocalStorage('module_results', result);
      }
    } else {
      // Fallback to localStorage
      this.saveToLocalStorage('module_results', result);
      console.log(`✅ Saved to localStorage 'module_results'`);
    }

    // No backend sync needed - already submitted in studentQuizQuestions.html
    // This prevents double submission and duplication
    return result.id;
  }

  /**
   * Save a practice mode result
   * CRITICAL: Practice results ARE stored locally for quick retrieval
   * Result is also synced to backend for persistent storage
   * @param {Object} resultData - Practice result data
   *   - studentId: numeric student ID
   *   - quizId: numeric quiz ID
   *   - quizTitle: title of the quiz
   *   - score: percentage score (0-100)
   *   - questions: array with shared fields (questionText, selectedOptionText, explanation)
   * @returns {string} - Unique result ID like "practice_123_456_1234567890"
   */
  async savePracticeResult(resultData) {
    const result = {
      ...resultData,
      mode: 'practice',
      timestamp: Date.now(),
      // UNIQUE ID format: practice_{studentId}_{quizId}_{timestamp}
      // DIFFERENT from quiz_ prefix to ensure complete independence
      id: `practice_${resultData.studentId}_${resultData.quizId}_${Date.now()}`
    };

    console.log(`💾 [PRACTICE_RESULT] Saving practice result to local storage`, {
      id: result.id,
      studentId: result.studentId,
      quizId: result.quizId,
      score: result.score
    });

    // Save to IndexedDB/localStorage for quick retrieval
    if (this.db) {
      try {
        await this.saveToIndexedDB('practice_results', result);
        console.log(`✅ Saved to IndexedDB 'practice_results' store`);
      } catch (e) {
        console.warn('❌ IndexedDB save failed, using localStorage:', e);
        this.saveToLocalStorage('practice_results', result);
      }
    } else {
      // Fallback to localStorage
      this.saveToLocalStorage('practice_results', result);
      console.log(`✅ Saved to localStorage 'practice_results'`);
    }

    // No backend sync needed - already submitted in studentQuizQuestions.html
    // This prevents double submission and duplication
    return result.id;
  }

  /**
   * Save an exam simulation result
   * CRITICAL: Each exam result gets a UNIQUE ID with 'exam_' prefix
   * Result is stored SEPARATELY from quiz/practice/random results
   * @param {Object} resultData - Exam result data
   *   - studentId: numeric student ID
   *   - score: percentage score (0-100)
   *   - questions: array with shared fields (questionText, selectedOptionText, explanation)
   * @returns {string} - Unique result ID like "exam_123_1234567890"
   */
  async saveExamResult(resultData) {
    const result = {
      ...resultData,
      mode: 'exam',
      timestamp: Date.now(),
      // UNIQUE ID format: exam_{studentId}_{timestamp}
      id: `exam_${resultData.studentId}_${Date.now()}`
    };

    console.log(`💾 [EXAM_RESULT] Saving to 'exam_results' store (INDEPENDENT):`, {
      id: result.id,
      studentId: result.studentId,
      score: result.score
    });

    if (this.db) {
      try {
        await this.saveToIndexedDB('exam_results', result);
      } catch (e) {
        console.warn('❌ IndexedDB save failed, using localStorage:', e);
        this.saveToLocalStorage('exam_results', result);
      }
    } else {
      this.saveToLocalStorage('exam_results', result);
    }

    // Sync to backend
    await this.syncResultToBackend(result);
    return result.id;
  }

  /**
   * Save a random quiz result
   * CRITICAL: Random results are NO LONGER stored locally (removed to fix duplication bug)
   * Result is only synced to backend for persistent storage
   * @param {Object} resultData - Random quiz result data
   *   - studentId: numeric student ID
   *   - score: percentage score (0-100)
   *   - questions: array with shared fields (questionText, selectedOptionText, explanation)
   *   - category: category of the random quiz
   * @returns {string} - Unique result ID like "random_123_1234567890"
   */
  async saveRandomResult(resultData) {
    const result = {
      ...resultData,
      mode: 'random',
      timestamp: Date.now(),
      // UNIQUE ID format: random_{studentId}_{timestamp}
      id: `random_${resultData.studentId}_${Date.now()}`
    };

    console.log(`\n💾 [RANDOM_RESULT] SAVING RANDOM QUIZ RESULT (Backend only):`);
    console.log(`   ID: ${result.id}`);
    console.log(`   StudentId: ${result.studentId}`);
    console.log(`   Category: ${result.category}`);
    console.log(`   Score: ${result.score}%`);
    console.log(`   ⚠️  LOCAL STORAGE DISABLED - Syncing to backend only`);

    // Sync to backend only (no local storage to prevent duplication bug)
    await this.syncResultToBackend(result);
    return result.id;
  }

  /**
   * Get a result by ID
   * @param {string} resultId - Result ID
   * @param {string} mode - Mode: quiz, practice, exam, random
   * @returns {Promise<Object>} - Result data
   */
  async getResultById(resultId, mode = 'quiz') {
    // ✅ CRITICAL: Wait for database to be ready before using it
    await this.ensureReady();
    
    const storeName = `${mode}_results`;

    // Check IndexedDB first
    if (this.db) {
      try {
        return await this.getFromIndexedDB(storeName, resultId);
      } catch (e) {
        console.warn('❌ IndexedDB retrieval failed, trying localStorage:', e);
      }
    }

    // Fall back to localStorage
    return this.getFromLocalStorage(storeName, resultId);
  }

  /**
   * Get all results for a student by mode
   * @param {string|number} studentId - Student ID
   * @param {string} mode - Mode: quiz, practice, exam, random, module
   * @returns {Promise<Array>} - Array of results
   */
  async getStudentResultsByMode(studentId, mode = 'quiz') {
    // ✅ CRITICAL: Wait for database to be ready before using it
    await this.ensureReady();
    
    const storeName = `${mode}_results`;
    const normalizedStudentId = parseInt(studentId);
    console.log(`\n📖 [getStudentResultsByMode] Getting ${mode} results for studentId: ${studentId} (normalized: ${normalizedStudentId})`);

    if (this.db) {
      try {
        console.log(`   Attempting IndexedDB retrieval from '${storeName}'...`);
        const results = await this.getAllFromIndexedDB(storeName, 'studentId', normalizedStudentId);
        console.log(`✅ [getStudentResultsByMode] Retrieved ${results.length} results from IndexedDB`);
        return results;
      } catch (e) {
        console.warn(`❌ [getStudentResultsByMode] IndexedDB retrieval failed:`, e.message);
        console.log(`   Falling back to localStorage...`);
      }
    } else {
      console.log(`⚠️  [getStudentResultsByMode] IndexedDB not available, using localStorage`);
    }

    const results = this.getAllFromLocalStorage(storeName, normalizedStudentId);
    console.log(`✅ [getStudentResultsByMode] Retrieved ${results.length} results from localStorage`);
    return results;
  }

  /**
   * Get latest result for a specific quiz by student
   * @param {string|number} studentId - Student ID
   * @param {string|number} quizId - Quiz ID
   * @param {string} mode - Mode: quiz, practice, exam, random
   * @returns {Promise<Object|null>} - Latest result or null
   */
  async getLatestResultForQuiz(studentId, quizId, mode = 'quiz') {
    if (mode === 'exam' || mode === 'random') {
      // Exam and random don't have specific quiz IDs
      return null;
    }

    const results = await this.getStudentResultsByMode(studentId, mode);
    const filtered = results.filter(r => r.quizId === quizId || r.quizId === parseInt(quizId));
    
    if (filtered.length === 0) return null;

    // Return most recent
    return filtered.sort((a, b) => b.timestamp - a.timestamp)[0];
  }

  /**
   * Delete a result
   * @param {string} resultId - Result ID
   * @param {string} mode - Mode: quiz, practice, exam, random
   */
  async deleteResult(resultId, mode = 'quiz') {
    const storeName = `${mode}_results`;

    if (this.db) {
      try {
        return await this.deleteFromIndexedDB(storeName, resultId);
      } catch (e) {
        console.warn('❌ IndexedDB delete failed, trying localStorage:', e);
      }
    }

    return this.deleteFromLocalStorage(storeName, resultId);
  }

  /**
   * Clear all results for a specific mode
   * @param {string} mode - Mode: quiz, practice, exam, random
   */
  async clearResultsByMode(mode = 'quiz') {
    const storeName = `${mode}_results`;

    if (this.db) {
      try {
        return await this.clearIndexedDB(storeName);
      } catch (e) {
        console.warn('❌ IndexedDB clear failed, trying localStorage:', e);
      }
    }

    this.clearLocalStorage(storeName);
  }

  /**
   * IndexedDB helpers
   */
  async saveToIndexedDB(storeName, data) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(data.id);
      request.onerror = () => reject(request.error);
    });
  }

  async getFromIndexedDB(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllFromIndexedDB(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction([storeName], 'readonly');
        const store = tx.objectStore(storeName);
        const index = store.index(indexName);
        const normalizedValue = parseInt(value);
        const request = index.getAll(normalizedValue);

        request.onsuccess = () => {
          const results = request.result || [];
          console.log(`   IndexedDB query for ${indexName}=${normalizedValue} returned ${results.length} results`);
          if (results.length > 0) {
            resolve(results);
          } else {
            // Try with string version as fallback
            console.log(`   No results found with number, trying with string value...`);
            const stringValue = String(value);
            const stringRequest = index.getAll(stringValue);
            stringRequest.onsuccess = () => {
              const stringResults = stringRequest.result || [];
              console.log(`   IndexedDB query for ${indexName}=${stringValue} returned ${stringResults.length} results`);
              resolve(stringResults);
            };
            stringRequest.onerror = () => {
              console.log(`   String query also failed, returning empty results`);
              resolve(results);
            };
          }
        };
        request.onerror = () => {
          console.warn(`   IndexedDB query error: ${request.error}`);
          reject(request.error);
        };
      } catch (e) {
        console.warn(`   Error in getAllFromIndexedDB: ${e.message}`);
        reject(e);
      }
    });
  }

  async deleteFromIndexedDB(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearIndexedDB(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * localStorage helpers
   */
  saveToLocalStorage(storeName, data) {
    const allResults = JSON.parse(localStorage.getItem(storeName) || '[]');
    allResults.push(data);
    localStorage.setItem(storeName, JSON.stringify(allResults));
  }

  getFromLocalStorage(storeName, id) {
    const allResults = JSON.parse(localStorage.getItem(storeName) || '[]');
    return allResults.find(r => r.id === id) || null;
  }

  getAllFromLocalStorage(storeName, studentId) {
    const allResults = JSON.parse(localStorage.getItem(storeName) || '[]');
    return allResults.filter(r => r.studentId === studentId || r.studentId === parseInt(studentId));
  }

  deleteFromLocalStorage(storeName, id) {
    const allResults = JSON.parse(localStorage.getItem(storeName) || '[]');
    const filtered = allResults.filter(r => r.id !== id);
    localStorage.setItem(storeName, JSON.stringify(filtered));
  }

  clearLocalStorage(storeName) {
    localStorage.removeItem(storeName);
  }

  /**
   * Export all results for backup
   * NOTE: Practice and Module results are not included as they are no longer stored locally
   * @returns {Object} - All results by mode
   */
  async exportAllResults() {
    const modes = ['quiz', 'exam', 'random'];  // Removed 'practice' and 'module' - no longer stored locally
    const exported = {};

    for (const mode of modes) {
      if (this.db) {
        try {
          exported[mode] = await this.getAllFromIndexedDB(`${mode}_results`, 'timestamp', undefined);
        } catch (e) {
          exported[mode] = [];
        }
      } else {
        exported[mode] = JSON.parse(localStorage.getItem(`${mode}_results`) || '[]');
      }
    }

    return exported;
  }

  /**
   * Sync a quiz result to the backend
   * This sends the result to the server for persistent storage
   */
  async syncResultToBackend(result) {
    try {
      // Check if ApiService is available
      if (typeof window === 'undefined' || !window.ApiService) {
        console.warn('⚠️ ApiService not available, skipping backend sync');
        return false;
      }

      const api = new ApiService();
      const studentId = parseInt(localStorage.getItem('userId'));

      // Calculate correct answers count from questions
      const correctAnswers = (result.questions || []).filter(q => q.isCorrect).length;
      const totalQuestions = (result.questions || []).length;

      const attemptData = {
        quizId: result.quizId || null,
        quizTitle: result.quizTitle,
        category: result.category || result.subjectName || (result.mode === 'exam' ? 'Exam Simulation' : 'Unknown'),
        score: result.score || 0,
        totalQuestions: totalQuestions || 0,
        correctAnswers: correctAnswers || 0,
        timeSpent: result.timeSpent || 0,
        mode: result.mode || 'quiz',
        answers: (result.questions || []).map((q, idx) => ({
          questionId: q.questionId || idx,
          selectedOption: q.selectedOptionText || q.answer || '',
          isCorrect: q.isCorrect || false
        }))
      };

      console.log('🔄 Syncing result to backend:', attemptData);
      const response = await api.saveQuizAttempt(attemptData);
      
      if (response && response.success) {
        console.log('✅ Result synced to backend successfully');
        return true;
      } else {
        console.warn('⚠️ Backend sync response was not successful:', response);
        return false;
      }
    } catch (error) {
      console.warn('⚠️ Error syncing result to backend:', error);
      // Don't throw - let the result stay local if sync fails
      return false;
    }
  }
}

// Create global instance and expose to window
const quizResultsManager = new QuizResultsManager();
window.quizResultsManager = quizResultsManager;
