-- Migration: Fix UNIQUE constraint to support Practice Mode unlimited attempts
-- Simpler version without IF EXISTS for better compatibility

-- Step 1: Drop the existing unique constraint
ALTER TABLE `quiz_attempts` DROP INDEX `unique_student_quiz`;

-- Step 2: Add new unique constraint that includes the mode column
ALTER TABLE `quiz_attempts` 
ADD UNIQUE KEY `unique_student_quiz_mode` (`quiz_id`, `student_id`, `mode`);

-- Migration complete
