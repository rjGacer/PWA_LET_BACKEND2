const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/me', teacherController.getCurrentUser);
router.get('/profile', teacherController.getProfile);
router.put('/profile', teacherController.updateProfile);
router.post('/password', teacherController.updatePassword);
router.get('/preferences', teacherController.getPreferences);
router.put('/preferences', teacherController.updatePreferences);
router.delete('/account', teacherController.deleteAccount);

module.exports = router;
