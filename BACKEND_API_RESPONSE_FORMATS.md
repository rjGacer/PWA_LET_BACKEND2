# Backend API Response Formats

## Overview
This document details the actual fields returned by the backend API endpoints referenced in the frontend code. Use this to understand data binding mismatches.

---

## 1. `/api/v1/performance/student-stats` 
**Route Handler**: [backend/src/routes/performance.js](backend/src/routes/performance.js#L13)  
**Controller**: `performanceController.getStudentDashboardStats`  
**Model Method**: `Performance.getStudentDashboardStats(studentId)`

### Response Format
```javascript
{
  total_quizzes_passed: number,    // Total quizzes passed (percentage >= 70)
  quizzes_taken: number,           // Total quiz attempts including all modes
  correct_answers: number,         // Total correct answers across all attempts
  fastest_time: number,            // Minimum time_spent in minutes (0 if none)
  study_time_minutes: number,      // Total time spent on all quizzes in minutes
  completion_rate: number          // Percentage of quizzes passed
}
```

### Database Query Source
```sql
SELECT 
  COUNT(DISTINCT CASE WHEN qa.is_passed = TRUE THEN 1 END) as total_quizzes_passed,
  COUNT(DISTINCT qa.id) as quizzes_taken,
  SUM(CASE WHEN sa.is_correct = TRUE THEN 1 ELSE 0 END) as correct_answers,
  CASE 
    WHEN MIN(qa.time_spent) IS NOT NULL AND MIN(qa.time_spent) > 0 
    THEN ROUND(MIN(qa.time_spent) / 60) 
    ELSE 0 
  END as fastest_time,
  ROUND(COALESCE(SUM(qa.time_spent), 0) / 60) as study_time_minutes,
  ROUND((COUNT(DISTINCT CASE WHEN qa.is_passed = TRUE THEN 1 END) / 
    NULLIF(COUNT(DISTINCT qa.id), 0) * 100), 2) as completion_rate
FROM quiz_attempts qa
LEFT JOIN quizzes q ON qa.quiz_id = q.id
LEFT JOIN student_answers sa ON qa.id = sa.attempt_id
WHERE qa.student_id = ?
```

### Key Notes
- **Includes ALL modes**: practice, random, simulation, module, exam, quiz
- **time_spent** is stored in seconds in database, converted to minutes in response
- Returns empty object with all zeros if no quiz attempts exist
- **Frontend Expectation Issue**: Frontend may expect `quizzes_taken` but also uses similar field names

---

## 2. `/api/v1/performance/leaderboard`
**Route Handler**: [backend/src/routes/performance.js](backend/src/routes/performance.js#L22)  
**Controller**: `performanceController.getLeaderboard`  
**Model Method**: `Performance.getLeaderboard(limit, period, category)`

### Query Parameters
- `limit` (default: 100) - Number of students to return
- `period` (default: 'all') - 'all', 'week', or 'month'
- `category` (default: 'all') - Filter by category name

### Response Format (Array)
```javascript
[
  {
    student_id: number,           // Student's unique ID
    full_name: string,            // Student's full name
    profile_picture: null,        // Currently always null
    rank: number,                 // Position in leaderboard (1, 2, 3, etc.)
    attempts: number,             // Total quiz attempts
    avg_score: number,            // Average score (correct_count * 10)
    pass_rate: number             // Percentage of quizzes passed (0-100)
  },
  // ... more students
]
```

### Score Calculation Details
```javascript
// Scoring Formula:
// 1. For each quiz attempt, count correct answers
// 2. avg_score = SUM(correct_answers_per_attempt) * 10
// 3. pass_rate = (passed_attempts / total_attempts) * 100
```

### Database Query Source (Simplified)
```sql
SELECT 
  st.id as student_id,
  st.name as full_name,
  NULL as profile_picture,
  COUNT(DISTINCT qa.id) as attempts,
  ROUND(SUM(COALESCE(qa_correct.correct_count, 0)) * 10, 1) as avg_score,
  ROUND(COUNT(DISTINCT CASE WHEN qa.is_passed = TRUE THEN 1 END) * 100.0 / 
    NULLIF(COUNT(DISTINCT qa.id), 0), 1) as pass_rate
FROM students st
LEFT JOIN quiz_attempts qa ON st.id = qa.student_id
LEFT JOIN student_answers sa ON qa.id = sa.attempt_id
WHERE st.is_active = TRUE
GROUP BY st.id, st.name
ORDER BY avg_score DESC, attempts DESC
LIMIT ?
```

### Key Notes
- **score field is NOT called "score"** - it's `avg_score`
- **Currently returns points/score, not a percentage**
- Ranking is added post-query in JavaScript
- Filters by period and category are applied via WHERE clauses
- Returns students with at least 1 quiz attempt

### ⚠️ POTENTIAL FRONTEND MISMATCH
- Frontend might be looking for a field called `score` but API returns `avg_score`
- Frontend might expect score to be 0-100 but API returns raw points (e.g., 250 for 25 correct answers)

---

## 3. `/api/v1/subjects/category/{categoryId}`
**Route Handler**: [backend/src/routes/subjects.js](backend/src/routes/subjects.js#L7)  
**Controller**: `subjectController.getByCategoryId`  
**Model Method**: `Subject.getByCategoryId(categoryId, onlySync)`

### Response Format (Array of Objects)
Each subject object in the array includes base fields PLUS stats:

```javascript
[
  {
    // Base Subject Fields
    id: number,
    category_id: number,
    name: string,
    description: string,
    icon: string,
    color: string,
    is_active: boolean,
    is_synced: boolean,
    created_by: number,
    created_at: timestamp,
    updated_at: timestamp,
    
    // Stats Fields (added by Subject.getStats)
    quizzes: number,              // Count of quizzes in this subject
    modules: number,              // Count of modules in this subject
    questions: number             // Total questions across all quizzes/modules
  },
  // ... more subjects
]
```

### Database Query Source
Two separate queries are combined:

**1. Base Subject Data**:
```sql
SELECT * FROM subjects 
WHERE category_id = ? AND is_active = TRUE
ORDER BY name
```

**2. Stats added via Subject.getStats()**:
```sql
-- Quiz Count
SELECT COUNT(*) as count FROM quizzes 
WHERE subject_id = ? AND is_active = TRUE AND is_synced = TRUE

-- Module Count
SELECT COUNT(*) as count FROM modules 
WHERE subject_id = ? AND is_active = TRUE AND is_synced = TRUE

-- Question Count
SELECT COUNT(*) as count FROM questions 
WHERE subject_id = ? AND is_active = TRUE AND is_synced = TRUE
```

### Key Notes
- **Field names returned**: `quizzes` (not `quiz_count`), `modules` (not `module_count`)
- **Conditional filtering**: If student user, only returns synced content
- **Stats are guaranteed**: Even if 0, stats fields are always present
- For students: only synced subjects/quizzes/modules are counted
- For teachers: all active content is counted

### ⚠️ FRONTEND MISMATCH ALERT
- **Frontend expects**: `module_count` and `quiz_count`
- **Backend returns**: `modules` and `quizzes`
- This is a field naming mismatch!

---

## Data Binding Issues Summary

### Issue 1: Dashboard Stats Fields
| Frontend Expects | Backend Returns | Type | Fix |
|---|---|---|---|
| `quizzes_taken` | `quizzes_taken` ✓ | number | ✓ Matches |
| `fastest_time` | `fastest_time` ✓ | number (minutes) | ✓ Matches |
| `correct_answers` | `correct_answers` ✓ | number | ✓ Matches |

**Status**: ✅ NO MISMATCH

### Issue 2: Leaderboard Score
| Frontend Expects | Backend Returns | Type | Fix |
|---|---|---|---|
| `score` (implied) | `avg_score` | number (points) | ❌ MISMATCH - Field name differs |
| Score format | Raw points (e.g., 250) | Should frontend expect points? | ⚠️ Clarify if this should be percentage |

**Status**: ❌ FIELD NAME MISMATCH + Unclear scoring format

### Issue 3: Subject Counts on Module Page
| Frontend Expects | Backend Returns | Type | Fix |
|---|---|---|---|
| `module_count` | `modules` | number | ❌ MISMATCH - Different field name |
| `quiz_count` | `quizzes` | number | ❌ MISMATCH - Different field name |

**Status**: ❌ FIELD NAME MISMATCH

---

## Recommended Frontend Fixes

### Fix 1: Leaderboard Response Mapping
```javascript
// Map backend response to frontend expectations
const leaderboardData = response.map(entry => ({
  student_id: entry.student_id,
  full_name: entry.full_name,
  rank: entry.rank,
  score: entry.avg_score,        // Map avg_score to score
  pass_rate: entry.pass_rate
}));
```

### Fix 2: Subject Stats Mapping
```javascript
// When receiving subject data with stats
const formattedSubjects = subjects.map(subject => ({
  ...subject,
  module_count: subject.modules,   // Map modules to module_count
  quiz_count: subject.quizzes      // Map quizzes to quiz_count
}));
```

### Fix 3: Consider Score Interpretation
- Verify if leaderboard score should be displayed as:
  - **Points**: 250 points (current backend behavior)
  - **Percentage**: 25% (if 10 questions answered)
  - **Average**: 8.5/10 (if averaged across attempts)

---

## Backend Route Configuration

All routes are prefixed with `/api/v1` in [backend/src/server.js](backend/src/server.js):

```javascript
const apiPrefix = '/api/v1';
app.use(`${apiPrefix}/performance`, performanceRoutes);     // Routes performance.js
app.use(`${apiPrefix}/subjects`, subjectRoutes);            // Routes subjects.js
```

Full routes:
- `GET /api/v1/performance/student-stats` - Dashboard stats
- `GET /api/v1/performance/leaderboard` - Leaderboard
- `GET /api/v1/subjects/category/:categoryId` - Subjects in category
