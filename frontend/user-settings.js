document.addEventListener('DOMContentLoaded', function() {
  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('cms_user'));
  
  if (!user) {
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
  
  // Set up form submission
  document.getElementById('profileForm').addEventListener('submit', function(e) {
    e.preventDefault();
    // In a real app, this would update the user's profile on the server
    alert('Profile updated successfully!');
  });
  
  document.getElementById('changePasswordBtn').addEventListener('click', function() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Please fill in all password fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    // In a real app, this would change the user's password on the server
    alert('Password changed successfully!');
    
    // Clear the password fields
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
  });
  
  // Populate profile information (in a real app, this would come from the server)
  document.getElementById('profileName').textContent = 'John Doe';
  document.getElementById('profileRole').textContent = 'Staff Member';
  document.getElementById('profileEmail').textContent = 'john.doe@example.com';
  document.getElementById('memberSince').textContent = 'Jan 1, 2024';
  document.getElementById('lastLogin').textContent = 'Today, 10:30 AM';
  document.getElementById('requestsCount').textContent = '12';
  
  // Populate form with existing data (in a real app, this would come from the server)
  document.getElementById('firstName').value = 'John';
  document.getElementById('lastName').value = 'Doe';
  document.getElementById('email').value = 'john.doe@example.com';
  document.getElementById('phone').value = '+1 (555) 123-4567';
  document.getElementById('department').value = 'Operations';
  document.getElementById('address').value = '123 Main St, City, Country';
});