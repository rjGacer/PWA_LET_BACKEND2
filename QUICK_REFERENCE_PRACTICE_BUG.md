# QUICK REFERENCE - Practice Score Bug Analysis

## BUG SUMMARY
✗ Practice quiz submissions are being **included in subject score calculations**
✗ Should be excluded (practice is for learning, not grading)
✗ Causes subject "View Score" to be inaccurate

---

## ROOT CAUSE - ONE FILE

### File: `backend/src/models/Performance.js`

**4 functions missing mode filter in their SQL queries:**

| Line | Function | Issue |
|------|----------|-------|
| 75-85 | `getSubjectPerformance()` | No WHERE mode filter |
| 53-66 | `getCategoryPerformance()` | No WHERE mode filter |
| 68-80 | `getAllCategoriesPerformance()` | No WHERE mode filter |
| 97-112 | `getStudentCategoryPerformance()` | No WHERE mode filter |

**Problem Code Pattern**:
```sql
LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
WHERE s.id = ? AND s.is_active = TRUE
-- ❌ MISSING: AND (qa.mode = 'module' OR qa.mode = 'exam' OR qa.mode IS NULL)
GROUP BY ...
```

---

## THE DATA FLOW

```
1. Student takes Module Quiz
   └─ quiz_attempts: mode='module', score=90%

2. Student takes Practice Quiz (same quiz)
   └─ quiz_attempts: mode='practice', score=40%

3. Backend calculates Subject Score
   └─ getSubjectPerformance() runs query
   └─ ❌ Query includes BOTH rows
   └─ Calculates: AVG(90%, 40%) = 65% ❌ WRONG

4. Frontend displays Subject Score
   └─ Shows 65% (should be 90%)
```

---

## THE FIX - 4 Changes, Same Pattern

Add ONE line to WHERE clause in each function:

```sql
AND (qa.mode = 'module' OR qa.mode = 'exam' OR qa.mode IS NULL)
```

This filters to only official attempts, excluding practice attempts.

---

## BEFORE & AFTER

### BEFORE (Buggy)
```
Subject "This is for Testing"
Module Attempts: [90%, 85%, 92%]
Practice Attempts: [40%, 35%, 38%]
Result: (90+85+92+40+35+38)/6 = 63.3% ❌
```

### AFTER (Fixed)
```
Subject "This is for Testing"
Module Attempts: [90%, 85%, 92%]
Practice Attempts: [40%, 35%, 38%] ← EXCLUDED from average
Result: (90+85+92)/3 = 89% ✅
```

---

## FILES AFFECTED

### Backend (Primary Fix)
- `backend/src/models/Performance.js` ← **FIX HERE**
  - getSubjectPerformance()
  - getCategoryPerformance()
  - getAllCategoriesPerformance()
  - getStudentCategoryPerformance()

### Backend (Uses the buggy functions)
- `backend/src/controllers/performanceController.js`
  - Calls the 4 functions above
  - No changes needed (just use fixed functions)

### Frontend (Displays the buggy data)
- `student/studentDashboard.html` - Shows subject performance cards
- `student/studentModules.html` - Shows subject "View Score"
- Various performance display pages

### Database (Already supports mode filtering)
- `backend/database/schema.sql`
- Table: `quiz_attempts` has `mode` column ✓
- Values: 'exam', 'practice', 'module'

---

## SCHEMA REFERENCE

```sql
CREATE TABLE `quiz_attempts` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `quiz_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `score` INT,
  `total_points` INT,
  `percentage` DECIMAL(5, 2),
  `time_spent` INT,
  `is_passed` BOOLEAN,
  `mode` ENUM('exam','practice','module') DEFAULT 'exam', ← THIS FIELD EXISTS
  `started_at` TIMESTAMP,
  `submitted_at` TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_student_quiz_mode` (`quiz_id`, `student_id`, `mode`)
);
```

The database already stores mode - we just need to filter by it!

---

## WHAT NEEDS CHANGING

```diff
backend/src/models/Performance.js

  static async getSubjectPerformance(subjectId) {
    const [performance] = await pool.query(`
      SELECT ...
      FROM subjects s
      LEFT JOIN quizzes q ON s.id = q.subject_id
      LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
      WHERE s.id = ? AND s.is_active = TRUE
+     AND (qa.mode = 'module' OR qa.mode = 'exam' OR qa.mode IS NULL)
      GROUP BY s.id, s.name
    `, [subjectId]);
    return performance[0];
  }
```

Same pattern for 3 other functions.

---

## VERIFICATION COMMANDS

### Check if mode field is populated
```sql
SELECT DISTINCT mode FROM quiz_attempts LIMIT 10;
-- Should show: 'exam', 'practice', 'module'
```

### See the difference before/after
```sql
-- BEFORE (includes practice - WRONG)
SELECT s.id, s.name, AVG(qa.percentage) as score
FROM subjects s
LEFT JOIN quizzes q ON s.id = q.subject_id
LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
WHERE s.id = 1
GROUP BY s.id;

-- AFTER (excludes practice - CORRECT)
SELECT s.id, s.name, AVG(qa.percentage) as score
FROM subjects s
LEFT JOIN quizzes q ON s.id = q.subject_id
LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
WHERE s.id = 1
AND (qa.mode = 'module' OR qa.mode = 'exam' OR qa.mode IS NULL)
GROUP BY s.id;
```

---

## IMPACT

### What Gets Fixed
✅ Subject "View Score" displays correct score
✅ Dashboard performance cards show accurate averages
✅ Student grades aren't lowered by practice attempts
✅ Teacher reports show accurate performance data

### What Stays the Same
✓ Practice mode still works (unlimited attempts)
✓ Quiz results still stored (nothing deleted)
✓ History still shows all attempts (including practice)
✓ Database unchanged (just filtered in queries)

---

## PRIORITY LEVEL

🔴 **HIGH** - Affects grading accuracy and performance display

---

## TIME TO FIX
⏱️ **~15 minutes** - 4 simple WHERE clause additions

---

## RELATED HISTORY

Previous fix (May 30, 2026):
- ✅ View Score button filtering by mode in UI
- ✅ Practice mode separate storage (module_results vs practice_results)
- ✅ Practice mode unlock after module quiz completion

Current fix (May 30, 2026):
- ❌ Backend performance queries include practice attempts
- THIS NEEDS TO BE FIXED

---

## KEY INSIGHT

**The database was designed correctly** with the `mode` field and UNIQUE constraint to handle multiple modes per quiz.

**The queries were just missing the filter** to use this built-in capability.

Simple fix = Big impact!

