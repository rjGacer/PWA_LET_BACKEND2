const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);
router.post('/', authenticateToken, categoryController.create);
router.put('/:id', authenticateToken, categoryController.update);
router.delete('/:id', authenticateToken, categoryController.delete);

module.exports = router;
