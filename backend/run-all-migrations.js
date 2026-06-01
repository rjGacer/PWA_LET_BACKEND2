// Comprehensive migration script to set up complete database schema
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
};

async function readSQLFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

async function runMigration(connection, filePath) {
  try {
    const sql = await readSQLFile(filePath);
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement) {
        await connection.query(statement);
      }
    }
    console.log(`✅ Applied: ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${path.basename(filePath)}`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

async function runAllMigrations() {
  let connection;
  
  try {
    // First, create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'pwa_let_db';
    console.log(`\n📋 Using database: ${dbName}`);
    console.log(`🔧 Database Config: host=${config.host}, user=${config.user}, port=${config.port}`);
    
    // Connect without database first to create it
    const tempConfig = { ...config };
    delete tempConfig.database;
    
    const tempPool = mysql.createPool(tempConfig);
    let tempConnection = await tempPool.getConnection();
    
    try {
      await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      console.log(`✅ Database "${dbName}" created or already exists`);
    } finally {
      tempConnection.release();
      await tempPool.end();
    }
    
    // Now connect to the specific database
    const pool = mysql.createPool({
      ...config,
      database: dbName
    });
    
    connection = await pool.getConnection();
    console.log('✅ Connected to database\n');
    
    // Array of migrations to apply IN ORDER
    const migrations = [
      'database/schema.sql',
      'database/init_categories.sql',
      'database/migration_login_tracking.sql',
      'database/migration_simple.sql',
      'database/migration_practice_mode_simple.sql',
      'database/migration_practice_mode_fix.sql',
      'database/migration_add_mode_column.sql',
      'database/MIGRATION_SYNC_SYSTEM.sql',
      'database/create_module_files_table.sql'
    ];
    
    console.log('🚀 Running migrations...\n');
    
    for (const migrationFile of migrations) {
      const filePath = path.join(__dirname, migrationFile);
      
      if (fs.existsSync(filePath)) {
        await runMigration(connection, filePath);
      } else {
        console.log(`⏭️  Skipped: ${migrationFile} (file not found)`);
      }
    }
    
    console.log('\n✅ All migrations completed successfully!');
    
    // Show database info
    const [tables] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME`
    );
    
    console.log(`\n📊 Database now contains ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`   - ${table.TABLE_NAME}`);
    });
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Run migrations
runAllMigrations();
