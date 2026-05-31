const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/database');

/**
 * Record login session
 * POST /api/v1/sessions/login
 */
router.post('/login', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    
    try {
      // Record login
      const [result] = await pool.query(
        'INSERT INTO login_sessions (student_id, login_at) VALUES (?, NOW())',
        [studentId]
      );
      
      res.json({
        sessionId: result.insertId,
        loginTime: new Date().toISOString()
      });
    } catch (dbError) {
      // If table doesn't exist, return success anyway (graceful degradation)
      if (dbError.code === 'ER_NO_SUCH_TABLE') {
        console.warn('login_sessions table not found, skipping session recording');
        res.json({
          sessionId: null,
          loginTime: new Date().toISOString(),
          note: 'session recording skipped - table not found'
        });
      } else {
        throw dbError;
      }
    }
  } catch (error) {
    console.error('Error recording login:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Record logout session
 * POST /api/v1/sessions/logout
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    
    try {
      // Update logout time and calculate duration
      const [result] = await pool.query(`
        UPDATE login_sessions 
        SET logout_at = NOW(),
            duration_minutes = TIMESTAMPDIFF(MINUTE, login_at, NOW())
        WHERE id = ? AND student_id = ?
      `, [sessionId, studentId]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      res.json({
        sessionId,
        logoutTime: new Date().toISOString()
      });
    } catch (dbError) {
      // If table doesn't exist, return success anyway (graceful degradation)
      if (dbError.code === 'ER_NO_SUCH_TABLE') {
        console.warn('login_sessions table not found, skipping logout recording');
        res.json({
          sessionId,
          logoutTime: new Date().toISOString(),
          note: 'logout recording skipped - table not found'
        });
      } else {
        throw dbError;
      }
    }
  } catch (error) {
    console.error('Error recording logout:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get active session for student
 * GET /api/v1/sessions/active
 */
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Get the most recent open session
    const [session] = await pool.query(`
      SELECT id, login_at 
      FROM login_sessions
      WHERE student_id = ? AND logout_at IS NULL
      ORDER BY login_at DESC
      LIMIT 1
    `, [studentId]);
    
    if (session && session.length > 0) {
      res.json(session[0]);
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('Error fetching active session:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
