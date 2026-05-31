# DETAILED BUG REPORT - Practice Quiz Affecting Subject Score

**Date**: May 30, 2026  
**Reporter**: User  
**Bug Type**: Data Calculation Error  
**Severity**: 🔴 HIGH - Affects grading accuracy  
**Status**: ROOT CAUSE IDENTIFIED, SOLUTION PROVIDED

---

## Problem Description

When students take practice quizzes inside a subject (e.g., "This is for Testing"), the subject's displayed score becomes inaccurate. Practice quiz submissions are being included in the subject performance calculation when they should be excluded.

### User's Observation
> "When I take practice quizzes on quizzes inside the 'This is for Testing' subject, the view score for that subject changes (though it's correct for 'Gen Ed3' subject)."

### Why This Is a Bug
- Practice mode is designed for unlimited learning attempts without affecting official grades
- Including practice results in subject scores violates the design principle
- It artificially lowers (or raises) the student's official grade

---

## Root Cause Analysis

### Location
**File**: `backend/src/models/Performance.js`

### Problem
Four query functions are missing a WHERE clause filter for the `mode` column in the `quiz_attempts` table.

### Database Schema (Correct)
```sql
CREATE TABLE `quiz_attempts` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `quiz_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `score` INT,
  `percentage` DECIMAL(5, 2),
  `mode` ENUM('exam','practice','module') DEFAULT 'exam',  ← MODE FIELD EXISTS
  `submitted_at` TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_student_quiz_mode` (`quiz_id`, `student_id`, `mode`)
);
```

The database supports multiple modes per student+quiz combination:
- One 'exam' mode attempt (official exam)
- One 'module' mode attempt (official module quiz)
- Multiple 'practice' mode attempts (unlimited learning)

### Query Functions (Incorrect)
These functions calculate subject/category performance but DON'T filter by mode:

1. **getSubjectPerformance(subjectId)** - Line 75
2. **getCategoryPerformance(categoryId)** - Line 53
3. **getAllCategoriesPerformance()** - Line 68
4. **getStudentCategoryPerformance(studentId, categoryId)** - Line 97

### Current Query Pattern (Missing Filter)
```sql
SELECT ROUND(AVG(qa.percentage), 2) as average_score
FROM subjects s
LEFT JOIN quizzes q ON s.id = q.subject_id
LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
WHERE s.id = ? AND s.is_active = TRUE
-- ❌ MISSING: AND (qa.mode = 'module' OR qa.mode = 'exam' OR qa.mode IS NULL)
GROUP BY s.id, s.name
```

**Result**: When averaging quiz scores, ALL attempts (including practice) are included.

---

## Example Scenario

### Subject: "This is for Testing"

#### Quiz: "Sample Quiz #1"

**Attempts Made**:
- Module attempt: 90/100 (mode='module')
- Practice attempt 1: 40/100 (mode='practice')
- Practice attempt 2: 35/100 (mode='practice')

**Current Calculation (BUGGY)**:
```
Average = (90 + 40 + 35) / 3 = 55% ❌
Subject Score Displayed: 55%
```

**Correct Calculation (AFTER FIX)**:
```
Average = (90) / 1 = 90% ✅
Subject Score Displayed: 90%
(Practice attempts excluded)
```

**Impact**: Subject score is 35 points LOWER than it should be!

---

## Why "Gen Ed3" Works Correctly

The user noted that "Gen Ed3" subject shows the correct score. This is likely because:
1. That subject has NO practice attempts yet, OR
2. All attempts for that subject are in 'module' or 'exam' mode only

Once practice quizzes are taken for Gen Ed3, it will start showing incorrect scores too.

---

## Detailed Analysis of Each Affected Function

### 1. getSubjectPerformance(subjectId)

**Usage**: Called when displaying subject performance/score on dashboard

**Current Code** (Lines 75-85):
```javascript
static async getSubjectPerformance(subjectId) {
  const [performance] = await pool.query(`
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
  `, [subjectId]);
  return performance[0];
}
```

**Issue**: 
- Calculates AVG(qa.percentage) from ALL attempts
- Includes practice attempts (should exclude)
- Results in lower average_score than should be displayed

**Fix**: Add mode filter to WHERE clause

---

### 2. getCategoryPerformance(categoryId)

**Usage**: Called when displaying category performance statistics

**Current Code** (Lines 53-66):
```javascript
static async getCategoryPerformance(categoryId) {
  const [performance] = await pool.query(`
    SELECT 
      c.id,
      c.name,
      ROUND(AVG(qa.percentage), 2) as average_score,
      COUNT(DISTINCT qa.student_id) as student_count,
      COUNT(qa.id) as total_attempts,
      COUNT(DISTINCT CASE WHEN qa.is_passed = TRUE THEN 1 END) as passed_count
    FROM categories c
    LEFT JOIN subjects s ON c.id = s.category_id
    LEFT JOIN quizzes q ON s.id = q.subject_id
    LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
    WHERE c.id = ? AND c.is_active = TRUE
    GROUP BY c.id, c.name
  `, [categoryId]);
  return performance[0];
}
```

**Issue**: Same as above - includes all modes in average

**Fix**: Add mode filter

---

### 3. getAllCategoriesPerformance()

**Usage**: Called when displaying all categories performance (leaderboards, dashboards)

**Current Code** (Lines 68-80):
```javascript
static async getAllCategoriesPerformance() {
  const [performance] = await pool.query(`
    SELECT 
      c.id,
      c.name,
      c.color,
      ROUND(AVG(qa.percentage), 2) as average_score,
      COUNT(DISTINCT qa.student_id) as student_count,
      COUNT(qa.id) as total_attempts
    FROM categories c
    LEFT JOIN subjects s ON c.id = s.category_id
    LEFT JOIN quizzes q ON s.id = q.subject_id
    LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
    WHERE c.is_active = TRUE
    GROUP BY c.id, c.name, c.color
    ORDER BY average_score DESC
  `);
  return performance;
}
```

**Issue**: Same - includes all modes

**Fix**: Add mode filter

---

### 4. getStudentCategoryPerformance(studentId, categoryId)

**Usage**: Called when displaying individual student's category performance

**Current Code** (Lines 97-112):
```javascript
static async getStudentCategoryPerformance(studentId, categoryId) {
  const [performance] = await pool.query(`
    SELECT 
      c.id,
      c.name,
      ROUND(AVG(qa.percentage), 2) as average_score,
      COUNT(qa.id) as total_attempts,
      COUNT(DISTINCT CASE WHEN qa.is_passed = TRUE THEN 1 END) as passed_count
    FROM categories c
    LEFT JOIN subjects s ON c.id = s.category_id
    LEFT JOIN quizzes q ON s.id = q.subject_id
    LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id AND qa.student_id = ?
    WHERE c.id = ? AND c.is_active = TRUE
    GROUP BY c.id, c.name
  `, [studentId, categoryId]);
  return performance[0];
}
```

**Issue**: Same - includes all modes

**Fix**: Add mode filter

---

## Data Flow Visualization

```
┌─────────────────────────────────────────────────────────────┐
│ STUDENT INTERACTION                                          │
└─────────────────────────────────────────────────────────────┘

1. Student takes Module Quiz
   ↓
   Quiz submitted with mode='module'
   ↓
   Stored in DB: quiz_attempts(quiz_id, student_id, mode='module', score=90%)

2. Student takes Practice Quiz (same quiz)
   ↓
   Quiz submitted with mode='practice'
   ↓
   Stored in DB: quiz_attempts(quiz_id, student_id, mode='practice', score=40%)

3. Student takes Practice Quiz again (same quiz)
   ↓
   Quiz submitted with mode='practice'
   ↓
   Stored in DB: quiz_attempts(quiz_id, student_id, mode='practice', score=35%)

┌─────────────────────────────────────────────────────────────┐
│ BACKEND CALCULATION (BUGGY)                                  │
└─────────────────────────────────────────────────────────────┘

getSubjectPerformance() runs:
  SELECT AVG(qa.percentage) 
  FROM quiz_attempts qa
  WHERE quiz_id = ? AND student_id = ?
  -- ❌ NO MODE FILTER

Results:
  - Finds 3 records: [90%, 40%, 35%]
  - Calculates: (90 + 40 + 35) / 3 = 55%
  - Returns: average_score = 55%

┌─────────────────────────────────────────────────────────────┐
│ FRONTEND DISPLAY                                             │
└─────────────────────────────────────────────────────────────┘

Subject Card shows:
  "This is for Testing"
  Average Score: 55% ❌ WRONG!
  (Should be 90%)

┌─────────────────────────────────────────────────────────────┐
│ AFTER FIX                                                    │
└─────────────────────────────────────────────────────────────┘

getSubjectPerformance() runs:
  SELECT AVG(qa.percentage) 
  FROM quiz_attempts qa
  WHERE quiz_id = ? AND student_id = ?
  AND (qa.mode = 'module' OR qa.mode = 'exam' OR qa.mode IS NULL)
  -- ✅ MODE FILTER ADDED

Results:
  - Finds 1 record: [90%] (practice excluded)
  - Calculates: 90 / 1 = 90%
  - Returns: average_score = 90%

Subject Card shows:
  "This is for Testing"
  Average Score: 90% ✅ CORRECT!
```

---

## Impact on Different Components

### Dashboard Subject Cards
- **Impact**: Shows incorrect average score
- **Severity**: HIGH - User sees wrong performance

### Subject "View Score" Feature
- **Impact**: Displays wrong score when clicking "View Score"
- **Severity**: HIGH - User views wrong results

### Student Grade Calculation
- **Impact**: Unofficial grades calculated incorrectly
- **Severity**: HIGH - Academic records affected

### Performance Analytics/Reports
- **Impact**: Teacher dashboards show skewed data
- **Severity**: MEDIUM - Analytics become unreliable

### Leaderboards
- **Impact**: Rankings affected by inflated/deflated scores
- **Severity**: MEDIUM - Competitive fairness affected

### History/Results Display
- **Impact**: NONE - History shows individual attempts correctly
- **Severity**: N/A - Individual attempts shown regardless of average

### Practice Mode Functionality
- **Impact**: NONE - Practice mode works as designed
- **Severity**: N/A - Only the performance calculation is wrong

---

## Technical Details

### Mode Values
```
mode='module'   - Official quiz attempt within a module
mode='exam'     - Exam simulation attempt
mode='practice' - Practice mode attempt (unlimited)
```

### Desired Behavior
For subject performance calculations:
- ✅ Include: mode='module' and mode='exam'
- ❌ Exclude: mode='practice'

### Why Include 'exam' Mode?
Exam simulations are full-length official attempts that should count toward performance.

### Why Exclude 'practice' Mode?
Practice mode is explicitly for unlimited learning attempts without affecting grades.

---

## Solution: The Fix

### What Needs to Change
Add mode filtering to WHERE clause in 4 functions in `backend/src/models/Performance.js`

### Standard WHERE Clause Filter
```sql
AND (qa.mode = 'module' OR qa.mode = 'exam' OR qa.mode IS NULL)
```

Filters:
- Includes: attempts with mode='module'
- Includes: attempts with mode='exam'  
- Includes: old data where mode is NULL (backward compatibility)
- Excludes: attempts with mode='practice'

### Functions to Update
1. `getSubjectPerformance()` - Line 75
2. `getCategoryPerformance()` - Line 53
3. `getAllCategoriesPerformance()` - Line 68
4. `getStudentCategoryPerformance()` - Line 97

### Time to Implement
Approximately 5-10 minutes (4 simple WHERE clause additions)

---

## Verification & Testing

### Manual Verification
1. Create test subject with multiple quizzes
2. Take module quiz: record score (e.g., 90%)
3. Take practice quiz: record low score (e.g., 40%)
4. Check subject "View Score"
5. Before fix: shows average of both (~65%)
6. After fix: shows module score (90%)

### Automated Testing
```javascript
// Test getSubjectPerformance
const performance = await Performance.getSubjectPerformance(subjectId);
// Should return average of only module/exam attempts
// Should NOT include practice attempts
```

### SQL Query Verification
```sql
-- Query before fix (includes practice)
SELECT AVG(percentage) FROM quiz_attempts 
WHERE quiz_id = 1 AND student_id = 1;
-- Result: 55% (includes practice)

-- Query after fix (excludes practice)
SELECT AVG(percentage) FROM quiz_attempts 
WHERE quiz_id = 1 AND student_id = 1
AND (mode = 'module' OR mode = 'exam' OR mode IS NULL);
-- Result: 90% (practice excluded)
```

---

## Backward Compatibility

The fix includes `qa.mode IS NULL` to handle:
- Old quiz attempts before mode field was added
- Legacy data without mode specified
- Graceful fallback for missing data

This ensures no data loss and backward compatibility.

---

## Summary

| Aspect | Details |
|--------|---------|
| **Bug** | Practice attempts included in subject score calculation |
| **Location** | backend/src/models/Performance.js (4 functions) |
| **Root Cause** | Missing WHERE clause filter for mode column |
| **Impact** | Subject scores shown incorrectly (usually lower) |
| **Fix** | Add WHERE filter: `AND (qa.mode = 'module' OR qa.mode = 'exam' OR qa.mode IS NULL)` |
| **Complexity** | Simple (4 WHERE clause additions) |
| **Time to Fix** | ~15 minutes |
| **Risk Level** | Low (only affects display calculation, not data storage) |
| **Breaking Changes** | None (backward compatible) |
| **Data Loss** | None (all quiz attempts remain stored) |

---

## Next Steps

1. Review this analysis with the development team
2. Implement the 4 WHERE clause additions in Performance.js
3. Test with subject containing both module and practice attempts
4. Deploy and verify on live environment
5. Optional: Re-calculate historical performance data

