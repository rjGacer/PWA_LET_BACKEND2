-- Add login sessions table for tracking study time
CREATE TABLE IF NOT EXISTS `login_sessions` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `student_id` INT NOT NULL,
  `login_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `logout_at` TIMESTAMP NULL,
  `duration_minutes` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  INDEX `idx_student_id` (`student_id`),
  INDEX `idx_login_at` (`login_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
