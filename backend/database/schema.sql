-- Create Database
CREATE DATABASE IF NOT EXISTS `pwa_let_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `pwa_let_db`;

-- Teachers Table
CREATE TABLE `teachers` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20),
  `specialization` VARCHAR(255),
  `role` ENUM('admin', 'teacher') DEFAULT 'teacher',
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Teacher Sync Settings Table
CREATE TABLE `teacher_sync_settings` (
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

-- Categories Table
CREATE TABLE `categories` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT,
  `icon` VARCHAR(100),
  `color` VARCHAR(50),
  `order` INT DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subjects Table
CREATE TABLE `subjects` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `category_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `icon` VARCHAR(100),
  `color` VARCHAR(50),
  `created_by` INT NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `is_synced` BOOLEAN DEFAULT FALSE,
  `synced_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `teachers` (`id`),
  UNIQUE KEY `unique_active_category_subject` (`category_id`, `name`, `is_active`),
  INDEX `idx_category_id` (`category_id`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_is_synced` (`is_synced`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Modules Table (Learning Modules)
CREATE TABLE `modules` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `subject_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `content` LONGTEXT,
  `file_type` VARCHAR(50),
  `file_url` VARCHAR(500),
  `order` INT DEFAULT 0,
  `created_by` INT NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `is_synced` BOOLEAN DEFAULT FALSE,
  `synced_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `teachers` (`id`),
  INDEX `idx_subject_id` (`subject_id`),
  INDEX `idx_order` (`order`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_is_synced` (`is_synced`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Questions Table
CREATE TABLE `questions` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `subject_id` INT NOT NULL,
  `question_text` TEXT NOT NULL,
  `question_image` VARCHAR(500),
  `question_type` ENUM('multiple_choice', 'true_false') DEFAULT 'multiple_choice',
  `difficulty` ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  `points` INT DEFAULT 1,
  `explanation` TEXT,
  `created_by` INT NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `is_synced` BOOLEAN DEFAULT FALSE,
  `synced_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `teachers` (`id`),
  INDEX `idx_subject_id` (`subject_id`),
  INDEX `idx_difficulty` (`difficulty`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_is_synced` (`is_synced`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Question Options Table (for multiple choice)
CREATE TABLE `question_options` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `question_id` INT NOT NULL,
  `option_text` TEXT NOT NULL,
  `option_image` VARCHAR(500),
  `is_correct` BOOLEAN DEFAULT FALSE,
  `order` INT DEFAULT 0,
  FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  INDEX `idx_question_id` (`question_id`),
  INDEX `idx_order` (`order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quizzes Table
CREATE TABLE `quizzes` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `subject_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `time_limit` INT,
  `passing_score` INT DEFAULT 70,
  `total_points` INT DEFAULT 100,
  `is_randomized` BOOLEAN DEFAULT TRUE,
  `show_answers` BOOLEAN DEFAULT TRUE,
  `created_by` INT NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `is_synced` BOOLEAN DEFAULT FALSE,
  `synced_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `teachers` (`id`),
  INDEX `idx_subject_id` (`subject_id`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_is_synced` (`is_synced`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quiz Questions (Junction table)
CREATE TABLE `quiz_questions` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `quiz_id` INT NOT NULL,
  `question_id` INT NOT NULL,
  `order` INT DEFAULT 0,
  FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_quiz_question` (`quiz_id`, `question_id`),
  INDEX `idx_quiz_id` (`quiz_id`),
  INDEX `idx_order` (`order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Students Table
CREATE TABLE `students` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE,
  `password` VARCHAR(255),
  `phone` VARCHAR(20),
  `device_id` VARCHAR(255) UNIQUE,
  `is_active` BOOLEAN DEFAULT TRUE,
  `last_sync` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`),
  INDEX `idx_device_id` (`device_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quiz Attempts Table
CREATE TABLE `quiz_attempts` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `quiz_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `score` INT,
  `total_points` INT,
  `percentage` DECIMAL(5, 2),
  `time_spent` INT,
  `is_passed` BOOLEAN,
  `mode` ENUM('exam','practice','module') DEFAULT 'exam',
  `started_at` TIMESTAMP,
  `submitted_at` TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_student_quiz_mode` (`quiz_id`, `student_id`, `mode`),
  INDEX `idx_quiz_id` (`quiz_id`),
  INDEX `idx_student_id` (`student_id`),
  INDEX `idx_submitted_at` (`submitted_at`),
  INDEX `idx_is_passed` (`is_passed`),
  INDEX `idx_mode` (`mode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student Answers Table
CREATE TABLE `student_answers` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `attempt_id` INT NOT NULL,
  `question_id` INT NOT NULL,
  `selected_option_id` INT,
  `is_correct` BOOLEAN,
  `points_earned` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`attempt_id`) REFERENCES `quiz_attempts` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`selected_option_id`) REFERENCES `question_options` (`id`) ON DELETE SET NULL,
  INDEX `idx_attempt_id` (`attempt_id`),
  INDEX `idx_question_id` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Category Performance (for dashboard statistics)
CREATE TABLE `category_performance` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `student_id` INT NOT NULL,
  `category_id` INT NOT NULL,
  `average_score` DECIMAL(5, 2),
  `total_attempts` INT DEFAULT 0,
  `total_passed` INT DEFAULT 0,
  `weak_topics` JSON,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_student_category` (`student_id`, `category_id`),
  INDEX `idx_student_id` (`student_id`),
  INDEX `idx_category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bulk Upload Log Table
CREATE TABLE `bulk_upload_logs` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `teacher_id` INT NOT NULL,
  `file_name` VARCHAR(255),
  `file_type` VARCHAR(50),
  `total_records` INT,
  `successful_records` INT,
  `failed_records` INT,
  `errors` JSON,
  `status` ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE,
  INDEX `idx_teacher_id` (`teacher_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Module Files Table (for storing multiple files per module)
CREATE TABLE `module_files` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `module_id` INT NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_type` VARCHAR(50),
  `file_size` INT,
  `original_name` VARCHAR(255),
  `uploaded_by` INT NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`uploaded_by`) REFERENCES `teachers` (`id`),
  INDEX `idx_module_id` (`module_id`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Sample Data
INSERT INTO `categories` (`id`, `name`, `description`, `icon`, `color`, `order`) VALUES
(1, 'General Education', 'General Education subjects for LET', 'ri-book-open-line', '#7c6ff7', 1),
(2, 'Professional Education', 'Professional Education subjects for LET', 'ri-briefcase-line', '#00a8e1', 2),
(3, 'Major / Specialization', 'Major or Specialization subjects for LET', 'ri-focus-2-line', '#ff6b6b', 3);

INSERT INTO `teachers` (`id`, `name`, `email`, `password`, `specialization`, `role`) VALUES
(1, 'Admin User', 'admin@example.com', '$2a$10$YIjlrEjRBc0rvgT2w8bvuuKjU0rq/V7Wv8YtQqV5vD5R8Q5w5K5wa', 'General Education', 'admin'),
(2, 'John Doe', 'john.doe@example.com', '$2a$10$YIjlrEjRBc0rvgT2w8bvuuKjU0rq/V7Wv8YtQqV5vD5R8Q5w5K5wa', 'Mathematics', 'teacher');
