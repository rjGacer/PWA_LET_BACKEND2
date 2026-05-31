
# Practice Mode - Complete System Documentation

## Overview
Practice Mode is a **separate, independent learning tool** distinct from subject quizzes. It allows students unlimited attempts to practice specific quizzes and master concepts.

## Key Differences from Regular Quizzes

| Feature | Practice Mode | Module/Exam Mode |
|---------|---------------|------------------|
| **Attempts** | Unlimited ✅ | 1 per student per mode |
| **Storage** | Local IndexedDB + Backend | Backend only |
| **Filtering** | Separate "Practice" filter | Regular quiz filter |
| **History Tracking** | Logged under "Practice" mode | Logged under respective mode |
| **Backend Submission** | YES (for analytics) | YES (required) |
| **Time Tracking** | YES | YES |
| **Scoring** | YES | YES |

## System Architecture

### Frontend (studentQuizQuestions.html)
- **Parameter Detection**: `?mode=practice`
- **Submission Logic**: 
  ```javascript
  const submissionData = {
    quiz_id: quizId,
    student_id: studentId,
    mode: "practice",        // ← Key differentiator
    time_spent: timeTaken,   // ← Time in seconds
    answers: [...]
  };
  ```
- **Local Storage**: Saves to IndexedDB via `QuizResultsManager.savePracticeResult()`
- **Redirect**: After submission → `studentQuizResults.html?mode=practice`

### Backend (API)
- **Endpoint**: `POST /quizzes/:id/submit`
- **Database Constraint**: `UNIQUE (quiz_id, student_id, mode)` ← Allows unlimited practice attempts
- **Key Processing**:
  - Records quiz attempt with `mode='practice'`
  - Calculates score and percentage
  - Logs analytics for student progress tracking

### Database Schema
```sql
CREATE TABLE quiz_attempts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  quiz_id INT NOT NULL,
  student_id INT NOT NULL,
  score INT,
  total_points INT,
  percentage DECIMAL(5, 2),
  time_spent INT,           -- Duration in seconds
  is_passed BOOLEAN,
  mode ENUM('exam','practice','module') DEFAULT 'exam',
  submitted_at TIMESTAMP,
  UNIQUE KEY unique_student_quiz_mode (quiz_id, student_id, mode),
  ...
);

CREATE TABLE student_answers (
  attempt_id INT,
  question_id INT,
  selected_option_id INT,
  is_correct BOOLEAN,
  points_earned INT,
  FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  ...
);
```

**Critical**: The unique constraint includes `mode` column. This allows:
- **Practice Mode**: Multiple attempts (different rows with same `quiz_id+student_id+practice`)
- **Module/Exam Mode**: One attempt (unique constraint enforced)

## History Page Filtering

### Filter Options
```html
<select id="filterModeSelect">
  <option value="">All Modes</option>
  <option value="Module">Module</option>
  <option value="Exam">Exam</option>
  <option value="Practice">Practice</option>
  <option value="Random">Random</option>
</select>
```

### Filtering Logic
```javascript
function applyFiltering() {
  filteredData = allResults.filter(result => {
    const resultMode = result.mode || 'quiz';
    let filterMode = currentFilters.mode;
    
    // Mode mapping
    if (filterMode === 'Practice') filterMode = 'practice';
    if (filterMode === 'Module') filterMode = 'module';
    
    if (filterMode && resultMode !== filterMode) return false;
    return true;
  });
}
```

**Result**: When "Practice" is selected, only results with `mode='practice'` are shown.

## Data Flow - Practice Mode Submission

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Student completes quiz in Practice Mode                 │
│    (studentQuizQuestions.html?mode=practice)               │
└─────────────────────┬───────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend collects answers + time_spent                  │
│    - Sends POST /quizzes/{id}/submit                       │
│    - Data: {quiz_id, student_id, mode:'practice', ...}   │
└─────────────────────┬───────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend (Quiz.submitAttempt)                            │
│    - Validates mode !== 'practice' OR no duplicate check  │
│    - Inserts quiz_attempt with mode='practice'            │
│    - Calculates score and stores student_answers          │
│    - Returns attemptId                                    │
└─────────────────────┬───────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Frontend saves result locally (IndexedDB)               │
│    - Stores via QuizResultsManager.savePracticeResult()   │
│    - Includes: score, time_taken, questions data, mode    │
└─────────────────────┬───────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Frontend redirects to Results Page                       │
│    - studentQuizResults.html?mode=practice&resultId={id}   │
│    - Displays score, accuracy, time, correct answers      │
└─────────────────────┬───────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Result appears in History with mode='Practice'          │
│    - Filterable separately from other modes                │
│    - Unlimited results per quiz per student               │
└─────────────────────────────────────────────────────────────┘
```

## Questions & Options Handling

### Loading Practice Quiz Questions
```javascript
// In studentQuizQuestions.html
const response = await fetch(`/quizzes/${quizId}?details=true`);
const quizData = await response.json();
// quizData contains: title, questions[], category, categoryId
```

### Question Structure
```javascript
{
  id: 1,
  question_text: "What is...",
  points: 1,
  options: [
    { id: 1, option_text: "Answer A", is_correct: 0 },
    { id: 2, option_text: "Answer B", is_correct: 1 },
    { id: 3, option_text: "Answer C", is_correct: 0 },
    { id: 4, option_text: "Answer D", is_correct: 0 }
  ],
  explanation: "The correct answer is B because..."
}
```

## Error Handling

### Common Errors & Solutions

**Error**: `HTTP 500` on submit
- **Cause**: Database constraint violation (duplicate entry)
- **Solution**: Ensure unique constraint is `(quiz_id, student_id, mode)` not `(quiz_id, student_id)`

**Error**: "Each quiz can only be submitted once"
- **Cause**: Submitted module/exam quiz twice
- **Solution**: Check mode - practice allows retries, others don't

**Error**: "time_spent is required"
- **Cause**: Frontend not sending `time_spent` parameter
- **Solution**: Calculate `timeTaken` and include in submission

## Implementation Checklist

- [x] Database constraint includes `mode` column
- [x] Quiz model checks duplicate only for non-practice modes
- [x] Frontend sends `time_spent` with submission
- [x] Frontend sends `mode='practice'` parameter
- [x] Backend logs practice mode separately
- [x] IndexedDB saves practice results with mode
- [x] History page filters by practice mode
- [x] Results page shows practice mode correctly

## Testing Practice Mode

### Test Case 1: Unlimited Attempts
1. Go to Practice Mode → Select quiz
2. Answer all questions → Submit
3. Go back and select same quiz again
4. Answer differently → Submit (should work)
5. **Expected**: Both submissions appear in History

### Test Case 2: History Filtering
1. Complete a practice quiz
2. Go to History page
3. Select "Practice" filter
4. **Expected**: Only practice results shown
5. Select "All Modes"
6. **Expected**: All results shown

### Test Case 3: Score Calculation
1. Complete practice quiz with known correct answers
2. Submit
3. View results
4. **Expected**: Correct score percentage shown

## API Integration

### QuizResultsManager Methods

```javascript
// Save practice result to IndexedDB
await quizResultsManager.savePracticeResult({
  studentId: 1,
  quizId: 17,
  quizTitle: "Math Practice",
  subjectId: 4,
  subjectName: "General",
  score: 85,
  timeTaken: 300,
  questions: [...],
  attemptId: "att_12345",
  mode: "practice",
  submittedAt: "2025-05-30T..."
});

// Get practice results by student
const results = await quizResultsManager.getStudentResultsByMode(
  studentId, 
  'practice'
);
```

## Notes

- Practice mode is **fully independent** - separate question loading, submission, and history tracking
- Results are stored **both locally (IndexedDB) and on backend (database)** for offline capability
- The unique constraint change from `(quiz_id, student_id)` to `(quiz_id, student_id, mode)` is **critical** for unlimited practice attempts
- Time tracking is automatic - calculated server-side and stored for analytics
