import Maintenance from '../models/Maintenance.js';
import Container from '../models/Container.js';

const maintenanceController = {
  getAll: (req, res) => {
    try {
      const maintenances = Maintenance.findAll();
      res.json(maintenances);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch maintenance records: ' + error.message });
    }
  },

  getById: (req, res) => {
    try {
      const { id } = req.params;
      const maintenance = Maintenance.findById(id);
      
      if (!maintenance) {
        return res.status(404).json({ error: 'Maintenance record not found' });
      }
      
      res.json(maintenance);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch maintenance record: ' + error.message });
    }
  },

  create: (req, res) => {
    try {
      const maintenanceData = req.body;
      
      // Validate required fields
      if (!maintenanceData.containerId) {
        return res.status(400).json({ error: 'Container ID is required' });
      }
      
      if (!maintenanceData.issueDescription) {
        return res.status(400).json({ error: 'Issue description is required' });
      }
      
      // Set default values
      maintenanceData.status = maintenanceData.status || 'Pending';
      maintenanceData.startDate = maintenanceData.startDate || new Date().toISOString();
      maintenanceData.taskSource = maintenanceData.taskSource || 'admin';
      
      // When creating a maintenance record, also update the container status to "UnderMaintenance"
      const container = Container.findById(maintenanceData.containerId);
      if (!container) {
        return res.status(404).json({ error: 'Container not found' });
      }
      
      // Update container status to UnderMaintenance
      const containerUpdated = Container.update(maintenanceData.containerId, { 
        ...container, 
        status: 'UnderMaintenance' 
      });
      
      if (!containerUpdated) {
        return res.status(500).json({ error: 'Failed to update container status' });
      }
      
      const maintenance = Maintenance.create(maintenanceData);
      res.status(201).json(maintenance);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create maintenance record: ' + error.message });
    }
  },

  update: (req, res) => {
    try {
      const { id } = req.params;
      const maintenance = Maintenance.findById(id);
      
      if (!maintenance) {
        return res.status(404).json({ error: 'Maintenance record not found' });
      }
      
      const updated = Maintenance.update(id, req.body);
      if (updated) {
        // If the maintenance status is being changed to "Completed", 
        // update the container status back to "Available"
        if (req.body.status === 'Completed' && maintenance.containerId) {
          const container = Container.findById(maintenance.containerId);
          if (container) {
            // Only update the status field to avoid NOT NULL constraint issues
            Container.update(maintenance.containerId, { status: 'Available' });
          }
        }
        // If the maintenance status is being changed from "Completed" to another status,
        // and the container is currently "Available", update it to "UnderMaintenance"
        else if (maintenance.status === 'Completed' && req.body.status !== 'Completed' && maintenance.containerId) {
          const container = Container.findById(maintenance.containerId);
          if (container && container.status === 'Available') {
            // Only update the status field to avoid NOT NULL constraint issues
            Container.update(maintenance.containerId, { status: 'UnderMaintenance' });
          }
        }
        
        res.json({ ...maintenance, ...req.body });
      } else {
        res.status(500).json({ error: 'Failed to update maintenance record' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to update maintenance record: ' + error.message });
    }
  },

  delete: (req, res) => {
    try {
      const { id } = req.params;
      const maintenance = Maintenance.findById(id);
      
      if (!maintenance) {
        return res.status(404).json({ error: 'Maintenance record not found' });
      }
      
      const deleted = Maintenance.delete(id);
      if (deleted) {
        // When deleting a maintenance record, also update the container status back to "Available"
        if (maintenance.containerId) {
          const container = Container.findById(maintenance.containerId);
          if (container) {
            // Only update the status field to avoid NOT NULL constraint issues
            Container.update(maintenance.containerId, { status: 'Available' });
          }
        }
        
        res.json({ message: 'Maintenance record deleted successfully' });
      } else {
        res.status(500).json({ error: 'Failed to delete maintenance record' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete maintenance record: ' + error.message });
    }
  }
};

export default maintenanceController;