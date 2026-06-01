-- Delete if exists
DELETE FROM students WHERE email='test_user@gmail.com';

-- Insert test student with password: "password123"
INSERT INTO students (name, email, password, device_id, is_active) 
VALUES ('Test User', 'test_user@gmail.com', '$2a$10$H0VNc.CmNi8JpqEH/uw2JexS6.IymwL6dtvscjbFSbE/xAftL3B7.', 'test-device-001', 1);

-- Verify
SELECT id, name, email FROM students WHERE email='test_user@gmail.com';
