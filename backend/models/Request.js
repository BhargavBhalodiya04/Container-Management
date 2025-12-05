import db from '../config/db.js';

class Request {
  static findAll() {
    return db.prepare('SELECT * FROM requests').all();
  }

  static create(requestData) {
    const { user, container_type, container_size, required_date, duration, pickup_location, delivery_location, remarks } = requestData;
    const result = db.prepare(
      'INSERT INTO requests (user, container_type, container_size, required_date, duration, pickup_location, delivery_location, remarks, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(user, container_type, container_size, required_date, duration, pickup_location, delivery_location, remarks, 'Pending');
    
    return { id: result.lastInsertRowid, ...requestData, status: 'Pending', created_at: new Date().toISOString() };
  }

  static updateStatus(id, status, rejection_reason = null) {
    let sql = 'UPDATE requests SET status = ?';
    let params = [status];
    
    if (rejection_reason) {
      sql += ', rejection_reason = ?';
      params.push(rejection_reason);
    }
    
    sql += ' WHERE id = ?';
    params.push(id);
    
    const result = db.prepare(sql).run(...params);
    return result.changes > 0;
  }
}

export default Request;