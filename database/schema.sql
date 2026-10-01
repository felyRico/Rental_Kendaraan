CREATE DATABASE IF NOT EXISTS rental_kendaraan;
USE rental_kendaraan;

CREATE TABLE IF NOT EXISTS kendaraan (
  id_kendaraan INT NOT NULL AUTO_INCREMENT,
  nama_kendaraan VARCHAR(100) NOT NULL,
  jenis ENUM('Mobil', 'Motor') NOT NULL,
  plat_nomor VARCHAR(20) NOT NULL,
  harga_sewa_per_hari DECIMAL(12, 2) NOT NULL,
  status ENUM('Tersedia', 'Disewa', 'Maintenance') NOT NULL DEFAULT 'Tersedia',
  PRIMARY KEY (id_kendaraan),
  UNIQUE KEY uq_kendaraan_plat (plat_nomor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pelanggan (
  id_pelanggan INT NOT NULL AUTO_INCREMENT,
  nama_pelanggan VARCHAR(100) NOT NULL,
  no_hp VARCHAR(15) NOT NULL,
  alamat VARCHAR(255) NOT NULL,
  no_ktp VARCHAR(16) NOT NULL,
  PRIMARY KEY (id_pelanggan),
  UNIQUE KEY uq_pelanggan_ktp (no_ktp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS transaksi (
  id_transaksi INT NOT NULL AUTO_INCREMENT,
  id_kendaraan INT NOT NULL,
  id_pelanggan INT NOT NULL,
  tanggal_sewa DATE NOT NULL,
  tanggal_kembali DATE NOT NULL,
  lama_sewa INT NOT NULL,
  total_bayar DECIMAL(12, 2) NOT NULL,
  status_transaksi ENUM('Selesai', 'Berlangsung', 'Dibatalkan') NOT NULL DEFAULT 'Berlangsung',
  PRIMARY KEY (id_transaksi),
  KEY idx_transaksi_kendaraan (id_kendaraan),
  KEY idx_transaksi_pelanggan (id_pelanggan),
  CONSTRAINT fk_transaksi_kendaraan
    FOREIGN KEY (id_kendaraan) REFERENCES kendaraan (id_kendaraan)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_transaksi_pelanggan
    FOREIGN KEY (id_pelanggan) REFERENCES pelanggan (id_pelanggan)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_transaksi_tanggal CHECK (tanggal_kembali >= tanggal_sewa),
  CONSTRAINT chk_transaksi_lama CHECK (lama_sewa >= 0),
  CONSTRAINT chk_transaksi_bayar CHECK (total_bayar >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
