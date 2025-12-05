// Get token from localStorage
const token = localStorage.getItem('cms_token');
if (!token) {
  window.location.href = 'index.html';
}

let tasks = [];

// DOM Elements
const tasksTableBody = document.getElementById('tasksTableBody');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const refreshBtn = document.getElementById('refreshBtn');
const taskModal = document.getElementById('taskModal');
const closeTaskModal = document.getElementById('closeTaskModal');
const taskModalContent = document.getElementById('taskModalContent');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  loadTasks();
  
  // Set up event listeners with error checking
  if (searchInput) searchInput.addEventListener('input', filterTasks);
  if (statusFilter) statusFilter.addEventListener('change', filterTasks);
  if (refreshBtn) refreshBtn.addEventListener('click', loadTasks);
  if (closeTaskModal) closeTaskModal.addEventListener('click', () => {
    taskModal.classList.add('hidden');
  });
});

// Load tasks from API
async function loadTasks() {
  try {
    tasksTableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Loading tasks...</td></tr>';
    
    const response = await fetch('/api/user/tasks', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }
    
    tasks = await response.json();
    renderTasks(tasks);
  } catch (error) {
    console.error('Error loading tasks:', error);
    tasksTableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">Error loading tasks: ' + error.message + '</td></tr>';
  }
}

// Render tasks in the table
function renderTasks(tasksToRender) {
  if (tasksToRender.length === 0) {
    tasksTableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No tasks found</td></tr>';
    return;
  }
  
  tasksTableBody.innerHTML = tasksToRender.map(task => `
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${task.containerId || 'N/A'}</td>
      <td class="px-6 py-4 text-sm text-gray-900">${escapeHtml(task.issueDescription || '')}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
          ${task.status === 'Completed' ? 'bg-green-100 text-green-800' : 
            task.status === 'InProgress' ? 'bg-yellow-100 text-yellow-800' : 
            'bg-red-100 text-red-800'}">
          ${task.status || 'Pending'}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatDate(task.startDate)}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
          ${task.taskSource === 'maintenance' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}">
          ${task.taskSource === 'maintenance' ? 'Maintenance' : 'Admin Task'}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button onclick="viewTaskDetails(${task.id})" class="text-blue-600 hover:text-blue-900">
          <i class="fas fa-eye mr-1"></i> View
        </button>
      </td>
    </tr>
  `).join('');
}

// Filter tasks based on search and status filters
function filterTasks() {
  const searchTerm = searchInput.value.toLowerCase();
  const statusValue = statusFilter.value;
  
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchTerm || (
      (task.containerId && task.containerId.toString().toLowerCase().includes(searchTerm)) ||
      (task.issueDescription && task.issueDescription.toLowerCase().includes(searchTerm))
    );
    
    const matchesStatus = !statusValue || task.status === statusValue;
    
    return matchesSearch && matchesStatus;
  });
  
  renderTasks(filteredTasks);
}

// View task details
function viewTaskDetails(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  
  taskModalContent.innerHTML = `
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Container ID</label>
          <p class="mt-1 text-sm text-gray-900">${task.containerId || 'N/A'}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Status</label>
          <p class="mt-1 text-sm text-gray-900">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
              ${task.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                task.status === 'InProgress' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-red-100 text-red-800'}">
              ${task.status || 'Pending'}
            </span>
          </p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Start Date</label>
          <p class="mt-1 text-sm text-gray-900">${formatDate(task.startDate)}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Assigned To</label>
          <p class="mt-1 text-sm text-gray-900">${task.assignedTo || 'N/A'}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Task Type</label>
          <p class="mt-1 text-sm text-gray-900">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
              ${task.taskSource === 'maintenance' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}">
              ${task.taskSource === 'maintenance' ? 'Maintenance Request' : 'Admin Assigned Task'}
            </span>
          </p>
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Issue Description</label>
        <p class="mt-1 text-sm text-gray-900">${escapeHtml(task.issueDescription || '')}</p>
      </div>
    </div>
  `;
  
  taskModal.classList.remove('hidden');
}

// Helper functions
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}