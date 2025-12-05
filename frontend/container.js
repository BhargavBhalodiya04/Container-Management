// Container details page
(async function(){
  const params = new URLSearchParams(location.search);
  const id = Number(params.get('id'));
  const backLink = document.getElementById('backLink');
  const detail = document.getElementById('detail');

  const user = JSON.parse(localStorage.getItem('cms_user') || 'null');
  // Always redirect to admin dashboard
  const backHref = 'admin.html';
  backLink.href = backHref;

  // Fetch container details from API
  const token = localStorage.getItem('cms_token');
  let c;
  try {
    const response = await fetch(`/api/containers/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch container');
    }
    
    c = await response.json();
  } catch (error) {
    detail.innerHTML = `
      <div class="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-red-200 p-8 text-center">
        <svg class="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Container Not Found</h2>
        <p class="text-gray-600 mb-6">The container you're looking for doesn't exist or may have been deleted.</p>
        <a href="${backHref}" class="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-md">Go Back to Dashboard</a>
      </div>
    `;
    return;
  }

  const mapLink = (c.lat != null && c.lng != null)
    ? `<button id="showMapBtn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Show Map</button>`
    : '<span class="text-gray-500">No GPS Available</span>';

  // Fetch movement history
  const token2 = localStorage.getItem('cms_token');
  const movements = await API.getMovements(token2, id);

  detail.innerHTML = `
    <div class="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div class="p-6 border-b bg-gray-50">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-800">${c.number}</h2>
          <span class="badge status-${c.status}">${c.status}</span>
        </div>
        <p class="text-sm text-gray-500">Created: ${new Date(c.created_at).toLocaleString()}</p>
      </div>
      <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-2">
          <div><span class="text-gray-500 text-sm">Type</span><div class="text-gray-900">${c.type || '-'}</div></div>
          <div><span class="text-gray-500 text-sm">Size</span><div class="text-gray-900">${c.size || '-'}</div></div>
          <div><span class="text-gray-500 text-sm">Owner</span><div class="text-gray-900">${c.owner || '-'}</div></div>
          <div><span class="text-gray-500 text-sm">Weight</span><div class="text-gray-900">${c.weight ? c.weight + ' kg' : '-'}</div></div>
        </div>
        <div class="space-y-2">
          <div><span class="text-gray-500 text-sm">Location</span><div class="text-gray-900">${c.location || '-'}</div></div>
          <div><span class="text-gray-500 text-sm">RFID/Barcode</span><div class="text-gray-900">${c.rfid || '-'}</div></div>
          <div><span class="text-gray-500 text-sm">Condition</span><div class="text-gray-900">${c.condition || '-'}</div></div>
          <div><span class="text-gray-500 text-sm">GPS Coordinates</span><div class="text-gray-900">${(c.lat!=null && c.lng!=null) ? `${c.lat}, ${c.lng}` : '-'}</div></div>
          <div class="mt-3">${mapLink}</div>
        </div>
      </div>
      <div class="p-6 bg-gray-50 flex gap-3 justify-end">
        <a class="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300" href="${backHref}">Back</a>
        ${user ? `<a class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white" href="admin.html">Edit in Admin</a>` : ''}
      </div>
    </div>

    <!-- Movement History Timeline -->
    <div class="max-w-3xl mx-auto mt-6 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div class="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 border-b">
        <h3 class="text-lg font-semibold text-white flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Movement History
        </h3>
      </div>
      <div class="p-6">
        ${movements.length > 0 ? `
          <div class="relative">
            <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div class="space-y-6">
              ${movements.map((m, idx) => `
                <div class="relative flex gap-4">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm z-10">${idx + 1}</div>
                  <div class="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div class="flex items-start justify-between">
                      <div>
                        <div class="text-sm font-semibold text-gray-900">${m.from_location} → ${m.to_location}</div>
                        <div class="text-xs text-gray-500 mt-1">${new Date(m.moved_at).toLocaleString()}</div>
                      </div>
                    </div>
                    ${m.remarks ? `<div class="mt-2 text-sm text-gray-600">📝 ${m.remarks}</div>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : '<div class="text-center text-gray-500 py-8">No movement history available</div>'}
      </div>
    </div>

    ${(c.lat != null && c.lng != null) ? `
    <div id="mapContainer" class="max-w-3xl mx-auto mt-6 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hidden">
      <div class="p-4 bg-gray-50 border-b">
        <h3 class="text-lg font-semibold text-gray-800">Container Location Map</h3>
      </div>
      <div id="map" style="height: 400px; width: 100%;"></div>
    </div>
    ` : ''}
  `;

  if (c.lat != null && c.lng != null) {
    const showMapBtn = document.getElementById('showMapBtn');
    const mapContainer = document.getElementById('mapContainer');
    
    showMapBtn.addEventListener('click', () => {
      mapContainer.classList.remove('hidden');
      showMapBtn.disabled = true;
      showMapBtn.textContent = 'Map Loaded Below';
      
      const mapScript = document.createElement('script');
      mapScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      mapScript.onload = () => {
        const mapStyle = document.createElement('link');
        mapStyle.rel = 'stylesheet';
        mapStyle.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(mapStyle);

        setTimeout(() => {
          const map = L.map('map').setView([c.lat, c.lng], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          const marker = L.marker([c.lat, c.lng]).addTo(map);
          marker.bindPopup(`
            <div class="p-2">
              <h3 class="font-bold text-lg">${c.number}</h3>
              <p class="text-sm"><strong>Type:</strong> ${c.type || '-'}</p>
              <p class="text-sm"><strong>Size:</strong> ${c.size || '-'}</p>
              <p class="text-sm"><strong>Status:</strong> ${c.status}</p>
              <p class="text-sm"><strong>Location:</strong> ${c.location || '-'}</p>
              <p class="text-sm"><strong>Owner:</strong> ${c.owner || '-'}</p>
              <p class="text-xs text-gray-500 mt-1">GPS: ${c.lat}, ${c.lng}</p>
            </div>
          `).openPopup();
        }, 100);
      };
      document.head.appendChild(mapScript);
    });
  }
})();
