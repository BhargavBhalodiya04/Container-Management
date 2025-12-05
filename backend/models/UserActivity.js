import userDb from '../config/userDb.js';

class UserActivity {
  static findAllByUserId(userId) {
    return userDb.prepare('SELECT * FROM user_activities WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  }

  static create(activityData) {
    const { user_id, activity_type, description } = activityData;
    
    const result = userDb.prepare(
      'INSERT INTO user_activities (user_id, activity_type, description) VALUES (?, ?, ?)'
    ).run(user_id, activity_type, description);
    
    return { id: result.lastInsertRowid, ...activityData, created_at: new Date().toISOString() };
  }
}

export default UserActivity;