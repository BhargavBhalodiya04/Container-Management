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
    // Skip external links (those with target="_blank")
    if (link.getAttribute('target') === '_blank') {
      return;
    }
    
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = this.getAttribute('href');
      
      // Hide all content sections (but not the navigation panel)
      const contentSections = document.querySelectorAll('#general, #statistics, #activity, #containers, #user-info, #security, #integrations');
      contentSections.forEach(section => {
        section.classList.add('hidden');
      });
      
      // Show target section
      const targetSection = document.querySelector(target);
      if (targetSection) {
        targetSection.classList.remove('hidden');
        
        // Load containers when the container management section is shown
        if (target === '#containers') {
          console.log('Loading containers for Container Management section');
          // Force a slight delay to ensure DOM is updated
          setTimeout(() => {
            loadContainers(token);
          }, 10);
        }
        
        // Load statistics when the statistics section is shown
        if (target === '#statistics') {
          console.log('Loading statistics for System Statistics section');
          // Force a slight delay to ensure DOM is updated
          setTimeout(() => {
            loadStatistics(token);
          }, 10);
        }
        
        // Load activity when the activity section is shown
        if (target === '#activity') {
          console.log('Loading activity for Recent Activity section');
          // Force a slight delay to ensure DOM is updated
          setTimeout(() => {
            loadActivity(token);
          }, 10);
        }
        
        // Load user info when the user info section is shown
        if (target === '#user-info') {
          console.log('Loading user info section');
          // The iframe will automatically load the content
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
  
  // Set up container search and filter event listeners
  const containerSearch = document.getElementById('containerSearch');
  const containerStatusFilter = document.getElementById('containerStatusFilter');
  const refreshContainersBtn = document.getElementById('refreshContainersBtn');
  const backToSettingsBtn = document.getElementById('backToSettingsBtn');
  const backToSettingsBtn2 = document.getElementById('backToSettingsBtn2');
  const backToSettingsBtn3 = document.getElementById('backToSettingsBtn3');
  
  // Helper function to show general settings and update navigation
  function showGeneralSettings() {
    // Hide all content sections (but not the navigation panel)
    const contentSections = document.querySelectorAll('#general, #statistics, #activity, #containers, #user-info, #security, #integrations');
    contentSections.forEach(section => {
      section.classList.add('hidden');
    });
    
    // Show general settings section
    const generalSection = document.getElementById('general');
    if (generalSection) {
      generalSection.classList.remove('hidden');
    }
    
    // Scroll to top to ensure navigation is visible
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
    
    // Update navigation active state
    updateNavState('#general');
  }  
  // Helper function to update navigation state for a specific link
  function updateNavState(targetHref) {
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(l => l.classList.remove('bg-blue-50', 'text-blue-700'));
    
    const targetLink = document.querySelector(`nav a[href="${targetHref}"]`);
    if (targetLink) {
      targetLink.classList.add('bg-blue-50', 'text-blue-700');
      // Add visual feedback
      targetLink.focus();
    }
  }

  if (containerSearch) {
    containerSearch.addEventListener('input', debounce(function() {
      if (document.getElementById('containers') && !document.getElementById('containers').classList.contains('hidden')) {
        loadContainers(token);
      }
    }, 300));
  }
  
  if (containerStatusFilter) {
    containerStatusFilter.addEventListener('change', function() {
      if (document.getElementById('containers') && !document.getElementById('containers').classList.contains('hidden')) {
        loadContainers(token);
      }
    });
  }
  
  if (refreshContainersBtn) {
    refreshContainersBtn.addEventListener('click', function() {
      if (document.getElementById('containers') && !document.getElementById('containers').classList.contains('hidden')) {
        loadContainers(token);
      }
    });
  }
  
  if (backToSettingsBtn) {
    backToSettingsBtn.addEventListener('click', function() {
      showGeneralSettings();
      updateNavState('#general');
    });
  }
  
  if (backToSettingsBtn2) {
    backToSettingsBtn2.addEventListener('click', function() {
      showGeneralSettings();
      updateNavState('#general');
    });
  }
  
  if (backToSettingsBtn3) {
    backToSettingsBtn3.addEventListener('click', function() {
      showGeneralSettings();
      updateNavState('#general');
    });
  }
  
  // Back button for User Information section
  const backToSettingsBtn4 = document.getElementById('backToSettingsBtn4');
  if (backToSettingsBtn4) {
    backToSettingsBtn4.addEventListener('click', function() {
      showGeneralSettings();
      updateNavState('#general');
    });
  }

  // Add event listener for container actions (edit/delete)
  document.addEventListener('click', async function(e) {
    // Handle container edit button clicks
    if (e.target.classList.contains('edit') && e.target.closest('#containers')) {
      const containerId = e.target.getAttribute('data-id');
      console.log('Edit container:', containerId);
      alert('Edit functionality would open a dialog to edit container ' + containerId);
      // In a full implementation, this would open an edit dialog similar to the main admin page
    }
    
    // Handle container delete button clicks
    if (e.target.classList.contains('delete') && e.target.closest('#containers')) {
      const containerId = e.target.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this container?')) {
        try {
          const response = await fetch(`/api/containers/${containerId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to delete container');
          }
          
          // Reload containers after deletion
          loadContainers(token);
          alert('Container deleted successfully');
        } catch (error) {
          console.error('Error deleting container:', error);
          alert('Error deleting container: ' + error.message);
        }
      }
    }
  });
});

// Debounce function to limit API calls
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// Function to load and display containers
async function loadContainers(token) {
  try {
    console.log('Loading containers with token:', token ? 'Token present' : 'No token');
    
    // Get search and filter values
    const searchInput = document.getElementById('containerSearch');
    const statusFilter = document.getElementById('containerStatusFilter');
    
    const q = searchInput ? searchInput.value : '';
    const status = statusFilter ? statusFilter.value : '';
    
    // Build API URL with query parameters
    let url = '/api/containers';
    const params = [];
    
    if (q) params.push(`q=${encodeURIComponent(q)}`);
    if (status) params.push(`status=${encodeURIComponent(status)}`);
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Containers API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch containers: ${response.status} - ${errorText}`);
    }
    
    const containers = await response.json();
    console.log('Containers loaded:', containers.length);
    displayContainers(containers);
  } catch (error) {
    console.error('Error loading containers:', error);
    alert('Error loading containers: ' + error.message);
  }
}

// Function to display containers in the table
function displayContainers(containers) {
  console.log('Displaying containers:', containers ? containers.length : 'No containers');
  const tbody = document.getElementById('containersTableBody');
  if (!tbody) {
    console.error('Could not find containers table body');
    return;
  }
  
  tbody.innerHTML = ''; // Clear existing rows
  
  if (!containers || containers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="px-4 py-8 text-center text-gray-500">
          <div class="flex flex-col items-center justify-center">
            <svg class="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
            </svg>
            <p>No containers found</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  containers.forEach((container, index) => {
    const row = document.createElement('tr');
    
    // Determine status class
    let statusClass = 'bg-gray-100 text-gray-800';
    if (container.status === 'Available') {
      statusClass = 'bg-green-100 text-green-800';
    } else if (container.status === 'In Transit') {
      statusClass = 'bg-yellow-100 text-yellow-800';
    } else if (container.status === 'Booked') {
      statusClass = 'bg-purple-100 text-purple-800';
    } else if (container.status === 'Maintenance') {
      statusClass = 'bg-red-100 text-red-800';
    }
    
    row.innerHTML = `
      <td class="px-4 py-3 text-sm text-gray-700">${index + 1}</td>
      <td class="px-4 py-3">
        <div class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
          <span class="text-gray-500 text-xs">${container.type ? container.type.charAt(0) : 'C'}</span>
        </div>
      </td>
      <td class="px-4 py-3">
        <a href="container.html?id=${container.id}" class="text-blue-600 hover:text-blue-800 font-medium">${container.number}</a>
      </td>
      <td class="px-4 py-3 text-sm text-gray-700">${container.type || '-'}</td>
      <td class="px-4 py-3 text-sm text-gray-700">${container.size || '-'}</td>
      <td class="px-4 py-3">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
          ${container.status}
        </span>
      </td>
      <td class="px-4 py-3 text-sm text-gray-700">${container.location || '-'}</td>
      <td class="px-4 py-3 text-sm text-gray-700">${container.owner || '-'}</td>
      <td class="px-4 py-3">
        <button data-id="${container.id}" class="edit px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded-md mr-1 transition">Edit</button>
        <button data-id="${container.id}" class="delete px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-md transition">Delete</button>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

// Function to load and display system statistics
async function loadStatistics(token) {
  try {
    console.log('Loading statistics with token:', token ? 'Token present' : 'No token');
    
    // Fetch container statistics
    const statsResponse = await fetch('/api/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!statsResponse.ok) {
      throw new Error('Failed to fetch statistics');
    }
    
    const stats = await statsResponse.json();
    console.log('Statistics loaded:', stats);
    
    // Update statistics display
    document.getElementById('totalContainers').textContent = stats.total || 0;
    document.getElementById('availableContainers').textContent = stats.available || 0;
    document.getElementById('inTransitContainers').textContent = stats.inTransit || 0;
    document.getElementById('bookedContainers').textContent = stats.booked || 0;
    
    // Fetch users count
    try {
      const usersResponse = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (usersResponse.ok) {
        const users = await usersResponse.json();
        document.getElementById('totalUsers').textContent = users.length || 0;
      }
    } catch (error) {
      console.error('Error fetching users count:', error);
    }
    
    // Fetch requests count
    try {
      const requestsResponse = await fetch('/api/admin/requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (requestsResponse.ok) {
        const requests = await requestsResponse.json();
        const pendingRequests = requests.filter(r => r.status === 'pending').length;
        document.getElementById('pendingRequests').textContent = pendingRequests || 0;
      }
    } catch (error) {
      console.error('Error fetching requests count:', error);
    }
    
    // For bookings, we'll use mock data since there's no API endpoint
    // In a real implementation, this would fetch from /api/bookings
    document.getElementById('activeBookings').textContent = '5'; // Mock value
  } catch (error) {
    console.error('Error loading statistics:', error);
    alert('Error loading statistics: ' + error.message);
  }
}

// Function to load and display recent activity
async function loadActivity(token) {
  try {
    console.log('Loading activity with token:', token ? 'Token present' : 'No token');
    
    // For now, we'll simulate activity data
    // In a real implementation, this would fetch actual activity logs from the server
    const activityData = [
      { id: 1, action: 'Created new container #CONT-1001', user: 'admin', time: '2 hours ago' },
      { id: 2, action: 'Updated container #CONT-2005 status to Booked', user: 'staff', time: '4 hours ago' },
      { id: 3, action: 'Added new user John Doe', user: 'admin', time: '1 day ago' },
      { id: 4, action: 'Approved container request #REQ-3002', user: 'admin', time: '1 day ago' },
      { id: 5, action: 'Deleted container #CONT-1000', user: 'admin', time: '2 days ago' },
      { id: 6, action: 'Created maintenance task for #CONT-3003', user: 'staff', time: '3 days ago' },
      { id: 7, action: 'Confirmed booking #BK-2001', user: 'admin', time: '4 days ago' }
    ];
    
    displayActivity(activityData);
  } catch (error) {
    console.error('Error loading activity:', error);
    alert('Error loading activity: ' + error.message);
  }
}

// Function to display recent activity in the table
function displayActivity(activityData) {
  console.log('Displaying activity:', activityData ? activityData.length : 'No activity');
  const tbody = document.getElementById('activityTableBody');
  if (!tbody) {
    console.error('Could not find activity table body');
    return;
  }
  
  tbody.innerHTML = ''; // Clear existing rows
  
  if (!activityData || activityData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="px-4 py-8 text-center text-gray-500">
          <div class="flex flex-col items-center justify-center">
            <svg class="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p>No recent activity</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  activityData.forEach(activity => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td class="px-4 py-3 text-sm text-gray-700">${activity.action}</td>
      <td class="px-4 py-3 text-sm text-gray-700">${activity.user}</td>
      <td class="px-4 py-3 text-sm text-gray-700">${activity.time}</td>
    `;
    
    tbody.appendChild(row);
  });
}
