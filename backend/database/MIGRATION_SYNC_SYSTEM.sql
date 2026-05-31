-- =========================================================================
-- Teacher Content Sync System - Database Migration
-- Run this script to add sync functionality to your existing database
-- =========================================================================

USE `pwa_let_db`;

-- =========================================================================
-- 1. Create Teacher Sync Settings Table
-- =========================================================================

CREATE TABLE IF NOT EXISTS `teacher_sync_settings` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `teacher_id` INT NOT NULL UNIQUE,
  `auto_sync_enabled` BOOLEAN DEFAULT TRUE,
  `last_sync_time` TIMESTAMP NULL,
  `last_sync_status` ENUM('pending', 'in_progress', 'success', 'failed') DEFAULT 'pending',
  `last_sync_message` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE,
  INDEX `idx_teacher_id` (`teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- 2. Add Sync Columns to Subjects Table
-- =========================================================================

ALTER TABLE `subjects` 
ADD COLUMN `is_synced` BOOLEAN DEFAULT FALSE AFTER `is_active`,
ADD COLUMN `synced_at` TIMESTAMP NULL AFTER `is_synced`,
ADD INDEX `idx_is_synced` (`is_synced`);

-- =========================================================================
-- 3. Add Sync Columns to Modules Table
-- =========================================================================

ALTER TABLE `modules`
ADD COLUMN `is_synced` BOOLEAN DEFAULT FALSE AFTER `is_active`,
ADD COLUMN `synced_at` TIMESTAMP NULL AFTER `is_synced`,
ADD INDEX `idx_is_synced` (`is_synced`);

-- =========================================================================
-- 4. Add Sync Columns to Questions Table
-- =========================================================================

ALTER TABLE `questions`
ADD COLUMN `is_synced` BOOLEAN DEFAULT FALSE AFTER `is_active`,
ADD COLUMN `synced_at` TIMESTAMP NULL AFTER `is_synced`,
ADD INDEX `idx_is_synced` (`is_synced`);

-- =========================================================================
-- 5. Add Sync Columns to Quizzes Table
-- =========================================================================

ALTER TABLE `quizzes`
ADD COLUMN `is_synced` BOOLEAN DEFAULT FALSE AFTER `is_active`,
ADD COLUMN `synced_at` TIMESTAMP NULL AFTER `is_synced`,
ADD INDEX `idx_is_synced` (`is_synced`);

-- =========================================================================
-- 6. Initialize Sync Settings for Existing Teachers
-- =========================================================================

INSERT INTO `teacher_sync_settings` (teacher_id, auto_sync_enabled, last_sync_status)
SELECT id, TRUE, 'pending' FROM `teachers` t
WHERE NOT EXISTS (
  SELECT 1 FROM `teacher_sync_settings` ts WHERE ts.teacher_id = t.id
);

-- =========================================================================
-- 7. Optionally: Mark All Existing Content as Already Synced
-- =========================================================================
-- Uncomment this section if you want all existing content to be visible to students by default
-- This is recommended for backward compatibility

/*
UPDATE `subjects` SET is_synced = TRUE WHERE is_synced = FALSE;
UPDATE `modules` SET is_synced = TRUE WHERE is_synced = FALSE;
UPDATE `questions` SET is_synced = TRUE WHERE is_synced = FALSE;
UPDATE `quizzes` SET is_synced = TRUE WHERE is_synced = FALSE;

UPDATE `teacher_sync_settings` 
SET last_sync_status = 'success', last_sync_time = NOW()
WHERE last_sync_status = 'pending';
*/

-- =========================================================================
-- Verification Query
-- =========================================================================
-- Run this to verify the migration was successful:

/*
SELECT 
  'Subjects' as table_name, 
  COUNT(*) as total_records,
  SUM(CASE WHEN is_synced = TRUE THEN 1 ELSE 0 END) as synced,
  SUM(CASE WHEN is_synced = FALSE THEN 1 ELSE 0 END) as not_synced
FROM subjects
UNION ALL
SELECT 'Modules', COUNT(*), SUM(CASE WHEN is_synced = TRUE THEN 1 ELSE 0 END), SUM(CASE WHEN is_synced = FALSE THEN 1 ELSE 0 END) FROM modules
UNION ALL
SELECT 'Questions', COUNT(*), SUM(CASE WHEN is_synced = TRUE THEN 1 ELSE 0 END), SUM(CASE WHEN is_synced = FALSE THEN 1 ELSE 0 END) FROM questions
UNION ALL
SELECT 'Quizzes', COUNT(*), SUM(CASE WHEN is_synced = TRUE THEN 1 ELSE 0 END), SUM(CASE WHEN is_synced = FALSE THEN 1 ELSE 0 END) FROM quizzes;

SELECT COUNT(*) as total_teachers, COUNT(DISTINCT teacher_id) as teachers_with_sync_settings FROM teacher_sync_settings;
*/
