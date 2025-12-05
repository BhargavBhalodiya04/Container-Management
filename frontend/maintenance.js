// Maintenance Management Page Logic

// Remove the global token and user declarations since they won't be updated if the user logs in after the script loads

// DOM Elements
const newMaintenanceBtn = document.getElementById('newMaintenanceBtn');
const maintenanceDialog = document.getElementById('maintenanceDialog');
const maintenanceForm = document.getElementById('maintenanceForm');
const maintenanceTable = document.getElementById('maintenanceTable');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const containerFilter = document.getElementById('containerFilter');

// Form Elements
const maintenanceId = document.getElementById('maintenanceId');
const mContainerId = document.getElementById('mContainerId');
const issueDescription = document.getElementById('issueDescription');
const assignedTo = document.getElementById('assignedTo');
const status = document.getElementById('status');
const taskSource = document.getElementById('taskSource');

// Cancel button
const cancelMaintenanceBtn = document.getElementById('cancelMaintenanceBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Helper function to get current token and user
function getCurrentAuth() {
  const token = localStorage.getItem('cms_token');
  const user = JSON.parse(localStorage.getItem('cms_user') || 'null');
  return { token, user };
}

// Helper to normalize IDs consistently
function idStr(id) {
  return id === null || id === undefined ? '' : String(id);
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
  
  await loadContainers();
  await refreshAll();
});

// Load containers for dropdowns
async function loadContainers(editingContainerId = null) {
  try {
    if (typeof API === 'undefined') {
      console.error('API object is not defined');
      return;
    }

    const { token } = getCurrentAuth();

    const [containers, maintenances] = await Promise.all([
      API.containers(token, {}),
      API.maintenances(token)
    ]);

    // active maintenance container IDs (normalized to strings)
    const underMaintenanceIds = new Set(
      maintenances
        .filter(m => m.status !== 'Completed')
        .map(m => idStr(m.containerId))
    );

    // containers that have status "UnderMaintenance" but no active maintenance record
    const orphanedMaintenanceContainers = containers
      .filter(c => c.status === 'UnderMaintenance' && !underMaintenanceIds.has(idStr(c.id)))
      .map(c => idStr(c.id));

    // union
    const allUnderMaintenanceIds = new Set([...underMaintenanceIds, ...orphanedMaintenanceContainers]);

    // keep container being edited even if it's under maintenance
    const editingIdStr = editingContainerId ? idStr(editingContainerId) : null;

    // Exclude booked containers from maintenance options
    const eligibleContainers = containers.filter(c => c.status !== 'Booked');
    
    const availableContainers = eligibleContainers.filter(c =>
      !allUnderMaintenanceIds.has(idStr(c.id)) || (editingIdStr && idStr(c.id) === editingIdStr)
    );

    const containerOptions = availableContainers.map(c =>
      `<option value="${c.id}">${c.number} (${c.type})</option>`
    ).join('');

    mContainerId.innerHTML = '<option value="">Select Container</option>' + containerOptions;
    containerFilter.innerHTML = '<option value="">All Containers</option>' + containerOptions;
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
    
    checkDataConsistency(containers, maintenanceRecords);
    
    document.getElementById('stat-total').textContent = maintenanceRecords.length;
    document.getElementById('stat-inProgress').textContent = maintenanceRecords.filter(m => m.status === 'InProgress').length;
    document.getElementById('stat-completed').textContent = maintenanceRecords.filter(m => m.status === 'Completed').length;
    document.getElementById('stat-pending').textContent = maintenanceRecords.filter(m => m.status === 'Pending').length;
    
    await renderMaintenances(maintenanceRecords);
  } catch (error) {
    console.error('Error refreshing data:', error);
    alert('Error refreshing data: ' + (error.message || error));
  }
}

// Check for data consistency between containers and maintenance records
function checkDataConsistency(containers, maintenanceRecords) {
  const underMaintenanceContainers = containers.filter(c => c.status === 'UnderMaintenance');
  const activeMaintenanceRecords = maintenanceRecords.filter(m => m.status !== 'Completed');

  // map containerId (string) -> maintenance record (first found)
  const containerToMaintenanceMap = {};
  activeMaintenanceRecords.forEach(record => {
    containerToMaintenanceMap[idStr(record.containerId)] = record;
  });

  const inconsistencies = [];

  // orphaned containers (UnderMaintenance but no active record)
  underMaintenanceContainers.forEach(container => {
    if (!containerToMaintenanceMap[idStr(container.id)]) {
      inconsistencies.push({
        type: 'orphaned_container',
        container,
        message: `Container ${container.number} (ID: ${container.id}) has "UnderMaintenance" status but no active maintenance record`
      });
    }
  });

  // active maintenance records whose container is not UnderMaintenance
  activeMaintenanceRecords.forEach(record => {
    const container = containers.find(c => idStr(c.id) === idStr(record.containerId));
    if (container && container.status !== 'UnderMaintenance') {
      inconsistencies.push({
        type: 'missing_status',
        container,
        record,
        message: `Container ${container.number} (ID: ${container.id}) has an active maintenance record (ID: ${record.id}) but status is "${container.status}"`
      });
    }
  });

  if (inconsistencies.length > 0) {
    console.warn('Data consistency issues found:');
    inconsistencies.forEach(issue => console.warn(issue.message, issue));
    // non-blocking UI suggestion: show a banner (replace alert to avoid modal spam)
    showDataConsistencyBanner(inconsistencies);
  } else {
    hideDataConsistencyBanner();
  }

  return inconsistencies;
}

// --- small banner helper (add to file once) ---
function showDataConsistencyBanner(issues) {
  // try to reuse or create a simple banner at top of page
  let banner = document.getElementById('dataConsistencyBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'dataConsistencyBanner';
    banner.style = 'background:#fff3cd;color:#856404;padding:10px;border:1px solid #ffeeba;margin-bottom:12px;';
    document.body.insertBefore(banner, document.body.firstChild);
  }
  banner.innerHTML = `<strong>Data consistency issues found (${issues.length}).</strong>
    <button style="margin-left:12px" onclick="console.log('See console for details');">View console</button>
    <details style="display:block;margin-top:8px">
      <summary>Details</summary>
      <pre style="white-space:pre-wrap">${issues.map(i => i.message).join('\n')}</pre>
    </details>`;
}

function hideDataConsistencyBanner() {
  const banner = document.getElementById('dataConsistencyBanner');
  if (banner) banner.remove();
}

// Render maintenance records
async function renderMaintenances(records) {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const statusValue = statusFilter.value;
  const containerValue = containerFilter.value;

  let allContainers = [];
  try {
    const { token } = getCurrentAuth();
    allContainers = await API.containers(token, {});
  } catch (error) {
    console.error('Error fetching containers for display:', error);
  }

  // normalized map: idStr -> number
  const containerMap = {};
  allContainers.forEach(container => {
    containerMap[idStr(container.id)] = container.number;
  });

  const filteredRecords = records.filter(record => {
    const containerIdStr = idStr(record.containerId);

    // Search across containerId, issueDescription, assignedTo
    const matchesSearch = !searchTerm || (
      containerIdStr.toLowerCase().includes(searchTerm) ||
      (record.issueDescription || '').toLowerCase().includes(searchTerm) ||
      (record.assignedTo || '').toLowerCase().includes(searchTerm)
    );

    const matchesStatus = !statusValue || record.status === statusValue;
    const matchesContainer = !containerValue || containerIdStr === containerValue;
    return matchesSearch && matchesStatus && matchesContainer;
  });

  const tbody = maintenanceTable.querySelector('tbody');
  tbody.innerHTML = filteredRecords.map(record => `
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${containerMap[idStr(record.containerId)] || record.containerId}</td>
      <td class="px-6 py-4 text-sm text-gray-900">${escapeHtml(record.issueDescription || '')}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${escapeHtml(record.assignedTo || '-')}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatDate(record.startDate)}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
          ${record.status === 'Completed' ? 'bg-green-100 text-green-800' : 
            record.status === 'InProgress' ? 'bg-yellow-100 text-yellow-800' : 
            'bg-red-100 text-red-800'}">
          ${record.status}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
          ${record.taskSource === 'maintenance' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}">
          ${record.taskSource === 'maintenance' ? 'Maintenance' : 'Admin Task'}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button onclick="editMaintenance('${record.id}')" class="text-red-600 hover:text-red-900 mr-3">Edit</button>
        <button onclick="deleteMaintenance('${record.id}')" class="text-red-600 hover:text-red-900">Delete</button>
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
newMaintenanceBtn.addEventListener('click', () => {
  // Reset form
  maintenanceForm.reset();
  maintenanceId.value = '';
  maintenanceDialog.classList.remove('hidden');
});

cancelMaintenanceBtn.addEventListener('click', () => {
  maintenanceDialog.classList.add('hidden');
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('cms_token');
  localStorage.removeItem('cms_user');
  location.href = 'index.html';
});

maintenanceForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (typeof API === 'undefined') {
    console.error('API object is not defined');
    alert('Application error: API not available');
    return;
  }
  const { token } = getCurrentAuth();

  // Create payload; if editing, fetch existing to preserve startDate
  let startDateToUse = new Date().toISOString();
  if (maintenanceId.value) {
    try {
      const prev = await API.getMaintenance(token, maintenanceId.value);
      if (prev && prev.startDate) startDateToUse = prev.startDate;
    } catch (e) {
      console.warn('Could not fetch previous maintenance to preserve startDate. Using now()', e);
    }
  }

  const maintenanceData = {
    containerId: mContainerId.value,
    issueDescription: issueDescription.value,
    assignedTo: assignedTo.value,
    status: status.value,
    taskSource: taskSource.value,
    startDate: startDateToUse
  };

  if (!maintenanceData.containerId) { alert('Please select a container'); return; }
  if (!maintenanceData.issueDescription) { alert('Please enter an issue description'); return; }

  try {
    let previousStatus = null;
    if (maintenanceId.value) {
      const previousRecord = await API.getMaintenance(token, maintenanceId.value);
      previousStatus = previousRecord && previousRecord.status;
      await API.updateMaintenance(token, maintenanceId.value, maintenanceData);
    } else {
      await API.createMaintenance(token, maintenanceData);
    }

    maintenanceDialog.classList.add('hidden');
    await loadContainers();
    await refreshAll();

    if ((previousStatus && previousStatus !== 'Completed' && maintenanceData.status === 'Completed') ||
        (previousStatus && previousStatus === 'Completed' && maintenanceData.status !== 'Completed')) {
      window.dispatchEvent(new CustomEvent('containerStatusChanged'));
    }
  } catch (error) {
    console.error('Error saving maintenance:', error);
    alert('Error saving maintenance record: ' + (error.message || error));
  }
});

// Edit maintenance record
async function editMaintenance(id) {
  try {
    if (typeof API === 'undefined') {
      console.error('API object is not defined');
      return;
    }
    
    const { token } = getCurrentAuth();
    
    const maintenance = await API.getMaintenance(token, id);
    maintenanceId.value = maintenance.id;
    issueDescription.value = maintenance.issueDescription;
    assignedTo.value = maintenance.assignedTo || '';
    status.value = maintenance.status;
    taskSource.value = maintenance.taskSource || 'admin';
    
    await loadContainers(maintenance.containerId);
    
    mContainerId.value = maintenance.containerId;
    
    maintenanceDialog.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading maintenance:', error);
    alert('Error loading maintenance record: ' + (error.message || error));
  }
}

// Delete maintenance record
async function deleteMaintenance(id) {
  if (confirm('Are you sure you want to delete this maintenance record?')) {
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
      console.error('Error deleting maintenance:', error);
      alert('Error deleting maintenance record: ' + (error.message || error));
    }
  }
}

// Filter events
searchInput.addEventListener('input', () => refreshAll());
statusFilter.addEventListener('change', () => refreshAll());
containerFilter.addEventListener('change', () => refreshAll());