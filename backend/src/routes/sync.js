const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');
const { authenticateToken } = require('../middleware/auth');

// Get teacher's sync settings
router.get('/settings', authenticateToken, syncController.getSyncSettings);

// Update auto-sync setting
router.put('/settings', authenticateToken, syncController.updateAutoSync);

// Get current sync status
router.get('/status', authenticateToken, syncController.getSyncStatus);

// Trigger manual sync
router.post('/sync-now', authenticateToken, syncController.syncNow);

module.exports = router;
