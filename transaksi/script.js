const editor = document.querySelector('#editor');
const status = document.querySelector('#status');
const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const numericFields = ['id_transaksi', 'id_kendaraan', 'id_pelanggan', 'lama_sewa', 'total_bayar'];
let transactions = [];
let customers = [];
let vehicles = [];
let sortDirection = 1;

function message(text, state = 'neutral') {
  status.textContent = text;
  status.dataset.state = state;
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function daysBetween(start, end) {
  if (!start || !end) return 0;
  return Math.max(0, (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000);
}

function render() {
  const query = document.querySelector('#search').value.trim().toLowerCase();
  const sortBy = document.querySelector('#sort-by').value;
  const rows = transactions
    .filter((item) => [item.id_transaksi, item.id_kendaraan, item.id_pelanggan, item.tanggal_sewa, item.tanggal_kembali, item.lama_sewa, item.total_bayar, item.status_transaksi]
      .some((value) => String(value ?? '').toLowerCase().includes(query)))
    .sort((first, second) => {
      const comparison = numericFields.includes(sortBy)
        ? Number(first[sortBy]) - Number(second[sortBy])
        : String(first[sortBy] || '').localeCompare(String(second[sortBy] || ''), 'id', { numeric: true });
      return comparison * sortDirection;
    });

  document.querySelector('#rows').innerHTML = rows.length ? rows.map((item) => `
    <tr>
      <td>${escapeHTML(item.id_transaksi)}</td>
      <td>${escapeHTML(item.id_kendaraan)}</td>
      <td>${escapeHTML(item.id_pelanggan)}</td>
      <td>${escapeHTML(String(item.tanggal_sewa).slice(0, 10))}</td>
      <td>${escapeHTML(String(item.tanggal_kembali).slice(0, 10))}</td>
      <td>${escapeHTML(item.lama_sewa)}</td>
      <td>${money.format(Number(item.total_bayar || 0))}</td>
      <td>${escapeHTML(item.status_transaksi)}</td>
      <td><div class="table-actions"><button data-action="edit" data-id="${item.id_transaksi}">Edit</button><button data-action="delete" data-id="${item.id_transaksi}">Hapus</button></div></td>
    </tr>`).join('') : '<tr class="empty-row"><td colspan="9">Tidak ada transaksi.</td></tr>';
}

function fillOptions(selector, items, idKey, label) {
  document.querySelector(selector).innerHTML = items.map((item) => `<option value="${item[idKey]}">${escapeHTML(label(item))}</option>`).join('');
}

async function load() {
  try {
    const [transactionResponse, customerResponse, vehicleResponse] = await Promise.all([
      fetch('/api/transaksi'), fetch('/api/pelanggan'), fetch('/api/kendaraan')
    ]);
    const [transactionResult, customerResult, vehicleResult] = await Promise.all([
      transactionResponse.json(), customerResponse.json(), vehicleResponse.json()
    ]);
    if (!transactionResponse.ok || !transactionResult.success) throw new Error(transactionResult.message || 'Gagal memuat transaksi');
    if (!customerResponse.ok || !customerResult.success) throw new Error(customerResult.message || 'Gagal memuat pelanggan');
    if (!vehicleResponse.ok || !vehicleResult.success) throw new Error(vehicleResult.message || 'Gagal memuat kendaraan');

    transactions = transactionResult.data;
    customers = customerResult.data;
    vehicles = vehicleResult.data;
    fillOptions('#pelanggan', customers, 'id_pelanggan', (item) => `${item.id_pelanggan} - HP ${item.no_hp} / KTP ${item.no_ktp}`);
    fillOptions('#kendaraan', vehicles, 'id_kendaraan', (item) => `${item.id_kendaraan} - ${item.nama_kendaraan} (${item.plat_nomor})`);
    render();
    message(`${transactions.length} transaksi`, 'ok');
  } catch (error) {
    message(error.message, 'error');
  }
}

function reset() {
  document.querySelector('#form').reset();
  document.querySelector('#id').value = '';
  document.querySelector('#lama-sewa').value = 0;
  document.querySelector('#dialog-title').textContent = 'Tambah transaksi';
  document.querySelector('#save').textContent = 'Simpan';
}

async function save(event) {
  event.preventDefault();
  const id = document.querySelector('#id').value;
  const payload = {
    id_kendaraan: Number(document.querySelector('#kendaraan').value),
    id_pelanggan: Number(document.querySelector('#pelanggan').value),
    tanggal_sewa: document.querySelector('#mulai').value,
    tanggal_kembali: document.querySelector('#kembali').value,
    lama_sewa: daysBetween(document.querySelector('#mulai').value, document.querySelector('#kembali').value),
    total_bayar: Number(document.querySelector('#biaya').value),
    status_transaksi: document.querySelector('#status-transaksi').value
  };

  try {
    const response = await fetch(id ? `/api/transaksi/${id}` : '/api/transaksi', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Gagal menyimpan transaksi');
    editor.close();
    reset();
    await load();
  } catch (error) {
    message(error.message, 'error');
  }
}

document.querySelector('#add').addEventListener('click', () => { reset(); editor.showModal(); });
document.querySelector('#refresh').addEventListener('click', load);
document.querySelector('#search').addEventListener('input', render);
document.querySelector('#sort-by').addEventListener('change', render);
document.querySelector('#sort-direction').addEventListener('click', (event) => {
  sortDirection *= -1;
  const ascending = sortDirection === 1;
  event.currentTarget.textContent = ascending ? '↑' : '↓';
  event.currentTarget.setAttribute('aria-label', ascending ? 'Urutkan naik' : 'Urutkan turun');
  event.currentTarget.title = ascending ? 'Urutkan naik' : 'Urutkan turun';
  render();
});
document.querySelector('#mulai').addEventListener('input', () => {
  document.querySelector('#lama-sewa').value = daysBetween(document.querySelector('#mulai').value, document.querySelector('#kembali').value);
});
document.querySelector('#kembali').addEventListener('input', () => {
  document.querySelector('#lama-sewa').value = daysBetween(document.querySelector('#mulai').value, document.querySelector('#kembali').value);
});
document.querySelector('#cancel').addEventListener('click', () => { editor.close(); reset(); });
document.querySelector('#close').addEventListener('click', () => { editor.close(); reset(); });
document.querySelector('#form').addEventListener('submit', save);
document.querySelector('#rows').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const item = transactions.find((transaction) => Number(transaction.id_transaksi) === Number(button.dataset.id));
  if (!item) return;

  if (button.dataset.action === 'edit') {
    document.querySelector('#id').value = item.id_transaksi;
    document.querySelector('#pelanggan').value = item.id_pelanggan;
    document.querySelector('#kendaraan').value = item.id_kendaraan;
    document.querySelector('#mulai').value = String(item.tanggal_sewa).slice(0, 10);
    document.querySelector('#kembali').value = String(item.tanggal_kembali).slice(0, 10);
    document.querySelector('#lama-sewa').value = item.lama_sewa;
    document.querySelector('#biaya').value = item.total_bayar;
    document.querySelector('#status-transaksi').value = item.status_transaksi;
    document.querySelector('#dialog-title').textContent = 'Edit transaksi';
    document.querySelector('#save').textContent = 'Perbarui';
    editor.showModal();
    return;
  }

  if (window.confirm(`Hapus transaksi ${item.id_transaksi}?`)) {
    const response = await fetch(`/api/transaksi/${item.id_transaksi}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok || !result.success) return message(result.message || 'Gagal menghapus transaksi', 'error');
    await load();
  }
});
load();
