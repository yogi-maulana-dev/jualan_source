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
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await guard(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const row = await queryOne(`SELECT * FROM ssl_products WHERE id = ?`, [id]);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product: row });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await guard(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const b = await req.json();
  const slug = b.slug ? toSlug(b.slug) : toSlug(b.name);

  try {
    await execute(
      `UPDATE ssl_products SET
         name=?, slug=?, brand=?, ssl_type=?, coverage=?, description=?, features=?,
         warranty_usd=?, validity_days=?, price=?, emoji=?, badge=?, status=?
       WHERE id = ?`,
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
        id,
      ]
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  await writeLog({ actor: { id: actor.sub, email: actor.email, name: actor.name }, action: "UPDATE_SSL_PRODUCT", detail: `Update paket SSL ID ${id}`, req });
  revalidatePath("/ssl");
  revalidatePath(`/ssl/${slug}`);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await guard(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await execute(`DELETE FROM ssl_products WHERE id = ?`, [id]);
  await writeLog({ actor: { id: actor.sub, email: actor.email, name: actor.name }, action: "DELETE_SSL_PRODUCT", detail: `Hapus paket SSL ID ${id}`, req });
  revalidatePath("/ssl");
  return NextResponse.json({ ok: true });
}
