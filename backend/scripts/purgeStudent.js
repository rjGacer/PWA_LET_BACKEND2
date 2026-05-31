// Simple script to permanently delete a student by email
// Usage: node scripts/purgeStudent.js student@example.com

const pool = require('../src/config/database');

async function purge(email) {
  if (!email) {
    console.error('Please provide an email: node scripts/purgeStudent.js student@example.com');
    process.exit(1);
  }

  try {
    const [rows] = await pool.query('SELECT id, email, is_active FROM students WHERE email = ?', [email]);
    if (rows.length === 0) {
      console.log('No student found with email:', email);
      process.exit(0);
    }

    const student = rows[0];
    console.log('Found student:', student);

    const [result] = await pool.query('DELETE FROM students WHERE email = ?', [email]);
    console.log('Deleted rows:', result.affectedRows);
    process.exit(0);
  } catch (err) {
    console.error('Error purging student:', err.message);
    process.exit(1);
  }
}

purge(process.argv[2]);
