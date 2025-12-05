// Settings Page Logic
const token = localStorage.getItem('cms_token');
const user = JSON.parse(localStorage.getItem('cms_user') || 'null');

if (!token || !user) {
  location.href = 'index.html';
}

document.getElementById('userName').textContent = user.username;

// DOM Elements
const logoutBtn = document.getElementById('logoutBtn');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const profileForm = document.getElementById('profileForm');
const passwordForm = document.getElementById('passwordForm');

// User profile data (in a real app, this would come from the server)
let userProfile = {
  username: user.username,
  role: user.role,
  fullName: '',
  email: '',
  phone: '',
  department: '',
  preferences: {
    darkMode: false,
    emailNotifications: true,
    pushNotifications: true,
    defaultView: 'dashboard'
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadUserProfile();
  setupEventListeners();
});

// Load user profile data
function loadUserProfile() {
  // In a real app, this would fetch from the server
  // For now, we'll populate with some default values
  document.getElementById('username').value = userProfile.username;
  document.getElementById('role').value = userProfile.role;
  document.getElementById('fullName').value = userProfile.fullName;
  document.getElementById('email').value = userProfile.email;
  document.getElementById('phone').value = userProfile.phone;
  document.getElementById('department').value = userProfile.department;
  
  // Load preferences
  document.getElementById('darkModeToggle').checked = userProfile.preferences.darkMode;
  document.getElementById('emailNotifications').checked = userProfile.preferences.emailNotifications;
  document.getElementById('pushNotifications').checked = userProfile.preferences.pushNotifications;
  document.getElementById('defaultView').value = userProfile.preferences.defaultView;
}

// Setup event listeners
function setupEventListeners() {
  // Tab switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      // Update active tab button
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Show active tab content
      tabContents.forEach(content => {
        content.classList.add('hidden');
        content.classList.remove('active');
      });
      
      const activeTab = document.getElementById(`${tabId}-tab`);
      if (activeTab) {
        activeTab.classList.remove('hidden');
        activeTab.classList.add('active');
      }
    });
  });
  
  // Logout
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('cms_token');
    localStorage.removeItem('cms_user');
    location.href = 'index.html';
  });
  
  // Profile form submission
  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveProfile();
  });
  
  // Password form submission
  passwordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    changePassword();
  });
  
  // Preference toggles
  document.getElementById('darkModeToggle').addEventListener('change', (e) => {
    userProfile.preferences.darkMode = e.target.checked;
    savePreferences();
  });
  
  document.getElementById('emailNotifications').addEventListener('change', (e) => {
    userProfile.preferences.emailNotifications = e.target.checked;
    savePreferences();
  });
  
  document.getElementById('pushNotifications').addEventListener('change', (e) => {
    userProfile.preferences.pushNotifications = e.target.checked;
    savePreferences();
  });
  
  document.getElementById('defaultView').addEventListener('change', (e) => {
    userProfile.preferences.defaultView = e.target.value;
    savePreferences();
  });
}

// Save profile
function saveProfile() {
  userProfile.fullName = document.getElementById('fullName').value;
  userProfile.email = document.getElementById('email').value;
  userProfile.phone = document.getElementById('phone').value;
  userProfile.department = document.getElementById('department').value;
  
  // In a real app, this would send to the server
  alert('Profile updated successfully!');
}

// Change password
function changePassword() {
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  // Simple validation
  if (newPassword !== confirmPassword) {
    alert('New passwords do not match!');
    return;
  }
  
  if (newPassword.length < 6) {
    alert('Password must be at least 6 characters long!');
    return;
  }
  
  // In a real app, this would send to the server
  alert('Password changed successfully!');
  passwordForm.reset();
}

// Save preferences
function savePreferences() {
  // In a real app, this would send to the server
  console.log('Preferences saved:', userProfile.preferences);
}