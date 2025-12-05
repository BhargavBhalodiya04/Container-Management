document.addEventListener('DOMContentLoaded', function() {
  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('cms_user'));
  const token = localStorage.getItem('cms_token');
  
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
  
  // Set up new request button
  document.getElementById('newRequestBtn').addEventListener('click', function() {
    document.getElementById('requestDialog').showModal();
  });
  
  // Set up request form submission
  document.getElementById('requestForm').addEventListener('submit', function(e) {
    e.preventDefault();
    submitRequest();
  });
  
  // Set min date for required date input to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('requiredDate').min = today;
  
  // Fetch and display requests and stats
  fetchRequests();
  fetchStats();
  
  // Set up auto-refresh every 30 seconds
  setInterval(function() {
    fetchRequests();
    fetchStats();
  }, 30000);
  
  // Function to submit a new request
  async function submitRequest() {
    try {
      const containerType = document.getElementById('containerType').value;
      const containerSize = document.getElementById('containerSize').value;
      const requiredDate = document.getElementById('requiredDate').value;
      const duration = document.getElementById('duration').value;
      const pickupLocation = document.getElementById('pickupLocation').value;
      const deliveryLocation = document.getElementById('deliveryLocation').value;
      const remarks = document.getElementById('remarks').value;
      
      const requestData = {
        user: user.username,
        container_type: containerType,
        container_size: containerSize,
        required_date: requiredDate,
        duration: parseInt(duration),
        pickup_location: pickupLocation,
        delivery_location: deliveryLocation,
        remarks: remarks
      };
      
      const response = await fetch('/api/user/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit request');
      }
      
      // Close dialog and reset form
      document.getElementById('requestDialog').close();
      document.getElementById('requestForm').reset();
      
      // Refresh the requests table and stats
      fetchRequests();
      fetchStats();
      
      alert('✅ Request submitted successfully!');
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('❌ Failed to submit request: ' + error.message);
    }
  }
  
  // Function to fetch requests from API
  async function fetchRequests() {
    try {
      const response = await fetch('/api/user/requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch requests');
      }
      
      const requests = await response.json();
      renderRequestsTable(requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      document.getElementById('requestsTable').innerHTML = 
        '<tr><td colspan="6" class="px-4 py-8 text-center text-red-500">❌ Failed to load requests: ' + error.message + '</td></tr>';
    }
  }
  
  // Function to fetch stats from API
  async function fetchStats() {
    try {
      const response = await fetch('/api/user/requests-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch stats');
      }
      
      const stats = await response.json();
      
      // Update stats with a small delay to ensure DOM is ready
      setTimeout(() => {
        updateStatsDisplay(stats);
      }, 100);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Show error state in UI
      setTimeout(() => {
        updateStatsDisplay({ total: '!', pending: '!', approved: '!', rejected: '!' });
      }, 100);
    }
  }
  
  // Function to update stats display
  function updateStatsDisplay(stats) {
    document.getElementById('statTotal').textContent = stats.total || 0;
    document.getElementById('statPending').textContent = stats.pending || 0;
    document.getElementById('statApproved').textContent = stats.approved || 0;
    document.getElementById('statRejected').textContent = stats.rejected || 0;
  }
  
  // Function to render requests table
  function renderRequestsTable(requests) {
    const tableBody = document.getElementById('requestsTable');
    tableBody.innerHTML = '';
    
    if (requests.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">📭 No requests found</td></tr>';
      return;
    }
    
    requests.forEach(request => {
      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50';
      
      // Format dates
      const requiredDate = request.required_date ? new Date(request.required_date).toLocaleDateString() : '-';
      const createdDate = request.created_at ? new Date(request.created_at).toLocaleDateString() : '-';
      
      // Handle null status
      const status = request.status || 'pending';
      
      // Handle null container type and size
      const containerType = request.container_type || '-';
      const containerSize = request.container_size || '-';
      
      // Handle null locations
      const pickupLocation = request.pickup_location || '-';
      const deliveryLocation = request.delivery_location || '-';
      
      row.innerHTML = `
        <td class="px-4 py-3">
          <div class="font-medium text-gray-900">#${request.id}</div>
          <div class="text-xs text-gray-500">${createdDate}</div>
        </td>
        <td class="px-4 py-3">
          <div class="font-medium text-gray-900">${containerType}</div>
          <div class="text-sm text-gray-500">${containerSize}</div>
        </td>
        <td class="px-4 py-3 text-sm text-gray-600">${requiredDate}</td>
        <td class="px-4 py-3 text-sm text-gray-600">${request.duration || '-'} days</td>
        <td class="px-4 py-3 text-sm text-gray-600">
          <div class="font-medium">${pickupLocation}</div>
          <div class="text-xs text-gray-500">→ ${deliveryLocation}</div>
        </td>
        <td class="px-4 py-3">
          <span class="px-2 py-1 rounded-full text-xs font-medium ${
            status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            status === 'approved' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }">
            ${status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          ${request.rejection_reason ? `<div class="text-xs text-red-600 mt-1">Reason: ${request.rejection_reason}</div>` : ''}
        </td>
      `;
      tableBody.appendChild(row);
    });
  }
});