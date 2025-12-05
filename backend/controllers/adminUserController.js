import AdminUser from '../models/AdminUser.js';

const adminUserController = {
  // Get all users
  getAll: (req, res) => {
    try {
      const users = AdminUser.findAll();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users: ' + error.message });
    }
  },

  // Get a specific user by ID
  getById: (req, res) => {
    try {
      const { id } = req.params;
      const user = AdminUser.findById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user: ' + error.message });
    }
  },

  // Create a new user
  create: (req, res) => {
    try {
      const user = AdminUser.create(req.body);
      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.message.includes('Username already exists')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create user: ' + error.message });
      }
    }
  },

  // Update a user
  update: (req, res) => {
    try {
      const { id } = req.params;
      const user = AdminUser.findById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const updated = AdminUser.update(id, req.body);
      if (updated) {
        const updatedUser = AdminUser.findById(id);
        res.json(updatedUser);
      } else {
        res.status(500).json({ error: 'Failed to update user' });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      if (error.message.includes('Username already exists')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update user: ' + error.message });
      }
    }
  },

  // Delete a user
  delete: (req, res) => {
    try {
      const { id } = req.params;
      const user = AdminUser.findById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Prevent deleting the last admin user
      const allUsers = AdminUser.findAll();
      const adminUsers = allUsers.filter(u => u.role === 'admin');
      if (user.role === 'admin' && adminUsers.length <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
      
      const deleted = AdminUser.delete(id);
      if (deleted) {
        res.json({ message: 'User deleted successfully' });
      } else {
        res.status(500).json({ error: 'Failed to delete user' });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user: ' + error.message });
    }
  },

  // Get user statistics
  getStats: (req, res) => {
    try {
      const stats = AdminUser.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      res.status(500).json({ error: 'Failed to fetch user statistics: ' + error.message });
    }
  }
};

export default adminUserController;