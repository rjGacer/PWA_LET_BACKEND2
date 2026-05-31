-- Clear all data from database while keeping schema intact
-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Truncate tables that exist (using error-safe approach)
-- Data tables
DELETE FROM `quiz_attempts`;
DELETE FROM `quiz_attempt_answers`;
DELETE FROM `student_quiz_results`;
DELETE FROM `student_progress`;
DELETE FROM `student_module_progress`;
DELETE FROM `quiz_options`;
DELETE FROM `quizzes`;
DELETE FROM `questions`;
DELETE FROM `modules`;
DELETE FROM `module_files`;
DELETE FROM `subjects`;
DELETE FROM `categories`;
DELETE FROM `teacher_sync_settings`;
DELETE FROM `teachers`;
DELETE FROM `students`;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Confirm
SELECT 'Database cleared successfully!' AS message;
