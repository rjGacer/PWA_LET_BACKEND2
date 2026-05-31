-- Seed data for leaderboard testing
-- This script adds sample students and quiz attempts

USE `pwa_let_db`;

-- Clear existing data (optional - comment out to keep existing data)
-- DELETE FROM student_answers;
-- DELETE FROM quiz_attempts;
-- DELETE FROM students;

-- Insert sample students
INSERT INTO students (name, email, phone, device_id, is_active, created_at) VALUES 
('Alice Johnson', 'alice.johnson@example.com', '09123456789', 'device_alice_001', TRUE, NOW()),
('Bob Smith', 'bob.smith@example.com', '09123456790', 'device_bob_001', TRUE, NOW()),
('Charlie Brown', 'charlie.brown@example.com', '09123456791', 'device_charlie_001', TRUE, NOW()),
('Diana Prince', 'diana.prince@example.com', '09123456792', 'device_diana_001', TRUE, NOW()),
('Eve Wilson', 'eve.wilson@example.com', '09123456793', 'device_eve_001', TRUE, NOW()),
('Frank Miller', 'frank.miller@example.com', '09123456794', 'device_frank_001', TRUE, NOW()),
('Grace Hopper', 'grace.hopper@example.com', '09123456795', 'device_grace_001', TRUE, NOW()),
('Henry Davis', 'henry.davis@example.com', '09123456796', 'device_henry_001', TRUE, NOW()),
('Iris Lee', 'iris.lee@example.com', '09123456797', 'device_iris_001', TRUE, NOW()),
('Jack Turner', 'jack.turner@example.com', '09123456798', 'device_jack_001', TRUE, NOW());

-- Get first quiz from database
SET @quiz_id = (SELECT id FROM quizzes LIMIT 1);

-- If no quizzes exist, create sample quizzes first
IF @quiz_id IS NULL THEN
  SET @subject_id = (SELECT id FROM subjects LIMIT 1);
  IF @subject_id IS NOT NULL THEN
    INSERT INTO quizzes (title, description, subject_id, passing_score, is_published, is_synced, created_at)
    VALUES 
    ('Sample Quiz 1', 'A sample quiz for testing', @subject_id, 70, TRUE, TRUE, NOW()),
    ('Sample Quiz 2', 'Another sample quiz', @subject_id, 70, TRUE, TRUE, NOW());
    SET @quiz_id = LAST_INSERT_ID();
  END IF;
END IF;

-- Insert sample quiz attempts for students with varying scores
-- Alice: High performer (85% average, 4 attempts)
INSERT INTO quiz_attempts (quiz_id, student_id, score, total_points, percentage, time_spent, is_passed, mode, submitted_at) VALUES 
(@quiz_id, 1, 85, 100, 85, 1200, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(@quiz_id, 1, 82, 100, 82, 1150, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(@quiz_id, 1, 88, 100, 88, 1100, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(@quiz_id, 1, 86, 100, 86, 1180, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 2 DAY));

-- Bob: Good performer (78% average, 3 attempts)
INSERT INTO quiz_attempts (quiz_id, student_id, score, total_points, percentage, time_spent, is_passed, mode, submitted_at) VALUES 
(@quiz_id, 2, 75, 100, 75, 1400, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(@quiz_id, 2, 78, 100, 78, 1350, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(@quiz_id, 2, 81, 100, 81, 1200, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Charlie: Average performer (72% average, 2 attempts)
INSERT INTO quiz_attempts (quiz_id, student_id, score, total_points, percentage, time_spent, is_passed, mode, submitted_at) VALUES 
(@quiz_id, 3, 70, 100, 70, 1500, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(@quiz_id, 3, 74, 100, 74, 1420, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 2 DAY));

-- Diana: High performer (92% average, 5 attempts)
INSERT INTO quiz_attempts (quiz_id, student_id, score, total_points, percentage, time_spent, is_passed, mode, submitted_at) VALUES 
(@quiz_id, 4, 90, 100, 90, 1100, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(@quiz_id, 4, 93, 100, 93, 1080, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(@quiz_id, 4, 91, 100, 91, 1120, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(@quiz_id, 4, 94, 100, 94, 1050, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(@quiz_id, 4, 92, 100, 92, 1100, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Eve: Struggling learner (65% average, 3 attempts)
INSERT INTO quiz_attempts (quiz_id, student_id, score, total_points, percentage, time_spent, is_passed, mode, submitted_at) VALUES 
(@quiz_id, 5, 60, 100, 60, 1800, FALSE, 'practice', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(@quiz_id, 5, 65, 100, 65, 1700, FALSE, 'practice', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(@quiz_id, 5, 70, 100, 70, 1600, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 3 DAY));

-- Frank: Good performer (80% average, 4 attempts)
INSERT INTO quiz_attempts (quiz_id, student_id, score, total_points, percentage, time_spent, is_passed, mode, submitted_at) VALUES 
(@quiz_id, 6, 76, 100, 76, 1400, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(@quiz_id, 6, 80, 100, 80, 1300, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(@quiz_id, 6, 82, 100, 82, 1250, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(@quiz_id, 6, 82, 100, 82, 1280, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Grace: Top performer (96% average, 3 attempts)
INSERT INTO quiz_attempts (quiz_id, student_id, score, total_points, percentage, time_spent, is_passed, mode, submitted_at) VALUES 
(@quiz_id, 7, 95, 100, 95, 950, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(@quiz_id, 7, 97, 100, 97, 920, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(@quiz_id, 7, 96, 100, 96, 940, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 2 DAY));

-- Henry: Average performer (73% average, 5 attempts)
INSERT INTO quiz_attempts (quiz_id, student_id, score, total_points, percentage, time_spent, is_passed, mode, submitted_at) VALUES 
(@quiz_id, 8, 70, 100, 70, 1500, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(@quiz_id, 8, 72, 100, 72, 1480, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(@quiz_id, 8, 74, 100, 74, 1420, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(@quiz_id, 8, 73, 100, 73, 1450, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(@quiz_id, 8, 75, 100, 75, 1400, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Iris: Good performer (81% average, 2 attempts)
INSERT INTO quiz_attempts (quiz_id, student_id, score, total_points, percentage, time_spent, is_passed, mode, submitted_at) VALUES 
(@quiz_id, 9, 79, 100, 79, 1350, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(@quiz_id, 9, 83, 100, 83, 1200, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Jack: Moderate performer (77% average, 4 attempts)
INSERT INTO quiz_attempts (quiz_id, student_id, score, total_points, percentage, time_spent, is_passed, mode, submitted_at) VALUES 
(@quiz_id, 10, 75, 100, 75, 1400, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(@quiz_id, 10, 77, 100, 77, 1350, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(@quiz_id, 10, 78, 100, 78, 1300, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(@quiz_id, 10, 78, 100, 78, 1320, TRUE, 'practice', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Optional: Insert student answers for one attempt to have complete data
SET @attempt_id = (SELECT id FROM quiz_attempts WHERE student_id = 1 LIMIT 1);
SET @question_id = (SELECT qq.id FROM quiz_questions qq WHERE qq.quiz_id = @quiz_id LIMIT 1);

IF @attempt_id IS NOT NULL AND @question_id IS NOT NULL THEN
  INSERT INTO student_answers (attempt_id, question_id, selected_option_id, is_correct, points_earned) VALUES 
  (@attempt_id, @question_id, NULL, TRUE, 1);
END IF;

SELECT 'Leaderboard test data has been seeded successfully!' AS status;
