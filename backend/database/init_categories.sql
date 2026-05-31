-- Initialize categories for LET exam system
USE pwa_let_db;

-- Insert default categories
INSERT INTO `categories` (`name`, `description`, `icon`, `color`, `order`, `is_active`) VALUES
('General Education', 'General Education content for LET exam', 'fa-book', '#4f46e5', 1, TRUE),
('Professional Education', 'Professional Education content for LET exam', 'fa-graduation-cap', '#8b5cf6', 2, TRUE),
('Major / Specialization', 'Major/Specialization content for LET exam', 'fa-star', '#f59e0b', 3, TRUE);

SELECT 'Categories initialized!' AS status;
SELECT COUNT(*) as total_categories FROM categories;
