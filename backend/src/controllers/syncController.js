const pool = require('../config/database');

/**
 * Sync Controller - Handles data synchronization between teachers and students
 */

// Get teacher sync settings
exports.getSyncSettings = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Get or create sync settings
    const query = `
      SELECT 
        auto_sync_enabled,
        last_sync_time,
        last_sync_status,
        last_sync_message
      FROM teacher_sync_settings
      WHERE teacher_id = ?
    `;

    try {
      const [results] = await pool.query(query, [teacherId]);

      if (results.length === 0) {
        // Create default sync settings
        const insertQuery = `
          INSERT INTO teacher_sync_settings (teacher_id, auto_sync_enabled)
          VALUES (?, TRUE)
        `;
        await pool.query(insertQuery, [teacherId]);
        
        return res.json({
          auto_sync_enabled: true,
          last_sync_time: null,
          last_sync_status: 'pending',
          last_sync_message: 'Never synced',
          pending_items: 0
        });
      }

      const settings = results[0];
      
      // Count pending sync items
      const countQuery = `
        SELECT COUNT(*) as pending_count FROM (
          SELECT id FROM subjects WHERE created_by = ? AND is_synced = FALSE
          UNION ALL
          SELECT id FROM modules WHERE created_by = ? AND is_synced = FALSE
          UNION ALL
          SELECT id FROM quizzes WHERE created_by = ? AND is_synced = FALSE
        ) as pending_items
      `;

      const [countResults] = await pool.query(countQuery, [teacherId, teacherId, teacherId]);

      console.log('[SYNC-SETTINGS] Loaded for teacher', teacherId, ':', { 
        auto_sync_enabled: settings.auto_sync_enabled,
        pending_items: countResults[0].pending_count
      });

      res.json({
        auto_sync_enabled: Boolean(settings.auto_sync_enabled),
        last_sync_time: settings.last_sync_time,
        last_sync_status: settings.last_sync_status,
        last_sync_message: settings.last_sync_message,
        pending_items: countResults[0].pending_count
      });
    } catch (dbError) {
      console.error('[SYNC-SETTINGS] Database error:', dbError);
      res.status(500).json({ error: dbError.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update auto-sync setting
exports.updateAutoSync = async (req, res) => {
  try {
    const { auto_sync_enabled } = req.body;
    const teacherId = req.user.id;

    if (typeof auto_sync_enabled !== 'boolean') {
      return res.status(400).json({ error: 'auto_sync_enabled must be a boolean' });
    }

    const query = `
      INSERT INTO teacher_sync_settings (teacher_id, auto_sync_enabled)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE auto_sync_enabled = ?, updated_at = NOW()
    `;

    try {
      await pool.query(query, [teacherId, auto_sync_enabled, auto_sync_enabled]);
      
      console.log('[AUTO-SYNC] Updated for teacher', teacherId, ':', auto_sync_enabled);
      
      // If enabling auto-sync, check for pending items and sync them automatically
      if (auto_sync_enabled) {
        const countQuery = `
          SELECT COUNT(*) as pending_count FROM (
            SELECT id FROM subjects WHERE created_by = ? AND is_synced = FALSE
            UNION ALL
            SELECT id FROM modules WHERE created_by = ? AND is_synced = FALSE
            UNION ALL
            SELECT id FROM quizzes WHERE created_by = ? AND is_synced = FALSE
          ) as pending_items
        `;
        
        const [countResults] = await pool.query(countQuery, [teacherId, teacherId, teacherId]);
        const pendingCount = countResults[0].pending_count;
        
        if (pendingCount > 0) {
          console.log('[AUTO-SYNC] Auto-sync enabled with', pendingCount, 'pending items. Starting automatic sync...');
          
          // Perform sync asynchronously (don't block the response)
          syncTeacherContent(teacherId).catch(error => {
            console.error('[AUTO-SYNC] Error during automatic sync:', error);
          });
        }
      }
      
      res.json({ 
        success: true, 
        message: `Auto-sync ${auto_sync_enabled ? 'enabled' : 'disabled'}`,
        auto_sync_enabled: Boolean(auto_sync_enabled)
      });
    } catch (dbError) {
      console.error('[AUTO-SYNC] Database error:', dbError);
      res.status(500).json({ error: dbError.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Trigger manual sync
exports.syncNow = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Update sync status to in_progress
    const updateStatusQuery = `
      INSERT INTO teacher_sync_settings (teacher_id, last_sync_status)
      VALUES (?, 'in_progress')
      ON DUPLICATE KEY UPDATE 
        last_sync_status = 'in_progress',
        updated_at = NOW()
    `;

    try {
      await pool.query(updateStatusQuery, [teacherId]);

      console.log('[SYNC-NOW] Starting manual sync for teacher', teacherId);

      // Sync all unsynced items for this teacher
      await syncTeacherContent(teacherId);

      // Update sync status to success
      const successQuery = `
        UPDATE teacher_sync_settings
        SET 
          last_sync_status = 'success',
          last_sync_time = NOW(),
          last_sync_message = 'Successfully synced all content',
          updated_at = NOW()
        WHERE teacher_id = ?
      `;

      await pool.query(successQuery, [teacherId]);

      console.log('[SYNC-NOW] Manual sync completed for teacher', teacherId);

      res.json({
        success: true,
        message: 'Content synced successfully',
        synced_at: new Date(),
        synced_items: {
          subjects: 0,
          modules: 0,
          quizzes: 0,
          questions: 0
        }
      });
    } catch (error) {
      console.error('[SYNC-NOW] Error during sync:', error);

      // Update sync status to failed
      const failedQuery = `
        UPDATE teacher_sync_settings
        SET 
          last_sync_status = 'failed',
          last_sync_message = ?,
          updated_at = NOW()
        WHERE teacher_id = ?
      `;

      try {
        await pool.query(failedQuery, [error.message, teacherId]);
      } catch (e) {
        console.error('[SYNC-NOW] Error updating failed status:', e);
      }

      res.status(500).json({ error: error.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper function to sync teacher content
async function syncTeacherContent(teacherId) {
  try {
    console.log('[SYNC-CONTENT] Syncing content for teacher', teacherId);

    // Sync subjects
    const syncSubjectsQuery = `
      UPDATE subjects
      SET is_synced = TRUE, synced_at = NOW()
      WHERE created_by = ? AND is_synced = FALSE
    `;
    const [subjectsResult] = await pool.query(syncSubjectsQuery, [teacherId]);
    console.log('[SYNC-CONTENT] Synced subjects:', subjectsResult.affectedRows);

    // Sync modules
    const syncModulesQuery = `
      UPDATE modules
      SET is_synced = TRUE, synced_at = NOW()
      WHERE created_by = ? AND is_synced = FALSE
    `;
    const [modulesResult] = await pool.query(syncModulesQuery, [teacherId]);
    console.log('[SYNC-CONTENT] Synced modules:', modulesResult.affectedRows);

    // Sync quizzes
    const syncQuizzesQuery = `
      UPDATE quizzes
      SET is_synced = TRUE, synced_at = NOW()
      WHERE created_by = ? AND is_synced = FALSE
    `;
    const [quizzesResult] = await pool.query(syncQuizzesQuery, [teacherId]);
    console.log('[SYNC-CONTENT] Synced quizzes:', quizzesResult.affectedRows);

    // Sync questions
    const syncQuestionsQuery = `
      UPDATE questions
      SET is_synced = TRUE, synced_at = NOW()
      WHERE created_by = ? AND is_synced = FALSE
    `;
    const [questionsResult] = await pool.query(syncQuestionsQuery, [teacherId]);
    console.log('[SYNC-CONTENT] Synced questions:', questionsResult.affectedRows);

    console.log('[SYNC-CONTENT] All content synced for teacher', teacherId);
  } catch (error) {
    console.error('[SYNC-CONTENT] Error syncing content:', error);
    throw new Error(`Error syncing content: ${error.message}`);
  }
}

// Get sync status
exports.getSyncStatus = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Get overall sync status
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM subjects WHERE created_by = ? AND is_synced = FALSE) as unsynced_subjects,
        (SELECT COUNT(*) FROM modules WHERE created_by = ? AND is_synced = FALSE) as unsynced_modules,
        (SELECT COUNT(*) FROM quizzes WHERE created_by = ? AND is_synced = FALSE) as unsynced_quizzes,
        (SELECT COUNT(*) FROM questions WHERE created_by = ? AND is_synced = FALSE) as unsynced_questions,
        (SELECT auto_sync_enabled FROM teacher_sync_settings WHERE teacher_id = ?) as auto_sync_enabled,
        (SELECT last_sync_time FROM teacher_sync_settings WHERE teacher_id = ?) as last_sync_time
    `;

    try {
      const [results] = await pool.query(query, [teacherId, teacherId, teacherId, teacherId, teacherId, teacherId]);

      if (results.length === 0) {
        return res.json({
          unsynced_subjects: 0,
          unsynced_modules: 0,
          unsynced_quizzes: 0,
          unsynced_questions: 0,
          auto_sync_enabled: true,
          last_sync_time: null,
          needs_sync: false
        });
      }

      const status = results[0];
      const totalUnsynced = status.unsynced_subjects + status.unsynced_modules + status.unsynced_quizzes + status.unsynced_questions;

      res.json({
        unsynced_subjects: status.unsynced_subjects,
        unsynced_modules: status.unsynced_modules,
        unsynced_quizzes: status.unsynced_quizzes,
        unsynced_questions: status.unsynced_questions,
        auto_sync_enabled: Boolean(status.auto_sync_enabled),
        last_sync_time: status.last_sync_time,
        needs_sync: totalUnsynced > 0,
        total_unsynced: totalUnsynced
      });
    } catch (dbError) {
      console.error('[SYNC-STATUS] Database error:', dbError);
      res.status(500).json({ error: dbError.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
