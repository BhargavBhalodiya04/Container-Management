import AdminUser from './backend/models/AdminUser.js';
import userDb from './backend/config/userDb.js';

// Test accessing the database
try {
  console.log('Testing database access...');
  
  console.log('Successfully imported userDb');
  
  // Try to prepare a statement
  const stmt = userDb.prepare('SELECT * FROM user_containers LIMIT 1');
  console.log('Successfully prepared statement');
  
  const result = stmt.all();
  console.log('Successfully executed query, got', result.length, 'rows');
  
} catch (error) {
  console.error('Error accessing database:', error);
}