const Store = {
  user: null,
  containers: [],
  nextId: 4
};
const API = {
  login: async (username, password) => {
    if (!username || !password) throw new Error('Missing credentials');
    
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    
    return await response.json();
  },
  containers: async (token, { q = '', status = '' } = {}) => {
    let url = '/api/containers';
    const params = [];
    
    if (q) params.push(`q=${encodeURIComponent(q)}`);
    if (status) params.push(`status=${encodeURIComponent(status)}`);
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch containers');
    }
    
    return await response.json();
  },
  createContainer: async (token, payload) => {
    if (!payload.number) throw new Error('number is required');
    
    const response = await fetch('/api/containers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create container');
    }
    
    return await response.json();
  },
  updateContainer: async (token, id, payload) => {
    const response = await fetch(`/api/containers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update container');
    }
    
    return await response.json();
  },
  deleteContainer: async (token, id) => {
    const response = await fetch(`/api/containers/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete container');
    }
    
    return true;
  },
  stats: async (token) => {
    const response = await fetch('/api/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }
    
    return await response.json();
  }
};

const loginSection = document.getElementById('login-section');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('user-info');

const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const containersTableBody = document.querySelector('#containersTable tbody');
const newContainerBtn = document.getElementById('newContainerBtn');

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
const cLat = document.getElementById('cLat');
const cLng = document.getElementById('cLng');

let token = localStorage.getItem('cms_token');
let user = JSON.parse(localStorage.getItem('cms_user') || 'null');

function setAuth(u, t) {
  user = u; token = t;
  localStorage.setItem('cms_token', t);
  localStorage.setItem('cms_user', JSON.stringify(u));
  userInfo.textContent = `Logged in: ${u.username} (${u.role})`;
  loginSection.classList.add('hidden');
  dashboard.classList.remove('hidden');
  logoutBtn.classList.remove('hidden');
  refreshAll();
}

function clearAuth() {
  token = null; user = null;
  localStorage.removeItem('cms_token');
  localStorage.removeItem('cms_user');
  userInfo.textContent = '';
  dashboard.classList.add('hidden');
  loginSection.classList.remove('hidden');
  logoutBtn.classList.add('hidden');
}

async function refreshAll() {
  const stats = await API.stats(token);
  document.getElementById('stat-total').textContent = stats.total;
  document.getElementById('stat-available').textContent = stats.available;
  document.getElementById('stat-inTransit').textContent = stats.inTransit;
  document.getElementById('stat-booked').textContent = stats.booked;
  document.getElementById('stat-underMaintenance').textContent = stats.underMaintenance;

  const list = await API.containers(token, { q: searchInput.value, status: statusFilter.value });
  renderContainers(list);
}

function renderContainers(list) {
  containersTableBody.innerHTML = '';
  list.forEach((c, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td><a href="container.html?id=${c.id}">${c.number}</a></td>
      <td>${c.type || ''}</td>
      <td>${c.size || ''}</td>
      <td><span class="badge status-${c.status}">${c.status}</span></td>
      <td>${c.location || ''} ${c.lat && c.lng ? '<a href="https://www.google.com/maps?q=' + c.lat + ',' + c.lng + '" target="_blank">Map</a>' : ''}</td>
      <td>${c.owner || ''}</td>
      <td>
        <button data-id="${c.id}" class="edit secondary">Edit</button>
        <button data-id="${c.id}" class="delete danger">Delete</button>
      </td>
    `;
    containersTableBody.appendChild(tr);
  });
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  try {
    const { token: t, user: u } = await API.login(username, password);
    setAuth(u, t);
    // Redirect based on user role
    if (u.role === 'admin') {
      location.href = 'admin.html';
    } else {
      // For staff users, redirect to user dashboard
      location.href = 'user.html';
    }
  } catch (err) {
    alert(err.message);
  }
});

logoutBtn.addEventListener('click', () => {
  clearAuth();
});

searchInput.addEventListener('input', debounce(refreshAll, 300));
statusFilter.addEventListener('change', refreshAll);
newContainerBtn.addEventListener('click', () => openContainerDialog());

containersTableBody.addEventListener('click', async (e) => {
  const btn = e.target;
  const id = btn.getAttribute('data-id');
  if (btn.classList.contains('edit')) {
    const row = btn.closest('tr');
    const model = Store.containers.find(x => String(x.id) === String(id));
    openContainerDialog({
      id,
      number: row.children[1].textContent,
      type: row.children[2].textContent,
      size: row.children[3].textContent,
      status: row.children[4].textContent,
      location: row.children[5].textContent,
      owner: row.children[6].textContent,
      lat: model?.lat,
      lng: model?.lng
    });
  } else if (btn.classList.contains('delete')) {
    if (confirm('Delete this container?')) {
      try {
        await API.deleteContainer(token, id);
        refreshAll();
      } catch (err) {
        alert(err.message);
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

document.addEventListener('DOMContentLoaded', async () => {
  if (token && user) {
    userInfo.textContent = `Logged in: ${user.username} (${user.role})`;
    loginSection.classList.add('hidden');
    dashboard.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
    refreshAll();
  }

  // Listen for container status changes (e.g., when maintenance is completed)
  window.addEventListener('containerStatusChanged', () => {
    if (token && user) {
      refreshAll();
    }
  });
});
