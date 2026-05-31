const pool = require('../config/database');

class Student {
  static async getById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, device_id, profile_picture, is_active, created_at, updated_at FROM students WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async updateProfile(id, data) {
    const { name, phone, course, bio, profile_picture } = data;
    
    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push('name = ?');
      values.push(name);
    }
    if (phone !== undefined) {
      fields.push('phone = ?');
      values.push(phone);
    }
    if (profile_picture !== undefined) {
      fields.push('profile_picture = ?');
      values.push(profile_picture);
    }

    if (fields.length === 0) {
      return await this.getById(id);
    }

    values.push(id);

    const query = `UPDATE students SET ${fields.join(', ')} WHERE id = ?`;
    await pool.query(query, values);

    return await this.getById(id);
  }

  static async updatePassword(id, hashedPassword) {
    await pool.query(
      'UPDATE students SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
    return true;
  }

  static async updatePreferences(id, preferences) {
    // Preferences are stored client-side in localStorage
    // This method now just returns the validated preferences
    const { email_reminders, push_notifications, weekly_report } = preferences;
    
    return {
      email_reminders: email_reminders !== undefined ? email_reminders : true,
      push_notifications: push_notifications !== undefined ? push_notifications : true,
      weekly_report: weekly_report !== undefined ? weekly_report : false
    };
  }

  static async delete(id) {
    // Hard delete so related records with ON DELETE CASCADE are removed
    await pool.query(
      'DELETE FROM students WHERE id = ?',
      [id]
    );
    return true;
  }

  static async getPreferences(id) {
    const [rows] = await pool.query(
      'SELECT JSON_EXTRACT(metadata, "$.preferences") as preferences FROM students WHERE id = ?',
      [id]
    );

    if (rows.length === 0) return null;

    const prefs = rows[0].preferences;
    return prefs ? JSON.parse(prefs) : {
      email_reminders: true,
      push_notifications: true,
      weekly_report: false
    };
  }

  static async getProfileData(id) {
    const [rows] = await pool.query(`
      SELECT 
        id,
        name,
        email,
        phone,
        profile_picture,
        created_at
      FROM students WHERE id = ?
    `, [id]);

    if (rows.length === 0) return null;

    const student = rows[0];
    return {
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      profile_picture: student.profile_picture || null,
      bio: '',
      course: '',
      preferences: {
        email_reminders: true,
        push_notifications: true,
        weekly_report: false
      }
    };
  }
}

module.exports = Student;
