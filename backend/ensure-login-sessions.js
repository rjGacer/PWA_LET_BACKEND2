const mysql = require('mysql2/promise');

async function createLoginSessionsTable() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'koitouso',
    database: 'pwa_let_db'
  });

  try {
    const conn = await pool.getConnection();
    
    const sql = `
      CREATE TABLE IF NOT EXISTS login_sessions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_id INT NOT NULL,
        login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        logout_at TIMESTAMP NULL,
        duration_minutes INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        INDEX idx_student_id (student_id),
        INDEX idx_login_at (login_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await conn.query(sql);
    console.log('✅ login_sessions table created/verified');
    
    conn.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createLoginSessionsTable();
