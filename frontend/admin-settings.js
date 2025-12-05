document.addEventListener('DOMContentLoaded', function() {
  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('cms_user'));
  const token = localStorage.getItem('cms_token');
  
  if (!user || !token) {
    // If no user is logged in, redirect to login page
    window.location.href = 'index.html';
    return;
  }
  
  // Check if user is admin
  if (user.role !== 'admin') {
    // If not admin, redirect to user dashboard
    window.location.href = 'user.html';
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
  
  // Set up navigation
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = this.getAttribute('href');
      
      // Hide all sections
      document.querySelectorAll('.bg-white').forEach(section => {
        section.classList.add('hidden');
      });
      
      // Show target section
      const targetSection = document.querySelector(target);
      if (targetSection) {
        targetSection.classList.remove('hidden');
        
        // Load users when the user management section is shown
        if (target === '#users') {
          console.log('Loading users for User Management section');
          // Force a slight delay to ensure DOM is updated
          setTimeout(() => {
            loadUsers(token);
          }, 10);
        }
      }
      
      // Update active link
      navLinks.forEach(l => l.classList.remove('bg-blue-50', 'text-blue-700'));
      this.classList.add('bg-blue-50', 'text-blue-700');
    });
  });
  
  // Set up form submissions
  document.getElementById('generalForm').addEventListener('submit', function(e) {
    e.preventDefault();
    // In a real app, this would save the general settings to the server
    alert('General settings saved successfully!');
  });
  
  // Set up add user button
  document.getElementById('addUserBtn').addEventListener('click', function() {
    document.getElementById('addUserDialog').showModal();
  });
  
  // Set up cancel add user button
  document.getElementById('cancelAddUserBtn').addEventListener('click', function() {
    document.getElementById('addUserDialog').close();
  });
  
  // Set up add user form
  document.getElementById('addUserForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('userEmail').value;
    const address = document.getElementById('userAddress').value;
    const role = document.getElementById('userRole').value;
    const password = document.getElementById('userPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!firstName || !lastName || !username || !email || !role || !password || !confirmPassword) {
      alert('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    try {
      // Create user data
      const userData = {
        username: username,
        password: password,
        role: role,
        first_name: firstName,
        last_name: lastName,
        email: email,
        department: 'Operations', // Default department
        address: address || '' // Add address field
      };
      
      // Call API to create user
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }
      
      const newUser = await response.json();
      console.log('User created:', newUser);
      
      alert(`User ${firstName} ${lastName} added successfully!`);
      
      // Close dialog and reset form
      document.getElementById('addUserDialog').close();
      this.reset();
      
      // Refresh the user list
      loadUsers(token);
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user: ' + error.message);
    }
  });
  
  // Set up the first tab (General Settings) as active by default if no section is visible
  const visibleSections = document.querySelectorAll('.bg-white:not(.hidden)');
  if (visibleSections.length === 0) {
    // Make the first nav link active and show its corresponding section
    const firstNavLink = navLinks[0];
    if (firstNavLink) {
      firstNavLink.classList.add('bg-blue-50', 'text-blue-700');
      const target = firstNavLink.getAttribute('href');
      if (target) {
        const targetSection = document.querySelector(target);
        if (targetSection) {
          targetSection.classList.remove('hidden');
        }
      }
    }
  }
});

// Function to load and display users
async function loadUsers(token) {
  try {
    console.log('Loading users with token:', token ? 'Token present' : 'No token');
    const response = await fetch('/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Users API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch users: ${response.status} - ${errorText}`);
    }
    
    const users = await response.json();
    console.log('Users loaded:', users.length);
    displayUsers(users);
  } catch (error) {
    console.error('Error loading users:', error);
    alert('Error loading users: ' + error.message);
  }
}

// Function to display users in the table
function displayUsers(users) {
  console.log('Displaying users:', users ? users.length : 'No users');
  const tbody = document.querySelector('#users tbody');
  if (!tbody) {
    console.error('Could not find users table body');
    return;
  }
  
  tbody.innerHTML = ''; // Clear existing rows
  
  if (!users || users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-4 text-center text-gray-500">No users found</td></tr>';
    return;
  }
  
  users.forEach(user => {
    const row = document.createElement('tr');
    
    // Determine user avatar letter
    const avatarLetter = user.first_name ? user.first_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase();
    
    // Determine role display
    let roleDisplay = 'Staff';
    let roleClass = 'bg-green-100 text-green-800';
    if (user.role === 'admin') {
      roleDisplay = 'Administrator';
      roleClass = 'bg-purple-100 text-purple-800';
    }
    
    // Determine status display
    let statusDisplay = 'Active';
    let statusClass = 'bg-green-100 text-green-800';
    if (user.status === 'inactive') {
      statusDisplay = 'Inactive';
      statusClass = 'bg-red-100 text-red-800';
    }
    
    row.innerHTML = `
      <td class="px-4 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <div class="flex-shrink-0 h-10 w-10">
            <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span class="text-blue-800 font-medium">${avatarLetter}</span>
            </div>
          </div>
          <div class="ml-4">
            <div class="text-sm font-medium text-gray-900">${user.first_name} ${user.last_name}</div>
            <div class="text-sm text-gray-500">${user.email}</div>
          </div>
        </div>
      </td>
      <td class="px-4 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-900">${user.username}</div>
        <div class="text-sm text-gray-500">ID: ${user.id}</div>
      </td>
      <td class="px-4 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleClass}">
          ${roleDisplay}
        </span>
      </td>
      <td class="px-4 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
          ${statusDisplay}
        </span>
      </td>
      <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
        ${user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
      </td>
      <td class="px-4 py-4 whitespace-nowrap text-sm font-medium">
        <button class="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
        <button class="text-red-600 hover:text-red-900">Delete</button>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}