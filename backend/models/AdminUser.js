import adminDb from '../config/adminDb.js';
import userDb from '../config/userDb.js';

class AdminUser {
  static findAll() {
    // Get all users from both databases
    const adminUsers = adminDb.prepare('SELECT * FROM user_accounts ORDER BY created_at DESC').all();
    const adminAdmins = adminDb.prepare("SELECT id, username, password, 'admin' as role, first_name, last_name, email, phone, department, 'active' as status, created_at, last_login FROM admins ORDER BY created_at DESC").all();
    const regularUsers = userDb.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
    
    // Combine results
    return [...adminUsers, ...adminAdmins, ...regularUsers];
  }

  static findById(id) {
    // First check in admin database (user_accounts table)
    let user = adminDb.prepare('SELECT * FROM user_accounts WHERE id = ?').get(id);
    
    // If not found, check in admin database (admins table)
    if (!user) {
      user = adminDb.prepare("SELECT id, username, password, 'admin' as role, first_name, last_name, email, phone, department, 'active' as status, created_at, last_login FROM admins WHERE id = ?").get(id);
    }
    
    // If not found, check in user database
    if (!user) {
      user = userDb.prepare('SELECT * FROM users WHERE id = ?').get(id);
    }
    
    return user;
  }

  static findByUsername(username) {
    // First check in admin database (user_accounts table)
    let user = adminDb.prepare('SELECT * FROM user_accounts WHERE username = ?').get(username);
    
    // If not found, check in admin database (admins table)
    if (!user) {
      user = adminDb.prepare("SELECT id, username, password, 'admin' as role, first_name, last_name, email, phone, department, 'active' as status, created_at, last_login FROM admins WHERE username = ?").get(username);
    }
    
    // If not found, check in user database
    if (!user) {
      user = userDb.prepare('SELECT * FROM users WHERE username = ?').get(username);
    }
    
    return user;
  }

  static create(userData) {
    // Set default role to 'user' if not provided
    const { 
      username, 
      password, 
      role = 'user', 
      first_name, 
      last_name, 
      email, 
      phone, 
      department,
      address
    } = userData;
    
    // Validate required fields
    if (!username || !password) {
      throw new Error('Username and password are required');
    }
    
    // Check if username already exists in either database
    const existingUser = this.findByUsername(username);
    if (existingUser) {
      throw new Error('Username already exists');
    }
    
    // If role is 'user' or 'staff', create in user database
    if (role === 'user' || role === 'staff') {
      const result = userDb.prepare(
        'INSERT INTO users (username, password, role, first_name, last_name, email, phone, department, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(username, password, role, first_name, last_name, email, phone, department, address || null);
      
      return { id: result.lastInsertRowid, ...userData, role };
    } else {
      // Otherwise, create in admin database (admin users)
      const result = adminDb.prepare(
        'INSERT INTO user_accounts (username, password, role, first_name, last_name, email, phone, department, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(username, password, role, first_name, last_name, email, phone, department, status || 'active');
      
      return { id: result.lastInsertRowid, ...userData, role };
    }
  }

  static update(id, userData) {
    const { username, password, role, first_name, last_name, email, phone, department, status } = userData;
    
    // Determine which database the user is in
    const existingUser = this.findById(id);
    
    if (!existingUser) {
      throw new Error('User not found');
    }
    
    // Check if username is being changed and if it already exists
    if (username && username !== existingUser.username) {
      const userWithNewUsername = this.findByUsername(username);
      if (userWithNewUsername) {
        throw new Error('Username already exists');
      }
    }
    
    // If the user is in the user database
    if (existingUser.role === 'user' || existingUser.role === 'staff') {
      const result = userDb.prepare(
        'UPDATE users SET username = ?, password = ?, role = ?, first_name = ?, last_name = ?, email = ?, phone = ?, department = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(username, password, role, first_name, last_name, email, phone, department, id);
      
      return result.changes > 0;
    } else if (existingUser.role === 'admin' && !existingUser.status) {
      // If the user is in the admins table (legacy admin)
      // Note: We don't allow updating legacy admins, they should be migrated to user_accounts
      throw new Error('Cannot update legacy admin users. Please create a new admin user in the user_accounts table.');
    } else {
      // If the user is in the admin database (user_accounts table)
      const result = adminDb.prepare(
        'UPDATE user_accounts SET username = ?, password = ?, role = ?, first_name = ?, last_name = ?, email = ?, phone = ?, department = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(username, password, role, first_name, last_name, email, phone, department, status, id);
      
      return result.changes > 0;
    }
  }

  static delete(id) {
    // Determine which database the user is in
    const existingUser = this.findById(id);
    
    if (!existingUser) {
      return false;
    }
    
    // If the user is in the user database
    if (existingUser.role === 'user' || existingUser.role === 'staff') {
      const result = userDb.prepare('DELETE FROM users WHERE id = ?').run(id);
      return result.changes > 0;
    } else if (existingUser.role === 'admin' && !existingUser.status) {
      // If the user is in the admins table (legacy admin)
      // Prevent deleting the last admin
      const adminAdmins = adminDb.prepare('SELECT COUNT(*) as count FROM admins').get().count;
      if (adminAdmins <= 1) {
        throw new Error('Cannot delete the last admin user');
      }
      const result = adminDb.prepare('DELETE FROM admins WHERE id = ?').run(id);
      return result.changes > 0;
    } else {
      // If the user is in the admin database (user_accounts table)
      const result = adminDb.prepare('DELETE FROM user_accounts WHERE id = ?').run(id);
      return result.changes > 0;
    }
  }

  static getStats() {
    const adminAccounts = adminDb.prepare('SELECT COUNT(*) as count FROM user_accounts').get().count;
    const adminAdmins = adminDb.prepare('SELECT COUNT(*) as count FROM admins').get().count;
    const userTotal = userDb.prepare('SELECT COUNT(*) as count FROM users').get().count;
    
    const activeAdminAccounts = adminDb.prepare('SELECT COUNT(*) as count FROM user_accounts WHERE status = "active"').get().count;
    const activeAdminAdmins = adminAdmins; // All legacy admins are considered active
    const userActive = userDb.prepare('SELECT COUNT(*) as count FROM users').get().count; // Assume all users are active
    
    return { 
      total: adminAccounts + adminAdmins + userTotal, 
      active: activeAdminAccounts + activeAdminAdmins + userActive, 
      inactive: adminAccounts - activeAdminAccounts // Only user_accounts have status field
    };
  }
}

export default AdminUser;