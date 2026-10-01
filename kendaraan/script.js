const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const statusEl = document.querySelector('#status');
const dialog = document.querySelector('#vehicle-dialog');
let vehicles = [];
let direction = 1;

function message(text, state = 'neutral') {
  statusEl.textContent = text;
  statusEl.dataset.state = state;
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function statusClass(status) {
  const normalized = String(status || '').toLowerCase();
  return ['tersedia', 'disewa', 'maintenance'].includes(normalized) ? normalized : '';
}

function drawVehicles() {
  const query = document.querySelector('#search-vehicles').value.trim().toLowerCase();
  const key = document.querySelector('#sort-by').value;
  const rows = vehicles.filter((vehicle) => [vehicle.nama_kendaraan, vehicle.jenis, vehicle.plat_nomor, vehicle.status]
    .some((value) => String(value || '').toLowerCase().includes(query)));

  rows.sort((a, b) => {
    const comparison = key === 'harga_sewa_per_hari'
      ? Number(a[key]) - Number(b[key])
      : String(a[key] || '').localeCompare(String(b[key] || ''), 'id', { numeric: true });
    return comparison * direction;
  });

  document.querySelector('#vehicles').innerHTML = rows.length ? rows.map((vehicle) => `
    <tr>
      <td>${escapeHTML(vehicle.nama_kendaraan)}</td><td>${escapeHTML(vehicle.jenis)}</td>
      <td>${escapeHTML(vehicle.plat_nomor)}</td><td>${currency.format(Number(vehicle.harga_sewa_per_hari || 0))}</td>
      <td><span class="badge ${statusClass(vehicle.status)}">${escapeHTML(vehicle.status)}</span></td>
      <td><div class="table-actions"><button type="button" data-action="edit" data-id="${vehicle.id_kendaraan}">Edit</button><button type="button" data-action="delete" data-id="${vehicle.id_kendaraan}">Hapus</button></div></td>
    </tr>`).join('') : '<tr class="empty-row"><td colspan="6">Tidak ada kendaraan.</td></tr>';
}

async function loadVehicles() {
  try {
    const response = await fetch('/api/kendaraan');
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Gagal memuat kendaraan');
    vehicles = result.data;
    drawVehicles();
    message(`${vehicles.length} kendaraan`, 'ok');
  } catch (error) {
    message(error.message, 'error');
  }
}

function resetForm() {
  document.querySelector('#vehicle-form').reset();
  document.querySelector('#vehicle-id').value = '';
  document.querySelector('#save-vehicle').textContent = 'Simpan';
  document.querySelector('#dialog-title').textContent = 'Tambah kendaraan';
}

async function saveVehicle(event) {
  event.preventDefault();
  const payload = {
    nama_kendaraan: document.querySelector('#nama-kendaraan').value.trim(),
    jenis: document.querySelector('#jenis-kendaraan').value,
    plat_nomor: document.querySelector('#plat-kendaraan').value.trim(),
    harga_sewa_per_hari: Number(document.querySelector('#harga-kendaraan').value),
    status: document.querySelector('#status-kendaraan').value
  };
  const id = document.querySelector('#vehicle-id').value;
  try {
    const response = await fetch(id ? `/api/kendaraan/${id}` : '/api/kendaraan', {
      method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Gagal menyimpan kendaraan');
    dialog.close();
    resetForm();
    await loadVehicles();
  } catch (error) {
    message(error.message, 'error');
  }
}

document.querySelector('#add-vehicle').addEventListener('click', () => { resetForm(); dialog.showModal(); });
document.querySelector('#refresh').addEventListener('click', loadVehicles);
document.querySelector('#search-vehicles').addEventListener('input', drawVehicles);
document.querySelector('#sort-by').addEventListener('change', drawVehicles);
document.querySelector('#sort-direction').addEventListener('click', (event) => {
  direction *= -1;
  const ascending = direction === 1;
  event.currentTarget.textContent = ascending ? '↑' : '↓';
  event.currentTarget.setAttribute('aria-label', ascending ? 'Urutkan naik' : 'Urutkan turun');
  drawVehicles();
});
document.querySelector('#vehicle-form').addEventListener('submit', saveVehicle);
document.querySelector('#cancel-edit').addEventListener('click', () => { dialog.close(); resetForm(); });
document.querySelector('#close-dialog').addEventListener('click', () => { dialog.close(); resetForm(); });
document.querySelector('#vehicles').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const vehicle = vehicles.find((item) => Number(item.id_kendaraan) === Number(button.dataset.id));
  if (!vehicle) return;
  if (button.dataset.action === 'edit') {
    document.querySelector('#vehicle-id').value = vehicle.id_kendaraan;
    document.querySelector('#nama-kendaraan').value = vehicle.nama_kendaraan;
    document.querySelector('#jenis-kendaraan').value = vehicle.jenis;
    document.querySelector('#plat-kendaraan').value = vehicle.plat_nomor;
    document.querySelector('#harga-kendaraan').value = vehicle.harga_sewa_per_hari;
    document.querySelector('#status-kendaraan').value = vehicle.status;
    document.querySelector('#save-vehicle').textContent = 'Perbarui';
    document.querySelector('#dialog-title').textContent = 'Edit kendaraan';
    dialog.showModal();
    return;
  }
  if (window.confirm(`Hapus ${vehicle.nama_kendaraan}?`)) {
    const response = await fetch(`/api/kendaraan/${vehicle.id_kendaraan}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok || !result.success) return message(result.message || 'Gagal menghapus kendaraan', 'error');
    await loadVehicles();
  }
});
loadVehicles();
