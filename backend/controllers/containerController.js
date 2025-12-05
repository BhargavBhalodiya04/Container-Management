import Container from '../models/Container.js';

const containerController = {
  getAll: (req, res) => {
    try {
      const { q, status } = req.query;
      const containers = Container.search(q, status);
      res.json(containers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getById: (req, res) => {
    try {
      const { id } = req.params;
      const container = Container.findById(id);
      
      if (!container) {
        return res.status(404).json({ error: 'Container not found' });
      }
      
      res.json(container);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  create: (req, res) => {
    try {
      const existing = Container.findByNumber(req.body.number);
      if (existing) {
        return res.status(400).json({ error: 'Container number already exists' });
      }
      
      const container = Container.create(req.body);
      res.status(201).json(container);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  update: (req, res) => {
    try {
      const { id } = req.params;
      const container = Container.findById(id);
      
      if (!container) {
        return res.status(404).json({ error: 'Container not found' });
      }
      
      const updated = Container.update(id, req.body);
      if (updated) {
        res.json({ ...container, ...req.body });
      } else {
        res.status(500).json({ error: 'Failed to update container' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  delete: (req, res) => {
    try {
      const { id } = req.params;
      const container = Container.findById(id);
      
      if (!container) {
        return res.status(404).json({ error: 'Container not found' });
      }
      
      const deleted = Container.delete(id);
      if (deleted) {
        res.json({ message: 'Container deleted successfully' });
      } else {
        res.status(500).json({ error: 'Failed to delete container' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

export default containerController;