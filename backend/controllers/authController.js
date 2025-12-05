import jwt from 'jsonwebtoken';
import userDb from '../config/userDb.js';
import adminDb from '../config/adminDb.js';

// Use environment variable for JWT secret, fallback to default for development
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const authController = {
  login: (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }
    
    // First, check in user database (for 'user' and 'staff' roles)
    let user = userDb.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
    
    // If not found, check in admin database for admin users
    if (!user) {
      user = adminDb.prepare('SELECT * FROM user_accounts WHERE username = ? AND password = ?').get(username, password);
      // If user is found in admin database, set role to 'admin'
      if (user) {
        user.role = user.role || 'admin';
      }
    }
    
    // If still not found, check legacy admins table (for backward compatibility)
    if (!user) {
      user = adminDb.prepare('SELECT * FROM admins WHERE username = ? AND password = ?').get(username, password);
      // If user is found in admin database, set role to 'admin'
      if (user) {
        user.role = 'admin';
      }
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role || 'user' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ 
      token: token, 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role || 'user'
      } 
    });
  }
};

export default authController;