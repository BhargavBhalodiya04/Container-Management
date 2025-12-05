import UserActivity from '../models/UserActivity.js';

const userActivityController = {
  // Get all activities for a user
  getAllByUser: (req, res) => {
    try {
      const userId = req.user.id; // Assuming user is attached to request after authentication
      const activities = UserActivity.findAllByUserId(userId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch activities' });
    }
  },

  // Create a new activity
  create: (req, res) => {
    try {
      const userId = req.user.id;
      
      const activityData = { ...req.body, user_id: userId };
      const activity = UserActivity.create(activityData);
      
      res.status(201).json(activity);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create activity: ' + error.message });
    }
  }
};

export default userActivityController;