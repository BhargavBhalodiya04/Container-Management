// Admin Tasks Management Page Logic

// DOM Elements
const newTaskBtn = document.getElementById('newTaskBtn');
const taskDialog = document.getElementById('taskDialog');
const taskForm = document.getElementById('taskForm');
const tasksTable = document.getElementById('tasksTable');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const userFilter = document.getElementById('userFilter');

// Form Elements
const taskId = document.getElementById('taskId');
const containerId = document.getElementById('containerId');
const issueDescription = document.getElementById('issueDescription');
const assignedTo = document.getElementById('assignedTo');
const taskStatus = document.getElementById('taskStatus');

// Cancel button
const cancelTaskBtn = document.getElementById('cancelTaskBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Helper function to get current token and user
function getCurrentAuth() {
  const token = localStorage.getItem('cms_token');
  const user = JSON.parse(localStorage.getItem('cms_user') || 'null');
  return { token, user };
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
  const { token, user } = getCurrentAuth();
  
  if (!token || !user) {
    location.href = 'index.html';
    return;
  }
  
  document.getElementById('userName').textContent = user.username;
  
  // Ensure API is defined
  if (typeof API === 'undefined') {
    console.error('API object is not defined');
    alert('Application error: API not available');
    return;
  }
  
  await loadUsers();
  await loadContainers();
  await refreshAll();
});

// Load users for dropdown
async function loadUsers() {
  try {
    if (typeof API === 'undefined') {
      console.error('API object is not defined');
      return;
    }

    const { token } = getCurrentAuth();
    
    // Fetch users from the API
    const response = await fetch('/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    const users = await response.json();
    
    // Filter out admin users, only show regular users
    const regularUsers = users.filter(u => u.role !== 'admin');
    
    const userOptions = regularUsers.map(u => 
      `<option value="${u.username}">${u.username}</option>`
    ).join('');
    
    assignedTo.innerHTML = '<option value="">Select User</option>' + userOptions;
    userFilter.innerHTML = '<option value="">All Users</option>' + userOptions;
  } catch (error) {
    console.error('Error loading users:', error);
    alert('Error loading users: ' + (error.message || error));
  }
}

// Load containers for dropdown
async function loadContainers() {
  try {
    if (typeof API === 'undefined') {
      console.error('API object is not defined');
      return;
    }

    const { token } = getCurrentAuth();

    const containers = await API.containers(token, {});
    
    // Exclude booked containers from maintenance options
    const eligibleContainers = containers.filter(c => c.status !== 'Booked');
    
    const containerOptions = eligibleContainers.map(c =>
      `<option value="${c.id}">${c.number} (${c.type})</option>`
    ).join('');

    containerId.innerHTML = '<option value="">Select Container</option>' + containerOptions;
  } catch (error) {
    console.error('Error loading containers:', error);
    alert('Error loading containers: ' + (error.message || error));
  }
}

// Refresh all data
async function refreshAll() {
  try {
    if (typeof API === 'undefined') {
      console.error('API object is not defined');
      return;
    }
    
    const { token } = getCurrentAuth();
    
    const [containers, maintenanceRecords] = await Promise.all([
      API.containers(token, {}),
      API.maintenances(token)
    ]);
    
    document.getElementById('stat-total').textContent = maintenanceRecords.length;
    document.getElementById('stat-pending').textContent = maintenanceRecords.filter(m => m.status === 'Pending').length;
    document.getElementById('stat-inProgress').textContent = maintenanceRecords.filter(m => m.status === 'InProgress').length;
    document.getElementById('stat-completed').textContent = maintenanceRecords.filter(m => m.status === 'Completed').length;
    
    await renderTasks(maintenanceRecords, containers);
  } catch (error) {
    console.error('Error refreshing data:', error);
    alert('Error refreshing data: ' + (error.message || error));
  }
}

// Render tasks
async function renderTasks(records, containers) {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const statusValue = statusFilter.value;
  const userValue = userFilter.value;

  // normalized map: idStr -> number
  const containerMap = {};
  containers.forEach(container => {
    containerMap[container.id] = container.number;
  });

  const filteredRecords = records.filter(record => {
    // Search across containerId, issueDescription, assignedTo
    const matchesSearch = !searchTerm || (
      (containerMap[record.containerId] || '').toLowerCase().includes(searchTerm) ||
      (record.issueDescription || '').toLowerCase().includes(searchTerm) ||
      (record.assignedTo || '').toLowerCase().includes(searchTerm)
    );

    const matchesStatus = !statusValue || record.status === statusValue;
    const matchesUser = !userValue || record.assignedTo === userValue;
    return matchesSearch && matchesStatus && matchesUser;
  });

  const tbody = tasksTable.querySelector('tbody');
  tbody.innerHTML = filteredRecords.map(record => `
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${containerMap[record.containerId] || record.containerId}</td>
      <td class="px-6 py-4 text-sm text-gray-900">${escapeHtml(record.issueDescription || '')}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${escapeHtml(record.assignedTo || '-')}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatDate(record.startDate)}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
          ${record.status === 'Completed' ? 'bg-green-100 text-green-800' : 
            record.status === 'InProgress' ? 'bg-yellow-100 text-yellow-800' : 
            'bg-blue-100 text-blue-800'}">
          ${record.status}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button onclick="editTask('${record.id}')" class="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
        <button onclick="deleteTask('${record.id}')" class="text-red-600 hover:text-red-900">Delete</button>
      </td>
    </tr>
  `).join('');
}

// simple HTML escaper
function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// Format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Event Listeners
newTaskBtn.addEventListener('click', () => {
  // Reset form
  taskForm.reset();
  taskId.value = '';
  taskDialog.classList.remove('hidden');
});

cancelTaskBtn.addEventListener('click', () => {
  taskDialog.classList.add('hidden');
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('cms_token');
  localStorage.removeItem('cms_user');
  location.href = 'index.html';
});

taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (typeof API === 'undefined') {
    console.error('API object is not defined');
    alert('Application error: API not available');
    return;
  }
  const { token } = getCurrentAuth();

  // Create payload; if editing, fetch existing to preserve startDate
  let startDateToUse = new Date().toISOString();
  if (taskId.value) {
    try {
      const prev = await API.getMaintenance(token, taskId.value);
      if (prev && prev.startDate) startDateToUse = prev.startDate;
    } catch (e) {
      console.warn('Could not fetch previous maintenance to preserve startDate. Using now()', e);
    }
  }

  const taskData = {
    containerId: containerId.value,
    issueDescription: issueDescription.value,
    assignedTo: assignedTo.value,
    status: taskStatus.value,
    startDate: startDateToUse
  };

  if (!taskData.containerId) { alert('Please select a container'); return; }
  if (!taskData.issueDescription) { alert('Please enter an issue description'); return; }
  if (!taskData.assignedTo) { alert('Please select a user to assign the task to'); return; }

  try {
    if (taskId.value) {
      await API.updateMaintenance(token, taskId.value, taskData);
    } else {
      await API.createMaintenance(token, taskData);
    }

    taskDialog.classList.add('hidden');
    await loadContainers();
    await refreshAll();
  } catch (error) {
    console.error('Error saving task:', error);
    alert('Error saving task: ' + (error.message || error));
  }
});

// Edit task
async function editTask(id) {
  try {
    if (typeof API === 'undefined') {
      console.error('API object is not defined');
      return;
    }
    
    const { token } = getCurrentAuth();
    
    const task = await API.getMaintenance(token, id);
    taskId.value = task.id;
    issueDescription.value = task.issueDescription;
    assignedTo.value = task.assignedTo || '';
    taskStatus.value = task.status;
    
    await loadContainers();
    await loadUsers();
    
    containerId.value = task.containerId;
    
    taskDialog.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading task:', error);
    alert('Error loading task: ' + (error.message || error));
  }
}

// Delete task
async function deleteTask(id) {
  if (confirm('Are you sure you want to delete this task?')) {
    try {
      if (typeof API === 'undefined') {
        console.error('API object is not defined');
        return;
      }
      
      const { token } = getCurrentAuth();
      
      await API.deleteMaintenance(token, id);
      await loadContainers();
      await refreshAll();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Error deleting task: ' + (error.message || error));
    }
  }
}

// Filter events
searchInput.addEventListener('input', () => refreshAll());
statusFilter.addEventListener('change', () => refreshAll());
userFilter.addEventListener('change', () => refreshAll());