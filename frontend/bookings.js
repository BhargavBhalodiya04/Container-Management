// Bookings page logic
const token = localStorage.getItem('cms_token');
const user = JSON.parse(localStorage.getItem('cms_user') || 'null');

if (!token || !user) {
  location.href = 'index.html';
}

document.getElementById('userName').textContent = user.username;

const newBookingBtn = document.getElementById('newBookingBtn');
const bookingDialog = document.getElementById('bookingDialog');
const bookingForm = document.getElementById('bookingForm');
const bookingsTable = document.getElementById('bookingsTable');

const bCustomer = document.getElementById('bCustomer');
const bContact = document.getElementById('bContact');
const bEmail = document.getElementById('bEmail');
const bType = document.getElementById('bType');
const bSize = document.getElementById('bSize');
const bPickupDate = document.getElementById('bPickupDate');
const bDropDate = document.getElementById('bDropDate');
const bPickupLocation = document.getElementById('bPickupLocation');
const bDropLocation = document.getElementById('bDropLocation');
const bRemarks = document.getElementById('bRemarks');

const statTotal = document.getElementById('statTotal');
const statPending = document.getElementById('statPending');
const statConfirmed = document.getElementById('statConfirmed');
const statCancelled = document.getElementById('statCancelled');

async function loadBookings() {
  try {
    const bookings = await API.getBookings(token);
    
    // Update stats
    statTotal.textContent = bookings.length;
    statPending.textContent = bookings.filter(b => b.status === 'Pending').length;
    statConfirmed.textContent = bookings.filter(b => b.status === 'Confirmed').length;
    statCancelled.textContent = bookings.filter(b => b.status === 'Cancelled').length;

    if (bookings.length === 0) {
      bookingsTable.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">No bookings found. Create your first booking!</td></tr>';
      return;
    }

    bookingsTable.innerHTML = bookings.map(b => {
      const statusColors = {
        'Pending': 'bg-yellow-100 text-yellow-800',
        'Confirmed': 'bg-green-100 text-green-800',
        'Cancelled': 'bg-gray-100 text-gray-800'
      };

      return `
        <tr class="hover:bg-gray-50">
          <td class="px-4 py-3 font-mono text-sm text-gray-900">BK-${String(b.id).padStart(4, '0')}</td>
          <td class="px-4 py-3">
            <div class="font-medium text-gray-900">${b.customer_name}</div>
            <div class="text-xs text-gray-500">${b.contact}</div>
          </td>
          <td class="px-4 py-3 text-gray-700">${b.container_type} - ${b.container_size}</td>
          <td class="px-4 py-3 text-sm text-gray-600">${new Date(b.pickup_date).toLocaleDateString()}</td>
          <td class="px-4 py-3 text-sm text-gray-600">${new Date(b.drop_date).toLocaleDateString()}</td>
          <td class="px-4 py-3">
            <span class="px-2 py-1 text-xs font-medium rounded-full ${statusColors[b.status] || 'bg-gray-100 text-gray-800'}">${b.status}</span>
          </td>
          <td class="px-4 py-3">
            <div class="flex gap-2">
              ${b.status === 'Pending' ? `
                <button onclick="confirmBooking(${b.id})" class="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded font-medium">Confirm</button>
                <button onclick="cancelBooking(${b.id})" class="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded font-medium">Cancel</button>
              ` : ''}
              <button onclick="viewBookingDetails(${b.id})" class="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded font-medium">View</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    bookingsTable.innerHTML = `<tr><td colspan="7" class="px-4 py-8 text-center text-red-500">Error: ${err.message}</td></tr>`;
  }
}

newBookingBtn.addEventListener('click', () => {
  bCustomer.value = '';
  bContact.value = '';
  bEmail.value = '';
  bType.value = '';
  bSize.value = '';
  bPickupDate.value = '';
  bDropDate.value = '';
  bPickupLocation.value = '';
  bDropLocation.value = '';
  bRemarks.value = '';
  bookingDialog.showModal();
});

bookingForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const payload = {
    customer_name: bCustomer.value.trim(),
    contact: bContact.value.trim(),
    email: bEmail.value.trim(),
    container_type: bType.value,
    container_size: bSize.value,
    pickup_date: bPickupDate.value,
    drop_date: bDropDate.value,
    pickup_location: bPickupLocation.value.trim(),
    drop_location: bDropLocation.value.trim(),
    remarks: bRemarks.value.trim()
  };

  try {
    await API.createBooking(token, payload);
    bookingDialog.close();
    alert('Booking created successfully!');
    loadBookings();
  } catch (err) {
    alert('Error: ' + err.message);
  }
});

async function confirmBooking(id) {
  if (!confirm('Confirm this booking?')) return;
  try {
    const booking = Store.bookings.find(b => b.id === id);
    if (booking) {
      booking.status = 'Confirmed';
      alert('Booking confirmed successfully!');
      loadBookings();
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

async function cancelBooking(id) {
  if (!confirm('Cancel this booking?')) return;
  try {
    const booking = Store.bookings.find(b => b.id === id);
    if (booking) {
      booking.status = 'Cancelled';
      alert('Booking cancelled.');
      loadBookings();
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function viewBookingDetails(id) {
  const booking = Store.bookings.find(b => b.id === id);
  if (!booking) return;

  const details = `
Booking ID: BK-${String(booking.id).padStart(4, '0')}
Customer: ${booking.customer_name}
Contact: ${booking.contact}
Email: ${booking.email || 'N/A'}

Container: ${booking.container_type} - ${booking.container_size}
Pickup Date: ${new Date(booking.pickup_date).toLocaleDateString()}
Drop Date: ${new Date(booking.drop_date).toLocaleDateString()}

Pickup Location: ${booking.pickup_location}
Drop Location: ${booking.drop_location}

Special Requirements: ${booking.remarks || 'None'}

Status: ${booking.status}
Created: ${new Date(booking.created_at).toLocaleString()}
  `;

  alert(details);
}

loadBookings();
