# Fix Implementation Guide - Practice Quiz Score Bug

**Date**: May 30, 2026  
**Bug**: Practice quiz submissions affecting subject "View Score" display  
**Status**: Ready to implement

---

## Executive Summary

**Problem**: Subject performance queries in `Performance.js` don't filter by mode, causing practice quiz attempts to be included in subject score calculations.

**Solution**: Add mode filtering to 4 query functions to exclude practice attempts from official grades.

**Time to Fix**: ~15 minutes

---

## Affected Code & Changes Required

### File: `backend/src/models/Performance.js`

#### Change 1: getSubjectPerformance() - Lines 75-85

**CURRENT (BUGGY)**:
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

**FIXED**:
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
    AND (qa.mode = 'module' OR qa.mode = 'exam' OR qa.mode IS NULL)
    GROUP BY s.id, s.name
  `, [subjectId]);
  return performance[0];
}
```

**Change**: Add mode filter to WHERE clause (1 line)

---

#### Change 2: getStudentCategoryPerformance() - Lines 97-112

**CURRENT (BUGGY)**:
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

**FIXED**:
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
    AND (qa.mode = 'module' OR qa.mode = 'exam' OR qa.mode IS NULL)
    GROUP BY c.id, c.name
  `, [studentId, categoryId]);
  return performance[0];
}
```

**Change**: Add mode filter to WHERE clause (1 line)

---

#### Change 3: getCategoryPerformance() - Lines 53-66

**CURRENT (BUGGY)**:
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

**FIXED**:
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
    AND (qa.mode = 'module' OR qa.mode = 'exam' OR qa.mode IS NULL)
    GROUP BY c.id, c.name
  `, [categoryId]);
  return performance[0];
}
```

**Change**: Add mode filter to WHERE clause (1 line)

---

#### Change 4: getAllCategoriesPerformance() - Lines 68-80

**CURRENT (BUGGY)**:
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

**FIXED**:
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
    AND (qa.mode = 'module' OR qa.mode = 'exam' OR qa.mode IS NULL)
    GROUP BY c.id, c.name, c.color
    ORDER BY average_score DESC
  `);
  return performance;
}
```

**Change**: Add mode filter to WHERE clause (1 line)

---

## Testing Checklist

### Before Deploy
- [ ] Build backend: `npm run build` or `npm start`
- [ ] No SQL syntax errors in updated queries
- [ ] Database connection working

### After Deploy
- [ ] Query `/api/v1/performance/subject/:subjectId` for a subject with practice attempts
- [ ] Verify score excludes practice attempts
- [ ] Compare with old score (should be higher if practice was low)
- [ ] Test with multiple subjects
- [ ] Test dashboard subject cards update correctly
- [ ] Check category performance queries return correct values

### Verification Script
```javascript
// In browser console on student dashboard
const subjectId = 1; // "This is for Testing"
fetch(`http://localhost:5000/api/v1/performance/subject/${subjectId}`)
  .then(r => r.json())
  .then(data => {
    console.log('Subject Performance:');
    console.log('Average Score:', data.average_score);
    console.log('Total Attempts:', data.total_attempts);
    console.log('Passed Count:', data.passed_count);
  });
```

---

## Verification Steps

### Step 1: Identify Test Case
- Find subject with both module and practice attempts
- Example: "This is for Testing" with practice attempts

### Step 2: Manual Verification (Before Fix)
1. Go to student dashboard
2. Find subject card
3. Note the score displayed
4. Check if it's lower than expected (due to practice attempts)

### Step 3: Deploy Fix
1. Update the 4 functions in Performance.js
2. Restart backend server
3. Clear any cached queries (restart Node.js)

### Step 4: Verify Fix
1. Refresh dashboard
2. Subject score should be higher (practice attempts excluded)
3. Score should match only module/exam attempts
4. Practice attempts still saved (just not counted in average)

---

## Why This Fix Works

### Before (Buggy)
```
Subject Score = AVG(all attempts including practice)
= AVG(module: 90%, practice: 40%, practice: 35%, module: 85%)
= (90 + 40 + 35 + 85) / 4 = 62.5%  ❌ WRONG
```

### After (Fixed)
```
Subject Score = AVG(official attempts only)
= AVG(module: 90%, module: 85%)
= (90 + 85) / 2 = 87.5%  ✅ CORRECT
```

The WHERE clause filter:
```sql
AND (qa.mode = 'module' OR qa.mode = 'exam' OR qa.mode IS NULL)
```

- Includes: module attempts and exam attempts
- Excludes: practice attempts (which have `mode='practice'`)
- Includes: old data without mode (backward compatible)

---

## Rollback Plan

If issues occur, revert the 4 WHERE clause additions:
- Remove `AND (qa.mode = 'module' OR qa.mode = 'exam' OR qa.mode IS NULL)` from all 4 functions
- Restart backend server
- Performance will return to (buggy) previous state

---

## Impact Analysis

| Component | Impact | Severity |
|-----------|--------|----------|
| Subject Score Display | FIXED - No longer includes practice | HIGH |
| Dashboard Performance Cards | FIXED - Accurate averages | HIGH |
| Student Grades | FIXED - Practice won't lower grades | HIGH |
| Teacher Reports | FIXED - Accurate performance data | HIGH |
| Practice Mode | NOT AFFECTED - Still works | N/A |
| Quiz Submission | NOT AFFECTED - Still stored | N/A |
| Historical Data | Recalculated on next query | N/A |

---

## Related Issues

- Bug: Practice quiz affecting subject scores
- Related Fix: View Score button mode filtering (studentViewModules.html - already done)
- Related Feature: Practice mode unlimited attempts (already working)

---

## Questions & Answers

**Q: Will this change affect stored data?**
A: No. Only the calculation of averages changes. All quiz attempts remain stored.

**Q: What about old data without a mode field?**
A: `qa.mode IS NULL` handles that - old data without mode is included (backward compatible).

**Q: Should we filter by mode='module' only, or include mode='exam' too?**
A: Include both 'module' and 'exam'. Both are official attempts. Only exclude 'practice'.

**Q: Will students see a change in their scores?**
A: Yes - scores will likely go UP because practice attempts (often lower scores) won't be included.

**Q: What about leaderboards?**
A: Leaderboards use quiz_attempts but calculate differently. This fix doesn't affect rankings directly, but rankings will be more accurate.

