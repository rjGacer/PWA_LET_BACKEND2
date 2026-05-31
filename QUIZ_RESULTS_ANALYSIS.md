# Quiz Result Storage & Retrieval System Analysis
## PWA-LET Backend Project

**Analysis Date:** May 29, 2026

---

## 1. Database Schema - Quiz Results Storage

### 1.1 Quiz Attempts Table (`quiz_attempts`)

The primary table storing quiz attempt results:

```sql
CREATE TABLE `quiz_attempts` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `quiz_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `score` INT,                    -- Points earned
  `total_points` INT,             -- Maximum possible points
  `percentage` DECIMAL(5, 2),     -- Calculated score %
  `time_spent` INT,               -- Duration in seconds
  `is_passed` BOOLEAN,            -- TRUE if percentage >= 70
  `mode` ENUM('practice', 'exam', 'random') DEFAULT 'exam',
  `started_at` TIMESTAMP,
  `submitted_at` TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  INDEX `idx_quiz_id` (`quiz_id`),
  INDEX `idx_student_id` (`student_id`),
  INDEX `idx_submitted_at` (`submitted_at`),
  INDEX `idx_is_passed` (`is_passed`),
  INDEX `idx_mode` (`mode`)         -- For mode filtering
) ENGINE=InnoDB;
```

**Key Field:** `mode` column distinguishes between three types of quizzes
- Migration: `backend/database/add_mode_to_quiz_attempts.sql`

### 1.2 Student Answers Table (`student_answers`)

Stores individual question answers for each attempt:

```sql
CREATE TABLE `student_answers` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `attempt_id` INT NOT NULL,
  `question_id` INT NOT NULL,
  `selected_option_id` INT,       -- Which option was selected
  `is_correct` BOOLEAN,           -- Whether answer was correct
  `points_earned` INT,            -- Points for this question
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`attempt_id`) REFERENCES `quiz_attempts` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`selected_option_id`) REFERENCES `question_options` (`id`) ON DELETE SET NULL,
  INDEX `idx_attempt_id` (`attempt_id`),
  INDEX `idx_question_id` (`question_id`)
) ENGINE=InnoDB;
```

---

## 2. Three Quiz Modes - Key Distinctions

### Mode 1: `practice`
- **Usage:** Subject/module-specific practice quizzes
- **Characteristics:**
  - Part of learning modules for a subject
  - Students can retake multiple times
  - Used to learn and review material
  - Not time-limited (or longer time limits)
- **Data File:** Tracks in `dashboard-integration.js` line 91
- **Display Tag:** Green badge "Practice Mode"
- **Frontend:** `student/studentPractice.html`

### Mode 2: `exam` (Exam Simulation)
- **Usage:** Timed mock exam simulations
- **Characteristics:**
  - Simulates real LET exam conditions
  - Time-limited (configurable: 10-180 minutes)
  - Auto-submit when time expires
  - Multiple question sets (10-100 questions)
  - Questions pulled from multiple categories
- **Data File:** Tracks in `dashboard-integration.js` line 92
- **Display Tag:** Blue badge "Exam Simulation"
- **Frontend:** `student/studentExamSimulation.html`

### Mode 3: `random`
- **Usage:** Random quiz mode from all categories
- **Characteristics:**
  - Mixed questions across all categories/subjects
  - Quick practice sessions
  - Random question shuffling
- **Data File:** References in `studentQuiz.html`
- **Display Tag:** Purple badge "Quiz Attempt"
- **Frontend:** `student/studentQuiz.html`

---

## 3. API Endpoints for Quiz Results

### 3.1 Submit Quiz Attempt
**Endpoint:** `POST /api/v1/quizzes/:id/submit`

**Controller:** `backend/src/controllers/quizController.js` → `exports.submitAttempt`
**Route:** `backend/src/routes/quizzes.js` line 12

**Request Payload:**
```javascript
{
  student_id: 1,
  answers: [
    { option_id: 42 },  // Question 1: selected option 42
    { option_id: 85 },  // Question 2: selected option 85
    null                 // Question 3: no answer
  ],
  time_spent: 1245,     // Time in seconds
  mode: "practice"      // or "exam" or "random"
}
```

**Processing Flow:**
1. Backend retrieves quiz questions and correct answers
2. Compares student answers with correct options
3. Calculates `score` (number correct)
4. Calculates `total_points` (sum of all question points)
5. Calculates `percentage` (score / total_points * 100)
6. Determines `is_passed` (percentage >= 70)
7. **Creates `quiz_attempts` record with mode**
8. **Creates individual `student_answers` records**
9. Returns `{ attemptId }`

**Model:** `backend/src/models/Quiz.js` → `static async submitAttempt(data)` (lines 121-205)

### 3.2 Retrieve Attempt Results
**Endpoint:** `GET /api/v1/quizzes/attempts/:attemptId`

**Controller:** `backend/src/controllers/quizController.js` → `exports.getAttempt`

**Response Includes:**
- Attempt metadata (score, percentage, time_spent, mode)
- Quiz title and passing score
- Full question details with options
- Student's selected answers
- Correct/incorrect flags per answer
- Explanation for each question

**Model:** `backend/src/models/Quiz.js` → `static async getAttempt(attemptId)` (lines 207-283)

### 3.3 Get All Student Attempts
**Endpoint:** `GET /api/v1/quizzes/student/:studentId/attempts`

**Controller:** `backend/src/controllers/quizController.js` → `exports.getStudentAttempts`

**Returns:** Array of all attempts with:
- Quiz title
- Subject ID
- Scores and percentages
- Timestamps
- **Mode (practice/exam/random)**

**Model:** `backend/src/models/Quiz.js` → `static async getAllStudentAttempts(studentId)` (lines 104-119)

---

## 4. How Quiz Results Are Saved (Backend Flow)

### Step-by-Step Save Process

**File:** `backend/src/models/Quiz.js` → `submitAttempt()` function

```
1. RECEIVE INPUT
   ├─ quiz_id, student_id
   ├─ answers[] array with option_ids
   ├─ time_spent in seconds
   └─ mode ('practice'|'exam'|'random')

2. GET QUIZ QUESTIONS
   └─ Query: SELECT q.* FROM questions q
      INNER JOIN quiz_questions qq
      WHERE qq.quiz_id = ?
      ORDER BY qq.order
   └─ Result: Array of questions with point values

3. PROCESS ANSWERS
   For each question (i = 0 to totalQuestions):
   ├─ Get correct option_id from database
   ├─ Compare with student's selected option_id
   ├─ If match: correctCount += question.points
   └─ total_points += question.points (always)

4. CALCULATE SCORE
   ├─ percentage = (correctCount / totalPoints) * 100
   ├─ is_passed = (percentage >= 70)
   └─ Round percentage to nearest integer

5. INSERT ATTEMPT RECORD
   └─ INSERT INTO quiz_attempts (
        quiz_id, student_id, score, total_points, 
        percentage, time_spent, is_passed, mode, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
   
6. INSERT ANSWER DETAILS
   For each student answer:
   └─ INSERT INTO student_answers (
        attempt_id, question_id, selected_option_id,
        is_correct, points_earned
      ) VALUES (?, ?, ?, ?, ?)

7. RETURN
   └─ attemptId for results page navigation
```

**Key Code Section:** Lines 140-205 in `Quiz.js`

---

## 5. How Quiz Results Are Retrieved & Displayed

### 5.1 Frontend Submission Flow

**File:** `student/studentQuizQuestions.html` (lines 1005-1095)

```javascript
const payload = {
  student_id: parseInt(studentId),
  answers: answersForBackend,  // Array of {option_id}
  time_spent: timeLimit * 60 - timeLeft,
  mode: quizMode  // "practice", "exam", or "random" ← MODE SENT HERE
};

// Submit to backend
const response = await fetch(`http://localhost:5000/api/v1/quizzes/${quizId}/submit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

// Store result metadata
localStorage.setItem("resultAttemptId", result.attemptId);
localStorage.setItem("resultQuizMode", quizMode);  // ← MODE STORED
```

**Also Records Locally:**
```javascript
await progressTracker.recordAttempt(
  quizId,
  answers,
  score,
  timeLimit * 60 - timeLeft,
  category,
  quizMode  // mode parameter
);
```

### 5.2 Results Display Pages

#### Individual Result Display
**File:** `student/studentQuizResults.html`

- Loads from `localStorage.resultAttemptId`
- Shows practice mode banner if `mode === "practice"`
- Displays score circle with percentage
- Lists all questions with student answers
- Shows correct/incorrect indicators

#### Attempt History Display
**File:** `assets/scripts/dashboard-integration.js` (lines 80-170)

```javascript
// Load student attempts
const attempts = await api.getAllStudentAttempts(studentId);

// Filter and color-code by mode
for (const attempt of attempts) {
  if (attempt.mode === 'practice') {
    tagClass = 'green-tag';
    tagText = 'Practice Mode';
  } else if (attempt.mode === 'simulation' || attempt.mode === 'exam') {
    tagClass = 'blue-tag';
    tagText = 'Exam Simulation';
  } else {
    tagClass = 'purple-tag';
    tagText = 'Quiz Attempt';
  }
}
```

**Display Statistics:**
```javascript
let practiceTaken = 0;
let randomTaken = 0;
attempts.forEach(a => {
  if (a.mode === 'practice') practiceTaken += 1;
  if (a.mode === 'random' || a.mode === 'simulation' || a.mode === 'exam') randomTaken += 1;
});

// Shows: "Practice: 5, Random: 3"
```

### 5.3 Dashboard Performance Summary
**File:** `assets/scripts/dashboard-integration.js` (lines 80-105)

```javascript
// Aggregated statistics
progressSummary.innerHTML = 
  `Correct: <strong>${correctAnswers}</strong> — 
   Quizzes: <strong>${quizzesTaken}</strong> 
   (Practice: ${practiceTaken}, Random: ${randomTaken})`;
```

---

## 6. Mode-Specific Tracking & Differentiation

### Database Level
- All modes stored in `quiz_attempts.mode` column
- Can filter results: `WHERE mode = 'practice'`
- Indexes on mode for fast filtering: `INDEX 'idx_mode' ON 'quiz_attempts'`
- Composite index for student+mode: `INDEX 'idx_student_mode'`

### Frontend Level

#### Practice Mode
```html
<!-- Practice mode banner in results -->
<div class="practice-mode-banner show">
  <i class="fa-solid fa-book-open"></i>
  <div class="banner-content">
    <div class="banner-title">Practice Mode</div>
    <div class="banner-desc">Your answers can be reviewed to improve learning</div>
  </div>
</div>
```

#### Exam/Simulation Mode
- Records with `mode: "exam"`
- Used by dashboard to display "Exam Simulation" tag
- Subject to timed submission (auto-submit on timeout)

#### Random Mode
- Records with `mode: "random"`
- Tracks practice attempts from quiz selection page
- Displayed as generic "Quiz Attempt" tag

### Local Storage Backup
Each submission stores in localStorage:
```javascript
localStorage.setItem("resultQuizMode", quizMode);
localStorage.setItem("resultScore", score);
localStorage.setItem("resultAttemptId", attemptId);
// ... other fields for offline fallback
```

---

## 7. Subject/Module vs Mode Distinctions

### Current System
**Mode only distinguishes:**
- Practice (learning-focused)
- Exam (assessment-focused)
- Random (mixed practice)

**Does NOT have separate fields for:**
- Subject-specific vs module-specific quizzes
- Category-specific results
- Competency tracking by subject

### Related Tables (for context)
- `quizzes.subject_id` - Links quiz to subject
- `quiz_questions` - Links quiz to questions (many-to-many)
- `questions.subject_id` - Questions belong to subject
- `category_performance` - Tracks performance by category (separate from mode)

### Tracking Subject Performance
Via `getAllStudentAttempts()` query (Quiz.js lines 104-119):
```sql
SELECT 
  qa.*,
  q.subject_id,
  q.title as quiz_title
FROM quiz_attempts qa
INNER JOIN quizzes q ON qa.quiz_id = q.id
WHERE qa.student_id = ?
ORDER BY qa.submitted_at DESC
```
- Mode + Subject ID combination allows filtering by both

---

## 8. Key Files Reference

### Backend Files
| File | Purpose | Key Functions |
|------|---------|---|
| `backend/database/schema.sql` | Quiz tables structure | Tables: quiz_attempts, student_answers |
| `backend/database/add_mode_to_quiz_attempts.sql` | Add mode column | Migration adding mode ENUM |
| `backend/src/models/Quiz.js` | Database operations | submitAttempt(), getAttempt(), getAllStudentAttempts() |
| `backend/src/controllers/quizController.js` | API handlers | submitAttempt(), getAttempt(), getStudentAttempts() |
| `backend/src/routes/quizzes.js` | Route definitions | POST /:id/submit, GET /attempts/:attemptId |

### Frontend Files
| File | Purpose | Key Elements |
|------|---------|---|
| `student/studentQuizQuestions.html` | Quiz taking interface | Line 1035: Submit endpoint, Line 1040: mode parameter |
| `student/studentExamSimulation.html` | Exam simulation | Line 591: submitExam() function, mode: "exam" |
| `student/studentPractice.html` | Practice mode selection | Mode: "practice" |
| `student/studentQuizResults.html` | Results display | Shows practice banner, student answers |
| `assets/scripts/dashboard-integration.js` | Dashboard stats | Lines 80-170: Mode filtering, color coding |
| `assets/scripts/progress-tracker.js` | Local storage | recordAttempt() with mode parameter |

---

## 9. Current Limitations & Notes

### 1. Mode Values Not Fully Standardized
- DB stores: `'practice'`, `'exam'`, `'random'`
- Dashboard checks for: `'practice'`, `'simulation'`, `'exam'`
- Potential mismatch between exam/simulation labels

### 2. Offline Syncing
- Mode is saved locally via `progressTracker.recordAttempt()`
- When synced later, backend receives all data including mode
- Both local and backend have mode tracking

### 3. No Direct Subject/Module Distinction in Mode
- Mode only = practice/exam/random
- Subject/module info tracked via `quiz.subject_id`
- To get subject-specific results: Filter by both quiz_id AND subject_id

### 4. Passing Score
- Hard-coded as 70% in `Quiz.submitAttempt()` line 196
- Could be made configurable per quiz in future

### 5. Practice Mode Handling
- Allows retakes (no prevent-retake logic for practice)
- Results always recorded (even if mode is practice)
- Different from assessments that may prevent retakes

---

## 10. Summary - Current Architecture

```
QUIZ SUBMISSION FLOW:
│
├─ Student takes quiz (studentQuizQuestions.html)
│
├─ Selects answers & time_spent
│
├─ Mode set by quiz type:
│  ├─ Practice mode quiz → mode: "practice"
│  ├─ Exam simulation → mode: "exam"
│  └─ Random quiz → mode: "random"
│
├─ POST to /api/v1/quizzes/:id/submit with payload including mode
│
├─ Backend Quiz.submitAttempt():
│  ├─ Calculates score vs correct answers
│  ├─ Inserts quiz_attempts WITH mode
│  ├─ Inserts student_answers for details
│  └─ Returns attemptId
│
├─ Frontend stores in localStorage
│
├─ Results displayed by:
│  ├─ Individual result page (studentQuizResults.html)
│  ├─ Dashboard history (color-coded by mode)
│  └─ Progress stats (separate practice/exam counters)
│
└─ Offline: Falls back to local storage with same mode tracking
```

---

## 11. Recommended Next Steps

1. **Standardize Mode Values**: Ensure 'exam' vs 'simulation' consistency
2. **Add Attempt Restrictions**: Prevent retakes for assessment (non-practice) quizzes
3. **Enhance Reporting**: Add subject/category breakdown in mode statistics
4. **Mobile Sync**: Ensure offline mode tracking survives app restart
5. **Analytics Dashboard**: Track mode distribution and performance by mode type

