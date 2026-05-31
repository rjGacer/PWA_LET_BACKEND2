// Migration script to fix quiz_attempts schema
const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  user: 'root',
  password: 'koitouso',
  database: 'learniq',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function applyMigration() {
  const pool = mysql.createPool(config);
  const connection = await pool.getConnection();

  try {
    console.log('🚀 Applying migration: Fix quiz_attempts schema...\n');

    // Step 1: Drop the problematic UNIQUE constraint if it exists
    console.log('Step 1: Dropping UNIQUE constraint...');
    try {
      await connection.query('ALTER TABLE `quiz_attempts` DROP INDEX `unique_student_quiz_mode`');
      console.log('✅ UNIQUE constraint dropped\n');
    } catch (err) {
      if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⚠️  UNIQUE constraint doesn\'t exist (already dropped)\n');
      } else {
        throw err;
      }
    }

    // Step 2: Modify the mode ENUM to include 'random'
    console.log('Step 2: Updating mode ENUM to include \'random\'...');
    try {
      await connection.query(
        "ALTER TABLE `quiz_attempts` MODIFY `mode` ENUM('exam','practice','module','random') DEFAULT 'exam'"
      );
      console.log('✅ Mode ENUM updated to support: exam, practice, module, random\n');
    } catch (err) {
      console.error('❌ Error updating mode ENUM:', err.message);
      throw err;
    }

    // Step 3: Add indexes for better query performance
    console.log('Step 3: Adding performance indexes...');
    try {
      await connection.query(
        'ALTER TABLE `quiz_attempts` ADD INDEX `idx_student_mode` (`student_id`, `mode`)'
      );
      console.log('✅ Index idx_student_mode added');
    } catch (err) {
      if (err.code !== 'ER_DUP_KEYNAME') {
        throw err;
      }
      console.log('⚠️  Index idx_student_mode already exists');
    }

    try {
      await connection.query(
        'ALTER TABLE `quiz_attempts` ADD INDEX `idx_student_quiz_mode` (`student_id`, `quiz_id`, `mode`)'
      );
      console.log('✅ Index idx_student_quiz_mode added\n');
    } catch (err) {
      if (err.code !== 'ER_DUP_KEYNAME') {
        throw err;
      }
      console.log('⚠️  Index idx_student_quiz_mode already exists\n');
    }

    // Verification
    console.log('Step 4: Verifying schema changes...');
    const [columns] = await connection.query(
      'SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = "quiz_attempts" AND TABLE_SCHEMA = "learniq" AND COLUMN_NAME = "mode"'
    );
    console.log('✅ Mode column definition:', columns[0]);

    const [indexes] = await connection.query(
      'SHOW INDEXES FROM quiz_attempts WHERE Column_name IN ("student_id", "quiz_id", "mode")'
    );
    console.log('✅ Indexes on quiz_attempts:');
    indexes.forEach(idx => {
      console.log(`   - ${idx.Key_name} (${idx.Column_name})`);
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('📝 Summary:');
    console.log('   ✓ Removed UNIQUE constraint preventing multiple attempts');
    console.log('   ✓ Added "random" mode support');
    console.log('   ✓ Added performance indexes');
    console.log('\n🎯 Now all quiz modes support multiple attempts:');
    console.log('   - Practice mode: unlimited retakes tracked');
    console.log('   - Module mode: multiple attempts tracked');
    console.log('   - Exam mode: multiple attempts tracked');
    console.log('   - Random mode: now fully supported');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
    await pool.end();
  }
}

applyMigration();
