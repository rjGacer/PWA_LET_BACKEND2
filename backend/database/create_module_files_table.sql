CREATE TABLE IF NOT EXISTS `module_files` (
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
