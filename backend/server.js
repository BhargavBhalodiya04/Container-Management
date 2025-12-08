import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Controllers
import authController from './controllers/authController.js';
import containerController from './controllers/containerController.js';
import movementController from './controllers/movementController.js';
import statsController from './controllers/statsController.js';
import userRequestController from './controllers/userRequestController.js';
import userActivityController from './controllers/userActivityController.js';
import adminUserController from './controllers/adminUserController.js';
import adminRequestController from './controllers/adminRequestController.js';
import maintenanceController from './controllers/maintenanceController.js';
import userTaskController from './controllers/userTaskController.js';
import userInfoController from './controllers/userInfoController.js';

// Config
import userDb from './config/userDb.js';

// Middleware
import { authMiddleware, adminMiddleware } from './middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Use PORT from environment variables (Render sets this automatically)
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// Authentication routes
app.post('/api/login', authController.login);

// Container routes (protected)
app.get('/api/containers', authMiddleware, containerController.getAll);
app.get('/api/containers/:id', authMiddleware, containerController.getById);
app.post('/api/containers', authMiddleware, containerController.create);
app.put('/api/containers/:id', authMiddleware, containerController.update);
app.delete('/api/containers/:id', authMiddleware, containerController.delete);

// Movement routes
app.get('/api/movements', movementController.getByContainerId);
app.post('/api/movements', movementController.create);

// Maintenance routes (protected)
app.get('/api/maintenances', authMiddleware, maintenanceController.getAll);
app.get('/api/maintenances/:id', authMiddleware, maintenanceController.getById);
app.post('/api/maintenances', authMiddleware, maintenanceController.create);
app.put('/api/maintenances/:id', authMiddleware, maintenanceController.update);
app.delete('/api/maintenances/:id', authMiddleware, maintenanceController.delete);

// Stats routes
app.get('/api/stats', statsController.getStats);

// Admin request management routes (admin-only)
app.get('/api/admin/requests', adminMiddleware, adminRequestController.getAll);
app.get('/api/admin/requests/:id', adminMiddleware, adminRequestController.getById);
app.put('/api/admin/requests/:id/status', adminMiddleware, adminRequestController.updateStatus);
app.get('/api/admin/requests-stats', adminMiddleware, adminRequestController.getStats);

// User request routes (protected)
app.get('/api/user/requests', authMiddleware, userRequestController.getAllByUser);
app.get('/api/user/requests/:id', authMiddleware, userRequestController.getById);
app.post('/api/user/requests', authMiddleware, userRequestController.create);
app.put('/api/user/requests/:id', authMiddleware, userRequestController.update);
app.delete('/api/user/requests/:id', authMiddleware, userRequestController.delete);
app.get('/api/user/requests-stats', authMiddleware, userRequestController.getStats);

// User task routes (protected)
app.get('/api/user/tasks', authMiddleware, userTaskController.getAllByUser);
app.get('/api/user/tasks/:id', authMiddleware, userTaskController.getById);
app.get('/api/user/task-stats', authMiddleware, userTaskController.getStats);
// User activity routes (protected)
app.get('/api/user/activities', authMiddleware, userActivityController.getAllByUser);
app.post('/api/user/activities', authMiddleware, userActivityController.create);

// User notification routes (protected)
app.get('/api/user/notifications', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = userDb.prepare(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId);
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications: ' + error.message });
  }
});

app.put('/api/user/notifications/:id/read', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = userDb.prepare(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?'
    ).run(id, userId);
    
    if (result.changes > 0) {
      res.json({ message: 'Notification marked as read' });
    } else {
      res.status(404).json({ error: 'Notification not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification: ' + error.message });
  }
});

// Admin user management routes (admin-only)
app.get('/api/admin/users', adminMiddleware, adminUserController.getAll);
app.get('/api/admin/users/:id', adminMiddleware, adminUserController.getById);
app.post('/api/admin/users', adminMiddleware, adminUserController.create);
app.put('/api/admin/users/:id', adminMiddleware, adminUserController.update);
app.delete('/api/admin/users/:id', adminMiddleware, adminUserController.delete);
app.get('/api/admin/users-stats', adminMiddleware, adminUserController.getStats);

// Simple user info route for easy viewing (admin-only)
app.get('/api/admin/users-info', adminMiddleware, userInfoController.getAllUsersInfo);

// Serve frontend files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// For any other route, serve the frontend app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the application`);
  console.log(`Access from other devices on the network using your IP address and port ${PORT}`);
  
  // Log environment info
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Process ID: ${process.pid}`);
});