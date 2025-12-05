import db from '../config/db.js';

class Movement {
  static findAll() {
    return db.prepare('SELECT * FROM movements').all();
  }

  static findByContainerId(containerId) {
    return db.prepare('SELECT * FROM movements WHERE container_id = ? ORDER BY moved_at DESC').all(containerId);
  }

  static create(movementData) {
    const { container_id, from_location, to_location, remarks } = movementData;
    const result = db.prepare(
      'INSERT INTO movements (container_id, from_location, to_location, remarks) VALUES (?, ?, ?, ?)'
    ).run(container_id, from_location, to_location, remarks);
    
    return { id: result.lastInsertRowid, ...movementData, moved_at: new Date().toISOString() };
  }
}

export default Movement;