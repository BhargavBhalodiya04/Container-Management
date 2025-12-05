import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use environment variable for database path, fallback to default
const dbPath = process.env.USER_DB_PATH || 'user_cargo_management.db';

// Create user database file if it doesn't exist
const userDb = new Database(dbPath);

// Initialize user-specific tables
userDb.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    department TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
  );
  
  CREATE TABLE IF NOT EXISTS user_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    container_type TEXT,
    container_size TEXT,
    required_date DATE,
    duration INTEGER,
    pickup_location TEXT,
    delivery_location TEXT,
    remarks TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
  
  CREATE TABLE IF NOT EXISTS user_containers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    container_id INTEGER,
    assignment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'assigned',
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (container_id) REFERENCES containers (id)
  );
  
  CREATE TABLE IF NOT EXISTS user_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    activity_type TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
  
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
`);

// Add admin_request_id column if it doesn't exist
try {
  userDb.exec('ALTER TABLE user_requests ADD COLUMN admin_request_id INTEGER');
} catch (error) {
  // Column might already exist, ignore the error
  if (!error.message.includes('duplicate column name')) {
    console.error('Error adding admin_request_id column:', error);
  }
}

// Add rejection_reason column if it doesn't exist
try {
  userDb.exec('ALTER TABLE user_requests ADD COLUMN rejection_reason TEXT');
} catch (error) {
  // Column might already exist, ignore the error
  if (!error.message.includes('duplicate column name')) {
    console.error('Error adding rejection_reason column:', error);
  }
}

// Insert default user if it doesn't exist
const stmt = userDb.prepare("SELECT COUNT(*) as count FROM users WHERE username = ?");
const userExists = stmt.get('staff');

if (userExists.count === 0) {
  const insert = userDb.prepare("INSERT INTO users (username, password, role, first_name, last_name, email) VALUES (?, ?, ?, ?, ?, ?)");
  insert.run('staff', 'staff123', 'user', 'Staff', 'User', 'staff@example.com');
}

export default userDb;