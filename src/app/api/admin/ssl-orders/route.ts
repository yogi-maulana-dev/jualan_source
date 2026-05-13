import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { writeLog } from "@/lib/logger";

export const runtime = "nodejs";

async function guard(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload || payload.role !== "superadmin") return null;
  return payload;
}

export async function GET(req: NextRequest) {
  const actor = await guard(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q      = searchParams.get("q")?.trim();
  const limit  = Math.min(Number(searchParams.get("limit") || 30), 100);
  const offset = Number(searchParams.get("offset") || 0);

  const conds: string[] = [];
  const params: unknown[] = [];
  if (status) { conds.push("o.status = ?"); params.push(status); }
  if (q)      { conds.push("(o.order_code LIKE ? OR o.buyer_email LIKE ? OR o.domain LIKE ?)"); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

  const [orders, countRow] = await Promise.all([
    query(`
      SELECT o.id, o.order_code, o.buyer_name, o.buyer_email, o.buyer_phone,
             o.domain, o.amount, o.status, o.paid_at, o.issued_at, o.expires_at,
             o.created_at, p.name as ssl_product_name, p.validity_days
      FROM ssl_orders o
      LEFT JOIN ssl_products p ON p.id = o.ssl_product_id
      ${where}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]),
    queryOne<{ c: number }>(`SELECT COUNT(*) as c FROM ssl_orders o ${where}`, params),
  ]);

  await writeLog({ actor: { id: actor.sub, email: actor.email, name: actor.name }, action: "VIEW_SSL_ORDERS", detail: `Melihat ${countRow?.c ?? 0} pesanan SSL`, req });
  return NextResponse.json({ orders, total: countRow?.c ?? 0 });
}
