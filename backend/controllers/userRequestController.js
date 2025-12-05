import UserRequest from '../models/UserRequest.js';
import db from '../config/db.js'; // Import main database
import userDb from '../config/userDb.js';
import adminDb from '../config/adminDb.js';
import UserActivity from '../models/UserActivity.js'; // Import UserActivity model

const userRequestController = {
  // Get all requests for a user
  getAllByUser: (req, res) => {
    try {
      const userId = req.user.id; // Assuming user is attached to request after authentication
      const requests = UserRequest.findAllByUserId(userId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch requests' });
    }
  },

  // Get a specific request by ID
  getById: (req, res) => {
    try {
      const { id } = req.params;
      const request = UserRequest.findById(id);
      
      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }
      
      // Check if request belongs to the user
      if (request.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch request' });
    }
  },

  // Create a new request
  create: (req, res) => {
    try {
      const userId = req.user.id;
      
      // Create the request in the user's database first
      const requestData = { ...req.body, user_id: userId };
      const userRequest = UserRequest.create(requestData);
      
      // Also create the request in the main database for admin visibility
      const { container_type, container_size, required_date, duration, pickup_location, delivery_location, remarks } = req.body;
      const user = req.user.username || 'Unknown User';
      
      const result = db.prepare(
        'INSERT INTO requests (user, container_type, container_size, required_date, duration, pickup_location, delivery_location, remarks, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(user, container_type, container_size, required_date, duration, pickup_location, delivery_location, remarks, 'pending');
      
      // Update the user request with the admin request ID
      UserRequest.update(userRequest.id, { admin_request_id: result.lastInsertRowid });
      
      // Create an activity for the user
      try {
        const activityData = {
          user_id: userId,
          activity_type: 'request',
          description: `Submitted a request for a ${container_type} ${container_size} container`
        };
        UserActivity.create(activityData);
        console.log('Activity created for user request submission:', req.user.username);
      } catch (activityError) {
        console.error('Error creating activity for request submission:', activityError);
      }
      
      // Create a notification for the user acknowledging their request submission
      try {
        const title = 'Request Submitted';
        const message = `Your request for a ${container_type} ${container_size} container has been submitted and is pending approval.`;
        
        userDb.prepare(
          'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)'
        ).run(userId, title, message);
        
        console.log('Notification created for user request submission:', req.user.username);
      } catch (notificationError) {
        console.error('Error creating notification for request submission:', notificationError);
      }
      
      // Create a notification for admins about the new request
      try {
        // Get all admins
        const admins = adminDb.prepare('SELECT id FROM admins').all();
        
        if (admins.length > 0) {
          const title = 'New Container Request';
          const message = `A new request for a ${container_type} ${container_size} container has been submitted by ${req.user.username}.`;
          
          // Create notification for each admin
          admins.forEach(admin => {
            userDb.prepare(
              'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)'
            ).run(admin.id, title, message);
          });
          
          console.log('Notifications created for admins about new request');
        }
      } catch (adminNotificationError) {
        console.error('Error creating notifications for admins:', adminNotificationError);
      }
      
      // Return the user request with the admin request ID
      const fullUserRequest = UserRequest.findById(userRequest.id);
      res.status(201).json(fullUserRequest);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create request: ' + error.message });
    }
  },

  // Update a request
  update: (req, res) => {
    try {
      const { id } = req.params;
      const request = UserRequest.findById(id);
      
      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }
      
      // Check if request belongs to the user
      if (request.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Only allow updating remarks for pending requests
      if (request.status !== 'pending') {
        return res.status(400).json({ error: 'Cannot update non-pending requests' });
      }
      
      const updated = UserRequest.update(id, req.body);
      if (updated) {
        const updatedRequest = UserRequest.findById(id);
        res.json(updatedRequest);
      } else {
        res.status(500).json({ error: 'Failed to update request' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to update request' });
    }
  },

  // Delete a request
  delete: (req, res) => {
    try {
      const { id } = req.params;
      const request = UserRequest.findById(id);
      
      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }
      
      // Check if request belongs to the user
      if (request.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Only allow deleting pending requests
      if (request.status !== 'pending') {
        return res.status(400).json({ error: 'Cannot delete non-pending requests' });
      }
      
      const deleted = UserRequest.delete(id);
      if (deleted) {
        res.json({ message: 'Request deleted successfully' });
      } else {
        res.status(500).json({ error: 'Failed to delete request' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete request' });
    }
  },

  // Get request statistics for a user
  getStats: (req, res) => {
    try {
      const userId = req.user.id; // Assuming user is attached to request after authentication
      const stats = UserRequest.getStatsByUserId(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching request statistics:', error);
      res.status(500).json({ error: 'Failed to fetch request statistics: ' + error.message });
    }
  },

  // Get task statistics for a user (including assigned and completed tasks)
  getTaskStats: (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get maintenance tasks assigned to this user
      const assignedTasks = db.prepare(
        'SELECT COUNT(*) as count FROM maintenances WHERE assignedTo = ?'
      ).get(userId).count;
      
      // Get completed maintenance tasks for this user
      const completedTasks = db.prepare(
        'SELECT COUNT(*) as count FROM maintenances WHERE assignedTo = ? AND status = ?'
      ).get(userId, 'Completed').count;
      
      // Get in-progress maintenance tasks for this user
      const inProgressTasks = db.prepare(
        'SELECT COUNT(*) as count FROM maintenances WHERE assignedTo = ? AND status = ?'
      ).get(userId, 'InProgress').count;
      
      res.json({
        assigned: assignedTasks,
        completed: completedTasks,
        inProgress: inProgressTasks
      });
    } catch (error) {
      console.error('Error fetching task statistics:', error);
      res.status(500).json({ error: 'Failed to fetch task statistics: ' + error.message });
    }
  }};

export default userRequestController;