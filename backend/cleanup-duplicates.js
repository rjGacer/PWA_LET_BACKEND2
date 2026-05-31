/**
 * Cleanup script to remove duplicate practice and module quiz attempts
 * Removes duplicates caused by double submission bug
 * Keeps the first (earliest) entry for each quiz attempt
 */

require('dotenv').config();
const pool = require('./src/config/database');

async function cleanupDuplicates() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    console.log('🔍 Scanning for duplicate quiz attempts...\n');
    
    // Find duplicates in practice mode
    const [practiceDuplicates] = await connection.query(`
      SELECT student_id, quiz_id, DATE(submitted_at) as attempt_date, COUNT(*) as count
      FROM quiz_attempts
      WHERE mode = 'practice'
      GROUP BY student_id, quiz_id, DATE(submitted_at)
      HAVING count > 1
    `);
    
    // Find duplicates in module mode
    const [moduleDuplicates] = await connection.query(`
      SELECT student_id, quiz_id, DATE(submitted_at) as attempt_date, COUNT(*) as count
      FROM quiz_attempts
      WHERE mode = 'module'
      GROUP BY student_id, quiz_id, DATE(submitted_at)
      HAVING count > 1
    `);
    
    if (practiceDuplicates.length === 0 && moduleDuplicates.length === 0) {
      console.log('✅ No duplicates found!');
      return;
    }
    
    console.log(`📋 Found ${practiceDuplicates.length} duplicate practice mode groups`);
    practiceDuplicates.forEach((dup, idx) => {
      console.log(`   ${idx + 1}. Student ${dup.student_id}, Quiz ${dup.quiz_id} - ${dup.count} entries`);
    });
    
    console.log(`\n📋 Found ${moduleDuplicates.length} duplicate module mode groups`);
    moduleDuplicates.forEach((dup, idx) => {
      console.log(`   ${idx + 1}. Student ${dup.student_id}, Quiz ${dup.quiz_id} - ${dup.count} entries`);
    });
    
    // Delete duplicates - keep the earliest entry
    console.log('\n🗑️  Deleting duplicate entries...\n');
    
    // For practice mode: delete all but the first (earliest) entry
    const [practiceResult] = await connection.query(`
      DELETE FROM quiz_attempts
      WHERE mode = 'practice' AND id IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (
            PARTITION BY student_id, quiz_id, DATE(submitted_at)
            ORDER BY id ASC
          ) as rn
          FROM quiz_attempts
          WHERE mode = 'practice'
        ) as ranked
        WHERE rn > 1
      )
    `);
    
    // For module mode: delete all but the first (earliest) entry
    const [moduleResult] = await connection.query(`
      DELETE FROM quiz_attempts
      WHERE mode = 'module' AND id IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (
            PARTITION BY student_id, quiz_id, DATE(submitted_at)
            ORDER BY id ASC
          ) as rn
          FROM quiz_attempts
          WHERE mode = 'module'
        ) as ranked
        WHERE rn > 1
      )
    `);
    
    console.log(`✅ Deleted ${practiceResult.affectedRows} duplicate practice mode entries`);
    console.log(`✅ Deleted ${moduleResult.affectedRows} duplicate module mode entries`);
    
    console.log('\n🎉 Cleanup complete!');
    console.log('💡 Remember to hard refresh your browser (Ctrl+Shift+R) to see the changes');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
    await pool.end();
  }
}

cleanupDuplicates();
