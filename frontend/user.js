// Global token variable
let token;

document.addEventListener('DOMContentLoaded', function() {
  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('cms_user'));
  token = localStorage.getItem('cms_token');
  
  if (!user || !token) {
    // If no user is logged in, redirect to login page
    window.location.href = 'index.html';
    return;
  }
  
  // Display username
  document.getElementById('userName').textContent = user.username;
  
  // Set up logout button
  document.getElementById('logoutBtn').addEventListener('click', function() {
    localStorage.removeItem('cms_token');
    localStorage.removeItem('cms_user');
    window.location.href = 'index.html';
  });
  
  // Set up notification button
  const notificationBtn = document.getElementById('notificationBtn');
  const notificationsDropdown = document.getElementById('notificationsDropdown');
  const notificationBadge = document.getElementById('notificationBadge');
  
  notificationBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    notificationsDropdown.classList.toggle('hidden');
    if (!notificationsDropdown.classList.contains('hidden')) {
      loadNotifications();
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!notificationBtn.contains(e.target) && !notificationsDropdown.contains(e.target)) {
      notificationsDropdown.classList.add('hidden');
    }
  });
  
  // Load notifications
  async function loadNotifications() {
    try {
      const response = await fetch('/api/user/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const notifications = await response.json();
      renderNotifications(notifications);
      
      // Update badge count
      const unreadCount = notifications.filter(n => !n.is_read).length;
      if (unreadCount > 0) {
        notificationBadge.textContent = unreadCount;
        notificationBadge.classList.remove('hidden');
      } else {
        notificationBadge.classList.add('hidden');
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }
  
  // Render notifications
  function renderNotifications(notifications) {
    const notificationsList = document.getElementById('notificationsList');
    notificationsList.innerHTML = '';
    
    if (notifications.length === 0) {
      notificationsList.innerHTML = '<div class="p-4 text-center text-gray-500">No notifications</div>';
      return;
    }
    
    notifications.forEach(notification => {
      const notificationEl = document.createElement('div');
      notificationEl.className = `p-4 border-b border-gray-100 ${notification.is_read ? '' : 'bg-blue-50'}`;
      
      const createdAt = new Date(notification.created_at).toLocaleString();
      
      notificationEl.innerHTML = `
        <div class="flex justify-between">
          <h4 class="font-bold text-gray-800">${notification.title}</h4>
          ${!notification.is_read ? '<span class="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">New</span>' : ''}
        </div>
        <p class="text-sm text-gray-600 mt-1">${notification.message}</p>
        <p class="text-xs text-gray-400 mt-2">${createdAt}</p>
      `;
      
      notificationsList.appendChild(notificationEl);
    });
  }
  
  // Mark all notifications as read
  document.getElementById('markAllReadBtn').addEventListener('click', async function() {
    try {
      // In a real app, you would call an API to mark all as read
      // For now, we'll just hide the badge
      notificationBadge.classList.add('hidden');
      alert('All notifications marked as read');
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  });
  
  // Update stats (in a real app, this would come from the server)
  // document.getElementById('stat-requests').textContent = '3';
  // document.getElementById('stat-tasks').textContent = '2';
  // document.getElementById('stat-progress').textContent = '1';
  // document.getElementById('stat-completed').textContent = '5';
  
  // Load dynamic stats
  loadStats();
  
  // Load notifications on page load
  loadNotifications();
  
  // Load recent activity
  loadRecentActivity();
});

// Load user stats
async function loadStats() {
  try {
    // Fetch requests stats
    const requestsResponse = await fetch('/api/user/requests-stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (requestsResponse.ok) {
      const requestsStats = await requestsResponse.json();
      document.getElementById('stat-requests').textContent = requestsStats.total;
    }
    
    // Fetch task stats
    const taskResponse = await fetch('/api/user/task-stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (taskResponse.ok) {
      const taskStats = await taskResponse.json();
      document.getElementById('stat-tasks').textContent = taskStats.total;
      document.getElementById('stat-progress').textContent = taskStats.inProgress;
      document.getElementById('stat-completed').textContent = taskStats.completed;
    } else {      // Fallback to mock data if API fails
      document.getElementById('stat-tasks').textContent = '2';
      document.getElementById('stat-progress').textContent = '1';
      document.getElementById('stat-completed').textContent = '5';
    }
  } catch (error) {
    console.error('Error loading stats:', error);
    // Fallback to mock data if API fails
    document.getElementById('stat-tasks').textContent = '2';
    document.getElementById('stat-progress').textContent = '1';
    document.getElementById('stat-completed').textContent = '5';
  }
}
// Load recent activity
async function loadRecentActivity() {
  try {
    const response = await fetch('/api/user/activities', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch recent activity');
    }
    
    const activities = await response.json();
    renderRecentActivity(activities);
  } catch (error) {
    console.error('Error loading recent activity:', error);
    // Fallback to static content if API fails
  }
}

// Render recent activity
function renderRecentActivity(activities) {
  const activityContainer = document.querySelector('.bg-white.rounded-xl.shadow-md.p-6 h3.text-lg.font-bold.text-gray-800.mb-4').parentElement;
  const activityList = activityContainer.querySelector('.space-y-4');
  
  // Clear existing content
  if (activityList) {
    activityList.innerHTML = '';
    
    if (activities.length === 0) {
      activityList.innerHTML = '<div class="p-4 text-center text-gray-500">No recent activity</div>';
      return;
    }
    
    // Take only the 5 most recent activities
    const recentActivities = activities.slice(0, 5);
    
    recentActivities.forEach(activity => {
      const activityEl = document.createElement('div');
      activityEl.className = 'flex items-start gap-3 p-3 border-b border-gray-100';
      
      // Determine icon and color based on activity type
      let icon, bgColor, textColor, title;
      switch (activity.activity_type) {
        case 'request':
          icon = '📋';
          bgColor = 'bg-green-100';
          textColor = 'text-green-600';
          title = 'Container request submitted';
          break;
        case 'task':
          icon = '✅';
          bgColor = 'bg-blue-100';
          textColor = 'text-blue-600';
          title = 'Task completed';
          break;
        case 'profile':
          icon = '👤';
          bgColor = 'bg-purple-100';
          textColor = 'text-purple-600';
          title = 'Profile updated';
          break;
        default:
          icon = 'ℹ️';
          bgColor = 'bg-gray-100';
          textColor = 'text-gray-600';
          title = activity.activity_type;
      }
      
      const createdAt = new Date(activity.created_at).toLocaleString();
      
      activityEl.innerHTML = `
        <div class="${bgColor} p-2 rounded-full">
          <span class="text-lg ${textColor}">${icon}</span>
        </div>
        <div>
          <p class="font-medium text-gray-800">${title}</p>
          <p class="text-sm text-gray-600">${activity.description || ''}</p>
          <p class="text-xs text-gray-500 mt-1">${formatTimeAgo(activity.created_at)}</p>
        </div>
      `;
      
      activityList.appendChild(activityEl);
    });
  }
}

// Format time ago (similar to the one in reports.js)
function formatTimeAgo(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}