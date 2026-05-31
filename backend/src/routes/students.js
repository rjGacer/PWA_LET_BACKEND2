const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken } = require('../middleware/auth');

// All student endpoints require authentication
router.use(authenticateToken);

// Current user endpoint
router.get('/me', studentController.getCurrentUser);

// Get specific student profile by ID (for leaderboard, etc)
router.get('/:studentId/profile', studentController.getStudentProfileById);

// Stats endpoint
router.get('/stats', studentController.getStats);

// Profile endpoints
router.get('/profile', studentController.getProfile);
router.put('/profile', studentController.updateProfile);

// Password endpoint
router.post('/password', studentController.updatePassword);

// Preferences endpoints
router.get('/preferences', studentController.getPreferences);
router.put('/preferences', studentController.updatePreferences);

// Account deletion
router.delete('/account', studentController.deleteAccount);

module.exports = router;
