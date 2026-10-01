const editor = document.querySelector('#editor');
const status = document.querySelector('#status');
let customers = [];
let sortDirection = 1;

function message(text, state = 'neutral') { status.textContent = text; status.dataset.state = state; }
function escapeHTML(value) { return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
function render() {
  const query = document.querySelector('#search').value.trim().toLowerCase();
  const sortBy = document.querySelector('#sort-by').value;
  const rows = customers
    .filter((customer) => [customer.id_pelanggan, customer.no_hp, customer.no_ktp].some((value) => String(value || '').toLowerCase().includes(query)))
    .sort((first, second) => {
      const comparison = sortBy === 'id_pelanggan'
        ? Number(first[sortBy]) - Number(second[sortBy])
        : String(first[sortBy] || '').localeCompare(String(second[sortBy] || ''), 'id', { numeric: true });
      return comparison * sortDirection;
    });
  document.querySelector('#rows').innerHTML = rows.length ? rows.map((customer) => `<tr><td>${escapeHTML(customer.id_pelanggan)}</td><td>${escapeHTML(customer.no_hp)}</td><td>${escapeHTML(customer.no_ktp)}</td><td><div class="table-actions"><button data-action="edit" data-id="${customer.id_pelanggan}">Edit</button><button data-action="delete" data-id="${customer.id_pelanggan}">Hapus</button></div></td></tr>`).join('') : '<tr class="empty-row"><td colspan="4">Tidak ada pelanggan.</td></tr>';
}
async function load() {
  try {
    const response = await fetch('/api/pelanggan'); const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Gagal memuat pelanggan');
    customers = result.data; render(); message(`${customers.length} pelanggan`, 'ok');
  } catch (error) { message(error.message, 'error'); }
}
function reset() { document.querySelector('#form').reset(); document.querySelector('#id').value = ''; document.querySelector('#dialog-title').textContent = 'Tambah pelanggan'; document.querySelector('#save').textContent = 'Simpan'; }
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
document.querySelector('#cancel').addEventListener('click', () => { editor.close(); reset(); });
document.querySelector('#close').addEventListener('click', () => { editor.close(); reset(); });
document.querySelector('#form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = document.querySelector('#id').value;
  const payload = { no_hp: document.querySelector('#no-hp').value.trim(), no_ktp: document.querySelector('#no-ktp').value.trim() };
  try {
    const response = await fetch(id ? `/api/pelanggan/${id}` : '/api/pelanggan', { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json(); if (!response.ok || !result.success) throw new Error(result.message || 'Gagal menyimpan pelanggan');
    editor.close(); reset(); await load();
  } catch (error) { message(error.message, 'error'); }
});
document.querySelector('#rows').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]'); if (!button) return;
  const customer = customers.find((item) => Number(item.id_pelanggan) === Number(button.dataset.id)); if (!customer) return;
  if (button.dataset.action === 'edit') {
    document.querySelector('#id').value = customer.id_pelanggan; document.querySelector('#no-hp').value = customer.no_hp; document.querySelector('#no-ktp').value = customer.no_ktp;
    document.querySelector('#dialog-title').textContent = 'Edit pelanggan'; document.querySelector('#save').textContent = 'Perbarui'; editor.showModal(); return;
  }
  if (window.confirm(`Hapus pelanggan dengan ID ${customer.id_pelanggan}?`)) {
    const response = await fetch(`/api/pelanggan/${customer.id_pelanggan}`, { method: 'DELETE' }); const result = await response.json();
    if (!response.ok || !result.success) return message(result.message || 'Gagal menghapus pelanggan', 'error');
    await load();
  }
});
load();
