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
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(req: NextRequest) {
  const actor = await guard(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await query(`
    SELECT p.*, COUNT(o.id) as order_count
    FROM products p
    LEFT JOIN orders o ON o.product_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `);

  await writeLog({ actor: { id: actor.sub, email: actor.email, name: actor.name }, action: "VIEW_PRODUCTS", detail: `Melihat daftar ${products.length} produk`, req });
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const actor = await guard(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, description, price, tech_stack, badge, emoji, status, youtube_url, images } = body;

  if (!name || price === undefined || price === "") {
    return NextResponse.json({ error: "Nama dan harga wajib diisi." }, { status: 400 });
  }

  // Auto-generate slug jika tidak dikirim
  const slug = body.slug ? toSlug(body.slug) : toSlug(name);

  const result = await execute(
    `INSERT INTO products (name, slug, description, price, tech_stack, badge, emoji, status, youtube_url, images)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      slug || null,
      description || null,
      Number(price),
      tech_stack || null,
      badge || null,
      emoji || "📦",
      status || "active",
      youtube_url || null,
      images || null,
    ]
  );

  await writeLog({ actor: { id: actor.sub, email: actor.email, name: actor.name }, action: "CREATE_PRODUCT", detail: `Tambah produk: "${name}" (ID: ${result.insertId})`, req });

  // Buang cache halaman publik
  revalidatePath("/");
  revalidatePath("/produk");

  return NextResponse.json({ id: result.insertId }, { status: 201 });
}
