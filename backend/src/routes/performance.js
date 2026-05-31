const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/performanceController');
const { authenticateToken } = require('../middleware/auth');

// Save quiz attempt
router.post('/quiz-attempts', authenticateToken, performanceController.saveQuizAttempt);

// Get student quiz history
router.get('/student-history', authenticateToken, performanceController.getStudentQuizHistory);

router.get('/stats', authenticateToken, performanceController.getStudentStats);
router.get('/student-stats', authenticateToken, performanceController.getStudentDashboardStats);
router.get('/weekly-progress', authenticateToken, performanceController.getWeeklyProgressStats);
router.get('/categories', authenticateToken, performanceController.getAllCategoriesPerformance);
router.get('/category/:categoryId', authenticateToken, performanceController.getCategoryPerformance);
router.get('/subject/:subjectId', authenticateToken, performanceController.getSubjectPerformance);
router.get('/quiz/:quizId', authenticateToken, performanceController.getQuizPerformance);
router.get('/top-subjects', authenticateToken, performanceController.getTopPerformingSubjects);
router.get('/recent-activity', authenticateToken, performanceController.getRecentActivity);
router.get('/student-activity', authenticateToken, performanceController.getStudentRecentActivity);
router.get('/leaderboard', authenticateToken, performanceController.getLeaderboard);
router.get('/system-overview', authenticateToken, performanceController.getSystemOverview);

module.exports = router;
