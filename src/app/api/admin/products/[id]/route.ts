import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { queryOne, execute } from "@/lib/db";
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

// GET /api/admin/products/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await guard(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const product = await queryOne("SELECT * FROM products WHERE id = ?", [id]);
  if (!product) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ product });
}

// PUT /api/admin/products/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await guard(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await queryOne<{ id: number; name: string }>("SELECT id, name FROM products WHERE id = ?", [id]);
  if (!existing) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });

  const body = await req.json();
  const { name, description, price, tech_stack, badge, emoji, status, youtube_url, images } = body;

  if (!name || price === undefined || price === "") {
    return NextResponse.json({ error: "Nama dan harga wajib diisi." }, { status: 400 });
  }

  const slug = body.slug ? toSlug(body.slug) : toSlug(name);

  await execute(
    `UPDATE products
     SET name = ?, slug = ?, description = ?, price = ?,
         tech_stack = ?, badge = ?, emoji = ?, status = ?, youtube_url = ?, images = ?
     WHERE id = ?`,
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
      id,
    ]
  );

  await writeLog({ actor: { id: actor.sub, email: actor.email, name: actor.name }, action: "UPDATE_PRODUCT", detail: `Update produk: "${name}" (ID: ${id})`, req });

  revalidatePath("/");
  revalidatePath("/produk");
  revalidatePath(`/produk/${body.slug ?? id}`);

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/products/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await guard(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await queryOne<{ id: number; name: string }>("SELECT id, name FROM products WHERE id = ?", [id]);
  if (!existing) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });

  await execute("DELETE FROM products WHERE id = ?", [id]);

  await writeLog({ actor: { id: actor.sub, email: actor.email, name: actor.name }, action: "DELETE_PRODUCT", detail: `Hapus produk: "${existing.name}" (ID: ${id})`, req });

  revalidatePath("/");
  revalidatePath("/produk");

  return NextResponse.json({ ok: true });
}
