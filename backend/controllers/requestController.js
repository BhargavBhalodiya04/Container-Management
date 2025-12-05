import db from '../config/db.js';

const requestController = {
  // Get all requests (for admin)
  getAll: (req, res) => {
    try {
      const requests = db.prepare('SELECT * FROM requests ORDER BY created_at DESC').all();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch requests' });
    }
  },

  // Get a specific request by ID (for admin)
  getById: (req, res) => {
    try {
      const { id } = req.params;
      const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
      
      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }
      
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch request' });
    }
  },

  // Create a new request (this will be called when user submits a request)
  create: (req, res) => {
    try {
      const { user, container_type, container_size, required_date, duration, pickup_location, delivery_location, remarks } = req.body;
      
      const result = db.prepare(
        'INSERT INTO requests (user, container_type, container_size, required_date, duration, pickup_location, delivery_location, remarks, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(user, container_type, container_size, required_date, duration, pickup_location, delivery_location, remarks, 'pending');
      
      const newRequest = {
        id: result.lastInsertRowid,
        user,
        container_type,
        container_size,
        required_date,
        duration,
        pickup_location,
        delivery_location,
        remarks,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      res.status(201).json(newRequest);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create request' });
    }
  },

  // Update a request (for admin to approve/reject)
  update: (req, res) => {
    try {
      const { id } = req.params;
      const { status, rejection_reason } = req.body;
      
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
        const updatedRequest = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
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
      const result = db.prepare('DELETE FROM requests WHERE id = ?').run(id);
      
      if (result.changes > 0) {
        res.json({ message: 'Request deleted successfully' });
      } else {
        res.status(500).json({ error: 'Failed to delete request' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete request' });
    }
  },

  // Get request statistics
  getStats: (req, res) => {
    try {
      const total = db.prepare('SELECT COUNT(*) as count FROM requests').get().count;
      const pending = db.prepare('SELECT COUNT(*) as count FROM requests WHERE status = "pending"').get().count;
      const approved = db.prepare('SELECT COUNT(*) as count FROM requests WHERE status = "approved"').get().count;
      const rejected = db.prepare('SELECT COUNT(*) as count FROM requests WHERE status = "rejected"').get().count;
      
      res.json({ total, pending, approved, rejected });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch request statistics' });
    }
  }
};

export default requestController;