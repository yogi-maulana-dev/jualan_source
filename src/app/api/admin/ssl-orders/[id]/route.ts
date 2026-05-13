import { NextRequest, NextResponse } from "next/server";
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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await guard(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const row = await queryOne(
    `SELECT o.*, p.name as ssl_product_name, p.validity_days
     FROM ssl_orders o LEFT JOIN ssl_products p ON p.id = o.ssl_product_id
     WHERE o.id = ?`, [id]);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order: row });
}

/**
 * PATCH: update status / catatan, atau issue SSL (upload cert).
 * Body bisa berisi:
 *   { status?, admin_note?, certificate?, ca_bundle?, csr? }
 * Kalau certificate diisi → otomatis set status=issued, issued_at=NOW(), expires_at = NOW() + validity_days
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await guard(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const order = await queryOne<{ id: number; status: string; validity_days: number; order_code: string; buyer_email: string }>(
    `SELECT o.id, o.status, o.order_code, o.buyer_email, p.validity_days
     FROM ssl_orders o LEFT JOIN ssl_products p ON p.id = o.ssl_product_id
     WHERE o.id = ?`, [id]);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const b = await req.json();
  const sets: string[] = [];
  const vals: unknown[] = [];

  if (typeof b.admin_note === "string")  { sets.push("admin_note = ?");  vals.push(b.admin_note); }
  if (typeof b.csr === "string")         { sets.push("csr = ?");         vals.push(b.csr); }

  // Issue mode
  if (b.certificate && String(b.certificate).trim()) {
    const validity = order.validity_days || 365;
    sets.push("certificate = ?"); vals.push(b.certificate);
    sets.push("ca_bundle = ?");   vals.push(b.ca_bundle || null);
    sets.push("status = ?");      vals.push("issued");
    sets.push("issued_at = NOW()");
    sets.push(`expires_at = DATE_ADD(CURDATE(), INTERVAL ${Number(validity)} DAY)`);

    // Increment sales_count produk
    await execute(
      `UPDATE ssl_products SET sales_count = sales_count + 1
       WHERE id = (SELECT ssl_product_id FROM ssl_orders WHERE id = ?)`,
      [id]
    );
  } else if (b.status && typeof b.status === "string") {
    sets.push("status = ?"); vals.push(b.status);
    if (b.status === "paid")       sets.push("paid_at = COALESCE(paid_at, NOW())");
    if (b.status === "processing") sets.push("paid_at = COALESCE(paid_at, NOW())");
  }

  if (sets.length === 0) return NextResponse.json({ error: "Tidak ada perubahan" }, { status: 400 });

  vals.push(id);
  await execute(`UPDATE ssl_orders SET ${sets.join(", ")} WHERE id = ?`, vals);

  await writeLog({
    actor:  { id: actor.sub, email: actor.email, name: actor.name },
    action: b.certificate ? "ISSUE_SSL" : "UPDATE_SSL_ORDER",
    detail: b.certificate
      ? `Issue SSL untuk order ${order.order_code} → ${order.buyer_email}`
      : `Update order SSL ${order.order_code}`,
    req,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await guard(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await execute(`DELETE FROM ssl_orders WHERE id = ?`, [id]);
  await writeLog({ actor: { id: actor.sub, email: actor.email, name: actor.name }, action: "DELETE_SSL_ORDER", detail: `Hapus order SSL ID ${id}`, req });
  return NextResponse.json({ ok: true });
}
