-- Migration: Add profile_picture column to students table
-- This allows storing base64 encoded profile pictures or image URLs

ALTER TABLE `students` 
ADD COLUMN `profile_picture` LONGTEXT NULL AFTER `phone`,
ADD INDEX `idx_profile_picture` (`id`);
