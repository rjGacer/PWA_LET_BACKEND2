const pool = require('../config/database');

class Teacher {
  static async getById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, specialization, role, is_active, created_at, updated_at FROM teachers WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async getProfileData(id) {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, specialization, role, is_active, created_at FROM teachers WHERE id = ?`,
      [id]
    );
    if (rows.length === 0) return null;
    const t = rows[0];
    return {
      id: t.id,
      name: t.name,
      email: t.email,
      phone: t.phone,
      specialization: t.specialization || '',
      role: t.role || 'teacher'
    };
  }

  static async updateProfile(id, data) {
    const { name, phone, specialization } = data;
    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push('name = ?'); values.push(name);
    }
    if (phone !== undefined) {
      fields.push('phone = ?'); values.push(phone);
    }
    if (specialization !== undefined) {
      fields.push('specialization = ?'); values.push(specialization);
    }

    if (fields.length === 0) return await this.getById(id);

    values.push(id);
    const q = `UPDATE teachers SET ${fields.join(', ')} WHERE id = ?`;
    await pool.query(q, values);
    return await this.getById(id);
  }

  static async updatePassword(id, hashedPassword) {
    await pool.query('UPDATE teachers SET password = ? WHERE id = ?', [hashedPassword, id]);
    return true;
  }

  static async delete(id) {
    await pool.query('UPDATE teachers SET is_active = FALSE WHERE id = ?', [id]);
    return true;
  }

  // Preferences stored in teacher_sync_settings.last_sync_message as JSON (fallback)
  static async getPreferences(id) {
    const [rows] = await pool.query('SELECT last_sync_message FROM teacher_sync_settings WHERE teacher_id = ?', [id]);
    if (rows.length === 0) return null;
    try {
      const parsed = rows[0].last_sync_message ? JSON.parse(rows[0].last_sync_message) : null;
      return parsed && parsed.preferences ? parsed.preferences : null;
    } catch (e) {
      return null;
    }
  }

  static async updatePreferences(id, prefs) {
    // Read existing row
    const [rows] = await pool.query('SELECT id, last_sync_message FROM teacher_sync_settings WHERE teacher_id = ?', [id]);
    const payload = { preferences: prefs };
    if (rows.length === 0) {
      await pool.query('INSERT INTO teacher_sync_settings (teacher_id, auto_sync_enabled, last_sync_status, last_sync_message) VALUES (?, ?, ?, ?)', [id, true, 'pending', JSON.stringify(payload)]);
    } else {
      const existing = rows[0].last_sync_message ? rows[0].last_sync_message : null;
      await pool.query('UPDATE teacher_sync_settings SET last_sync_message = ? WHERE teacher_id = ?', [JSON.stringify(payload), id]);
    }
    return prefs;
  }
}

module.exports = Teacher;
