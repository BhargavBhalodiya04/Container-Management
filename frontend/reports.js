// Reports & Analytics Page Logic
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
const logoutBtn = document.getElementById('logoutBtn');
const applyFiltersBtn = document.getElementById('applyFiltersBtn');
const exportContainersBtn = document.getElementById('exportContainersBtn');
const exportShipmentsBtn = document.getElementById('exportShipmentsBtn');
const exportMaintenanceBtn = document.getElementById('exportMaintenanceBtn');

// Chart instances
let statusDistributionChart, typeAnalysisChart, shipmentTrendsChart, utilizationChart;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Set default date range (last 30 days)
  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setDate(today.getDate() - 30);
  
  document.getElementById('startDate').valueAsDate = lastMonth;
  document.getElementById('endDate').valueAsDate = today;
  
  await refreshAll();
  initializeCharts();
});

// Refresh all data
async function refreshAll() {
  try {
    // Update key metrics
    const containers = await API.containers(token);
    const bookings = await API.getBookings(token);
    const requests = await API.getRequests(token);
    const maintenances = await API.maintenances(token);
    
    document.getElementById('totalContainers').textContent = containers.length;
    document.getElementById('activeShipments').textContent = bookings.filter(b => b.status === 'Confirmed').length;
    document.getElementById('pendingRequests').textContent = requests.filter(r => r.status === 'Pending').length;
    document.getElementById('maintenanceDue').textContent = maintenances.filter(m => m.status !== 'Completed').length;
    
    // Update recent activity
    updateRecentActivity(containers, bookings, requests, maintenances);
    
    // Update charts
    updateCharts(containers, bookings);
  } catch (error) {
    console.error('Error refreshing data:', error);
  }
}

// Update recent activity
function updateRecentActivity(containers, bookings, requests, maintenances) {
  // Combine all activities with timestamps
  const activities = [
    ...containers.map(c => ({ type: 'container', action: 'created', timestamp: c.created_at, details: c.number })),
    ...bookings.map(b => ({ type: 'booking', action: b.status, timestamp: b.created_at, details: b.customer_name })),
    ...requests.map(r => ({ type: 'request', action: r.status, timestamp: r.created_at, details: r.container_type })),
    ...maintenances.map(m => ({ type: 'maintenance', action: m.status, timestamp: m.startDate, details: m.containerId }))
  ];
  
  // Sort by timestamp (newest first)
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Take only the 5 most recent
  const recentActivities = activities.slice(0, 5);
  
  const activityContainer = document.getElementById('recentActivity');
  activityContainer.innerHTML = recentActivities.map(activity => {
    let icon, color, actionText;
    
    switch (activity.type) {
      case 'container':
        icon = '📦';
        color = 'bg-blue-100 text-blue-800';
        actionText = 'Container added';
        break;
      case 'booking':
        icon = '📅';
        color = activity.action === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
        actionText = `Booking ${activity.action}`;
        break;
      case 'request':
        icon = '📋';
        color = activity.action === 'Approved' ? 'bg-green-100 text-green-800' : 
                activity.action === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800';
        actionText = `Request ${activity.action}`;
        break;
      case 'maintenance':
        icon = '🔧';
        color = activity.action === 'Completed' ? 'bg-green-100 text-green-800' : 
                activity.action === 'InProgress' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
        actionText = `Maintenance ${activity.action}`;
        break;
    }
    
    return `
      <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
        <span class="text-lg">${icon}</span>
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <span class="font-medium text-gray-900">${actionText}</span>
            <span class="text-xs text-gray-500">${formatTimeAgo(activity.timestamp)}</span>
          </div>
          <p class="text-sm text-gray-600 mt-1">${activity.details}</p>
        </div>
      </div>
    `;
  }).join('');
}

// Format time ago
function formatTimeAgo(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Initialize charts
function initializeCharts() {
  const statusCtx = document.getElementById('statusDistributionChart').getContext('2d');
  const typeCtx = document.getElementById('typeAnalysisChart').getContext('2d');
  const trendsCtx = document.getElementById('shipmentTrendsChart').getContext('2d');
  const utilizationCtx = document.getElementById('utilizationChart').getContext('2d');
  
  statusDistributionChart = new Chart(statusCtx, {
    type: 'doughnut',
    data: {
      labels: ['Available', 'In Transit', 'Booked', 'Maintenance'],
      datasets: [{
        data: [0, 0, 0, 0],
        backgroundColor: ['#10B981', '#F59E0B', '#8B5CF6', '#EF4444']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
  
  typeAnalysisChart = new Chart(typeCtx, {
    type: 'bar',
    data: {
      labels: ['Dry', 'Reefer', 'OpenTop', 'FlatRack', 'Tank'],
      datasets: [{
        label: 'Container Count',
        data: [0, 0, 0, 0, 0],
        backgroundColor: '#8B5CF6'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
  
  shipmentTrendsChart = new Chart(trendsCtx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Shipments',
        data: [0, 0, 0, 0, 0, 0],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
  
  utilizationChart = new Chart(utilizationCtx, {
    type: 'radar',
    data: {
      labels: ['Availability', 'Efficiency', 'Turnaround', 'Capacity', 'Performance'],
      datasets: [{
        label: 'Utilization Score',
        data: [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: '#3B82F6',
        pointBackgroundColor: '#3B82F6'
      }]
    },
    options: {
      responsive: true,
      scales: {
        r: {
          angleLines: {
            display: true
          },
          suggestedMin: 0,
          suggestedMax: 100
        }
      }
    }
  });
}

// Update charts with data
function updateCharts(containers, bookings) {
  // Status distribution
  const statusCounts = {
    Available: containers.filter(c => c.status === 'Available').length,
    InTransit: containers.filter(c => c.status === 'InTransit').length,
    Booked: containers.filter(c => c.status === 'Booked').length,
    UnderMaintenance: containers.filter(c => c.status === 'UnderMaintenance').length
  };
  
  statusDistributionChart.data.datasets[0].data = [
    statusCounts.Available,
    statusCounts.InTransit,
    statusCounts.Booked,
    statusCounts.UnderMaintenance
  ];
  statusDistributionChart.update();
  
  // Type analysis
  const typeCounts = {
    Dry: containers.filter(c => c.type === 'Dry').length,
    Reefer: containers.filter(c => c.type === 'Reefer').length,
    OpenTop: containers.filter(c => c.type === 'OpenTop').length,
    FlatRack: containers.filter(c => c.type === 'FlatRack').length,
    Tank: containers.filter(c => c.type === 'Tank').length
  };
  
  typeAnalysisChart.data.datasets[0].data = [
    typeCounts.Dry,
    typeCounts.Reefer,
    typeCounts.OpenTop,
    typeCounts.FlatRack,
    typeCounts.Tank
  ];
  typeAnalysisChart.update();
  
  // Shipment trends (mock data for demo)
  shipmentTrendsChart.data.datasets[0].data = [12, 19, 15, 17, 22, 18];
  shipmentTrendsChart.update();
  
  // Utilization (mock data for demo)
  utilizationChart.data.datasets[0].data = [85, 78, 92, 76, 88];
  utilizationChart.update();
}

// Event Listeners
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('cms_token');
  localStorage.removeItem('cms_user');
  location.href = 'index.html';
});

applyFiltersBtn.addEventListener('click', refreshAll);

// Export functions
exportContainersBtn.addEventListener('click', async () => {
  try {
    const containers = await API.containers(token);
    
    if (containers.length === 0) {
      alert('No containers to export!');
      return;
    }
    
    // Create CSV content
    const headers = ['ID', 'Container Number', 'Type', 'Size', 'Status', 'Location', 'Owner', 'Weight (kg)', 'RFID', 'Condition', 'Latitude', 'Longitude', 'Created Date'];
    const rows = containers.map(c => [
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
    link.setAttribute('download', `Containers_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`Successfully exported ${containers.length} containers to CSV!`);
  } catch (err) {
    alert('Export failed: ' + err.message);
  }
});

exportShipmentsBtn.addEventListener('click', async () => {
  try {
    const bookings = await API.getBookings(token);
    
    if (bookings.length === 0) {
      alert('No bookings to export!');
      return;
    }
    
    // Create CSV content
    const headers = ['ID', 'Customer Name', 'Contact', 'Email', 'Container Type', 'Container Size', 'Pickup Date', 'Drop Date', 'Pickup Location', 'Drop Location', 'Remarks', 'Status', 'Created Date'];
    const rows = bookings.map(b => [
      b.id,
      b.customer_name,
      b.contact || '',
      b.email || '',
      b.container_type || '',
      b.container_size || '',
      b.pickup_date || '',
      b.drop_date || '',
      b.pickup_location || '',
      b.drop_location || '',
      b.remarks || '',
      b.status,
      new Date(b.created_at).toLocaleString()
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
    link.setAttribute('download', `Bookings_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`Successfully exported ${bookings.length} bookings to CSV!`);
  } catch (err) {
    alert('Export failed: ' + err.message);
  }
});

exportMaintenanceBtn.addEventListener('click', async () => {
  try {
    const maintenances = await API.maintenances(token);
    
    if (maintenances.length === 0) {
      alert('No maintenance records to export!');
      return;
    }
    
    // Create CSV content
    const headers = ['ID', 'Container ID', 'Issue Description', 'Assigned To', 'Status', 'Start Date'];
    const rows = maintenances.map(m => [
      m.id,
      m.containerId || '',
      m.issueDescription || '',
      m.assignedTo || '',
      m.status,
      m.startDate ? new Date(m.startDate).toLocaleString() : ''
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
    link.setAttribute('download', `Maintenance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`Successfully exported ${maintenances.length} maintenance records to CSV!`);
  } catch (err) {
    alert('Export failed: ' + err.message);
  }
});