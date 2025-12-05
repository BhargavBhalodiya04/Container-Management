// Admin page logic using core Store/API (mock)
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const containersTableBody = document.querySelector('#containersTable tbody');
const newContainerBtn = document.getElementById('newContainerBtn');
const exportExcelBtn = document.getElementById('exportExcelBtn');

// Notification System
const notificationBtn = document.getElementById('notificationBtn');
const notificationBadge = document.getElementById('notificationBadge');

async function updateNotifications() {
  // Fetch requests from API instead of using mock Store
  let pendingRequests = 0;
  
  try {
    const requests = await API.getRequests(token);
    pendingRequests = requests.filter(r => r.status === 'pending').length;
  } catch (err) {
    console.error('Failed to fetch requests for notification count', err);
  }
  
  // For now, use mock data for bookings since there's no API endpoint
  const pendingBookings = Store.bookings.filter(b => b.status === 'Pending').length;
  
  // Fetch containers from API to check maintenance status
  let maintenanceCount = 0;
  try {
    const containers = await API.containers(token, {});
    maintenanceCount = 0; // UnderMaintenance status removed
  } catch (err) {
    console.error('Failed to fetch containers for notification count', err);
  }
  
  const totalNotifications = pendingRequests + pendingBookings + maintenanceCount;
  
  if (totalNotifications > 0) {
    notificationBadge.textContent = totalNotifications;
    notificationBadge.classList.remove('hidden');
  } else {
    notificationBadge.classList.add('hidden');
  }
}

notificationBtn.addEventListener('click', async () => {
  // Fetch requests from API instead of using mock Store
  let pendingRequests = 0;
  
  try {
    const requests = await API.getRequests(token);
    pendingRequests = requests.filter(r => r.status === 'pending').length;
  } catch (err) {
    console.error('Failed to fetch requests for notification count', err);
  }
  
  // For now, use mock data for bookings since there's no API endpoint
  const pendingBookings = Store.bookings.filter(b => b.status === 'Pending').length;
  
  // Fetch containers from API to check maintenance status
  let maintenanceCount = 0;
  try {
    const containers = await API.containers(token, {});
    maintenanceCount = 0; // UnderMaintenance status removed
  } catch (err) {
    console.error('Failed to fetch containers for notification count', err);
  }
  
  let message = '🔔 NOTIFICATIONS\n\n';
  
  if (pendingRequests > 0) {
    message += `📋 ${pendingRequests} Pending Container Request${pendingRequests > 1 ? 's' : ''}\n`;
  }
  if (pendingBookings > 0) {
    message += `📅 ${pendingBookings} Pending Booking${pendingBookings > 1 ? 's' : ''}\n`;
  }
  if (maintenanceCount > 0) {
    message += `🔧 ${maintenanceCount} Container${maintenanceCount > 1 ? 's' : ''} Under Maintenance\n`;
  }
  
  if (pendingRequests === 0 && pendingBookings === 0 && maintenanceCount === 0) {
    message += '✅ No pending items';
  }
  
  alert(message);
});

const containerDialog = document.getElementById('containerDialog');
const containerForm = document.getElementById('containerForm');
const dialogTitle = document.getElementById('dialogTitle');
const containerId = document.getElementById('containerId');
const cNumber = document.getElementById('cNumber');
const cType = document.getElementById('cType');
const cSize = document.getElementById('cSize');
const cStatus = document.getElementById('cStatus');
const cLocation = document.getElementById('cLocation');
const cOwner = document.getElementById('cOwner');
const cWeight = document.getElementById('cWeight');
const cRfid = document.getElementById('cRfid');
const cCondition = document.getElementById('cCondition');
const cLat = document.getElementById('cLat');
const cLng = document.getElementById('cLng');

let token, user;

// Initialize charts function
function initCharts() {
  const statusCtx = document.getElementById('statusChart').getContext('2d');
  const typeCtx = document.getElementById('typeChart').getContext('2d');

  statusChart = new Chart(statusCtx, {
    type: 'bar',
    data: {
      labels: ['Available', 'In Transit', 'Booked', 'Maintenance'],
      datasets: [{
        label: 'Containers',
        data: [0, 0, 0, 0],
        backgroundColor: [
          'rgba(34, 197, 94, 0.7)',
          'rgba(234, 179, 8, 0.7)',
          'rgba(168, 85, 247, 0.7)',
          'rgba(239, 68, 68, 0.7)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(234, 179, 8)',
          'rgb(168, 85, 247)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      }
    }
  });

  typeChart = new Chart(typeCtx, {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(168, 85, 247, 0.7)',
          'rgba(236, 72, 153, 0.7)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(234, 179, 8, 0.7)'
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(168, 85, 247)',
          'rgb(236, 72, 153)',
          'rgb(34, 197, 94)',
          'rgb(234, 179, 8)'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const storedToken = localStorage.getItem('cms_token');
  const storedUser = JSON.parse(localStorage.getItem('cms_user') || 'null');
  
  if (!storedToken || !storedUser) {
    location.href = 'index.html';
    return;
  }
  
  token = storedToken;
  user = storedUser;
  
  // This should now work since we added the userName element to the HTML
  document.getElementById('userName').textContent = user.username;
  
  // Initialize charts
  initCharts();
  
  // Initial load
  await refreshAll();
  
  // Listen for container status changes (e.g., when maintenance is completed)
  window.addEventListener('containerStatusChanged', () => {
    refreshAll();
  });
});

// Handle logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('cms_token');
    localStorage.removeItem('cms_user');
    location.href = 'index.html';
  });
}

async function refreshAll() {
  const stats = await API.stats(token);
  document.getElementById('stat-total').textContent = stats.total;
  document.getElementById('stat-available').textContent = stats.available;
  document.getElementById('stat-inTransit').textContent = stats.inTransit;
  document.getElementById('stat-booked').textContent = stats.booked;
  document.getElementById('stat-underMaintenance').textContent = 0; // underMaintenance count removed

  // Fetch all containers (including those under maintenance)
  const allContainers = await API.containers(token, { q: searchInput.value, status: statusFilter.value });
  // Removed filter that excluded under maintenance containers
  const list = allContainers;
  renderContainers(list);
  
  // Update charts
  updateCharts(stats, list);
  
  // Update notifications
  await updateNotifications();
}

function renderContainers(list) {
  containersTableBody.innerHTML = '';
  list.forEach((c, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-4 py-3 text-sm text-gray-700">${idx + 1}</td>
      <td class="px-4 py-3">
        <div class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
          <span class="text-gray-500 text-xs">${c.type ? c.type.charAt(0) : 'C'}</span>
        </div>
      </td>
      <td class="px-4 py-3"><a href="container.html?id=${c.id}" class="text-blue-600 hover:text-blue-800 font-medium">${c.number}</a></td>
      <td class="px-4 py-3 text-sm text-gray-700">${c.type || '-'}</td>
      <td class="px-4 py-3 text-sm text-gray-700">${c.size || '-'}</td>
      <td class="px-4 py-3"><span class="badge status-${c.status}">${c.status}</span></td>
      <td class="px-4 py-3 text-sm text-gray-700">${c.location || '-'}</td>
      <td class="px-4 py-3 text-sm text-gray-700">${c.owner || '-'}</td>
      <td class="px-4 py-3">
        <div class="flex gap-1">
          <button data-id="${c.id}" class="generateBL px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white text-xs rounded transition" title="Bill of Lading">📄 B/L</button>
          <button data-id="${c.id}" class="generateGP px-2 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-xs rounded transition" title="Gate Pass">🎫 GP</button>
        </div>
      </td>
      <td class="px-4 py-3">
        <button data-id="${c.id}" class="edit px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded-md mr-1 transition">Edit</button>
        <!-- UnderMaintenance option removed as per requirements -->
        <button data-id="${c.id}" class="delete px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-md transition">Delete</button>
      </td>
    `;
    containersTableBody.appendChild(tr);
  });
}

searchInput.addEventListener('input', debounce(refreshAll, 300));
statusFilter.addEventListener('change', refreshAll);
newContainerBtn.addEventListener('click', () => openContainerDialog());

containersTableBody.addEventListener('click', async (e) => {
  const btn = e.target;
  const id = btn.getAttribute('data-id');
  if (btn.classList.contains('edit')) {
    // Fetch container details from API
    try {
      const response = await fetch(`/api/containers/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch container');
      }
      
      const model = await response.json();
      
      const row = btn.closest('tr');
      openContainerDialog({
        id,
        number: row.children[2].textContent,
        type: row.children[3].textContent,
        size: row.children[4].textContent,
        status: row.children[5].textContent,
        location: row.children[6].textContent,
        owner: row.children[7].textContent,
        lat: model?.lat,
        lng: model?.lng,
        weight: model?.weight,
        rfid: model?.rfid,
        condition: model?.condition
      });
    } catch (error) {
      alert('Failed to fetch container details: ' + error.message);
    }
  } else if (btn.classList.contains('delete')) {
    if (confirm('Delete this container?')) {
      try {
        await API.deleteContainer(token, id);
        refreshAll();
      } catch (err) {
        alert(err.message);
      }
    }
  } else if (btn.classList.contains('generateBL')) {
    // Fetch container details from API
    try {
      const response = await fetch(`/api/containers/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch container');
      }
      
      const container = await response.json();
      generateBillOfLading(container);
    } catch (error) {
      alert('Failed to fetch container details: ' + error.message);
    }
  } else if (btn.classList.contains('generateGP')) {
    // Fetch container details from API
    try {
      const response = await fetch(`/api/containers/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch container');
      }
      
      const container = await response.json();
      generateGatePass(container);
    } catch (error) {
      alert('Failed to fetch container details: ' + error.message);
    }
  } else if (btn.classList.contains('mark-ready')) {
    // Handle marking container as ready
    if (confirm('Mark this container as ready (Available)?')) {
      try {
        // Update only the container status to Available
        await API.updateContainer(token, id, { status: 'Available' });
        refreshAll(); // Refresh the container list
      } catch (err) {
        alert('Failed to update container status: ' + err.message);
      }
    }
  }
});

function openContainerDialog(c = null) {
  if (c) {
    dialogTitle.textContent = 'Edit Container';
    containerId.value = c.id;
    cNumber.value = c.number || '';
    cType.value = c.type || '';
    cSize.value = c.size || '';
    cStatus.value = c.status || 'Available';
    cLocation.value = c.location || '';
    cOwner.value = c.owner || '';
    cWeight.value = c.weight || '';
    cRfid.value = c.rfid || '';
    cCondition.value = c.condition || 'Good';
    cLat.value = c.lat ?? '';
    cLng.value = c.lng ?? '';
  } else {
    dialogTitle.textContent = 'New Container';
    containerId.value = '';
    cNumber.value = '';
    cType.value = '';
    cSize.value = '';
    cStatus.value = 'Available';
    cLocation.value = '';
    cOwner.value = '';
    cWeight.value = '';
    cRfid.value = '';
    cCondition.value = 'Good';
    cLat.value = '';
    cLng.value = '';
  }
  containerDialog.showModal();
}

containerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    number: cNumber.value.trim(),
    type: cType.value.trim(),
    size: cSize.value.trim(),
    status: cStatus.value,
    location: cLocation.value.trim(),
    owner: cOwner.value.trim(),
    weight: cWeight.value ? Number(cWeight.value) : null,
    rfid: cRfid.value.trim(),
    condition: cCondition.value,
    lat: cLat.value ? Number(cLat.value) : null,
    lng: cLng.value ? Number(cLng.value) : null
  };
  try {
    if (containerId.value) {
      await API.updateContainer(token, containerId.value, payload);
    } else {
      await API.createContainer(token, payload);
    }
    containerDialog.close();
    refreshAll();
  } catch (err) {
    alert(err.message);
  }
});

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// Initialize Charts
let statusChart, typeChart;

function updateCharts(stats, containers) {
  // Update status chart
  statusChart.data.datasets[0].data = [
    stats.available,
    stats.inTransit,
    stats.booked,
    0 // underMaintenance count removed
  ];
  statusChart.update();

  // Update type chart
  const typeCounts = {};
  containers.forEach(c => {
    if (c.type) {
      typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
    }
  });
  
  typeChart.data.labels = Object.keys(typeCounts);
  typeChart.data.datasets[0].data = Object.values(typeCounts);
  typeChart.update();
}

// ========== PDF DOCUMENT GENERATION ==========
function generateBillOfLading(container) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text('BILL OF LADING', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text('Cargo Management System', 105, 30, { align: 'center' });
  
  // Document Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`B/L No: BL-${container.id}-${Date.now()}`, 15, 50);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 57);
  
  // Container Details Section
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Container Details', 15, 75);
  doc.setDrawColor(59, 130, 246);
  doc.line(15, 77, 195, 77);
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  let y = 87;
  doc.text(`Container Number: ${container.number}`, 20, y);
  y += 7;
  doc.text(`Type: ${container.type || 'N/A'}`, 20, y);
  y += 7;
  doc.text(`Size: ${container.size || 'N/A'}`, 20, y);
  y += 7;
  doc.text(`Weight: ${container.weight ? container.weight + ' kg' : 'N/A'}`, 20, y);
  y += 7;
  doc.text(`RFID/Barcode: ${container.rfid || 'N/A'}`, 20, y);
  y += 7;
  doc.text(`Condition: ${container.condition || 'N/A'}`, 20, y);
  y += 7;
  doc.text(`Status: ${container.status}`, 20, y);
  
  // Shipper Details
  y += 15;
  doc.setFont(undefined, 'bold');
  doc.text('Shipper/Owner Details', 15, y);
  doc.line(15, y + 2, 195, y + 2);
  y += 10;
  doc.setFont(undefined, 'normal');
  doc.text(`Owner: ${container.owner || 'N/A'}`, 20, y);
  y += 7;
  doc.text(`Location: ${container.location || 'N/A'}`, 20, y);
  y += 7;
  if (container.lat && container.lng) {
    doc.text(`GPS Coordinates: ${container.lat}, ${container.lng}`, 20, y);
    y += 7;
  }
  
  // Terms & Conditions
  y += 10;
  doc.setFont(undefined, 'bold');
  doc.text('Terms & Conditions', 15, y);
  doc.line(15, y + 2, 195, y + 2);
  y += 10;
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('1. This Bill of Lading is subject to the terms and conditions of carriage.', 20, y);
  y += 5;
  doc.text('2. The carrier shall not be liable for any loss or damage unless declared.', 20, y);
  y += 5;
  doc.text('3. All freight charges must be paid before container release.', 20, y);
  
  // Footer
  doc.setFillColor(240, 240, 240);
  doc.rect(0, 270, 210, 27, 'F');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('This is a computer-generated document. No signature required.', 105, 280, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });
  
  // Save PDF
  doc.save(`Bill_of_Lading_${container.number}.pdf`);
  alert('Bill of Lading generated successfully!');
}

function generateGatePass(container) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, 210, 45, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont(undefined, 'bold');
  doc.text('GATE PASS', 105, 22, { align: 'center' });
  doc.setFontSize(11);
  doc.text('Container Entry/Exit Authorization', 105, 32, { align: 'center' });
  
  // Pass Number & Date
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(`Pass No: GP-${container.id}-${Date.now()}`, 15, 60);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 68);
  doc.text(`Time: ${new Date().toLocaleTimeString()}`, 15, 76);
  
  // Container Information
  let y = 95;
  doc.setFillColor(245, 245, 245);
  doc.rect(15, y - 8, 180, 10, 'F');
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('CONTAINER INFORMATION', 20, y);
  
  y += 15;
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Container Number:`, 20, y);
  doc.setFont(undefined, 'bold');
  doc.text(`${container.number}`, 80, y);
  
  y += 10;
  doc.setFont(undefined, 'normal');
  doc.text(`Container Type:`, 20, y);
  doc.text(`${container.type || 'N/A'}`, 80, y);
  
  y += 10;
  doc.text(`Size:`, 20, y);
  doc.text(`${container.size || 'N/A'}`, 80, y);
  
  y += 10;
  doc.text(`Status:`, 20, y);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(99, 102, 241);
  doc.text(`${container.status}`, 80, y);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'normal');
  
  y += 10;
  doc.text(`RFID/Barcode:`, 20, y);
  doc.text(`${container.rfid || 'N/A'}`, 80, y);
  
  y += 10;
  doc.text(`Weight:`, 20, y);
  doc.text(`${container.weight ? container.weight + ' kg' : 'N/A'}`, 80, y);
  
  y += 10;
  doc.text(`Condition:`, 20, y);
  doc.text(`${container.condition || 'N/A'}`, 80, y);
  
  // Location Details
  y += 20;
  doc.setFillColor(245, 245, 245);
  doc.rect(15, y - 8, 180, 10, 'F');
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('LOCATION DETAILS', 20, y);
  
  y += 15;
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Current Location:`, 20, y);
  doc.text(`${container.location || 'N/A'}`, 80, y);
  
  y += 10;
  doc.text(`Owner/Company:`, 20, y);
  doc.text(`${container.owner || 'N/A'}`, 80, y);
  
  if (container.lat && container.lng) {
    y += 10;
    doc.text(`GPS Coordinates:`, 20, y);
    doc.text(`${container.lat}, ${container.lng}`, 80, y);
  }
  
  // Authorization
  y += 25;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, 90, y);
  doc.line(120, y, 190, y);
  y += 5;
  doc.setFontSize(9);
  doc.text('Authorized Signature', 40, y);
  doc.text('Security Stamp', 145, y);
  
  // Footer
  doc.setFillColor(240, 240, 240);
  doc.rect(0, 270, 210, 27, 'F');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('IMPORTANT: This gate pass must be presented at entry/exit points.', 105, 278, { align: 'center' });
  doc.text('Valid for 24 hours from time of issue.', 105, 283, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleString()} | Cargo Management System`, 105, 288, { align: 'center' });
  
  // Save PDF
  doc.save(`Gate_Pass_${container.number}.pdf`);
  alert('Gate Pass generated successfully!');
}

// ========== EXCEL/CSV EXPORT ==========
exportExcelBtn.addEventListener('click', async () => {
  try {
    const list = await API.containers(token, {});
    
    if (list.length === 0) {
      alert('No containers to export!');
      return;
    }
    
    // Create CSV content
    const headers = ['ID', 'Container Number', 'Type', 'Size', 'Status', 'Location', 'Owner', 'Weight (kg)', 'RFID', 'Condition', 'Latitude', 'Longitude', 'Created Date'];
    const rows = list.map(c => [
      c.id,
      c.number,
      c.type || '',
      c.size || '',
      c.status,
      c.location || '',
      c.owner || '',
      c.weight || '',
      c.rfid || '',
      c.condition || '',
      c.lat || '',
      c.lng || '',
      new Date(c.created_at).toLocaleString()
    ]);
    
    // Build CSV string
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Containers_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`Successfully exported ${list.length} containers to CSV!`);
  } catch (err) {
    alert('Export failed: ' + err.message);
  }
});
