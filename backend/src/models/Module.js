const pool = require('../config/database');

class Module {
  static async getAll(subjectId, onlySync = false) {
    let query = 'SELECT m.* FROM modules m WHERE m.subject_id = ? AND m.is_active = TRUE';
    const params = [subjectId];
    
    if (onlySync) {
      query += ' AND m.is_synced = TRUE';
    }
    
    query += ' ORDER BY m.`order`';
    const [rows] = await pool.query(query, params);
    
    // Get files for each module
    for (let module of rows) {
      module.files = await this.getModuleFiles(module.id);
    }
    
    return rows;
  }

  static async getById(id, onlySync = false) {
    let query = 'SELECT * FROM modules WHERE id = ?';
    const params = [id];
    
    if (onlySync) {
      query += ' AND is_synced = TRUE';
    }
    
    const [rows] = await pool.query(query, params);
    const module = rows[0];
    
    if (module) {
      module.files = await this.getModuleFiles(id);
    }
    
    return module;
  }

  static async getModuleFiles(moduleId) {
    const [files] = await pool.query(
      'SELECT id, file_name, file_path, file_type, file_size, original_name, created_at FROM module_files WHERE module_id = ? AND is_active = TRUE ORDER BY created_at DESC',
      [moduleId]
    );
    return files || [];
  }

  static async addModuleFile(moduleId, fileData) {
    const { file_name, file_path, file_type, file_size, original_name, uploaded_by } = fileData;
    const [result] = await pool.query(
      'INSERT INTO module_files (module_id, file_name, file_path, file_type, file_size, original_name, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [moduleId, file_name, file_path, file_type, file_size, original_name, uploaded_by]
    );
    return result.insertId;
  }

  static async deleteModuleFile(fileId) {
    await pool.query('UPDATE module_files SET is_active = FALSE WHERE id = ?', [fileId]);
    return true;
  }

  static async create(data) {
    const { subject_id, title, description, content, file_type, file_url, order, created_by } = data;
    const [result] = await pool.query(
      'INSERT INTO modules (subject_id, title, description, content, file_type, file_url, `order`, created_by, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE)',
      [subject_id, title, description, content, file_type, file_url, order || 0, created_by]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const { title, description, content, file_type, file_url, order } = data;
    await pool.query(
      'UPDATE modules SET title = ?, description = ?, content = ?, file_type = ?, file_url = ?, `order` = ? WHERE id = ?',
      [title, description, content, file_type, file_url, order, id]
    );
    return this.getById(id);
  }

  static async delete(id) {
    await pool.query('UPDATE modules SET is_active = FALSE WHERE id = ?', [id]);
    return true;
  }
}

module.exports = Module;
