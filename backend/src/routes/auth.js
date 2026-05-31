const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Teacher routes
router.post('/teacher/register', authController.teacherRegister);
router.post('/teacher/login', authController.teacherLogin);

// Student routes
router.post('/student/register', authController.studentRegister);
router.post('/student/login', authController.studentLogin);

// General routes
router.post('/verify', authController.verifyToken);
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/logout', authController.logout);

module.exports = router;
