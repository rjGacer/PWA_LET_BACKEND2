-- Migration: Fix UNIQUE constraint to support Practice Mode unlimited attempts
-- Changes the unique constraint from (quiz_id, student_id) to (quiz_id, student_id, mode)
-- This allows practice mode to have unlimited retakes while maintaining one-submission limit for module/exam modes

-- Step 1: Drop the existing unique constraint
ALTER TABLE `quiz_attempts` DROP INDEX IF EXISTS `unique_student_quiz`;

-- Step 2: Add new unique constraint that includes the mode column
-- This allows:
-- - Unlimited practice mode attempts (different rows, same quiz_id+student_id+practice mode)
-- - One submission per module/exam mode
ALTER TABLE `quiz_attempts` 
ADD UNIQUE KEY `unique_student_quiz_mode` (`quiz_id`, `student_id`, `mode`);

-- Step 3: Verify the new constraint
SHOW INDEXES FROM `quiz_attempts` WHERE Key_name = 'unique_student_quiz_mode';

-- Migration complete: Practice mode can now support unlimited retakes
