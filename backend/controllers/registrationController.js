import AdminUser from '../models/AdminUser.js';
import userDb from '../config/userDb.js';

const registrationController = {
  // Register a new user
  register: async (req, res) => {
    try {
      const { 
        first_name, 
        last_name, 
        username, 
        email, 
        phone, 
        department, 
        password 
      } = req.body;

      // Validate required fields
      if (!username || !password || !email || !first_name || !last_name) {
        return res.status(400).json({ 
          error: 'Username, password, email, first name, and last name are required' 
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Validate username format
      if (username.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters long' });
      }
      
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
      }

      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      // Check if username already exists
      const existingByUsername = AdminUser.findByUsername(username);
      if (existingByUsername) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      // Check if email already exists
      const existingByEmail = await checkEmailExists(email);
      if (existingByEmail) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Create the new user (default role is 'user')
      const newUser = AdminUser.create({
        first_name,
        last_name,
        username,
        email,
        phone: phone || null,
        department: department || null,
        password,
        role: 'user' // Default role for self-registered users
      });

      // Remove password from response for security
      const { password: _, ...userResponse } = newUser;

      res.status(201).json({
        message: 'User registered successfully',
        user: userResponse
      });

    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.message.includes('Username already exists')) {
        res.status(400).json({ error: 'Username already exists' });
      } else if (error.message.includes('Email already registered')) {
        res.status(400).json({ error: 'Email already registered' });
      } else {
        res.status(500).json({ error: 'Registration failed: ' + error.message });
      }
    }
  },

  // Check if username exists
  checkUsername: async (req, res) => {
    try {
      const { username } = req.query;
      
      if (!username) {
        return res.status(400).json({ error: 'Username is required' });
      }

      const existingUser = AdminUser.findByUsername(username);
      
      res.json({ exists: !!existingUser });
    } catch (error) {
      console.error('Username check error:', error);
      res.status(500).json({ error: 'Failed to check username' });
    }
  },

  // Check if email exists
  checkEmail: async (req, res) => {
    try {
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const existingUser = await checkEmailExists(email);
      
      res.json({ exists: existingUser });
    } catch (error) {
      console.error('Email check error:', error);
      res.status(500).json({ error: 'Failed to check email' });
    }
  }
};

// Helper function to check if email exists in either database
async function checkEmailExists(email) {
  try {
    // Check in user database
    const userStmt = userDb.prepare('SELECT COUNT(*) as count FROM users WHERE email = ?');
    const userResult = userStmt.get(email);
    
    if (userResult.count > 0) {
      return true;
    }

    // Check in admin database (both tables)
    const adminDb = (await import('../config/adminDb.js')).default;
    const adminStmt = adminDb.prepare('SELECT COUNT(*) as count FROM user_accounts WHERE email = ?');
    const adminResult = adminStmt.get(email);
    
    if (adminResult.count > 0) {
      return true;
    }

    const adminsStmt = adminDb.prepare('SELECT COUNT(*) as count FROM admins WHERE email = ?');
    const adminsResult = adminsStmt.get(email);
    
    return adminsResult.count > 0;
  } catch (error) {
    console.error('Error checking email existence:', error);
    return false;
  }
}

export default registrationController;