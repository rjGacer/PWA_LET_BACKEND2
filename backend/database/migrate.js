const fs = require('fs');
const path = require('path');
const pool = require('../src/config/database');

async function runMigrations() {
  try {
    console.log('Starting database migrations...');

    // Get all SQL files in the database directory
    const dbDir = __dirname;
    const files = fs.readdirSync(dbDir)
      .filter(file => file.endsWith('.sql'))
      .filter(file => file !== 'schema.sql') // Skip schema.sql as it's the initial setup
      .sort();

    console.log(`Found ${files.length} migration files: ${files.join(', ')}`);

    for (const file of files) {
      const filePath = path.join(dbDir, file);
      let sql = fs.readFileSync(filePath, 'utf8');

      console.log(`\n▶ Running migration: ${file}`);

      // Remove SQL comments (single-line and multi-line)
      sql = sql
        .replace(/--.*$/gm, '') // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments

      // Split by semicolon and execute each statement
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await pool.query(statement);
          } catch (error) {
            // Ignore "already exists" errors
            if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
              console.log(`  ⚠️  Skipping (already exists): ${error.message.substring(0, 50)}`);
            } else {
              throw error;
            }
          }
        }
      }

      console.log(`✅ Migration completed: ${file}`);
    }

    console.log('\n✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
