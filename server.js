const express = require('express');
const mysql = require('mysql2');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'rental_kendaraan'
});

db.connect((err) => {
  if (err) {
    console.log('Database belum siap:', err.message);
    return;
  }
  console.log('Database Connected!');
});

app.get('/', (_, res) => res.sendFile(__dirname + '/index.html'));

app.get('/api/kendaraan', (req, res) => {
  const q = req.query.q || '';
  const sql = 'SELECT * FROM kendaraan WHERE nama_kendaraan LIKE ? OR plat_nomor LIKE ? ORDER BY id_kendaraan DESC';

  db.query(sql, [`%${q}%`, `%${q}%`], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, data: rows });
  });
});

app.get('/api/pelanggan', (req, res) => {
  db.query('SELECT * FROM pelanggan ORDER BY id_pelanggan DESC', (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data: rows });
  });
});

app.post('/api/pelanggan', (req, res) => {
  const { no_hp, no_ktp } = req.body;
  if (!no_hp || !no_ktp) return res.status(400).json({ success: false, message: 'Nomor HP dan nomor KTP wajib diisi' });

  db.query('INSERT INTO pelanggan (no_hp, no_ktp) VALUES (?, ?)',
    [no_hp.trim(), no_ktp.trim()], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, id: result.insertId });
    });
});

app.put('/api/pelanggan/:id', (req, res) => {
  const { no_hp, no_ktp } = req.body;
  if (!no_hp || !no_ktp) return res.status(400).json({ success: false, message: 'Nomor HP dan nomor KTP wajib diisi' });

  db.query('UPDATE pelanggan SET no_hp = ?, no_ktp = ? WHERE id_pelanggan = ?',
    [no_hp.trim(), no_ktp.trim(), req.params.id], (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true });
    });
});

app.delete('/api/pelanggan/:id', (req, res) => {
  db.query('DELETE FROM pelanggan WHERE id_pelanggan = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true });
  });
});

app.get('/api/transaksi', (req, res) => {
  db.query('SELECT id_transaksi, id_kendaraan, id_pelanggan, tanggal_sewa, tanggal_kembali, lama_sewa, total_bayar, status_transaksi FROM transaksi ORDER BY id_transaksi DESC', (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data: rows });
  });
});

app.post('/api/transaksi', (req, res) => {
  const { id_pelanggan, id_kendaraan, tanggal_sewa, tanggal_kembali, total_bayar, status_transaksi } = req.body;
  if (!id_pelanggan || !id_kendaraan || !tanggal_sewa || !tanggal_kembali || !Number.isFinite(Number(total_bayar))) {
    return res.status(400).json({ success: false, message: 'Data transaksi belum lengkap' });
  }
  if (tanggal_kembali < tanggal_sewa) return res.status(400).json({ success: false, message: 'Tanggal kembali harus setelah tanggal sewa' });
  const lama_sewa = Math.ceil((Date.parse(`${tanggal_kembali}T00:00:00Z`) - Date.parse(`${tanggal_sewa}T00:00:00Z`)) / 86400000);

  db.query('INSERT INTO transaksi (id_kendaraan, id_pelanggan, tanggal_sewa, tanggal_kembali, lama_sewa, total_bayar, status_transaksi) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id_kendaraan, id_pelanggan, tanggal_sewa, tanggal_kembali, lama_sewa, total_bayar, status_transaksi || 'Berlangsung'], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, id: result.insertId });
    });
});

app.put('/api/transaksi/:id', (req, res) => {
  const { id_pelanggan, id_kendaraan, tanggal_sewa, tanggal_kembali, total_bayar, status_transaksi } = req.body;
  if (!id_pelanggan || !id_kendaraan || !tanggal_sewa || !tanggal_kembali || !Number.isFinite(Number(total_bayar))) {
    return res.status(400).json({ success: false, message: 'Data transaksi belum lengkap' });
  }
  if (tanggal_kembali < tanggal_sewa) return res.status(400).json({ success: false, message: 'Tanggal kembali harus setelah tanggal sewa' });
  const lama_sewa = Math.ceil((Date.parse(`${tanggal_kembali}T00:00:00Z`) - Date.parse(`${tanggal_sewa}T00:00:00Z`)) / 86400000);

  db.query('UPDATE transaksi SET id_kendaraan = ?, id_pelanggan = ?, tanggal_sewa = ?, tanggal_kembali = ?, lama_sewa = ?, total_bayar = ?, status_transaksi = ? WHERE id_transaksi = ?',
    [id_kendaraan, id_pelanggan, tanggal_sewa, tanggal_kembali, lama_sewa, total_bayar, status_transaksi || 'Berlangsung', req.params.id], (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true });
    });
});

app.delete('/api/transaksi/:id', (req, res) => {
  db.query('DELETE FROM transaksi WHERE id_transaksi = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true });
  });
});

app.post('/api/kendaraan', (req, res) => {
  const { nama_kendaraan, jenis, plat_nomor, harga_sewa_per_hari, status } = req.body;
  if (!nama_kendaraan || !jenis || !plat_nomor || !harga_sewa_per_hari) {
    return res.status(400).json({ success: false, message: 'Data kendaraan tidak lengkap' });
  }

  db.query(
    'INSERT INTO kendaraan (nama_kendaraan, jenis, plat_nomor, harga_sewa_per_hari, status) VALUES (?, ?, ?, ?, ?)',
    [nama_kendaraan, jenis, plat_nomor, harga_sewa_per_hari, status || 'Tersedia'],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, id: result.insertId });
    }
  );
});

app.put('/api/kendaraan/:id', (req, res) => {
  const { nama_kendaraan, jenis, plat_nomor, harga_sewa_per_hari, status } = req.body;
  if (!nama_kendaraan || !jenis || !plat_nomor || !harga_sewa_per_hari) {
    return res.status(400).json({ success: false, message: 'Data kendaraan tidak lengkap' });
  }

  db.query(
    'UPDATE kendaraan SET nama_kendaraan = ?, jenis = ?, plat_nomor = ?, harga_sewa_per_hari = ?, status = ? WHERE id_kendaraan = ?',
    [nama_kendaraan, jenis, plat_nomor, harga_sewa_per_hari, status || 'Tersedia', req.params.id],
    (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true });
    }
  );
});

app.delete('/api/kendaraan/:id', (req, res) => {
  db.query('DELETE FROM kendaraan WHERE id_kendaraan = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Gagal menghapus kendaraan' });
    res.json({ success: true });
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server berjalan di http://localhost:${port}`));