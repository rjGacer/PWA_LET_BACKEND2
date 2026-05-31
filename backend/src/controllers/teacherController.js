const Teacher = require('../models/Teacher');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

exports.getProfile = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const profile = await Teacher.getProfileData(teacherId);
    if (!profile) return res.status(404).json({ error: 'Teacher not found' });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { name, phone, specialization } = req.body;
    if (name && name.trim().length === 0) return res.status(400).json({ error: 'Name cannot be empty' });
    const updated = await Teacher.updateProfile(teacherId, { name, phone, specialization });
    res.json({ message: 'Profile updated successfully', profile: updated });
  } catch (error) {
    console.error('Teacher profile update error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) return res.status(400).json({ error: 'All password fields are required' });
    if (newPassword !== confirmPassword) return res.status(400).json({ error: 'New passwords do not match' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const [rows] = await pool.query('SELECT password FROM teachers WHERE id = ?', [teacherId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Teacher not found' });

    const isValid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isValid) return res.status(401).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await Teacher.updatePassword(teacherId, hashed);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Teacher password update error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getPreferences = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const prefs = await Teacher.getPreferences(teacherId);
    res.json(prefs || { email_reminders: true, push_notifications: true, weekly_report: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { email_reminders, push_notifications, weekly_report } = req.body;
    const prefs = { email_reminders, push_notifications, weekly_report };
    const saved = await Teacher.updatePreferences(teacherId, prefs);
    res.json({ message: 'Preferences updated', preferences: saved });
  } catch (error) {
    console.error('Teacher preferences update error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const teacherId = req.user.id;
    // Delete related data (modules, quizzes created) - handled by FK cascade
    await Teacher.delete(teacherId);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Teacher delete error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const profile = await Teacher.getProfileData(teacherId);
    if (!profile) return res.status(404).json({ error: 'Teacher not found' });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
