import Movement from '../models/Movement.js';

const movementController = {
  getByContainerId: (req, res) => {
    try {
      const { containerId } = req.query;
      if (!containerId) {
        return res.status(400).json({ error: 'containerId required' });
      }
      
      const movements = Movement.findByContainerId(containerId);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  create: (req, res) => {
    try {
      const { container_id, from_location, to_location, remarks } = req.body;
      if (!container_id || !to_location) {
        return res.status(400).json({ error: 'container_id and to_location required' });
      }
      
      const movement = Movement.create(req.body);
      res.status(201).json(movement);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

export default movementController;