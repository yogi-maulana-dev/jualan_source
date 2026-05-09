/**
 * GET  /api/admin/settings — ambil semua settings
 * POST /api/admin/settings — update satu atau lebih settings
 */
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { query, execute } from "@/lib/db";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { writeLog } from "@/lib/logger";

export const runtime = "nodejs";

async function guard(req: NextRequest) {
  const token   = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;
  return payload?.role === "superadmin" ? payload : null;
}

/** Buat tabel + isi default jika belum ada */
async function ensureSettingsTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS site_settings (
      \`key\`    VARCHAR(100) NOT NULL PRIMARY KEY,
      value      TEXT,
      label      VARCHAR(200),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB ROW_FORMAT=DYNAMIC
  `, []);

  // Migrasi kolom produk jika belum ada — .catch() supaya aman jika kolom sudah ada
  await execute(`ALTER TABLE products ADD COLUMN images      TEXT         NULL AFTER description`, []).catch(() => {});
  await execute(`ALTER TABLE products ADD COLUMN youtube_url VARCHAR(500) NULL AFTER status`,      []).catch(() => {});
  await execute(`ALTER TABLE products ADD COLUMN slug        VARCHAR(191) NULL AFTER name`,        []).catch(() => {});
  await execute(`ALTER TABLE users    ADD COLUMN backup_codes TEXT        NULL`,                   []).catch(() => {});

  // Insert defaults — tidak menimpa yang sudah ada
  const defaults = [
    ["catalog_title",       "Katalog Produk",              "Label kecil di atas heading"],
    ["catalog_heading",     "Pilih Aplikasi Sesuai Kebutuhan", "Judul utama section produk"],
    ["catalog_description", "Semua produk sudah production-ready, dilengkapi dokumentasi lengkap dan source code yang bersih.", "Deskripsi section produk"],
  ];
  for (const [key, value, label] of defaults) {
    await execute(
      "INSERT IGNORE INTO site_settings (`key`, value, label) VALUES (?, ?, ?)",
      [key, value, label]
    );
  }
}

export async function GET(req: NextRequest) {
  const actor = await guard(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureSettingsTable();

    const rows = await query<{ key: string; value: string; label: string }>(
      "SELECT `key`, value, label FROM site_settings ORDER BY `key`"
    );
    const settings: Record<string, string> = {};
    const meta:     Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
      meta[row.key]     = row.label;
    }
    return NextResponse.json({ settings, meta });
  } catch (err) {
    console.error("[GET /api/admin/settings]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const actor = await guard(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Record<string, string>;

  for (const [key, value] of Object.entries(body)) {
    await execute(
      "INSERT INTO site_settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?",
      [key, value, value]
    );
  }

  await writeLog({
    actor:  { id: actor.sub, email: actor.email, name: actor.name },
    action: "UPDATE_SETTINGS" as never,
    detail: `Update settings: ${Object.keys(body).join(", ")}`,
    req,
  });

  revalidatePath("/");
  revalidatePath("/produk");

  return NextResponse.json({ ok: true });
}
