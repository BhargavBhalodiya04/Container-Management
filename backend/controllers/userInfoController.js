import AdminUser from '../models/AdminUser.js';

const userInfoController = {
  // Get all users in a simplified format for easy viewing
  getAllUsersInfo: (req, res) => {
    try {
      const users = AdminUser.findAll();
      
      // Simplify user data for easy viewing
      const simplifiedUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        role: user.role,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        department: user.department || '',
        status: user.status || 'active',
        createdAt: user.created_at || ''
      }));
      
      res.json({
        totalUsers: simplifiedUsers.length,
        users: simplifiedUsers
      });
    } catch (error) {
      console.error('Error fetching user info:', error);
      res.status(500).json({ error: 'Failed to fetch user information' });
    }
  }
};

export default userInfoController;