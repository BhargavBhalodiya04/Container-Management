// Yard Management Page Logic
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

// DOM Elements
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const zoneFilter = document.getElementById('zoneFilter');
const refreshBtn = document.getElementById('refreshBtn');
const containersTable = document.getElementById('containersTable');
const positionDialog = document.getElementById('positionDialog');
const positionForm = document.getElementById('positionForm');
const logoutBtn = document.getElementById('logoutBtn');

// Form Elements
const containerId = document.getElementById('containerId');
const containerNumber = document.getElementById('containerNumber');
const zone = document.getElementById('zone');
const position = document.getElementById('position');
const cancelPositionBtn = document.getElementById('cancelPositionBtn');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await refreshAll();
});

// Refresh all data
async function refreshAll() {
  try {
    // Update stats
    const stats = await API.stats(token);
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-available').textContent = stats.available;
    document.getElementById('stat-inTransit').textContent = stats.inTransit;
    document.getElementById('stat-underMaintenance').textContent = stats.underMaintenance;
    
    // Get containers
    const containers = await API.containers(token);
    
    // Render container positions
    renderContainerPositions(containers);
  } catch (error) {
    console.error('Error refreshing data:', error);
  }
}

// Render container positions
function renderContainerPositions(containers) {
  const searchTerm = searchInput.value.toLowerCase();
  const statusValue = statusFilter.value;
  const zoneValue = zoneFilter.value;
  
  // For demo purposes, we'll add some mock position data to containers
  const containersWithPositions = containers.map(container => ({
    ...container,
    zone: container.status === 'UnderMaintenance' ? 'Repair' : 
          container.status === 'InTransit' ? 'Loading' : 
          `Zone ${String.fromCharCode(65 + (container.id % 3))}`, // Zone A, B, or C
    position: `${String.fromCharCode(65 + (container.id % 3))}${container.id.toString().padStart(2, '0')}`
  }));
  
  const filteredContainers = containersWithPositions.filter(container => {
    const matchesSearch = container.number.toLowerCase().includes(searchTerm);
    const matchesStatus = !statusValue || container.status === statusValue;
    const matchesZone = !zoneValue || container.zone === zoneValue;
    return matchesSearch && matchesStatus && matchesZone;
  });
  
  const tbody = containersTable.querySelector('tbody');
  tbody.innerHTML = filteredContainers.map(container => `
    <tr class="hover:bg-gray-50 cursor-pointer" onclick="assignPosition('${container.id}', '${container.number}')">
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${container.number}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${container.type} (${container.size})</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
          ${container.zone === 'Repair' ? 'bg-red-100 text-red-800' : 
            container.zone === 'Loading' ? 'bg-purple-100 text-purple-800' : 
            'bg-blue-100 text-blue-800'}">
          ${container.zone}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${container.position}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
          ${container.status === 'Available' ? 'bg-green-100 text-green-800' : 
            container.status === 'InTransit' ? 'bg-yellow-100 text-yellow-800' : 
            container.status === 'Booked' ? 'bg-blue-100 text-blue-800' : 
            'bg-red-100 text-red-800'}">
          ${container.status}
        </span>
      </td>
    </tr>
  `).join('');
  
  // Render containers on yard map
  renderYardMap(filteredContainers);
}

// Render containers on yard map visualization
function renderYardMap(containers) {
  const yardContainers = document.getElementById('yardContainers');
  yardContainers.innerHTML = '';
  
  containers.forEach(container => {
    const containerElement = document.createElement('div');
    containerElement.className = `absolute w-8 h-8 rounded flex items-center justify-center text-xs font-bold cursor-pointer transform transition-transform hover:scale-110 ${
      container.status === 'Available' ? 'bg-green-500 text-white' : 
      container.status === 'InTransit' ? 'bg-yellow-500 text-gray-900' : 
      container.status === 'Booked' ? 'bg-blue-500 text-white' : 
      'bg-red-500 text-white'
    }`;
    
    // Position containers in their respective zones
    let top, left;
    switch(container.zone) {
      case 'Zone A':
        top = `${10 + (container.id * 15) % 70}%`;
        left = `${10 + (container.id * 10) % 20}%`;
        break;
      case 'Zone B':
        top = `${10 + (container.id * 12) % 70}%`;
        left = `${70 + (container.id * 8) % 20}%`;
        break;
      case 'Zone C':
        top = `${60 + (container.id * 10) % 30}%`;
        left = `${10 + (container.id * 15) % 20}%`;
        break;
      case 'Loading':
        top = `${40 + (container.id * 10) % 20}%`;
        left = `${40 + (container.id * 15) % 20}%`;
        break;
      case 'Repair':
        top = `${70 + (container.id * 8) % 20}%`;
        left = `${70 + (container.id * 12) % 20}%`;
        break;
      default:
        top = `${20 + (container.id * 10) % 60}%`;
        left = `${20 + (container.id * 15) % 60}%`;
    }
    
    containerElement.style.top = top;
    containerElement.style.left = left;
    containerElement.title = `${container.number} (${container.zone})`;
    containerElement.textContent = container.number.substring(container.number.length - 2);
    
    containerElement.addEventListener('click', () => {
      assignPosition(container.id, container.number);
    });
    
    yardContainers.appendChild(containerElement);
  });
}

// Assign position function
function assignPosition(id, number) {
  containerId.value = id;
  containerNumber.value = number;
  zone.value = '';
  position.value = '';
  positionDialog.classList.remove('hidden');
}

// Event Listeners
refreshBtn.addEventListener('click', refreshAll);

searchInput.addEventListener('input', () => refreshAll());
statusFilter.addEventListener('change', () => refreshAll());
zoneFilter.addEventListener('change', () => refreshAll());

cancelPositionBtn.addEventListener('click', () => {
  positionDialog.classList.add('hidden');
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('cms_token');
  localStorage.removeItem('cms_user');
  location.href = 'index.html';
});

positionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = containerId.value;
  const zoneValue = zone.value;
  const positionValue = position.value;
  
  if (!zoneValue) {
    alert('Please select a zone');
    return;
  }
  
  try {
    // In a real app, we would update the container's position in the database
    // For this mock, we'll just show a success message
    alert(`Position assigned successfully!\nContainer: ${containerNumber.value}\nZone: ${zoneValue}\nPosition: ${positionValue || 'N/A'}`);
    
    positionDialog.classList.add('hidden');
    refreshAll();
  } catch (error) {
    console.error('Error assigning position:', error);
    alert('Error assigning position');
  }
});

// Add yard management APIs to core.js if they don't exist
if (!API.assignPosition) {
  API.assignPosition = async (token, containerId, zone, position) => {
    // In a real implementation, this would update the container's position
    // For mock purposes, we'll just return success
    return { success: true, message: 'Position assigned successfully' };
  };
}