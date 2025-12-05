// Container Requests Management
const token = localStorage.getItem('cms_token');
const user = JSON.parse(localStorage.getItem('cms_user') || 'null');

if (!token || !user) {
  location.href = 'index.html';
}

// Allow all authenticated users to access this page
if (!user) {
  location.href = 'index.html';
}

document.getElementById('userName').textContent = user.username;

const requestsTable = document.getElementById('requestsTable');
const rejectDialog = document.getElementById('rejectDialog');
const rejectForm = document.getElementById('rejectForm');
const rejectRequestId = document.getElementById('rejectRequestId');
const rejectReason = document.getElementById('rejectReason');

const statTotal = document.getElementById('statTotal');
const statPending = document.getElementById('statPending');
const statApproved = document.getElementById('statApproved');
const statRejected = document.getElementById('statRejected');

async function loadRequests() {
  try {
    // Fetch requests from the backend API instead of using the mock Store
    const response = await fetch('/api/admin/requests', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch requests');
    }
    
    const requests = await response.json();
    
    // Update stats
    statTotal.textContent = requests.length;
    statPending.textContent = requests.filter(r => r.status === 'pending').length;
    statApproved.textContent = requests.filter(r => r.status === 'approved').length;
    statRejected.textContent = requests.filter(r => r.status === 'rejected').length;

    if (requests.length === 0) {
      requestsTable.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-gray-500">📭 No requests found</td></tr>';
      return;
    }

    requestsTable.innerHTML = requests.map(r => {
      const statusColors = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'approved': 'bg-green-100 text-green-800',
        'rejected': 'bg-red-100 text-red-800'
      };

      // Format dates
      const requiredDate = new Date(r.required_date).toLocaleDateString();
      const createdDate = new Date(r.created_at).toLocaleString();
      
      return `
        <tr class="hover:bg-gray-50">
          <td class="px-4 py-3 font-mono text-sm text-gray-900">#${r.id}</td>
          <td class="px-4 py-3">
            <div class="font-medium text-gray-900">${r.user}</div>
            <div class="text-xs text-gray-500">${createdDate}</div>
          </td>
          <td class="px-4 py-3 text-gray-700">${r.container_type} - ${r.container_size}</td>
          <td class="px-4 py-3 text-sm text-gray-600">${requiredDate}</td>
          <td class="px-4 py-3 text-sm text-gray-600">${r.duration} days</td>
          <td class="px-4 py-3 text-sm text-gray-600">
            <div class="font-medium">${r.pickup_location}</div>
            <div class="text-xs text-gray-500">↓ ${r.delivery_location}</div>
          </td>
          <td class="px-4 py-3">
            <span class="px-2 py-1 text-xs font-medium rounded-full ${statusColors[r.status] || 'bg-gray-100 text-gray-800'}">
              ${r.status.charAt(0).toUpperCase() + r.status.slice(1)}
            </span>
            ${r.rejection_reason ? `<div class="text-xs text-red-600 mt-1">Reason: ${r.rejection_reason}</div>` : ''}
          </td>
          <td class="px-4 py-3">
            <div class="flex gap-2">
              ${r.status === 'pending' ? `
                <button onclick="approveRequest(${r.id})" class="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded font-medium transition">✓ Approve</button>
                <button onclick="openRejectDialog(${r.id})" class="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded font-medium transition">✗ Reject</button>
              ` : ''}
              <button onclick="viewRequestDetails(${r.id})" class="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded font-medium">View</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    requestsTable.innerHTML = `<tr><td colspan="8" class="px-4 py-8 text-center text-red-500">❌ Error: ${err.message}</td></tr>`;
  }
}

async function approveRequest(id) {
  if (!confirm('Approve this container request?')) return;
  
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
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to approve request');
    }
    
    alert('✅ Request approved successfully!');
    loadRequests();
  } catch (err) {
    alert('❌ Error: ' + err.message);
  }
}

function openRejectDialog(id) {
  rejectRequestId.value = id;
  rejectReason.value = '';
  rejectDialog.showModal();
}

rejectForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = parseInt(rejectRequestId.value);
  const reason = rejectReason.value.trim();
  
  if (!reason) {
    alert('Please provide a reason for rejection');
    return;
  }
  
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
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to reject request');
    }
    
    alert('✅ Request rejected successfully!');
    rejectDialog.close();
    loadRequests();
  } catch (err) {
    alert('❌ Error: ' + err.message);
  }
});

function viewRequestDetails(id) {
  // Fetch the request details from the backend
  fetch(`/api/admin/requests/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => response.json())
  .then(request => {
    const details = `
📋 REQUEST DETAILS

Request ID: #${request.id}
User: ${request.user}
Status: ${request.status}

CONTAINER REQUIREMENTS:
Type: ${request.container_type}
Size: ${request.container_size}
Required Date: ${new Date(request.required_date).toLocaleDateString()}
Duration: ${request.duration} days

ROUTE:
Pickup: ${request.pickup_location}
Delivery: ${request.delivery_location}

REMARKS:
${request.remarks || 'None'}

${request.rejection_reason ? `\nREJECTION REASON:\n${request.rejection_reason}` : ''}

Submitted: ${new Date(request.created_at).toLocaleString()}
    `;
    
    alert(details);
  })
  .catch(err => {
    alert('❌ Error fetching request details: ' + err.message);
  });
}

// Load requests when the page loads
loadRequests();