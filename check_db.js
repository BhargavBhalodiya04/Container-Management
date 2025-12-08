import Database from 'better-sqlite3';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use environment variable for database path, fallback to default
const dbPath = process.env.USER_DB_PATH || 'user_cargo_management.db';

console.log('Checking database file:', dbPath);

// Create user database file if it doesn't exist
const userDb = new Database(dbPath);

// List all tables
const tables = userDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables in database:');
tables.forEach(table => {
  console.log('- ' + table.name);
});

// Check if user_containers table exists
const tableExists = userDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user_containers'").get();
console.log('user_containers table exists:', !!tableExists);

if (tableExists) {
  // Show table schema
  const schema = userDb.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='user_containers'").get();
  console.log('user_containers schema:', schema.sql);
}

userDb.close();