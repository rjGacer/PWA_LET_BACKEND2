const pool = require('../config/database');

class Category {
  static async getAll() {
    const [rows] = await pool.query('SELECT * FROM categories WHERE is_active = TRUE ORDER BY `order`');
    return rows;
  }

  static async getById(id) {
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(data) {
    const { name, description, icon, color, order } = data;
    const [result] = await pool.query(
      'INSERT INTO categories (name, description, icon, color, `order`) VALUES (?, ?, ?, ?, ?)',
      [name, description, icon, color, order || 0]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const { name, description, icon, color, order } = data;
    await pool.query(
      'UPDATE categories SET name = ?, description = ?, icon = ?, color = ?, `order` = ? WHERE id = ?',
      [name, description, icon, color, order, id]
    );
    return this.getById(id);
  }

  static async delete(id) {
    await pool.query('UPDATE categories SET is_active = FALSE WHERE id = ?', [id]);
    return true;
  }
}

module.exports = Category;
