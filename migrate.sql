-- ============================================================
-- migrate.sql — jalankan ini di phpMyAdmin / MySQL CLI
-- Aman dijalankan berkali-kali (semua pakai IF NOT EXISTS)
-- ============================================================

USE jualan;

-- 1. Tambah kolom images ke tabel products (jika belum ada)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS images TEXT NULL AFTER description;

-- 2. Tambah kolom youtube_url ke tabel products (jika belum ada)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(500) NULL AFTER status;

-- 3. Tambah kolom slug ke tabel products (jika belum ada)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS slug VARCHAR(191) NULL AFTER name;

-- Buat unique index untuk slug (aman jika sudah ada)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- 4. Tambah backup_codes ke tabel users (jika belum ada)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS backup_codes TEXT NULL AFTER totp_enabled;

-- 5. Buat tabel site_settings (jika belum ada)
CREATE TABLE IF NOT EXISTS site_settings (
  `key`      VARCHAR(100) NOT NULL PRIMARY KEY,
  value      TEXT,
  label      VARCHAR(200),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

-- 6. Isi default settings (tidak menimpa yang sudah ada)
INSERT IGNORE INTO site_settings (`key`, value, label) VALUES
  ('catalog_title',       'Katalog Produk',
   'Label kecil di atas heading'),
  ('catalog_heading',     'Pilih Aplikasi Sesuai Kebutuhan',
   'Judul utama section produk'),
  ('catalog_description', 'Semua produk sudah production-ready, dilengkapi dokumentasi lengkap dan source code yang bersih.',
   'Deskripsi section produk');

-- Verifikasi hasil
SELECT 'site_settings' AS tabel, COUNT(*) AS total_rows FROM site_settings
UNION ALL
SELECT 'products (images col exists)' AS tabel,
       COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = 'jualan' AND TABLE_NAME = 'products' AND COLUMN_NAME = 'images';
