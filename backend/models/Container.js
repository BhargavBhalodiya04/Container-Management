import db from '../config/db.js';

class Container {
  static findAll() {
    return db.prepare('SELECT * FROM containers').all();
  }

  static findById(id) {
    return db.prepare('SELECT * FROM containers WHERE id = ?').get(id);
  }

  static findByNumber(number) {
    return db.prepare('SELECT * FROM containers WHERE number = ?').get(number);
  }

  static create(containerData) {
    const { number, type, size, status, location, owner, lat, lng, weight, rfid, condition } = containerData;
    const result = db.prepare(
      'INSERT INTO containers (number, type, size, status, location, owner, lat, lng, weight, rfid, condition) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(number, type, size, status, location, owner, lat, lng, weight, rfid, condition);
    
    return { id: result.lastInsertRowid, ...containerData, created_at: new Date().toISOString() };
  }

  static update(id, containerData) {
    // Build dynamic query based on provided fields
    const fields = [];
    const values = [];
    
    // Only include fields that are present in containerData
    if (containerData.number !== undefined) {
      fields.push('number = ?');
      values.push(containerData.number);
    }
    if (containerData.type !== undefined) {
      fields.push('type = ?');
      values.push(containerData.type);
    }
    if (containerData.size !== undefined) {
      fields.push('size = ?');
      values.push(containerData.size);
    }
    if (containerData.status !== undefined) {
      fields.push('status = ?');
      values.push(containerData.status);
    }
    if (containerData.location !== undefined) {
      fields.push('location = ?');
      values.push(containerData.location);
    }
    if (containerData.owner !== undefined) {
      fields.push('owner = ?');
      values.push(containerData.owner);
    }
    if (containerData.lat !== undefined) {
      fields.push('lat = ?');
      values.push(containerData.lat);
    }
    if (containerData.lng !== undefined) {
      fields.push('lng = ?');
      values.push(containerData.lng);
    }
    if (containerData.weight !== undefined) {
      fields.push('weight = ?');
      values.push(containerData.weight);
    }
    if (containerData.rfid !== undefined) {
      fields.push('rfid = ?');
      values.push(containerData.rfid);
    }
    if (containerData.condition !== undefined) {
      fields.push('condition = ?');
      values.push(containerData.condition);
    }
    
    // If no fields to update, return true (nothing to do)
    if (fields.length === 0) {
      return true;
    }
    
    // Add the id for the WHERE clause
    values.push(id);
    
    const sql = `UPDATE containers SET ${fields.join(', ')} WHERE id = ?`;
    const result = db.prepare(sql).run(...values);
    
    return result.changes > 0;
  }

  static delete(id) {
    const result = db.prepare('DELETE FROM containers WHERE id = ?').run(id);
    return result.changes > 0;
  }

  static search(query, status) {
    let sql = 'SELECT * FROM containers WHERE 1=1';
    const params = [];
    
    if (query) {
      sql += ' AND (number LIKE ? OR type LIKE ? OR size LIKE ? OR location LIKE ? OR owner LIKE ?)';
      const likeQuery = `%${query}%`;
      params.push(likeQuery, likeQuery, likeQuery, likeQuery, likeQuery);
    }
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    return db.prepare(sql).all(params);
  }
}

export default Container;