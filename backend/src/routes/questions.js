const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, questionController.getAll);
router.get('/:id', optionalAuth, questionController.getById);
router.post('/', authenticateToken, questionController.create);
router.put('/:id', authenticateToken, questionController.update);
router.delete('/:id', authenticateToken, questionController.delete);

module.exports = router;
