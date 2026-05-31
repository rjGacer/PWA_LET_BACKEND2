const Student = require('../models/Student');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

// Get student profile
exports.getProfile = async (req, res) => {
  try {
    const studentId = req.user.id;
    const profile = await Student.getProfileData(studentId);

    if (!profile) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get specific student profile by ID (for leaderboard)
exports.getStudentProfileById = async (req, res) => {
  try {
    const { studentId } = req.params;
    const profile = await Student.getProfileData(studentId);

    if (!profile) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update student profile
exports.updateProfile = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { name, phone, course, bio, profile_picture } = req.body;

    // Validate input
    if (name && name.trim().length === 0) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }

    const updated = await Student.updateProfile(studentId, {
      name,
      phone,
      course,
      bio,
      profile_picture
    });

    res.json({
      message: 'Profile updated successfully',
      profile: updated
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update password
exports.updatePassword = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Get current password from database
    const [students] = await pool.query(
      'SELECT password FROM students WHERE id = ?',
      [studentId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, students[0].password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await Student.updatePassword(studentId, hashedPassword);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update notification preferences
exports.updatePreferences = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { email_reminders, push_notifications, weekly_report } = req.body;

    const preferences = await Student.updatePreferences(studentId, {
      email_reminders,
      push_notifications,
      weekly_report
    });

    res.json({
      message: 'Preferences updated successfully',
      preferences
    });
  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get notification preferences
exports.getPreferences = async (req, res) => {
  try {
    const studentId = req.user.id;
    const preferences = await Student.getPreferences(studentId);

    res.json(preferences || {
      email_reminders: true,
      push_notifications: true,
      weekly_report: false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Delete all quiz attempts first (due to foreign key constraints)
    await pool.query('DELETE FROM student_answers WHERE attempt_id IN (SELECT id FROM quiz_attempts WHERE student_id = ?)', [studentId]);
    await pool.query('DELETE FROM quiz_attempts WHERE student_id = ?', [studentId]);

    // Delete the student
    await Student.delete(studentId);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get current user info
exports.getCurrentUser = async (req, res) => {
  try {
    const studentId = req.user.id;
    const profile = await Student.getProfileData(studentId);

    if (!profile) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get student statistics
exports.getStats = async (req, res) => {
  try {
    const studentId = req.user.id;

    const [stats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT qa.id) as quizzes_taken,
        COUNT(CASE WHEN qa.is_passed = TRUE THEN 1 END) as quizzes_passed,
        ROUND(AVG(qa.percentage), 2) as avg_score,
        SUM(CASE WHEN qa.percentage >= 70 THEN 1 ELSE 0 END) * 100.0 / COUNT(qa.id) as pass_rate,
        COUNT(DISTINCT CASE WHEN sa.is_correct = TRUE THEN 1 END) as correct_answers,
        ROUND(AVG(qa.percentage) / 100 * 100, 2) as completion_rate,
        CEIL(SUM(CASE WHEN qa.submitted_at > DATE_SUB(NOW(), INTERVAL 1 WEEK) THEN qa.percentage ELSE 0 END) / 100) as fastest_time,
        SUM(CASE WHEN sa.is_correct = TRUE THEN 1 END) as total_correct,
        SUM(CASE WHEN qa.submitted_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN TIMESTAMPDIFF(MINUTE, qa.created_at, qa.submitted_at) ELSE 0 END) as study_time_minutes
      FROM quiz_attempts qa
      LEFT JOIN student_answers sa ON qa.id = sa.attempt_id
      WHERE qa.student_id = ?
    `, [studentId]);

    const data = stats[0] || {};
    res.json({
      quizzes_taken: data.quizzes_taken || 0,
      quizzes_passed: data.quizzes_passed || 0,
      avg_score: data.avg_score || 0,
      pass_rate: data.pass_rate || 0,
      correct_answers: data.total_correct || 0,
      completion_rate: data.completion_rate || 0,
      fastest_time: data.fastest_time || 0,
      study_time_minutes: data.study_time_minutes || 0
    });
  } catch (error) {
    console.error('Stats retrieval error:', error);
    res.status(500).json({ error: error.message });
  }
};
