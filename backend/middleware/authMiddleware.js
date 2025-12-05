import jwt from 'jsonwebtoken';
import userDb from '../config/userDb.js';
import adminDb from '../config/adminDb.js';

// Use environment variable for JWT secret, fallback to default for development
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
const authMiddleware = (req, res, next) => {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Extract token
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Look up user in database using username instead of just ID to avoid conflicts
    // First check in user database
    let user = userDb.prepare('SELECT id, username, role FROM users WHERE username = ?').get(decoded.username);
    
    // If not found, check in admin database (user_accounts table)
    if (!user) {
      user = adminDb.prepare('SELECT id, username, role FROM user_accounts WHERE username = ?').get(decoded.username);
    }
    
    // If still not found, check in admin database (admins table - legacy)
    if (!user) {
      user = adminDb.prepare('SELECT id, username, role FROM admins WHERE username = ?').get(decoded.username);
      // If user is found in admins table, set role to 'admin'
      if (user) {
        user.role = 'admin';
      }
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin-only middleware
const adminMiddleware = (req, res, next) => {
  // First, run the standard authentication
  authMiddleware(req, res, () => {
    // Check if the authenticated user has admin role
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // User is authenticated and is an admin
    next();
  });
};

export { authMiddleware, adminMiddleware };