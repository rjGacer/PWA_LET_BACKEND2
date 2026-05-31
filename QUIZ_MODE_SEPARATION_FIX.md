# Quiz Mode Separation Fix - Implementation Guide

**Date:** May 29, 2026  
**Issue:** Practice mode quiz results were overriding/displaying instead of subject quiz results  
**Solution:** Implement mode-aware quiz result filtering and display

## Problem Summary

When a student:
1. Took a quiz within a subject (stored as `mode='exam'`)
2. Then took the same quiz in practice mode (stored as `mode='practice'`)
3. The practice mode result would display instead of the subject quiz result

This was because the API endpoint didn't filter quiz attempts by mode when displaying quiz status to students.

## Root Cause

In `backend/src/controllers/quizController.js`, the `getStudentAttempts()` method returned ALL attempts for a quiz regardless of mode:

```javascript
const attempts = await Quiz.getStudentAttempts(quiz.id, req.user.id);
// This returned all attempts: practice, exam, random, etc. together
// Then it just took the first one: attempts[0]
quiz.last_attempt = attempts[0]; // Could be ANY mode!
```

The database already stores attempts with different modes, but the display layer wasn't respecting that distinction.

## Solution Implemented

### 1. Backend Model Layer - Quiz.js

Added two new mode-aware query methods:

```javascript
// Get all attempts for a specific mode, sorted by date
static async getStudentAttemptsByMode(quizId, studentId, mode = 'exam')

// Get the most recent attempt for a specific mode
static async getLatestAttemptByMode(quizId, studentId, mode = 'exam')
```

### 2. Backend Controller Layer - quizController.js

Updated API endpoints to accept `mode` query parameter:

```javascript
exports.getAll = async (req, res) => {
  const { subjectId, mode = 'exam' } = req.query; // NEW: mode parameter
  
  // ... Now filters attempts by mode:
  const modeAttempts = await Quiz.getLatestAttemptByMode(quiz.id, req.user.id, mode);
  quiz.last_attempt = modeAttempts;
}
```

**Endpoint:** `GET /api/v1/quizzes?subjectId=X&mode=exam`

### 3. Frontend API Layer - ApiService.js

Updated methods to accept and pass `mode` parameter:

```javascript
getQuizzes(subjectId = null, mode = 'exam')
getQuizById(id, mode = 'exam')
```

### 4. Frontend Page Updates

Each quiz context now specifies which mode it represents:

#### Student View Modules (Subject Quizzes)
- **File:** `student/studentViewModules.html`
- **Mode:** `'exam'` (subject quizzes use exam mode)
- **Call:** `viewModulesApi.getQuizzes(subjectId, 'exam')`
- **Result:** Shows only subject quiz attempts

#### Student Practice (Practice Mode)
- **File:** `student/studentPractice.html`
- **Mode:** `'practice'`
- **Call:** `fetch('/quizzes?mode=practice')`
- **Result:** Shows only practice mode attempts

#### Student Quiz (Random Mode)
- **File:** `student/studentQuiz.html`
- **Mode:** `'random'`
- **Call:** `apiService.getQuizzes(subject.id, 'random')`
- **Result:** Shows only random quiz mode attempts

#### Student Exam Simulation
- **File:** `student/studentExamSimulation.html`
- **Mode:** `'exam'`
- **Call:** `apiService.getQuizzes(subject.id, 'exam')`
- **Result:** Shows only exam simulation attempts

## How Quiz Modes Are Stored

When a quiz is submitted, the frontend specifies which mode it's being taken in:

```javascript
const payload = {
  student_id: studentId,
  answers: answersForBackend,
  time_spent: timeSpent,
  mode: quizMode  // 'practice', 'exam', or 'random'
};
// Sent to POST /api/v1/quizzes/:id/submit
```

The database stores each attempt with its mode, allowing complete separation.

## Result: Three Separate Quiz Experiences

Now each quiz has independent result histories:

| Context | Mode | Storage | Display |
|---------|------|---------|---------|
| **Subject Module Quiz** | `exam` | `quiz_attempts.mode='exam'` | Subject quiz results only |
| **Practice Mode** | `practice` | `quiz_attempts.mode='practice'` | Practice attempts only |
| **Random Quiz Mode** | `random` | `quiz_attempts.mode='random'` | Random quiz attempts only |
| **Exam Simulation** | `exam` | `quiz_attempts.mode='exam'` | Exam simulation attempts (same as subject) |

## Impact

✅ **Subject quiz scores are protected** - Practice mode won't override them  
✅ **Separate result tracking** - Each quiz type has its own history  
✅ **Better UX** - Students see relevant results for each context  
✅ **Future enhancement** - Easy to add mode='exam_simulation' if needed for further separation  

## Testing the Fix

### Test Case 1: Subject Quiz Not Overridden by Practice
1. Go to Subject → Take Quiz 1 → Score 80%
2. Go to Practice Mode → Take Quiz 1 → Score 60%
3. Go back to Subject → Quiz 1 should still show 80%, not 60%

### Test Case 2: Practice Attempts Don't Show in Subject
1. Go to Subject → Quiz 1 hasn't been taken
2. Go to Practice Mode → Take Quiz 1 → Pass
3. Go back to Subject → Quiz 1 should still show "Not taken"

### Test Case 3: Each Mode Has Independent Results
1. Take Same Quiz in:
   - Subject: 70%
   - Practice: 85%
   - Random Mode: 60%
2. Each should show its own score in each context

## Files Modified

1. **backend/src/models/Quiz.js** - Added mode-aware query methods
2. **backend/src/controllers/quizController.js** - Updated getAll() and getById()
3. **assets/scripts/ApiService.js** - Added mode parameter to getQuizzes() and getQuizById()
4. **student/studentViewModules.html** - Pass mode='exam'
5. **student/studentPractice.html** - Pass mode='practice'
6. **student/studentQuiz.html** - Pass mode='random'
7. **student/studentExamSimulation.html** - Pass mode='exam'

## Database Schema (No Changes Required)

The `quiz_attempts` table already had the `mode` column:

```sql
CREATE TABLE `quiz_attempts` (
  ...
  `mode` ENUM('practice', 'exam', 'random') DEFAULT 'exam',
  ...
);
```

This fix leverages the existing structure to properly filter and display results.

## Future Improvements

1. **Separate Exam Simulation from Subject Quizzes**
   - Add new mode: `'exam_simulation'`
   - Update Quiz model and frontend calls

2. **Reset Button Enhancement**
   - Reset only certain modes (e.g., practice and random, but not exam/subject)
   - Implement selective reset UI

3. **History Page Filtering**
   - Allow students to view history by mode
   - Add mode column to history display

## Backward Compatibility

✅ All existing quiz attempts are preserved  
✅ No database migration required  
✅ Mode defaults to 'exam' if not specified (existing behavior)  
✅ Existing API calls without mode parameter still work
