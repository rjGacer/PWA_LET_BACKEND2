-- Migration: Fix Random Quiz and Exam Simulation Results Storage
-- Date: 2026-05-31
-- Issue: Random Quiz and Exam Simulation results are not being saved because quiz_id is NOT NULL
-- Solution: Make quiz_id nullable and add quiz_title/category columns to quiz_attempts table

USE `pwa_let_db`;

-- Step 1: Add new columns to store quiz metadata
ALTER TABLE `quiz_attempts` 
ADD COLUMN `quiz_title` VARCHAR(255) DEFAULT NULL AFTER `quiz_id`,
ADD COLUMN `category` VARCHAR(255) DEFAULT NULL AFTER `quiz_title`;

-- Step 2: Make quiz_id nullable (so random/exam without specific quiz_id can be stored)
-- Drop the foreign key first, then modify the column
ALTER TABLE `quiz_attempts` DROP FOREIGN KEY `quiz_attempts_ibfk_1`;

ALTER TABLE `quiz_attempts` 
MODIFY COLUMN `quiz_id` INT DEFAULT NULL;

-- Step 3: Re-add the foreign key with ON DELETE SET NULL
ALTER TABLE `quiz_attempts` 
ADD CONSTRAINT `quiz_attempts_ibfk_1` 
FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE SET NULL;

-- Step 4: Update the mode ENUM to include 'random' if not already present
-- (This should have been done by migration 001_fix_quiz_attempts_schema.sql)
ALTER TABLE `quiz_attempts` 
MODIFY COLUMN `mode` ENUM('exam','practice','module','random','quiz') DEFAULT 'exam';

-- Verification queries:
-- SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_NAME = 'quiz_attempts' AND COLUMN_NAME IN ('quiz_id', 'quiz_title', 'category');
-- SHOW CREATE TABLE quiz_attempts;
