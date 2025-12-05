import db from '../config/db.js';

class Maintenance {
  static findAll() {
    return db.prepare('SELECT * FROM maintenances').all();
  }

  static findById(id) {
    // Convert id to integer since SQLite might return it as string
    const intId = parseInt(id);
    return db.prepare('SELECT * FROM maintenances WHERE id = ?').get(intId);
  }

  static create(maintenanceData) {
    const { containerId, issueDescription, assignedTo, status, startDate, taskSource = 'admin' } = maintenanceData;
    const result = db.prepare(
      'INSERT INTO maintenances (containerId, issueDescription, assignedTo, status, startDate, taskSource) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(containerId, issueDescription, assignedTo, status, startDate, taskSource);
    
    // Return the complete maintenance record with proper ID
    return { 
      id: result.lastInsertRowid, 
      containerId, 
      issueDescription, 
      assignedTo, 
      status, 
      startDate,
      taskSource
    };
  }

  static update(id, maintenanceData) {
    const { containerId, issueDescription, assignedTo, status, startDate, taskSource = 'admin' } = maintenanceData;
    const result = db.prepare(
      'UPDATE maintenances SET containerId = ?, issueDescription = ?, assignedTo = ?, status = ?, startDate = ?, taskSource = ? WHERE id = ?'
    ).run(containerId, issueDescription, assignedTo, status, startDate, taskSource, id);
    
    return result.changes > 0;
  }

  static delete(id) {
    const result = db.prepare('DELETE FROM maintenances WHERE id = ?').run(id);
    return result.changes > 0;
  }

  // Get maintenance tasks assigned to a specific user
  static findByAssignedUser(username) {
    return db.prepare('SELECT * FROM maintenances WHERE assignedTo = ? ORDER BY startDate DESC').all(username);
  }

  // Get task statistics for a specific user
  static getStatsByUser(username) {
    const total = db.prepare('SELECT COUNT(*) as count FROM maintenances WHERE assignedTo = ?').get(username).count;
    const completed = db.prepare('SELECT COUNT(*) as count FROM maintenances WHERE assignedTo = ? AND status = ?').get(username, 'Completed').count;
    const inProgress = db.prepare('SELECT COUNT(*) as count FROM maintenances WHERE assignedTo = ? AND status = ?').get(username, 'InProgress').count;
    const pending = db.prepare('SELECT COUNT(*) as count FROM maintenances WHERE assignedTo = ? AND status = ?').get(username, 'Pending').count;
    
    return { total, completed, inProgress, pending };
  }
}

export default Maintenance;