import db from '../config/db.js';

class Booking {
  static findAll() {
    return db.prepare('SELECT * FROM bookings').all();
  }

  static create(bookingData) {
    const { customer_name, contact, email, container_type, container_size, pickup_date, drop_date, pickup_location, drop_location, remarks } = bookingData;
    const result = db.prepare(
      'INSERT INTO bookings (customer_name, contact, email, container_type, container_size, pickup_date, drop_date, pickup_location, drop_location, remarks, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(customer_name, contact, email, container_type, container_size, pickup_date, drop_date, pickup_location, drop_location, remarks, 'Pending');
    
    return { id: result.lastInsertRowid, ...bookingData, status: 'Pending', created_at: new Date().toISOString() };
  }
}

export default Booking;