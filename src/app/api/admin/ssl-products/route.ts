import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { query, execute } from "@/lib/db";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { writeLog } from "@/lib/logger";

export const runtime = "nodejs";

async function guard(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload || payload.role !== "superadmin") return null;
  return payload;
}

function toSlug(str: string) {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(req: NextRequest) {
  const actor = await guard(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await query(`
    SELECT s.*, COUNT(o.id) as order_count
    FROM ssl_products s
    LEFT JOIN ssl_orders o ON o.ssl_product_id = s.id
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `);

  await writeLog({ actor: { id: actor.sub, email: actor.email, name: actor.name }, action: "VIEW_SSL_PRODUCTS", detail: `Melihat ${rows.length} paket SSL`, req });
  return NextResponse.json({ products: rows });
}

export async function POST(req: NextRequest) {
  const actor = await guard(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();
  if (!b.name || b.price === undefined || b.price === "") {
    return NextResponse.json({ error: "Nama dan harga wajib diisi." }, { status: 400 });
  }

  const slug = b.slug ? toSlug(b.slug) : toSlug(b.name);

  let result;
  try {
    result = await execute(
      `INSERT INTO ssl_products
       (name, slug, brand, ssl_type, coverage, description, features, warranty_usd, validity_days, price, emoji, badge, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        b.name,
        slug || null,
        b.brand || null,
        b.ssl_type || "DV",
        b.coverage || "single",
        b.description || null,
        b.features || null,
        Number(b.warranty_usd || 0),
        Number(b.validity_days || 365),
        Number(b.price),
        b.emoji || "🔒",
        b.badge || null,
        b.status || "active",
      ]
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  await writeLog({ actor: { id: actor.sub, email: actor.email, name: actor.name }, action: "CREATE_SSL_PRODUCT", detail: `Tambah paket SSL "${b.name}" (ID: ${result.insertId})`, req });
  revalidatePath("/ssl");
  return NextResponse.json({ id: result.insertId }, { status: 201 });
}
