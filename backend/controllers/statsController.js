import Container from '../models/Container.js';

const statsController = {
  getStats: (req, res) => {
    try {
      const containers = Container.findAll();
      
      const total = containers.length;
      const available = containers.filter(c => c.status === 'Available').length;
      const inTransit = containers.filter(c => c.status === 'InTransit').length;
      const booked = containers.filter(c => c.status === 'Booked').length;
      const underMaintenance = containers.filter(c => c.status === 'UnderMaintenance').length;
      
      res.json({ total, available, inTransit, booked, underMaintenance });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

export default statsController;