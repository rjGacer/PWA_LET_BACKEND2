const pool = require('../config/database');

class Subject {
  static async getAll(categoryId = null, onlySync = false) {
    let query = 'SELECT * FROM subjects WHERE is_active = TRUE';
    const params = [];
    
    // Only return synced subjects for students (when onlySync is true)
    if (onlySync) {
      query += ' AND is_synced = TRUE';
    }
    
    if (categoryId) {
      query += ' AND category_id = ?';
      params.push(categoryId);
    }
    
    query += ' ORDER BY name';
    console.log('[SUBJECT-MODEL] getAll query:', query, 'params:', params);
    const [rows] = await pool.query(query, params);
    console.log('[SUBJECT-MODEL] getAll found', rows.length, 'subjects:', rows.map(r => ({id: r.id, name: r.name, category_id: r.category_id})));
    return rows;
  }

  static async getById(id, onlySync = false) {
    let query = 'SELECT * FROM subjects WHERE id = ? AND is_active = TRUE';
    const params = [id];
    
    if (onlySync) {
      query += ' AND is_synced = TRUE';
    }
    
    console.log('[SUBJECT-MODEL] Executing query:', query, 'with params:', params);
    const [rows] = await pool.query(query, params);
    console.log('[SUBJECT-MODEL] Query result:', rows);
    return rows[0];
  }

  static async getByCategoryId(categoryId, onlySync = false) {
    let query = 'SELECT * FROM subjects WHERE category_id = ? AND is_active = TRUE';
    const params = [categoryId];
    
    if (onlySync) {
      query += ' AND is_synced = TRUE';
    }
    
    query += ' ORDER BY name';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async create(data) {
    const { category_id, name, description, icon, color, created_by } = data;
    
    // Check if subject with same name already exists and is active
    const [existing] = await pool.query(
      'SELECT id FROM subjects WHERE category_id = ? AND name = ? AND is_active = TRUE',
      [category_id, name]
    );
    
    if (existing.length > 0) {
      throw new Error('Subject already exists in this category');
    }
    
    const [result] = await pool.query(
      'INSERT INTO subjects (category_id, name, description, icon, color, created_by, is_active, is_synced) VALUES (?, ?, ?, ?, ?, ?, TRUE, FALSE)',
      [category_id, name, description, icon, color, created_by]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const { name, description, icon, color } = data;
    await pool.query(
      'UPDATE subjects SET name = ?, description = ?, icon = ?, color = ? WHERE id = ?',
      [name, description, icon, color, id]
    );
    return this.getById(id);
  }

  static async delete(id) {
    // Use hard delete to avoid unique constraint violations with soft-deleted duplicates
    // Foreign keys have ON DELETE CASCADE, so child records are handled automatically
    await pool.query('DELETE FROM subjects WHERE id = ?', [id]);
    return true;
  }

  static async getStats(id, onlySync = false) {
    let quizzesQuery = 'SELECT COUNT(*) as count FROM quizzes WHERE subject_id = ? AND is_active = TRUE';
    let modulesQuery = 'SELECT COUNT(*) as count FROM modules WHERE subject_id = ? AND is_active = TRUE';
    let questionsQuery = 'SELECT COUNT(*) as count FROM questions WHERE subject_id = ? AND is_active = TRUE';
    
    if (onlySync) {
      quizzesQuery += ' AND is_synced = TRUE';
      modulesQuery += ' AND is_synced = TRUE';
      questionsQuery += ' AND is_synced = TRUE';
    }
    
    const [quizzes] = await pool.query(quizzesQuery, [id]);
    const [modules] = await pool.query(modulesQuery, [id]);
    const [questions] = await pool.query(questionsQuery, [id]);
    
    return {
      quizzes: quizzes[0].count,
      modules: modules[0].count,
      questions: questions[0].count
    };
  }
}

module.exports = Subject;
