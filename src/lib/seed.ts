import { query, execute } from "./db";
import bcrypt from "bcryptjs";

export async function seedIfEmpty() {
  // ── Superadmin ──────────────────────────────────────────
  const admins = await query<{ id: number }>(
    "SELECT id FROM users WHERE role = 'superadmin' LIMIT 1"
  );
  if (admins.length === 0) {
    const hash = await bcrypt.hash("admin123", 12);
    await execute(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      ["Super Admin", "admin@aplikasijadi.com", hash, "superadmin"]
    );
    console.log("✅ Seeded superadmin: admin@aplikasijadi.com / admin123");
  }

  // ── Produk dummy ─────────────────────────────────────────
  const [{ c: productCount }] = await query<{ c: number }>(
    "SELECT COUNT(*) as c FROM products"
  );
  if (productCount === 0) {
    const products = [
      ["SaaS Starter Kit",          "Boilerplate SaaS lengkap: auth, billing Stripe, dashboard admin, multi-tenant.", 499000, "Next.js,Prisma,Stripe",          "Terlaris", "🚀", "active", 42],
      ["Toko Online (E-Commerce)",  "Aplikasi belanja online lengkap dengan katalog, keranjang, checkout.",           399000, "Next.js,Tailwind,Supabase",      "Populer",  "🛒", "active", 35],
      ["Aplikasi Kasir POS",        "Point of Sale untuk toko fisik. Manajemen stok, laporan, cetak struk.",         599000, "React,Electron,SQLite",          "Baru",     "🧾", "active", 18],
      ["Sistem Manajemen Klinik",   "Rekam medis, jadwal dokter, antrian digital, laporan keuangan.",                799000, "Laravel,Vue.js,MySQL",           "Premium",  "🏥", "active", 12],
      ["Landing Page Builder",      "Buat landing page cantik. Drag & drop editor, 20+ template.",                   299000, "Next.js,Tailwind,TypeScript",    null,       "🎨", "active", 28],
      ["Aplikasi Chat Real-time",   "Chat room, DM, notifikasi, upload file, emoji reactions.",                      449000, "Socket.io,Node.js,React",        null,       "💬", "active", 21],
    ];
    for (const p of products) {
      await execute(
        "INSERT INTO products (name, description, price, tech_stack, badge, emoji, status, sales_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        p
      );
    }
    console.log("✅ Seeded 6 produk dummy");
  }

  // ── Orders dummy ─────────────────────────────────────────
  const [{ c: orderCount }] = await query<{ c: number }>(
    "SELECT COUNT(*) as c FROM orders"
  );
  if (orderCount === 0) {
    const now = Date.now();
    const day = 86400000;
    const dummyOrders = [
      [1, 499000, "paid",    "Andi Kurniawan", "andi@email.com",   new Date(now - day * 1).toISOString().slice(0, 19).replace("T", " ")],
      [2, 399000, "paid",    "Siti Rahma",     "siti@email.com",   new Date(now - day * 2).toISOString().slice(0, 19).replace("T", " ")],
      [3, 599000, "pending", "Budi Santoso",   "budi@email.com",   new Date(now - day * 2).toISOString().slice(0, 19).replace("T", " ")],
      [4, 799000, "paid",    "Dewi Lestari",   "dewi@email.com",   new Date(now - day * 3).toISOString().slice(0, 19).replace("T", " ")],
      [5, 299000, "paid",    "Reza Pratama",   "reza@email.com",   new Date(now - day * 4).toISOString().slice(0, 19).replace("T", " ")],
      [6, 449000, "failed",  "Nita Wahyuni",   "nita@email.com",   new Date(now - day * 5).toISOString().slice(0, 19).replace("T", " ")],
      [1, 499000, "paid",    "Hendra Wijaya",  "hendra@email.com", new Date(now - day * 6).toISOString().slice(0, 19).replace("T", " ")],
      [2, 399000, "paid",    "Lisa Amalia",    "lisa@email.com",   new Date(now - day * 7).toISOString().slice(0, 19).replace("T", " ")],
    ];
    for (const o of dummyOrders) {
      await execute(
        "INSERT INTO orders (product_id, amount, status, buyer_name, buyer_email, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        o
      );
    }
    console.log("✅ Seeded 8 orders dummy");
  }
}
