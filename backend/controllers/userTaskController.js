import Maintenance from '../models/Maintenance.js';

const userTaskController = {
  // Get all tasks assigned to a user
  getAllByUser: (req, res) => {
    try {
      const username = req.user.username; // Assuming user is attached to request after authentication
      const tasks = Maintenance.findByAssignedUser(username);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  },

  // Get a specific task by ID
  getById: (req, res) => {
    try {
      const { id } = req.params;
      const task = Maintenance.findById(id);
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      // Check if task is assigned to the user
      if (task.assignedTo !== req.user.username) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  },

  // Get task statistics for a user
  getStats: (req, res) => {
    try {
      const username = req.user.username; // Assuming user is attached to request after authentication
      const stats = Maintenance.getStatsByUser(username);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching task statistics:', error);
      res.status(500).json({ error: 'Failed to fetch task statistics: ' + error.message });
    }
  }
};

export default userTaskController;