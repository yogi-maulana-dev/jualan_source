import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { writeLog } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload || payload.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit  = Math.min(Number(searchParams.get("limit") || 20), 100);
  const offset = Number(searchParams.get("offset") || 0);

  const where  = status ? "WHERE o.status = ?" : "";
  const params = status ? [status, limit, offset] : [limit, offset];

  const [orders, countRow] = await Promise.all([
    query(`
      SELECT o.id, o.buyer_name, o.buyer_email, o.amount, o.status, o.created_at,
             p.name as product_name, p.emoji as product_emoji
      FROM orders o
      LEFT JOIN products p ON p.id = o.product_id
      ${where}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, params),
    queryOne<{ c: number }>(
      `SELECT COUNT(*) as c FROM orders ${status ? "WHERE status = ?" : ""}`,
      status ? [status] : []
    ),
  ]);

  await writeLog({ actor: { id: payload.sub, email: payload.email, name: payload.name }, action: "VIEW_ORDERS", detail: `Melihat pesanan${status ? ` (filter: ${status})` : ""}, total: ${countRow?.c ?? 0}`, req });
  return NextResponse.json({ orders, total: countRow?.c ?? 0 });
}
