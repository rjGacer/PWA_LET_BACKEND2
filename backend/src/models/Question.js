const pool = require('../config/database');

class Question {
  static async getAll(subjectId = null, onlySync = false) {
    let query = 'SELECT * FROM questions WHERE is_active = TRUE';
    const params = [];
    
    if (onlySync) {
      query += ' AND is_synced = TRUE';
    }
    
    if (subjectId) {
      query += ' AND subject_id = ?';
      params.push(subjectId);
    }
    
    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async getById(id, onlySync = false) {
    let query = 'SELECT * FROM questions WHERE id = ?';
    const params = [id];
    
    if (onlySync) {
      query += ' AND is_synced = TRUE';
    }
    
    const [rows] = await pool.query(query, params);
    return rows[0];
  }

  static async getWithOptions(id, onlySync = false) {
    const question = await this.getById(id, onlySync);
    if (!question) return null;

    const [options] = await pool.query(
      'SELECT * FROM question_options WHERE question_id = ? ORDER BY `order`',
      [id]
    );
    question.options = options;
    return question;
  }

  static async create(data) {
    const { subject_id, question_text, question_image, question_type, difficulty, points, explanation, created_by } = data;
    const [result] = await pool.query(
      'INSERT INTO questions (subject_id, question_text, question_image, question_type, difficulty, points, explanation, created_by, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE)',
      [subject_id, question_text, question_image, question_type, difficulty, points || 1, explanation, created_by]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const { question_text, question_image, difficulty, points, explanation } = data;
    await pool.query(
      'UPDATE questions SET question_text = ?, question_image = ?, difficulty = ?, points = ?, explanation = ? WHERE id = ?',
      [question_text, question_image, difficulty, points, explanation, id]
    );
    return this.getById(id);
  }

  static async delete(id) {
    await pool.query('UPDATE questions SET is_active = FALSE WHERE id = ?', [id]);
    return true;
  }

  static async createOption(questionId, data) {
    const { option_text, option_image, is_correct, order } = data;
    const [result] = await pool.query(
      'INSERT INTO question_options (question_id, option_text, option_image, is_correct, `order`) VALUES (?, ?, ?, ?, ?)',
      [questionId, option_text, option_image, is_correct || false, order || 0]
    );
    return result.insertId;
  }

  static async updateOption(optionId, data) {
    const { option_text, option_image, is_correct, order } = data;
    await pool.query(
      'UPDATE question_options SET option_text = ?, option_image = ?, is_correct = ?, `order` = ? WHERE id = ?',
      [option_text, option_image, is_correct, order, optionId]
    );
  }

  static async deleteOption(optionId) {
    await pool.query('DELETE FROM question_options WHERE id = ?', [optionId]);
  }

  static async deleteAllOptions(questionId) {
    await pool.query('DELETE FROM question_options WHERE question_id = ?', [questionId]);
  }
}

module.exports = Question;
