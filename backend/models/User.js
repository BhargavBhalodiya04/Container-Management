import userDb from '../config/userDb.js';
import adminDb from '../config/adminDb.js';

class User {
  static findAll() {
    // Get all users from both databases
    const users = userDb.prepare('SELECT * FROM users').all();
    const admins = adminDb.prepare('SELECT * FROM admins').all();
    
    // Combine and format the results
    return [...users, ...admins.map(admin => ({
      ...admin,
      // Map admin fields to user fields for consistency
      role: 'admin'
    }))];
  }

  static findByUsername(username) {
    // First check in user database
    let user = userDb.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    // If not found, check in admin database
    if (!user) {
      user = adminDb.prepare('SELECT * FROM admins WHERE username = ?').get(username);
      if (user) {
        // Add role field for consistency
        user.role = 'admin';
      }
    }
    
    return user;
  }

  static findById(id) {
    // First check in user database
    let user = userDb.prepare('SELECT * FROM users WHERE id = ?').get(id);
    
    // If not found, check in admin database
    if (!user) {
      user = adminDb.prepare('SELECT * FROM admins WHERE id = ?').get(id);
      if (user) {
        // Add role field for consistency
        user.role = 'admin';
      }
    }
    
    return user;
  }

  static create(userData) {
    const { username, password, role, first_name, last_name, email, phone, department, address } = userData;
    
    // For admin users, store in admin database
    if (role === 'admin') {
      const result = adminDb.prepare(
        'INSERT INTO admins (username, password, role, first_name, last_name, email, phone, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(username, password, role, first_name, last_name, email, phone, department);
      
      return { id: result.lastInsertRowid, ...userData };
    } else {
      // For regular users (staff, user, etc.), store in user database
      const result = userDb.prepare(
        'INSERT INTO users (username, password, role, first_name, last_name, email, phone, department, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(username, password, role || 'user', first_name, last_name, email, phone, department, address);
      
      return { id: result.lastInsertRowid, ...userData };
    }
  }
}

export default User;