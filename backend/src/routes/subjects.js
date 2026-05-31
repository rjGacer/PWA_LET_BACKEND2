const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, subjectController.getAll);
router.get('/:id', optionalAuth, subjectController.getById);
router.get('/category/:categoryId', optionalAuth, subjectController.getByCategoryId);
router.post('/', authenticateToken, subjectController.create);
router.put('/:id', authenticateToken, subjectController.update);
router.delete('/:id', authenticateToken, subjectController.delete);

module.exports = router;
