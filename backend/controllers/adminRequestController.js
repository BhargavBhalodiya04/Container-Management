import db from '../config/db.js';
import userDb from '../config/userDb.js';
import User from '../models/User.js';
import UserActivity from '../models/UserActivity.js'; // Import UserActivity model

const adminRequestController = {
  // Get all requests (for admin)
  getAll: (req, res) => {
    try {
      console.log('Fetching all requests from database');
      const requests = db.prepare('SELECT * FROM requests ORDER BY created_at DESC').all();
      console.log('Found requests:', requests.length);
      res.json(requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      res.status(500).json({ error: 'Failed to fetch requests: ' + error.message });
    }
  },

  // Get a specific request by ID (for admin)
  getById: (req, res) => {
    try {
      const { id } = req.params;
      console.log('Fetching request by ID:', id);
      const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
      
      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }
      
      res.json(request);
    } catch (error) {
      console.error('Error fetching request:', error);
      res.status(500).json({ error: 'Failed to fetch request: ' + error.message });
    }
  },

  // Update a request status (for admin to approve/reject)
  updateStatus: (req, res) => {
    try {
      const { id } = req.params;
      const { status, rejection_reason } = req.body;
      console.log('Updating request status:', id, status, rejection_reason);
      
      // Validate status
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      
      let result;
      if (status === 'rejected' && rejection_reason) {
        result = db.prepare(
          'UPDATE requests SET status = ?, rejection_reason = ? WHERE id = ?'
        ).run(status, rejection_reason, id);
      } else {
        result = db.prepare(
          'UPDATE requests SET status = ? WHERE id = ?'
        ).run(status, id);
      }
      
      if (result.changes > 0) {
        // Also update the status in the user's database using the admin_request_id
        try {
          const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
          if (request) {
            if (status === 'rejected') {
              userDb.prepare(
                'UPDATE user_requests SET status = ?, rejection_reason = ? WHERE admin_request_id = ?'
              ).run(status, rejection_reason || null, id);
            } else {
              userDb.prepare(
                'UPDATE user_requests SET status = ? WHERE admin_request_id = ?'
              ).run(status, id);
            }
            console.log('Successfully updated user request status');
          }
        } catch (userDbError) {
          console.error('Error updating user database:', userDbError);
        }
        
        // Create a notification for the user
        try {
          const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
          if (request) {
            // Find the user ID by username
            const user = User.findByUsername(request.user);
            if (user) {
              let title, message;
              
              if (status === 'approved') {
                title = 'Request Approved';
                message = `Your request for a ${request.container_type} ${request.container_size} container has been approved.`;
              } else if (status === 'rejected') {
                title = 'Request Rejected';
                message = `Your request for a ${request.container_type} ${request.container_size} container has been rejected. Reason: ${rejection_reason || 'Not specified'}.`;
              }
              
              if (title && message) {
                userDb.prepare(
                  'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)'
                ).run(user.id, title, message);
                
                console.log('Notification created for user:', user.id);
                
                // Create an activity for the user
                try {
                  let activityType, description;
                  
                  if (status === 'approved') {
                    activityType = 'request_approved';
                    description = `Your request for a ${request.container_type} ${request.container_size} container was approved`;
                  } else if (status === 'rejected') {
                    activityType = 'request_rejected';
                    description = `Your request for a ${request.container_type} ${request.container_size} container was rejected. Reason: ${rejection_reason || 'Not specified'}`;
                  }
                  
                  if (activityType && description) {
                    const activityData = {
                      user_id: user.id,
                      activity_type: activityType,
                      description: description
                    };
                    UserActivity.create(activityData);
                    console.log('Activity created for user request status update:', user.username);
                  }
                } catch (activityError) {
                  console.error('Error creating activity for request status update:', activityError);
                }
              }
            }
          }
        } catch (notificationError) {
          console.error('Error creating notification:', notificationError);
        }
        
        res.json({ message: 'Request status updated successfully' });
      } else {
        res.status(404).json({ error: 'Request not found' });
      }
    } catch (error) {
      console.error('Error updating request status:', error);
      res.status(500).json({ error: 'Failed to update request status: ' + error.message });
    }
  },

  // Get request statistics for admin
  getStats: (req, res) => {
    try {
      // Get total requests
      const total = db.prepare('SELECT COUNT(*) as count FROM requests').get().count;
      
      // Get pending requests
      const pending = db.prepare('SELECT COUNT(*) as count FROM requests WHERE status = ?').get('pending').count;
      
      // Get approved requests
      const approved = db.prepare('SELECT COUNT(*) as count FROM requests WHERE status = ?').get('approved').count;
      
      // Get rejected requests
      const rejected = db.prepare('SELECT COUNT(*) as count FROM requests WHERE status = ?').get('rejected').count;
      
      res.json({
        total,
        pending,
        approved,
        rejected
      });
    } catch (error) {
      console.error('Error fetching request statistics:', error);
      res.status(500).json({ error: 'Failed to fetch request statistics: ' + error.message });
    }
  }
};

export default adminRequestController;