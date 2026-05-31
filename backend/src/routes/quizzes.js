const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// More specific routes must come FIRST before /:id
router.get('/attempts/:attemptId', authenticateToken, quizController.getAttempt);
router.get('/student/:studentId/attempts', quizController.getStudentAttempts);

// Generic routes
router.get('/', optionalAuth, quizController.getAll);
router.get('/:id', optionalAuth, quizController.getById);
router.post('/', authenticateToken, quizController.create);
router.put('/:id', authenticateToken, quizController.update);
router.delete('/:id', authenticateToken, quizController.delete);
router.post('/:id/add-question', authenticateToken, quizController.addQuestion);
router.post('/:id/remove-question', authenticateToken, quizController.removeQuestion);
router.post('/:id/submit', quizController.submitAttempt);

module.exports = router;
