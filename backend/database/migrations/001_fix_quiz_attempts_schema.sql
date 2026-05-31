-- Migration: Fix quiz_attempts schema to support all modes and multiple attempts
-- Date: 2026-05-31
-- Issue: Database doesn't support 'random' mode, UNIQUE constraint prevents multiple attempts per mode

-- Step 1: Drop the problematic UNIQUE constraint
ALTER TABLE `quiz_attempts` DROP INDEX `unique_student_quiz_mode`;

-- Step 2: Modify the mode ENUM to include 'random'
ALTER TABLE `quiz_attempts` MODIFY `mode` ENUM('exam','practice','module','random') DEFAULT 'exam';

-- Step 3: Add new indexes for better query performance (optional, for optimization)
-- This allows efficient filtering by student + mode combination
ALTER TABLE `quiz_attempts` ADD INDEX `idx_student_mode` (`student_id`, `mode`);
ALTER TABLE `quiz_attempts` ADD INDEX `idx_student_quiz_mode` (`student_id`, `quiz_id`, `mode`);

-- Verification queries (run these to confirm the changes):
-- SELECT * FROM information_schema.COLUMNS WHERE TABLE_NAME = 'quiz_attempts' AND COLUMN_NAME = 'mode';
-- SHOW INDEXES FROM quiz_attempts WHERE Column_name IN ('student_id', 'quiz_id', 'mode');
