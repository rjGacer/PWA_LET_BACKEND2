-- Migration: Add UNIQUE constraint to enforce one-submission-per-quiz rule
-- The mode column already exists, so we just need to add the constraint

-- Step 1: Drop existing unique constraint if it exists
-- Using a safer method that works on older MySQL versions
SET @constraintName = '';
SELECT CONSTRAINT_NAME INTO @constraintName 
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'quiz_attempts' 
AND COLUMN_NAME = 'quiz_id' 
AND REFERENCED_TABLE_NAME IS NULL
AND CONSTRAINT_NAME != 'PRIMARY'
LIMIT 1;

SET @sqlStatement = CONCAT('ALTER TABLE `quiz_attempts` DROP INDEX `', @constraintName, '`');
IF @constraintName != '' THEN
  PREPARE stmt FROM @sqlStatement;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END IF;

-- Step 2: Add unique constraint to enforce one-submission-per-quiz rule
-- This prevents a student from submitting the same quiz twice
ALTER TABLE `quiz_attempts` 
ADD UNIQUE KEY `unique_student_quiz` (`quiz_id`, `student_id`);

-- Verification - check the constraint was added
SHOW INDEXES FROM `quiz_attempts` WHERE Key_name = 'unique_student_quiz';
