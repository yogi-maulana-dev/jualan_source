-- ============================================
-- Database: jualan (AplikasiJadi.com)
-- Jalankan sekali di WAMP phpMyAdmin atau CLI
-- ============================================

DROP DATABASE IF EXISTS jualan;
CREATE DATABASE jualan
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE jualan;

-- ============================================
-- Tabel: users (admin & customer)
-- ============================================
CREATE TABLE users (
  id           INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(150)    NOT NULL,
  email        VARCHAR(150)    NOT NULL UNIQUE,
  password     VARCHAR(255)    NOT NULL,
  role         VARCHAR(50)     NOT NULL DEFAULT 'customer',
  totp_secret  VARCHAR(64)     NULL,
  totp_enabled TINYINT(1)      NOT NULL DEFAULT 0,
  backup_codes TEXT            NULL,
  created_at   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

-- ============================================
-- Tabel: products
-- ============================================
CREATE TABLE products (
  id          INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255)  NOT NULL,
  slug        VARCHAR(191)  NULL UNIQUE,
  description TEXT,
  images      TEXT          NULL,
  price       INT           NOT NULL DEFAULT 0,
  tech_stack  VARCHAR(255),
  badge       VARCHAR(100),
  emoji       VARCHAR(10)   DEFAULT '📦',
  status      VARCHAR(50)   NOT NULL DEFAULT 'active',
  youtube_url VARCHAR(500)  NULL,
  sales_count INT           NOT NULL DEFAULT 0,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

-- ============================================
-- Tabel: orders
-- ============================================
CREATE TABLE orders (
  id          INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED,
  product_id  INT UNSIGNED,
  amount      INT           NOT NULL,
  status      VARCHAR(50)   NOT NULL DEFAULT 'pending',
  buyer_name  VARCHAR(150),
  buyer_email VARCHAR(150),
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE SET NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

CREATE INDEX idx_orders_status     ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- ============================================
-- Tabel: activity_logs (audit trail)
-- ============================================
CREATE TABLE activity_logs (
  id         INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED,
  user_name  VARCHAR(150),
  user_email VARCHAR(150),
  action     VARCHAR(100)  NOT NULL,
  detail     TEXT,
  ip_address VARCHAR(60),
  user_agent VARCHAR(500),
  created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_logs_action     (action),
  INDEX idx_logs_user_id    (user_id),
  INDEX idx_logs_created_at (created_at)
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

-- ============================================
-- Tabel: site_settings (konten teks yang bisa diedit admin)
-- ============================================
CREATE TABLE site_settings (
  `key`      VARCHAR(100) NOT NULL PRIMARY KEY,
  value      TEXT,
  label      VARCHAR(200),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

INSERT INTO site_settings (`key`, value, label) VALUES
  ('catalog_title',       'Katalog Produk',      'Label kecil di atas heading'),
  ('catalog_heading',     'Pilih Aplikasi Sesuai Kebutuhan', 'Judul utama section produk'),
  ('catalog_description', 'Semua produk sudah production-ready, dilengkapi dokumentasi lengkap dan source code yang bersih.', 'Deskripsi section produk');
