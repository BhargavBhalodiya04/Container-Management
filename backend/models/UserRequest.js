import userDb from '../config/userDb.js';

class UserRequest {
  static findAllByUserId(userId) {
    return userDb.prepare('SELECT * FROM user_requests WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  }

  static findById(id) {
    return userDb.prepare('SELECT * FROM user_requests WHERE id = ?').get(id);
  }

  static create(requestData) {
    const { user_id, admin_request_id, container_type, container_size, required_date, duration, pickup_location, delivery_location, remarks } = requestData;
    
    // Check if admin_request_id column exists
    let hasAdminRequestIdColumn = false;
    try {
      const columns = userDb.prepare("PRAGMA table_info(user_requests)").all();
      hasAdminRequestIdColumn = columns.some(col => col.name === 'admin_request_id');
    } catch (error) {
      console.error('Error checking for admin_request_id column:', error);
    }
    
    let result;
    if (hasAdminRequestIdColumn) {
      result = userDb.prepare(
        'INSERT INTO user_requests (user_id, admin_request_id, container_type, container_size, required_date, duration, pickup_location, delivery_location, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(user_id, admin_request_id || null, container_type, container_size, required_date, duration, pickup_location, delivery_location, remarks);
    } else {
      result = userDb.prepare(
        'INSERT INTO user_requests (user_id, container_type, container_size, required_date, duration, pickup_location, delivery_location, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(user_id, container_type, container_size, required_date, duration, pickup_location, delivery_location, remarks);
    }
    
    return { id: result.lastInsertRowid, ...requestData };
  }

  static update(id, requestData) {
    // Check if admin_request_id column exists
    let hasAdminRequestIdColumn = false;
    try {
      const columns = userDb.prepare("PRAGMA table_info(user_requests)").all();
      hasAdminRequestIdColumn = columns.some(col => col.name === 'admin_request_id');
    } catch (error) {
      console.error('Error checking for admin_request_id column:', error);
    }
    
    // Check if rejection_reason column exists
    let hasRejectionReasonColumn = false;
    try {
      const columns = userDb.prepare("PRAGMA table_info(user_requests)").all();
      hasRejectionReasonColumn = columns.some(col => col.name === 'rejection_reason');
    } catch (error) {
      console.error('Error checking for rejection_reason column:', error);
    }
    
    // Build dynamic update query based on provided fields
    const fields = [];
    const values = [];
    
    if (requestData.container_type !== undefined) {
      fields.push('container_type = ?');
      values.push(requestData.container_type);
    }
    
    if (requestData.container_size !== undefined) {
      fields.push('container_size = ?');
      values.push(requestData.container_size);
    }
    
    if (requestData.required_date !== undefined) {
      fields.push('required_date = ?');
      values.push(requestData.required_date);
    }
    
    if (requestData.duration !== undefined) {
      fields.push('duration = ?');
      values.push(requestData.duration);
    }
    
    if (requestData.pickup_location !== undefined) {
      fields.push('pickup_location = ?');
      values.push(requestData.pickup_location);
    }
    
    if (requestData.delivery_location !== undefined) {
      fields.push('delivery_location = ?');
      values.push(requestData.delivery_location);
    }
    
    if (requestData.remarks !== undefined) {
      fields.push('remarks = ?');
      values.push(requestData.remarks);
    }
    
    if (requestData.status !== undefined) {
      fields.push('status = ?');
      values.push(requestData.status);
    }
    
    if (hasRejectionReasonColumn && requestData.rejection_reason !== undefined) {
      fields.push('rejection_reason = ?');
      values.push(requestData.rejection_reason);
    }
    
    if (hasAdminRequestIdColumn && requestData.admin_request_id !== undefined) {
      fields.push('admin_request_id = ?');
      values.push(requestData.admin_request_id);
    }
    
    // Always update the timestamp
    fields.push('updated_at = CURRENT_TIMESTAMP');
    
    if (fields.length === 1) {
      // Only timestamp would be updated, no need to run the query
      return true;
    }
    
    const query = `UPDATE user_requests SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);
    
    const result = userDb.prepare(query).run(...values);
    return result.changes > 0;
  }

  static delete(id) {
    const result = userDb.prepare('DELETE FROM user_requests WHERE id = ?').run(id);
    return result.changes > 0;
  }

  static getStatsByUserId(userId) {
    const total = userDb.prepare('SELECT COUNT(*) as count FROM user_requests WHERE user_id = ?').get(userId).count;
    // Handle null status values by treating them as 'pending'
    const pending = userDb.prepare('SELECT COUNT(*) as count FROM user_requests WHERE user_id = ? AND (status = \'pending\' OR status IS NULL)').get(userId).count;
    const approved = userDb.prepare('SELECT COUNT(*) as count FROM user_requests WHERE user_id = ? AND status = \'approved\'').get(userId).count;
    const rejected = userDb.prepare('SELECT COUNT(*) as count FROM user_requests WHERE user_id = ? AND status = \'rejected\'').get(userId).count;
    
    return { total, pending, approved, rejected };
  }
};

export default UserRequest;