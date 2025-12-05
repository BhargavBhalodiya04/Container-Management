// Core store and mock API for design phase (no backend)
const Store = {
  users: [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
    { id: 2, username: 'staff', password: 'staff123', role: 'staff' }
  ],
  currentUser: null,
  containers: [],
  movements: [],
  bookings: [
    { id: 1, customer_name: 'John Doe', contact: '+91 9876543210', email: 'john@example.com', container_type: 'Dry', container_size: '20ft', pickup_date: '2024-12-05', drop_date: '2024-12-15', pickup_location: 'Mumbai Port', drop_location: 'Delhi Warehouse', remarks: 'Urgent delivery', status: 'Pending', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 2, customer_name: 'Jane Smith', contact: '+91 9123456789', email: 'jane@company.com', container_type: 'Reefer', container_size: '40ft', pickup_date: '2024-12-03', drop_date: '2024-12-10', pickup_location: 'Chennai Port', drop_location: 'Bangalore Hub', remarks: 'Temperature sensitive goods', status: 'Confirmed', created_at: new Date(Date.now() - 172800000).toISOString() }
  ],
  requests: [
    { id: 1, user: 'staff', container_type: 'Dry', container_size: '20ft', required_date: '2024-12-10', duration: 7, pickup_location: 'Mumbai Port', delivery_location: 'Delhi Warehouse', remarks: 'Need for export shipment', status: 'Pending', created_at: new Date(Date.now() - 43200000).toISOString() }
  ],
  nextRequestId: 2,
  nextMovementId: 6,
  nextBookingId: 3,
  nextId: 6
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
  },
  getMovements: async (token, containerId) => {
    const response = await fetch(`/api/movements?containerId=${containerId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch movements');
    }
    
    return await response.json();
  },
  addMovement: async (token, payload) => {
    const response = await fetch('/api/movements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add movement');
    }
    
    return await response.json();
  },
  createBooking: async (token, payload) => {
    // For now, we'll keep this as mock data since we haven't implemented bookings API
    const id = Store.nextBookingId++;
    const booking = { id, ...payload, status: 'Pending', created_at: new Date().toISOString() };
    Store.bookings.push(booking);
    return booking;
  },
  getBookings: async (token) => {
    // For now, return mock data since there's no API endpoint
    return Store.bookings.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getRequests: async (token) => {
    // For admin users, fetch all requests
    const response = await fetch('/api/admin/requests', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch requests');
    }
    
    return await response.json();
  },
  
  getUserRequests: async (token) => {
    // For regular users, fetch their own requests
    const response = await fetch('/api/user/requests', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user requests');
    }
    
    return await response.json();
  },

  createRequest: async (token, payload) => {
    const id = Store.nextRequestId++;
    const request = { id, ...payload, status: 'Pending', created_at: new Date().toISOString() };
    Store.requests.push(request);
    return request;
  },
  approveRequest: async (token, id) => {
    const request = Store.requests.find(r => r.id === id);
    if (!request) throw new Error('Request not found');
    request.status = 'Approved';
    return request;
  },
  rejectRequest: async (token, id, reason) => {
    const request = Store.requests.find(r => r.id === id);
    if (!request) throw new Error('Request not found');
    request.status = 'Rejected';
    request.rejection_reason = reason || 'Not specified';
    return request;
  },
  maintenances: async (token) => {
    const response = await fetch('/api/maintenances', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch maintenances');
    }
    
    return await response.json();
  },
  getMaintenance: async (token, id) => {
    const response = await fetch(`/api/maintenances/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch maintenance');
    }
    
    return await response.json();
  },
  createMaintenance: async (token, data) => {
    const response = await fetch('/api/maintenances', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create maintenance');
    }
    
    return await response.json();
  },
  updateMaintenance: async (token, id, data) => {
    const response = await fetch(`/api/maintenances/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update maintenance');
    }
    
    return await response.json();
  },
  deleteMaintenance: async (token, id) => {
    const response = await fetch(`/api/maintenances/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete maintenance');
    }
    
    return true;
  },
  
  // Get all users (admin only)
  getUsers: async (token) => {
    const response = await fetch('/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    return await response.json();
  }
};
