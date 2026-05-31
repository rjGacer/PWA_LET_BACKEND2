const Module = require('../models/Module');
const pool = require('../config/database');
const path = require('path');

exports.getAll = async (req, res) => {
  try {
    const { subjectId } = req.query;
    if (!subjectId) {
      return res.status(400).json({ error: 'Subject ID is required' });
    }

    // Filter by sync status if user is a student
    const onlySync = req.user?.role === 'student' || !req.user;
    const modules = await Module.getAll(subjectId, onlySync);
    res.json(modules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    // Filter by sync status if user is a student
    const onlySync = req.user?.role === 'student' || !req.user;
    const module = await Module.getById(req.params.id, onlySync);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    res.json(module);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { subject_id, title, description, content, file_type, order } = req.body;
    
    if (!subject_id || !title) {
      return res.status(400).json({ error: 'Subject ID and title are required' });
    }

    // Create module (without file - file_url can be null)
    const id = await Module.create({
      subject_id,
      title,
      description,
      content,
      file_type,
      file_url: null,
      order,
      created_by: req.user.id
    });

    // Handle file upload if present
    if (req.file) {
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      const filePath = `/uploads/${req.file.filename}`;
      
      await Module.addModuleFile(id, {
        file_name: req.file.filename,
        file_path: filePath,
        file_type: fileExt.replace('.', ''),
        file_size: req.file.size,
        original_name: req.file.originalname,
        uploaded_by: req.user.id
      });
    }

    // Check if auto-sync is enabled for this teacher and mark content as synced if it is
    try {
      const [results] = await pool.query(
        'SELECT auto_sync_enabled FROM teacher_sync_settings WHERE teacher_id = ?',
        [req.user.id]
      );
      
      console.log(`[AUTO-SYNC] Module ${id}: Teacher ${req.user.id} sync settings:`, results);
      
      if (results.length > 0 && (results[0].auto_sync_enabled === 1 || results[0].auto_sync_enabled === true)) {
        console.log(`[AUTO-SYNC] Auto-sync ENABLED - marking module ${id} as synced`);
        await pool.query(
          'UPDATE modules SET is_synced = TRUE, synced_at = NOW() WHERE id = ?',
          [id]
        );
        console.log(`[AUTO-SYNC] Module ${id} marked as synced successfully`);
      } else {
        console.log(`[AUTO-SYNC] Auto-sync DISABLED - module ${id} remains unsynced`);
      }
    } catch (syncError) {
      console.error('Auto-sync error:', syncError);
      // Continue even if sync fails
    }

    const module = await Module.getById(id);
    res.status(201).json(module);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const module = await Module.getById(req.params.id);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const { title, description, content, file_type, order } = req.body;
    
    // Update module info
    await Module.update(req.params.id, {
      title: title || module.title,
      description: description || module.description,
      content: content || module.content,
      file_type: file_type || module.file_type,
      file_url: module.file_url,
      order: order !== undefined ? order : module.order
    });

    // Handle new file upload if present
    if (req.file) {
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      const filePath = `/uploads/${req.file.filename}`;
      
      await Module.addModuleFile(req.params.id, {
        file_name: req.file.filename,
        file_path: filePath,
        file_type: fileExt.replace('.', ''),
        file_size: req.file.size,
        original_name: req.file.originalname,
        uploaded_by: req.user.id
      });
    }

    const updated = await Module.getById(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const module = await Module.getById(req.params.id);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    await Module.delete(req.params.id);
    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a specific file from a module
exports.deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Verify the file exists and belongs to the teacher
    const [files] = await pool.query(
      'SELECT mf.*, m.created_by FROM module_files mf JOIN modules m ON mf.module_id = m.id WHERE mf.id = ?',
      [fileId]
    );
    
    if (!files || files.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Only allow the teacher who created the module to delete files
    if (files[0].created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await Module.deleteModuleFile(fileId);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
