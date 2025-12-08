import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Use environment variable for database path, fallback to default
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// For Render deployment, use RENDER_ADMIN_DB_PATH if available, otherwise use ADMIN_DB_PATH
// Fallback to local file if neither is set
const dbPath = 
  process.env.RENDER_ADMIN_DB_PATH ||
  process.env.ADMIN_DB_PATH ||
  path.join(__dirname, '..', 'admin_cargo_management.db');

console.log('Using admin database path:', dbPath);

// Ensure the directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create admin database file if it doesn't exist
const adminDb = new Database(dbPath);

// Initialize admin-specific tables
adminDb.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    department TEXT,
    permissions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
  );
  
  CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER,
    action TEXT,
    table_name TEXT,
    record_id INTEGER,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins (id)
  );
  
  CREATE TABLE IF NOT EXISTS container_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    dimensions TEXT,
    capacity REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    type TEXT,
    address TEXT,
    lat REAL,
    lng REAL,
    capacity INTEGER,
    contact_person TEXT,
    contact_phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER,
    report_name TEXT,
    report_type TEXT,
    filters TEXT,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    file_path TEXT,
    FOREIGN KEY (admin_id) REFERENCES admins (id)
  );
  
  CREATE TABLE IF NOT EXISTS user_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    department TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Insert default admin if it doesn't exist
const stmt = adminDb.prepare("SELECT COUNT(*) as count FROM admins WHERE username = ?");
const adminExists = stmt.get('admin');

if (adminExists.count === 0) {
  const insert = adminDb.prepare("INSERT INTO admins (username, password, role, first_name, last_name, email) VALUES (?, ?, ?, ?, ?, ?)");
  insert.run('admin', 'admin123', 'admin', 'Admin', 'User', 'admin@example.com');
}

// Insert default system settings
const settingStmt = adminDb.prepare("SELECT COUNT(*) as count FROM system_settings WHERE setting_key = ?");
const timezoneExists = settingStmt.get('timezone');
const currencyExists = settingStmt.get('currency');
const systemNameExists = settingStmt.get('system_name');

if (timezoneExists.count === 0) {
  const insert = adminDb.prepare("INSERT INTO system_settings (setting_key, setting_value, description) VALUES (?, ?, ?)");
  insert.run('timezone', '(UTC-08:00) Pacific Time (US & Canada)', 'Default timezone for the system');
}

if (currencyExists.count === 0) {
  const insert = adminDb.prepare("INSERT INTO system_settings (setting_key, setting_value, description) VALUES (?, ?, ?)");
  insert.run('currency', 'USD', 'Default currency for the system');
}

if (systemNameExists.count === 0) {
  const insert = adminDb.prepare("INSERT INTO system_settings (setting_key, setting_value, description) VALUES (?, ?, ?)");
  insert.run('system_name', 'Cargo Management System', 'Name of the system');
}

export default adminDb;