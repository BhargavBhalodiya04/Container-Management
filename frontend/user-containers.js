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
  
  // Set up event listeners
  document.getElementById('refreshBtn').addEventListener('click', loadContainers);
  document.getElementById('searchInput').addEventListener('input', filterContainers);
  document.getElementById('typeFilter').addEventListener('change', filterContainers);
  document.getElementById('sizeFilter').addEventListener('change', filterContainers);
  document.getElementById('closeDialogBtn').addEventListener('click', closeRequestDialog);
  document.getElementById('cancelRequestBtn').addEventListener('click', closeRequestDialog);
  document.getElementById('requestForm').addEventListener('submit', submitRequest);
  
  // Set min date for required date input to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('requiredDate').min = today;
  
  // Load containers when the page loads
  loadContainers();
  
  // Function to load containers from the API
  async function loadContainers() {
    try {
      // Show loading state
      document.getElementById('containersTableBody').innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">Loading available containers...</td></tr>';
      
      // Fetch containers from the backend API
      const response = await fetch('/api/containers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch containers');
      }
      
      const containers = await response.json();
      
      // Filter to show only available containers and exclude those under maintenance
      const availableContainers = containers.filter(container => 
        container.status === 'Available' && container.status !== 'UnderMaintenance'
      );
      
      // Update stats
      updateStats(availableContainers);
      
      // Render containers
      renderContainers(availableContainers);
    } catch (error) {
      console.error('Error loading containers:', error);
      document.getElementById('containersTableBody').innerHTML = 
        `<tr><td colspan="7" class="px-4 py-8 text-center text-red-500">❌ Error loading containers: ${error.message}</td></tr>`;
    }
  }
  
  // Function to update stats
  function updateStats(containers) {
    document.getElementById('stat-total').textContent = containers.length;
    
    const dryCount = containers.filter(c => c.type === 'Dry').length;
    document.getElementById('stat-dry').textContent = dryCount;
    
    const reeferCount = containers.filter(c => c.type === 'Reefer').length;
    document.getElementById('stat-reefer').textContent = reeferCount;
    
    const otherCount = containers.length - dryCount - reeferCount;
    document.getElementById('stat-other').textContent = otherCount;
  }
  
  // Function to render containers in the table
  function renderContainers(containers) {
    const tableBody = document.getElementById('containersTableBody');
    tableBody.innerHTML = '';
    
    if (containers.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">📭 No available containers found</td></tr>';
      return;
    }
    
    containers.forEach(container => {
      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50';
      
      row.innerHTML = `
        <td class="px-4 py-3 font-medium text-gray-900">${container.number}</td>
        <td class="px-4 py-3 text-gray-700">${container.type || '-'}</td>
        <td class="px-4 py-3 text-gray-700">${container.size || '-'}</td>
        <td class="px-4 py-3">
          <span class="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ${container.status}
          </span>
        </td>
        <td class="px-4 py-3 text-gray-700">${container.location || '-'}</td>
        <td class="px-4 py-3 text-gray-700">${container.owner || '-'}</td>
        <td class="px-4 py-3">
          <button data-id="${container.id}" data-number="${container.number}" data-type="${container.type}" data-size="${container.size}" class="request-btn px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded font-medium transition shadow">
            Request
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });
    
    // Add event listeners to request buttons
    document.querySelectorAll('.request-btn').forEach(button => {
      button.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        const number = this.getAttribute('data-number');
        const type = this.getAttribute('data-type');
        const size = this.getAttribute('data-size');
        openRequestDialog(id, number, type, size);
      });
    });
  }
  
  // Function to filter containers based on search and filters
  function filterContainers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    const sizeFilter = document.getElementById('sizeFilter').value;
    
    // In a real app, this would filter on the server side
    // For now, we'll reload and let the user see all containers
    loadContainers();
  }
  
  // Function to open the request dialog
  function openRequestDialog(id, number, type, size) {
    document.getElementById('containerId').value = id;
    document.getElementById('containerNumber').value = number;
    document.getElementById('containerType').value = `${type} - ${size}`;
    
    // Store the actual type and size in hidden fields or data attributes
    document.getElementById('requestForm').setAttribute('data-container-type', type);
    document.getElementById('requestForm').setAttribute('data-container-size', size);
    
    // Set default duration to 7 days
    document.getElementById('duration').value = 7;
    
    document.getElementById('requestDialog').classList.remove('hidden');
  }
  
  // Function to close the request dialog
  function closeRequestDialog() {
    document.getElementById('requestDialog').classList.add('hidden');
    document.getElementById('requestForm').reset();
  }
  
  // Function to submit a container request
  async function submitRequest(e) {
    e.preventDefault();
    
    try {
      const containerId = document.getElementById('containerId').value;
      const containerNumber = document.getElementById('containerNumber').value;
      const requiredDate = document.getElementById('requiredDate').value;
      const duration = document.getElementById('duration').value;
      const pickupLocation = document.getElementById('pickupLocation').value;
      const deliveryLocation = document.getElementById('deliveryLocation').value;
      const remarks = document.getElementById('remarks').value;
      
      // Get the actual container type and size from data attributes
      const containerType = document.getElementById('requestForm').getAttribute('data-container-type');
      const containerSize = document.getElementById('requestForm').getAttribute('data-container-size');
      
      // Validate required fields
      if (!requiredDate || !duration || !pickupLocation || !deliveryLocation) {
        alert('❌ Please fill in all required fields');
        return;
      }
      
      // Create request data
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
      
      // Submit request to the backend API
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
      
      // Success
      alert('✅ Container request submitted successfully!');
      closeRequestDialog();
      
      // Refresh the containers list
      loadContainers();
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('❌ Error submitting request: ' + error.message);
    }
  }
});