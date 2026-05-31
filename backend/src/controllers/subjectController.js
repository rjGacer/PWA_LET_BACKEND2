const Subject = require('../models/Subject');
const pool = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { categoryId } = req.query;
    // Filter by sync status if user is a student
    const onlySync = req.user?.role === 'student' || !req.user;
    console.log('[SUBJECTS-GETALL] User Role:', req.user?.role, 'OnlySync:', onlySync, 'CategoryId:', categoryId);
    const subjects = await Subject.getAll(categoryId, onlySync);
    console.log('[SUBJECTS-GETALL] Returning', subjects.length, 'subjects');
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    // Filter by sync status if user is a student
    const onlySync = req.user?.role === 'student' || !req.user;
    const subject = await Subject.getById(req.params.id, onlySync);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    
    const stats = await Subject.getStats(req.params.id, onlySync);
    res.json({ ...subject, ...stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getByCategoryId = async (req, res) => {
  try {
    // Filter by sync status if user is a student
    const onlySync = req.user?.role === 'student' || !req.user;
    const subjects = await Subject.getByCategoryId(req.params.categoryId, onlySync);
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { category_id, name, description, icon, color } = req.body;
    
    if (!category_id || !name) {
      return res.status(400).json({ error: 'Category ID and Subject name are required' });
    }

    const id = await Subject.create({
      category_id,
      name,
      description,
      icon,
      color,
      created_by: req.user.id
    });

    // Check if auto-sync is enabled for this teacher and mark content as synced if it is
    try {
      const [results] = await pool.query(
        'SELECT auto_sync_enabled FROM teacher_sync_settings WHERE teacher_id = ?',
        [req.user.id]
      );
      
      console.log(`[AUTO-SYNC] Subject ${id}: Teacher ${req.user.id} sync settings:`, results);
      
      if (results.length > 0 && (results[0].auto_sync_enabled === 1 || results[0].auto_sync_enabled === true)) {
        console.log(`[AUTO-SYNC] Auto-sync ENABLED - marking subject ${id} as synced`);
        await pool.query(
          'UPDATE subjects SET is_synced = TRUE, synced_at = NOW() WHERE id = ?',
          [id]
        );
        console.log(`[AUTO-SYNC] Subject ${id} marked as synced successfully`);
      } else {
        console.log(`[AUTO-SYNC] Auto-sync DISABLED - subject ${id} remains unsynced`);
      }
    } catch (syncError) {
      console.error('Auto-sync error:', syncError);
      // Continue even if sync check fails
    }

    const subject = await Subject.getById(id);
    res.status(201).json(subject);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Subject already exists in this category' });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const subject = await Subject.getById(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const updated = await Subject.update(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const subject = await Subject.getById(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    await Subject.delete(req.params.id);
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
