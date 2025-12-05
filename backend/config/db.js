import Database from 'better-sqlite3';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use environment variable for database path, fallback to default
const dbPath = process.env.DB_PATH || 'cargo_management.db';

// Create database file if it doesn't exist
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS containers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT UNIQUE NOT NULL,
    type TEXT,
    size TEXT,
    status TEXT,
    location TEXT,
    owner TEXT,
    lat REAL,
    lng REAL,
    weight REAL,
    rfid TEXT,
    condition TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    container_id INTEGER,
    from_location TEXT,
    to_location TEXT,
    moved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT,
    FOREIGN KEY (container_id) REFERENCES containers (id)
  );
  
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    contact TEXT,
    email TEXT,
    container_type TEXT,
    container_size TEXT,
    pickup_date DATE,
    drop_date DATE,
    pickup_location TEXT,
    drop_location TEXT,
    remarks TEXT,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT,
    container_type TEXT,
    container_size TEXT,
    required_date DATE,
    duration INTEGER,
    pickup_location TEXT,
    delivery_location TEXT,
    remarks TEXT,
    status TEXT DEFAULT 'pending',
    rejection_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS maintenances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    containerId INTEGER,
    issueDescription TEXT,
    assignedTo TEXT,
    status TEXT,
    startDate DATETIME,
    FOREIGN KEY (containerId) REFERENCES containers (id)
  );
`);

// Insert default users if they don't exist
const stmt = db.prepare("SELECT COUNT(*) as count FROM users WHERE username = ?");
const adminExists = stmt.get('admin');
const staffExists = stmt.get('staff');

if (adminExists.count === 0) {
  const insert = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
  insert.run('admin', 'admin123', 'admin');
}

if (staffExists.count === 0) {
  const insert = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
  insert.run('staff', 'staff123', 'staff');
}

export default db;