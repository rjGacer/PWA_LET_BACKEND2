-- Simple Migration: Add UNIQUE constraint to prevent duplicate quiz submissions
-- This enforces the rule that each student can only submit each quiz once

ALTER TABLE `quiz_attempts` 
ADD UNIQUE KEY `unique_student_quiz` (`quiz_id`, `student_id`);
