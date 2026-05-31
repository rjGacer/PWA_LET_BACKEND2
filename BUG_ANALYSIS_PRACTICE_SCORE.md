# Bug Analysis: Practice Quiz Results Affecting Subject "View Score"

**Date**: May 30, 2026  
**Status**: ROOT CAUSE IDENTIFIED  
**Severity**: Medium - Affects subject performance display accuracy

---

## Problem Statement

When students take practice quizzes inside a subject (e.g., "This is for Testing"), the subject's "View Score" display changes incorrectly. The subject score is being affected by practice quiz submissions.

### Reported Behavior
- Module quiz result for subject "This is for Testing": Correct score displayed
- After taking **practice** version of same quiz: Subject score changes/becomes incorrect
- "Gen Ed3" subject works correctly (reason: likely no practice attempts taken)

---

## Root Cause Analysis

### The Issue: Missing Mode Filter in Subject Performance Query

**Location**: [backend/src/models/Performance.js](backend/src/models/Performance.js#L75-L85)

**Current Query** (BUGGY):
```sql
SELECT 
  s.id,
  s.name,
  ROUND(AVG(qa.percentage), 2) as average_score,
  COUNT(DISTINCT qa.student_id) as student_count,
  COUNT(qa.id) as total_attempts,
  COUNT(DISTINCT CASE WHEN qa.is_passed = TRUE THEN 1 END) as passed_count
FROM subjects s
LEFT JOIN quizzes q ON s.id = q.subject_id
LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
WHERE s.id = ? AND s.is_active = TRUE
GROUP BY s.id, s.name
```

**The Problem**:
- ❌ **NO MODE FILTER** - This query includes ALL quiz attempts regardless of mode
- It combines attempts from:
  - `mode='exam'` - Exam mode attempts
  - `mode='practice'` - Practice mode attempts ← THIS IS THE BUG
  - `mode='module'` - Module quiz attempts

### Why This Causes the Bug

The database schema supports multiple modes per quiz:
```sql
CREATE TABLE `quiz_attempts` (
  ...
  `mode` ENUM('exam','practice','module') DEFAULT 'exam',
  UNIQUE KEY `unique_student_quiz_mode` (`quiz_id`, `student_id`, `mode`),
  ...
)
```

**Example Scenario**:
1. Student takes module quiz for "Mathematics" → 90% (mode='module')
2. Student takes PRACTICE version of same quiz → 40% (mode='practice')
3. Subject score calculation:
   - **Current (BUGGY)**: (90% + 40%) / 2 = **65%** ❌
   - **Correct**: Should only use module quiz = **90%** ✅

---

## Affected Code Locations

### 1. **Performance.getSubjectPerformance()** (PRIMARY BUG)
**File**: [backend/src/models/Performance.js](backend/src/models/Performance.js#L75-L85)

This function calculates subject scores but doesn't filter by mode. When called for displaying "View Score", it returns inflated/deflated scores.

### 2. **Performance.getStudentCategoryPerformance()** (SECONDARY BUG)
**File**: [backend/src/models/Performance.js](backend/src/models/Performance.js#L97-L112)

Similar issue - calculates category performance without mode filtering.

### 3. **Performance.getCategoryPerformance()** (SECONDARY BUG)
**File**: [backend/src/models/Performance.js](backend/src/models/Performance.js#L53-L66)

Also lacks mode filtering in the query.

### 4. **Performance.getAllCategoriesPerformance()** (SECONDARY BUG)
**File**: [backend/src/models/Performance.js](backend/src/models/Performance.js#L68-L80)

Same issue across categories.

### 5. **Quiz Result Display in UI**
**Files**:
- [student/studentViewModules.html](student/studentViewModules.html#L1195-L1210) - Fetches and displays quiz attempts
- [student/studentDashboard.html](student/studentDashboard.html) - Displays subject performance
- Backend API endpoint: `/api/v1/performance/subject/:subjectId`

---

## Data Flow Diagram

```
Student takes Practice Quiz
    ↓
Quiz submitted with mode='practice'
    ↓
Stored in quiz_attempts table
    ↓
getSubjectPerformance() called
    ↓
❌ Query includes ALL modes (exam + practice + module)
    ↓
Average calculated from mixed results
    ↓
Subject "View Score" becomes INCORRECT
```

---

## How Quiz Modes Should Work

| Mode | Purpose | Use Case | Should Include in Subject Score? |
|------|---------|----------|----------------------------------|
| `module` | Official quiz attempt within module | Student takes subject quiz | ✅ YES (main grade) |
| `exam` | Full exam simulation | Comprehensive exam | ✅ YES (can be official) |
| `practice` | Unlimited practice attempts | Learning/drilling | ❌ **NO** (should not affect grade) |

**Key Insight**: Practice mode is meant for unlimited learning attempts without affecting official grades. Including practice results in subject scores violates this principle.

---

## Solution

### Fix 1: Update Performance Model Queries (REQUIRED)

**Modify all performance queries to filter by mode**:

1. **getSubjectPerformance()** - Add mode filter (lines 75-85)
2. **getStudentCategoryPerformance()** - Add mode filter (lines 97-112)
3. **getCategoryPerformance()** - Add mode filter (lines 53-66)
4. **getAllCategoriesPerformance()** - Add mode filter (lines 68-80)
5. **getQuizPerformance()** - Consider mode filter (lines 87-98) if quiz-level scores need filtering

### Query Template

**Current**:
```sql
LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
WHERE s.id = ? AND s.is_active = TRUE
```

**Fixed** (only mode='module' or mode='exam'):
```sql
LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id 
  AND (qa.mode = 'module' OR qa.mode = 'exam' OR qa.mode IS NULL)
WHERE s.id = ? AND s.is_active = TRUE
```

**Or filter to only 'module'** (if module quiz is the official grade):
```sql
LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id 
  AND (qa.mode = 'module' OR qa.mode IS NULL)
WHERE s.id = ? AND s.is_active = TRUE
```

### Fix 2: Update Recent Activity Query (RECOMMENDED)

**File**: [backend/src/models/Performance.js](backend/src/models/Performance.js#L115-L135)

The `getRecentActivity()` and `getStudentRecentActivity()` queries should also filter by mode to avoid showing inflated/irrelevant practice attempts in activity feeds.

---

## Testing Strategy

### Test Case 1: Single Module Quiz (No Practice)
```
Setup:
- Subject: "Gen Ed3"
- Quiz: "Mathematics Final"
- Student: Attempts module mode only

Expected:
- View Score: Shows module attempt score ✅

After Fix:
- Same result ✅
```

### Test Case 2: Module + Practice (CURRENT BUG)
```
Setup:
- Subject: "This is for Testing"
- Quiz: "Sample Quiz"
- Module attempt: 90%
- Practice attempt: 40%

Current Behavior (BUGGY):
- View Score: (90% + 40%) / 2 = 65% ❌

After Fix:
- View Score: 90% ✅ (module only)
```

### Test Case 3: Multiple Quiz Attempts
```
Setup:
- Subject: "Mixed"
- Quiz A module: 85%
- Quiz B module: 75%
- Quiz A practice: 60% (should not count)
- Quiz B practice: 50% (should not count)

Current (BUGGY):
- Average: (85 + 75 + 60 + 50) / 4 = 67.5% ❌

After Fix:
- Average: (85 + 75) / 2 = 80% ✅
```

### Test Case 4: Exam Mode Inclusion
```
Setup:
- Subject: "Finals"
- Quiz: "Midterm"
- Module attempt: 88%
- Exam attempt: 92%

Current (BUGGY):
- Average: Includes both + any practice ❌

After Fix (if including exam):
- Average: (88 + 92) / 2 = 90% ✅

OR (if module-only):
- Average: 88% ✅
```

---

## Impact Assessment

### Affected Features
1. ❌ Subject "View Score" display - WRONG VALUES
2. ❌ Dashboard subject performance cards - INCORRECT AVERAGES
3. ❌ Student performance tracking - SKEWED DATA
4. ❌ Teacher performance reports - MISLEADING STATISTICS
5. ✅ Practice mode functionality - NOT AFFECTED (independent)
6. ✅ History/Results display - NOT AFFECTED (shows individual attempts)

### Scope of Bug
- **Affects**: Teacher and student dashboard performance displays
- **Does NOT affect**: Individual quiz result storage, practice mode functionality, or quiz submission
- **Data integrity**: All raw data in database is correct; only calculated averages are wrong

---

## Implementation Priority

**Priority**: 🔴 **HIGH** - Affects student grading and performance evaluation

1. **Immediate**: Fix getSubjectPerformance() query (most critical)
2. **Soon**: Fix all other performance queries
3. **Then**: Add regression tests
4. **Finally**: Re-calculate and update historical performance data

---

## Related Code

### Database Schema References
- [schema.sql - quiz_attempts table](backend/database/schema.sql#L196-L210)
- Mode values: `'exam'`, `'practice'`, `'module'`
- Unique constraint: `(quiz_id, student_id, mode)`

### Related Issues Fixed Previously
- ✅ Practice mode unlock implementation (May 30, 2026)
- ✅ View Score button showing wrong result (fixed in studentViewModules.html)
- ✅ Practice mode separate storage (module_results vs practice_results)

### Related Documentation
- [PRACTICE_MODE_SYSTEM.md](PRACTICE_MODE_SYSTEM.md) - Practice mode architecture
- [QUIZ_SYSTEM_REFACTOR.md](QUIZ_SYSTEM_REFACTOR.md) - Quiz mode handling

---

## Recommendation

**Implement the fix immediately in Performance.js to ensure subject scores only reflect official quiz attempts (module or exam modes) and exclude practice attempts.**

This will restore accuracy to the subject performance display and prevent practice quiz submissions from affecting official grades.
