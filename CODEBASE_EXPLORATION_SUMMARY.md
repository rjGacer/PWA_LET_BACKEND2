# PWA-LET Backend & Frontend Codebase Exploration Summary

## Overview
This document provides a comprehensive exploration of the quiz system, database schema, backend routes, frontend pages, and sync mechanisms in the PWA-LET (Progressive Web App Learning Evaluation Tool) system.

---

## 1. QUIZ DATABASE SCHEMA

### Core Quiz Tables

#### **quizzes**
- **Purpose**: Store quiz metadata
- **Key Fields**:
  - `id` (INT, PRIMARY KEY)
  - `subject_id` (INT, FK → subjects)
  - `title`, `description` (TEXT)
  - `time_limit` (INT, seconds)
  - `passing_score` (INT, default 70%)
  - `total_points` (INT, default 100)
  - `is_randomized` (BOOLEAN, default TRUE)
  - `show_answers` (BOOLEAN, default TRUE)
  - `created_by` (INT, FK → teachers)
  - `is_active` (BOOLEAN, soft delete flag)
  - `is_synced` (BOOLEAN, sync status)
  - `synced_at` (TIMESTAMP)
  - `created_at`, `updated_at` (TIMESTAMPS)

#### **questions**
- **Purpose**: Store individual questions
- **Key Fields**:
  - `id`, `subject_id` (FK → subjects)
  - `question_text` (TEXT)
  - `question_image` (VARCHAR 500)
  - `question_type` (ENUM: 'multiple_choice', 'true_false')
  - `difficulty` (ENUM: 'easy', 'medium', 'hard')
  - `points` (INT, default 1)
  - `explanation` (TEXT)
  - `created_by` (INT, FK → teachers)
  - `is_active`, `is_synced` (BOOLEAN)

#### **question_options**
- **Purpose**: Store multiple choice options
- **Key Fields**:
  - `id`
  - `question_id` (INT, FK → questions)
  - `option_text` (TEXT)
  - `option_image` (VARCHAR 500)
  - `is_correct` (BOOLEAN)
  - `order` (INT)

#### **quiz_questions** (Junction Table)
- **Purpose**: Link quizzes to questions (many-to-many)
- **Key Fields**:
  - `id`
  - `quiz_id` (INT, FK → quizzes)
  - `question_id` (INT, FK → questions)
  - `order` (INT, question sequence)
  - **Constraint**: UNIQUE KEY `(quiz_id, question_id)`

#### **quiz_attempts**
- **Purpose**: Store student quiz attempt records
- **Key Fields**:
  - `id`
  - `quiz_id`, `student_id` (FKs)
  - `score`, `total_points` (INT)
  - `percentage` (DECIMAL 5,2)
  - `time_spent` (INT, seconds)
  - `is_passed` (BOOLEAN)
  - `mode` (VARCHAR, tracks quiz type: 'exam', 'practice', 'module', 'random')
  - `started_at`, `submitted_at` (TIMESTAMPS)

#### **student_answers**
- **Purpose**: Store individual student answers
- **Key Fields**:
  - `id`
  - `attempt_id` (FK → quiz_attempts)
  - `question_id` (FK → questions)
  - `selected_option_id` (FK → question_options)
  - `is_correct` (BOOLEAN)
  - `points_earned` (INT)

### Supporting Tables for Quiz System

#### **categories**
- Top-level organization (General Education, Professional Education, Major/Specialization)
- `id`, `name`, `description`, `icon`, `color`, `order`, `is_active`

#### **subjects**
- Subjects within categories (e.g., "English" under "General Education")
- `id`, `category_id` (FK), `name`, `created_by` (FK → teachers)
- `is_synced` (BOOLEAN) - Sync filtering for student visibility

#### **modules**
- Learning materials associated with subjects
- `id`, `subject_id` (FK)
- `title`, `description`, `content`, `file_type`, `file_url`
- `order` (INT)
- `created_by` (FK → teachers)
- `is_synced` (BOOLEAN)

#### **module_files**
- Multiple files can be attached to a module
- `id`, `module_id` (FK), `file_name`, `file_path`, `file_type`, `file_size`

#### **category_performance**
- Dashboard statistics tracking
- `student_id`, `category_id`, `average_score`, `total_attempts`, `weak_topics` (JSON)

### Relationship Diagram
```
categories
    ↓
subjects (many per category)
    ├─→ modules (many per subject)
    ├─→ questions (many per subject)
    └─→ quizzes (many per subject)
            ↓
        quiz_questions (junction) → questions
            ↓
        quiz_attempts (student) → students
            ↓
        student_answers → question_options
```

---

## 2. BACKEND ROUTES & ENDPOINTS

### Quiz Routes (`/backend/src/routes/quizzes.js`)

| Method | Endpoint | Handler | Purpose |
|--------|----------|---------|---------|
| GET | `/` | `getAll` | List all quizzes (with mode filtering) |
| GET | `/:id` | `getById` | Get single quiz with questions |
| POST | `/` | `create` | Create new quiz |
| PUT | `/:id` | `update` | Update quiz metadata |
| DELETE | `/:id` | `delete` | Soft delete quiz |
| POST | `/:id/add-question` | `addQuestion` | Add question to quiz |
| POST | `/:id/remove-question` | `removeQuestion` | Remove question from quiz |
| POST | `/:id/submit` | `submitAttempt` | Submit quiz attempt |
| GET | `/attempts/:attemptId` | `getAttempt` | Get single attempt details |
| GET | `/student/:studentId/attempts` | `getStudentAttempts` | Get student's attempts |

### Related Routes

**Modules** (`/backend/src/routes/modules.js`)
- GET `/` - List modules by subject
- GET `/:id` - Get module details
- POST `/` - Create module

**Questions** (`/backend/src/routes/questions.js`)
- GET `/` - List questions by subject
- POST `/` - Create question
- POST `/:id/options` - Add options to question

**Sync** (`/backend/src/routes/sync.js`)
- GET `/settings` - Get teacher's sync settings
- PUT `/settings` - Update auto-sync setting
- GET `/status` - Get current sync status
- POST `/sync-now` - Trigger manual sync

**Subjects** (`/backend/src/routes/subjects.js`)
- GET `/` - List subjects by category
- GET `/categories/:categoryId` - Get subjects by category
- POST `/` - Create subject

**Categories** (`/backend/src/routes/categories.js`)
- GET `/` - List all categories

---

## 3. BACKEND CONTROLLERS & LOGIC

### Quiz Controller (`quizController.js`)

#### **Key Features**:

1. **Mode-Aware Filtering**:
   - Checks student attempts by specific `mode` parameter
   - Supports modes: 'exam', 'practice', 'module', 'random'
   - Uses `getLatestAttemptByMode()` to prevent duplicate attempts

2. **Sync Status Filtering**:
   ```javascript
   const onlySync = req.user?.role === 'student' || !req.user;
   ```
   - Students see only `is_synced = TRUE` content
   - Teachers see all their own content regardless of sync status
   - Unauthenticated users see only synced content

3. **Auto-Sync on Creation**:
   - Checks teacher's `teacher_sync_settings.auto_sync_enabled`
   - If TRUE, marks quiz as `is_synced = TRUE` immediately
   - If FALSE, marks as `is_synced = FALSE` (unsynced)

4. **Question Count**:
   - Adds `question_count` to quiz data before response
   - Uses `Quiz.getQuestionCount(quizId)`

### Module Controller (`moduleController.js`)

- **getAll()**: Lists modules with sync filtering
- **getById()**: Retrieves single module with associated files
- **create()**: Creates module and handles file uploads
  - Marks with `is_synced = FALSE` by default
  - Respects teacher's auto-sync setting
- **Files**: Module files stored in `module_files` table with separate tracking

### Question Controller (`questionController.js`)

- CRUD operations for questions
- Supports question creation with options
- Filters by sync status for student visibility

### Sync Controller (`syncController.js`)

**Key Functions**:
1. **getSyncSettings()**: Returns teacher's sync configuration
   - `auto_sync_enabled` (BOOLEAN)
   - `last_sync_time`, `last_sync_status`, `last_sync_message`
   - Counts pending unsynced items (subjects, modules, quizzes)

2. **updateAutoSync()**: Toggle auto-sync setting
   - Creates or updates `teacher_sync_settings` record
   - When enabled, syncs any pending items

3. **syncNow()**: Manual sync endpoint
   - Updates `is_synced = TRUE` and `synced_at` for pending content

---

## 4. BACKEND MODELS

### Quiz Model (`Quiz.js`)

**Methods**:
- `getAll(subjectId, onlySync)` - List with filters
- `getById(id, onlySync)` - Single quiz
- `getWithQuestions(id, onlySync)` - Full quiz with questions and options
- `create(data)` - Insert new quiz (defaults `is_synced = FALSE`)
- `update(id, data)` - Update quiz
- `delete(id)` - Soft delete
- `addQuestion(quizId, questionId, order)` - Add to quiz_questions
- `removeQuestion(quizId, questionId)` - Remove from quiz
- `getQuestionCount(quizId)` - Count questions
- `getStudentAttempts(quizId, studentId)` - All attempts
- `getStudentAttemptsByMode(quizId, studentId, mode)` - Attempts in specific mode
- `getLatestAttemptByMode(quizId, studentId, mode)` - Single most recent attempt

### Module Model (`Module.js`)

- `getAll(subjectId, onlySync)` - List modules with files
- `getById(id, onlySync)` - Single module
- `getModuleFiles(moduleId)` - Attached files
- `addModuleFile(moduleId, fileData)` - Upload file
- `deleteModuleFile(fileId)` - Soft delete file
- `create(data)` - New module
- `update(id, data)` - Edit module

### Question Model (`Question.js`)

- `getAll(subjectId, onlySync)` - Questions with filter
- `getById(id, onlySync)` - Single question
- `getWithOptions(id, onlySync)` - Question with options
- `create(data)` - New question
- `update(id, data)` - Edit question
- `addOptions(questionId, options)` - Add multiple choice options

### Subject Model (`Subject.js`)

- `getAll(categoryId, onlySync)` - Subjects with optional category filter
- `getById(id, onlySync)` - Single subject
- `getByCategoryId(categoryId, onlySync)` - Subjects in category
- `create(data)` - New subject
- `update(id, data)` - Edit subject
- `delete(id)` - Hard delete (changed from soft delete to avoid unique constraint conflicts)

### Category Model (`Category.js`)

- `getAll()` - All active categories
- `getById(id)` - Single category
- `create()`, `update()`, `delete()`

---

## 5. FRONTEND QUIZ PAGES

### Student Quiz Pages Structure

#### **studentQuiz.html** (`/student/studentQuiz.html`)
- Main quiz mode selection page
- Displays options to:
  - Take regular quizzes
  - Start practice mode
  - Exam simulation
  - Random quizzes
- Links to individual quiz modes

#### **studentQuizQuestions.html** (`/student/studentQuizQuestions.html`)
- Main quiz-taking interface
- **Features**:
  - Question display with options
  - Progress tracking (current question, percentage)
  - Mark for review functionality
  - Timer support (if time_limit set)
  - Navigation (prev/next)
  - **Key Logic**:
    - Loads quiz from backend via `?quizId=X&mode=module` parameters
    - Supports multiple modes: 'exam', 'practice', 'module', 'random'
    - Stores questions to localStorage for results page display
    - Submits attempt to backend AND stores locally via QuizResultsManager
    - Filters out corrupted "undefined" options from display

- **submitQuiz() Function** (~line 1030):
  - ALWAYS stores local result data (resultScore, resultQuestions, etc.)
  - For 'module' mode: Calls `quizResultsManager.saveModuleResult()`
  - Stores attempt data to localStorage as backup
  - Prevents undefined options from being stored

#### **studentQuizResults.html** (`/student/studentQuizResults.html`)
- Display quiz results and answer review
- **Features**:
  - Shows score percentage
  - Question-by-question review
  - Displays user's selected answer vs correct answer
  - Shows explanation for each question
  - **Data Source**: Loads from localStorage (populated by studentQuizQuestions.html)

#### **studentPractice.html** (`/student/studentPractice.html`)
- Practice mode selection interface
- Shows available quizzes for practice
- Displays attempt statistics
- Links to quiz questions page

#### **studentExamSimulation.html** (`/student/studentExamSimulation.html`)
- Exam simulation mode
- Allows selecting question count (10, 20, etc.)
- Creates random quiz from available questions

#### **studentViewModules.html** (`/student/studentViewModules.html`)
- Display subject-specific modules and module quizzes
- **Key Features** (Lines 986-1143):
  - `loadSubjectData()`: Loads modules, quizzes, and performance data
  - `renderQuizzes()`: **ASYNC function** that displays quizzes
    - Checks local IndexedDB via `quizResultsManager.getLatestResultForQuiz()` for 'module' mode
    - Falls back to backend `student_has_attempted` flag if no local result
    - Shows "View Score" button if attempt found
    - Handles search filtering
  - Stores local module results in QuizResultsManager with 'module' mode
  - Module quizzes launch with `mode=module` parameter

#### **studentHistory.html** (`/student/studentHistory.html`)
- Display all quiz attempts across all modes
- **Features**:
  - Filters by mode: Exam, Practice, Module, Random
  - Shows recent activity
  - Loads module results from QuizResultsManager
  - Groups by mode and displays statistics

#### **studentDashboard.html** (`/student/studentDashboard.html`)
- Student overview dashboard
- Shows:
  - Overall statistics (quizzes taken, average score)
  - Quick action cards (Take Quiz, Practice Mode, etc.)
  - Recent activity
  - Performance by category
  - Calls `getStudentRecentActivity()` API method (not `getRecentActivity()`)

### Dashboard Integration (`assets/scripts/dashboard-integration.js`)
- `loadRecentActivityData()`: Fetches student's recent quiz attempts
- Uses `api.getStudentRecentActivity(limit)` for student-specific data
- Displays mode label (Practice Mode, Exam, etc.)
- Shows correct score (X/Y questions answered correctly)

---

## 6. FRONTEND DATA STORAGE & QUIZ RESULTS MANAGER

### QuizResultsManager.js (`assets/scripts/QuizResultsManager.js`)

**Purpose**: Client-side quiz result storage using IndexedDB + localStorage fallback

**IndexedDB Stores** (initialized in VERSION 2):

1. **module_results** (NEW)
   - For subject/module quizzes
   - Result ID format: `module_{studentId}_{quizId}_{timestamp}`
   - Allows checking "View Score" status before backend sync

2. **quiz_results**
   - Legacy quiz result storage

3. **practice_results**
   - Practice mode quiz attempts

4. **exam_results**
   - Exam simulation results

5. **random_results**
   - Random quiz attempts

**Key Methods**:

1. **saveModuleResult(resultData)**:
   - Stores quiz result with mode='module'
   - Format: `module_{studentId}_{quizId}_{timestamp}`
   - Stores: score, questions (with answer text), explanations
   - IndexedDB or localStorage fallback
   - Returns unique result ID

2. **getLatestResultForQuiz(studentId, quizId, mode)**:
   - Retrieves most recent result for specific mode
   - Used by studentViewModules.html renderQuizzes()

3. **getStudentResultsByMode(studentId, mode)**:
   - Gets all results for a student in specific mode
   - Used by studentHistory.html

4. **saveToIndexedDB(storeName, result)**:
   - Writes to IndexedDB
   - Auto-falls back to localStorage if fails

5. **saveToLocalStorage(storeName, result)**:
   - JSON.stringify and localStorage.setItem

---

## 7. SYNC SYSTEM IMPLEMENTATION

### Sync Architecture

```
Teacher Creates Quiz/Module
        ↓
Is auto_sync_enabled?
    ├─ YES → is_synced = TRUE, synced_at = NOW()
    └─ NO  → is_synced = FALSE
        ↓
Students Request Content
        ↓
Backend checks: req.user?.role === 'student'
    ├─ YES → Filter: WHERE is_synced = TRUE
    └─ NO  → Show all created content
        ↓
Students See: Only synced content
Teachers See: All their own content
```

### Database Schema for Sync

#### **teacher_sync_settings**
- `id`, `teacher_id` (UNIQUE FK → teachers)
- `auto_sync_enabled` (BOOLEAN, default TRUE)
- `last_sync_time` (TIMESTAMP)
- `last_sync_status` (ENUM: 'pending', 'in_progress', 'success', 'failed')
- `last_sync_message` (TEXT)

### Sync Status Flags on Content

All content tables include:
- `is_synced` (BOOLEAN, default FALSE when created)
- `synced_at` (TIMESTAMP, NULL until synced)

Content Types:
- `subjects.is_synced`
- `modules.is_synced`
- `quizzes.is_synced`
- `questions.is_synced`

### Sync Flow

1. **When Auto-Sync is ENABLED**:
   - Teacher creates quiz/module/subject
   - Backend checks: `SELECT auto_sync_enabled FROM teacher_sync_settings`
   - If TRUE: Updates created content to `is_synced = TRUE`
   - Students immediately see content

2. **When Auto-Sync is DISABLED**:
   - Teacher creates quiz/module
   - Backend marks as `is_synced = FALSE`
   - Content invisible to students

3. **Manual Sync (Teacher Dashboard)**:
   - Teacher calls `/api/v1/sync/sync-now`
   - Backend updates all pending items: `SET is_synced = TRUE, synced_at = NOW()`
   - Students can now access

### Sync Filtering Logic

**Controller Pattern**:
```javascript
const onlySync = req.user?.role === 'student' || !req.user;
const quizzes = await Quiz.getAll(subjectId, onlySync);
```

**Model Query**:
```javascript
if (onlySync) {
  query += ' AND is_synced = TRUE';
}
```

### Service Worker Caching Strategy (`sw.js`)

**Problem Solved**: Deleted quizzes still showing due to stale cache

**Solution**:
1. Identify dynamic endpoints: `/quizzes`, `/modules`, `/questions`, `/subjects`, `/students`
2. **DO NOT cache** GET requests to dynamic endpoints
3. Only cache static reference data (categories)
4. When network fails on dynamic endpoints, return offline error
5. Added `CLEAR_API_CACHE` message handler for manual cache clearing

**Offline-Sync** (`assets/scripts/offline-sync.js`):
- Detects online/offline state
- Queues quiz submissions when offline
- Auto-syncs when connection restored
- Integrates with service worker background sync

---

## 8. MODULE-TO-QUIZ RELATIONSHIPS

### Data Flow

```
Category (e.g., "General Education")
    ↓
Subject (e.g., "English")
    ├─ Module 1 (e.g., "Module 1: Grammar")
    ├─ Module 2 (e.g., "Module 2: Vocabulary")
    │
    └─ Quiz 1 (e.g., "English Quiz 1")
        ├─ Question 1
        ├─ Question 2
        └─ Question 3 (with multiple choice options)
```

### Quiz Modes

Each quiz can be taken in different modes with separate tracking:

| Mode | Storage | Use Case | Attempt Limit |
|------|---------|----------|---------------|
| **exam** | exam_results | Exam simulation | May have limit |
| **practice** | practice_results | Unlimited practice | No limit |
| **module** | module_results | Subject module quiz | Usually single attempt |
| **random** | random_results | Random question pool | No limit |

### Module Quiz Implementation

**Flow in studentViewModules.html**:

1. Load subject data and modules
2. For each module, render associated quizzes
3. When rendering quizzes:
   - Check local IndexedDB (`quizResultsManager.getLatestResultForQuiz()`) for mode='module'
   - If result found: Show "View Score" button
   - If not found: Show "Start Quiz" button
4. Quiz launch: Pass `?mode=module` parameter

**In studentQuizQuestions.html**:
- Detect `mode=module` parameter
- After submission: Save to `quizResultsManager.saveModuleResult()`
- Prevent retake: Check if module result already exists
- Store questions to localStorage for results page

**In studentHistory.html**:
- Load module results from `quizResultsManager.getStudentResultsByMode(studentId, 'module')`
- Display under "Module" filter
- Show with subject name and quiz title

---

## 9. KEY RECENT FIXES & IMPROVEMENTS (May 29, 2026)

### Subject Deletion Fix
- **Issue**: Couldn't delete subjects with duplicate names
- **Cause**: Soft delete violated UNIQUE constraint `(category_id, name, is_active)`
- **Solution**: Changed Subject.delete() to hard DELETE (safe due to CASCADE)

### Practice Mode Results Display
- **Issue**: Practice mode results not showing on results page
- **Cause**: Results stored locally only in "else" branch, but practice mode had quizId
- **Solution**: Store local results ALWAYS, regardless of backend submission success

### Recent Activity Data Tracking
- **Issues**: Wrong scores shown, quiz mode not tracked, undefined options displayed
- **Solutions**:
  - Performance model updated to include `mode` and answer counts
  - Dashboard uses `getStudentRecentActivity()` instead of `getRecentActivity()`
  - Quiz.getAttempt() filters out "undefined" options

### Quiz Submission Mode Separation
- **Issue**: Subject quizzes overriding exam results, retakes allowed
- **Solution**: Created 'module' mode with:
  - Separate IndexedDB store (module_results)
  - Unique result ID format: `module_{studentId}_{quizId}_{timestamp}`
  - Retake prevention checking

### Sync System - Visibility Control
- **Issue**: Students seeing unsynced content
- **Cause**: Backwards logic checking if user exists (both students and teachers authenticated)
- **Solution**: Check role explicitly: `req.user?.role === 'student' || !req.user`

### Quiz Attempt Detection (View Score Button)
- **Issue**: View Score button not appearing after module quiz
- **Cause**: Only checked backend flag, not local IndexedDB results
- **Solution**: Made renderQuizzes() async, checks local module_results first

---

## 10. API SERVICE & INTEGRATION

### ApiService.js (`assets/scripts/ApiService.js`)

**Methods**:
- `request(endpoint, options)` - Generic HTTP method
- `get(endpoint)` - GET request
- `post(endpoint, data)` - POST with JSON body
- `put(endpoint, data)` - PUT request
- `delete(endpoint)` - DELETE request
- `getToken()` - Retrieve auth token
- `setToken(token)` - Store auth token

**Key Features**:
- Auto-detects API base URL (same host, port 5000)
- Adds `Authorization: Bearer {token}` header automatically
- Console logging for debugging (token, request/response)
- Error handling with status codes

**Dynamic Endpoints**:
- `/quizzes` - NOT cached (dynamic content)
- `/modules` - NOT cached (dynamic content)
- `/questions` - NOT cached (dynamic content)
- `/subjects` - NOT cached (dynamic content)
- `/students` - NOT cached (dynamic content)
- `/categories` - CACHED (static reference data)

### Performance API (`assets/scripts/ApiService.js` additions)

- `getStudentRecentActivity(limit)` - GET `/performance/student-activity?limit=${limit}`
  - Returns only current student's quiz attempts
  - Includes: score, total_questions, mode, timestamp

---

## 11. OFFLINE SUPPORT

### Service Worker Strategy (`sw.js`)

1. **Static Asset Caching**:
   - HTML, CSS, JS files are cached for offline use

2. **Dynamic Content Exclusion**:
   - Quiz/module/question/subject endpoints NOT cached
   - Prevents serving stale deleted content

3. **Reference Data Caching**:
   - Categories cached (rarely change)

4. **Offline Fallback**:
   - Offline-sync module queues submissions
   - Background sync API (if available)

### Offline-Sync (`assets/scripts/offline-sync.js`)

- Detects online/offline transitions
- Maintains sync queue in IndexedDB
- Auto-syncs when connection restored
- Integrates with service worker messages

---

## 12. DATABASE INTEGRITY & CONSTRAINTS

### Key Constraints

| Constraint | Purpose | Impact |
|-----------|---------|--------|
| FK quiz_questions.quiz_id → quizzes.id (ON DELETE CASCADE) | When quiz deleted, remove question associations | No orphaned quiz_questions |
| FK quiz_questions.question_id → questions.id (ON DELETE CASCADE) | When question deleted, remove from quizzes | Clean up quiz associations |
| FK quiz_attempts → quizzes (ON DELETE CASCADE) | When quiz deleted, remove attempts | Audit trail removed with quiz |
| FK student_answers → quiz_attempts (ON DELETE CASCADE) | When attempt deleted, remove answers | Detailed answers cleaned up |
| UNIQUE (quiz_id, question_id) in quiz_questions | Prevent duplicate question assignments | Each question appears once per quiz |
| UNIQUE (student_id, category_id) in category_performance | One performance record per student-category | No duplicate stats |

### Indexes for Performance

All tables include indexes on:
- `is_active` - Fast soft delete filtering
- `is_synced` - Fast sync status checks
- Foreign keys - Fast joins
- `submitted_at`, `created_at` - Fast sorting/filtering

---

## 13. AUTHENTICATION & AUTHORIZATION

### User Roles

| Role | Can See | Can Modify |
|------|---------|-----------|
| **student** | Only synced content | Quiz attempts (local + backend) |
| **teacher** | All their own content | Create/edit/delete content, configure sync |
| **admin** | All content | Manage system, users, settings |
| **unauthenticated** | Only synced content | Nothing (read-only) |

### Token Management

- Stored in localStorage: `authToken`
- Sent in every API request: `Authorization: Bearer {token}`
- JWT format (server-side validation)

---

## 14. FILE UPLOADS & MODULES

### Module File Handling

**Upload Flow**:
1. Teacher uploads file via module creation form
2. Backend stores in `/backend/uploads/` directory
3. Filename: `{timestamp}_{originalname}`
4. Database record created in `module_files` table:
   - `file_name` (server filename)
   - `file_path` (URL path)
   - `file_type` (extension)
   - `original_name` (user-friendly name)
   - `file_size` (bytes)

**Retrieval**:
- Module.getAll() includes `files` array
- Module.getById() includes files
- Files ordered by creation date (newest first)

**Deletion**:
- Soft delete: `UPDATE module_files SET is_active = FALSE`
- Prevents accidental data loss

---

## 15. COMMON CODE PATTERNS

### Quiz Retrieval Pattern
```javascript
// Backend Controller
const onlySync = req.user?.role === 'student' || !req.user;
const quiz = await Quiz.getWithQuestions(id, onlySync);

// Model
if (onlySync) {
  query += ' AND is_synced = TRUE';
}
```

### Result Storage Pattern
```javascript
// Frontend (studentQuizQuestions.html)
const result = {
  studentId,
  quizId,
  score,
  questions: [
    { questionText, selectedOptionText, explanation }
  ]
};

// For module mode
const resultId = await quizResultsManager.saveModuleResult(result);

// Store backup in localStorage
localStorage.setItem('resultScore', score);
localStorage.setItem('resultQuestions', JSON.stringify(questions));
```

### Async Quiz Loading Pattern
```javascript
// studentViewModules.html
async function renderQuizzes(filterText = '') {
  // Check local results first
  const localResults = await quizResultsManager.getStudentResultsByMode(
    studentId, 
    'module'
  );
  
  // Render with local data
  for (const quiz of quizzes) {
    const localResult = localResults.find(r => r.quizId === quiz.id);
    quiz.hasAttempted = !!localResult;
  }
}
```

---

## Summary Table

| Component | Location | Purpose |
|-----------|----------|---------|
| Quiz Schema | database/schema.sql | Define quiz data structures |
| Quiz Routes | src/routes/quizzes.js | HTTP endpoints for quizzes |
| Quiz Controller | src/controllers/quizController.js | Request handling & validation |
| Quiz Model | src/models/Quiz.js | Database operations |
| Quiz Pages | student/studentQuiz*.html | User interfaces |
| Results Manager | assets/scripts/QuizResultsManager.js | Client-side result storage |
| Sync System | src/routes/sync.js, teacher_sync_settings table | Content visibility control |
| Service Worker | sw.js | Offline support & caching |
| API Service | assets/scripts/ApiService.js | Frontend HTTP client |
| Offline Sync | assets/scripts/offline-sync.js | Queue & restore when online |

---

## Document Version
**Created**: May 29, 2026
**Last Updated**: May 29, 2026
**Scope**: Complete codebase exploration of quiz system, database, backend routes, frontend pages, modules, and sync mechanisms
