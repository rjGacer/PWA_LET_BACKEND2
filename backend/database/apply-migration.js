const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pwa_let_db',
    multipleStatements: true
  });

  try {
    console.log('📊 Applying database migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '001_fix_quiz_attempts_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and filter empty statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      console.log(`\n▶️  Executing: ${statement.substring(0, 80)}...`);
      try {
        await connection.query(statement);
        console.log('✅ Success');
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log('⚠️  Index already exists (skipping)');
        } else {
          throw error;
        }
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    
    // Verify the changes
    console.log('\n📋 Verifying schema...');
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE 
      FROM information_schema.COLUMNS 
      WHERE TABLE_NAME = 'quiz_attempts' AND COLUMN_NAME = 'mode'
    `);
    
    if (columns.length > 0) {
      console.log(`✅ Mode column type: ${columns[0].COLUMN_TYPE}`);
    }
    
    const [indexes] = await connection.query(`
      SHOW INDEXES FROM quiz_attempts 
      WHERE Column_name IN ('student_id', 'quiz_id', 'mode')
    `);
    
    console.log(`✅ Indexes created: ${indexes.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

applyMigration();
