USE rental_kendaraan;

INSERT IGNORE INTO kendaraan
  (id_kendaraan, nama_kendaraan, jenis, plat_nomor, harga_sewa_per_hari, status)
VALUES
  (1, 'Toyota Avanza', 'Mobil', 'B 1234 ABC', 300000, 'Tersedia'),
  (2, 'Honda Brio', 'Mobil', 'B 2345 ABD', 275000, 'Disewa'),
  (3, 'Daihatsu Xenia', 'Mobil', 'B 3456 ABE', 290000, 'Tersedia'),
  (4, 'Toyota Innova', 'Mobil', 'B 4567 ABF', 450000, 'Tersedia'),
  (5, 'Suzuki Ertiga', 'Mobil', 'B 5678 ABG', 320000, 'Tersedia'),
  (6, 'Honda Vario 125', 'Motor', 'B 1122 XYZ', 75000, 'Tersedia'),
  (7, 'Yamaha NMAX', 'Motor', 'B 2233 XYZ', 90000, 'Tersedia');

INSERT IGNORE INTO pelanggan
  (id_pelanggan, nama_pelanggan, no_hp, alamat, no_ktp)
VALUES
  (1, 'Pelanggan Uji 1', '080000000001', 'Alamat Uji 1', '0000000000000001'),
  (2, 'Pelanggan Uji 2', '080000000002', 'Alamat Uji 2', '0000000000000002'),
  (3, 'Pelanggan Uji 3', '080000000003', 'Alamat Uji 3', '0000000000000003'),
  (4, 'Pelanggan Uji 4', '080000000004', 'Alamat Uji 4', '0000000000000004'),
  (5, 'Pelanggan Uji 5', '080000000005', 'Alamat Uji 5', '0000000000000005');

INSERT IGNORE INTO transaksi
  (id_transaksi, id_kendaraan, id_pelanggan, tanggal_sewa, tanggal_kembali, lama_sewa, total_bayar, status_transaksi)
VALUES
  (1, 6, 1, '2026-09-10', '2026-09-13', 3, 225000, 'Selesai'),
  (2, 7, 2, '2026-09-15', '2026-09-17', 2, 180000, 'Selesai'),
  (3, 1, 3, '2026-09-20', '2026-09-23', 3, 900000, 'Selesai'),
  (4, 2, 4, '2026-09-24', '2026-09-27', 3, 825000, 'Berlangsung');
