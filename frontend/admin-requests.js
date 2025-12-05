document.addEventListener('DOMContentLoaded', function() {
  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('cms_user'));
  const token = localStorage.getItem('cms_token');
  
  // If no token, redirect to login
  if (!token) {
    window.location.href = 'index.html';
    return;
  }
  
  if (!user) {
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
  
  // Set up rejection dialog
  document.getElementById('rejectForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const requestId = document.getElementById('rejectRequestId').value;
    const reason = document.getElementById('rejectReason').value;
    
    // Reject the request
    rejectRequest(requestId, reason);
    
    document.getElementById('rejectDialog').close();
    // Reset form
    this.reset();
  });
  
  // Fetch and display requests
  fetchRequests();
  fetchStats();
  
  // Add event listeners to approve buttons (using event delegation)
  document.getElementById('requestsTable').addEventListener('click', function(e) {
    if (e.target.classList.contains('approve-btn')) {
      const id = e.target.getAttribute('data-id');
      approveRequest(id);
    } else if (e.target.classList.contains('reject-btn')) {
      const id = e.target.getAttribute('data-id');
      document.getElementById('rejectRequestId').value = id;
      document.getElementById('rejectDialog').showModal();
    }
  });
  
  // Function to fetch requests from API
  async function fetchRequests() {
    try {
      const response = await fetch('/api/admin/requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      
      const requests = await response.json();
      renderRequestsTable(requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      document.getElementById('requestsTable').innerHTML = 
        '<tr><td colspan="8" class="px-4 py-8 text-center text-red-500">Failed to load requests</td></tr>';
    }
  }
  
  // Function to fetch stats from API
  async function fetchStats() {
    try {
      const response = await fetch('/api/admin/requests-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const stats = await response.json();
      document.getElementById('statTotal').textContent = stats.total;
      document.getElementById('statPending').textContent = stats.pending;
      document.getElementById('statApproved').textContent = stats.approved;
      document.getElementById('statRejected').textContent = stats.rejected;
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }
  
  // Function to render requests table
  function renderRequestsTable(requests) {
    const tableBody = document.getElementById('requestsTable');
    tableBody.innerHTML = '';
    
    if (requests.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-gray-500">No requests found</td></tr>';
      return;
    }
    
    requests.forEach(request => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="px-4 py-3">${request.id}</td>
        <td class="px-4 py-3">${request.user}</td>
        <td class="px-4 py-3">${request.container_type} ${request.container_size}</td>
        <td class="px-4 py-3">${request.required_date}</td>
        <td class="px-4 py-3">${request.duration} days</td>
        <td class="px-4 py-3">${request.pickup_location} → ${request.delivery_location}</td>
        <td class="px-4 py-3">
          <span class="px-2 py-1 rounded-full text-xs font-medium ${
            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            request.status === 'approved' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }">
            ${request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </span>
        </td>
        <td class="px-4 py-3">
          ${
            request.status === 'pending' ? 
            `<button data-id="${request.id}" class="approve-btn px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded mr-2">Approve</button>
             <button data-id="${request.id}" class="reject-btn px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded">Reject</button>` :
            `<span class="text-gray-500 text-sm">-</span>`
          }
        </td>
      `;
      tableBody.appendChild(row);
    });
  }
  
  // Function to approve a request
  async function approveRequest(id) {
    try {
      const response = await fetch(`/api/admin/requests/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'approved' })
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve request');
      }
      
      // Refresh the requests table and stats
      fetchRequests();
      fetchStats();
      
      alert(`Request ${id} approved!`);
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    }
  }
  
  // Function to reject a request
  async function rejectRequest(id, reason) {
    try {
      const response = await fetch(`/api/admin/requests/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'rejected', rejection_reason: reason })
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject request');
      }
      
      // Refresh the requests table and stats
      fetchRequests();
      fetchStats();
      
      alert(`Request ${id} rejected!`);
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  }
});