# Database Migration: Add Mode Column and One-Submission Restriction

## Problem Fixed
1. **SQL Error**: "Data truncated for column 'mode' at row 1"
   - The `mode` column was missing from the `quiz_attempts` table in the database
   - The code was trying to insert `'module'` mode but the column didn't exist

2. **Multiple Submissions**: Students could submit the same quiz multiple times
   - This violates the requirement that each quiz should be submitted only once (like Google Classroom)

## Solution

### Database Changes
The migration script `migration_add_mode_column.sql` does:
1. Adds `mode` VARCHAR(20) column with default 'exam'
2. Adds UNIQUE constraint on (quiz_id, student_id) to prevent duplicate submissions

### Code Changes
1. **Backend Model** (`src/models/Quiz.js`):
   - Added validation in `submitAttempt()` to check if student has already submitted
   - Throws error: "Student has already submitted this quiz"

2. **Frontend** (`student/studentQuizQuestions.html`):
   - Enhanced error handling for duplicate submissions
   - Shows warning and redirects back to quiz list

## How to Apply

### Option 1: Fresh Database Setup
Delete the existing database and recreate from scratch:
```bash
cd backend/database
mysql -u root -p < schema.sql
mysql -u root -p < seed.sql  # If you have seed data
```

### Option 2: Migrate Existing Database
Run the migration script:
```bash
mysql -u root -p YOUR_DATABASE < migration_add_mode_column.sql
```

### Option 3: Manual SQL (if migration doesn't work)
```sql
ALTER TABLE `quiz_attempts` 
ADD COLUMN `mode` VARCHAR(20) DEFAULT 'exam' 
AFTER `is_passed`;

ALTER TABLE `quiz_attempts` 
ADD UNIQUE KEY `unique_student_quiz` (`quiz_id`, `student_id`);
```

## Testing

1. **Create a quiz** in the teacher dashboard
2. **Take the quiz** as a student (it should work now)
3. **Try to submit again** - should show error: "Quiz has already been submitted"
4. **Verify button changes** - The "Take Quiz" button should change to "📊 View Score" after submission

## What Changed

### Files Modified
- `backend/database/schema.sql` - Updated table definition
- `backend/src/models/Quiz.js` - Added duplicate submission check
- `student/studentQuizQuestions.html` - Better error handling

### Files Created
- `backend/database/migration_add_mode_column.sql` - Migration script

## Key Features Now Working
✅ Students can take a quiz  
✅ Quiz submissions are saved  
✅ Each student can only submit each quiz once  
✅ Attempting to resubmit shows clear error message  
✅ Button states properly reflect completion status  
