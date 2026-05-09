import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload || payload.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    { c: totalProducts },
    { c: totalUsers },
    { c: totalOrders },
    { c: paidOrders },
    { r: revenue },
    { r: revenueToday },
  ] = await Promise.all([
    queryOne<{ c: number }>("SELECT COUNT(*) as c FROM products"),
    queryOne<{ c: number }>("SELECT COUNT(*) as c FROM users WHERE role = 'customer'"),
    queryOne<{ c: number }>("SELECT COUNT(*) as c FROM orders"),
    queryOne<{ c: number }>("SELECT COUNT(*) as c FROM orders WHERE status = 'paid'"),
    queryOne<{ r: number }>("SELECT COALESCE(SUM(amount), 0) as r FROM orders WHERE status = 'paid'"),
    queryOne<{ r: number }>("SELECT COALESCE(SUM(amount), 0) as r FROM orders WHERE status = 'paid' AND DATE(created_at) = CURDATE()"),
  ]) as [{ c: number }, { c: number }, { c: number }, { c: number }, { r: number }, { r: number }];

  const [recentOrders, topProducts] = await Promise.all([
    query(`
      SELECT o.id, o.buyer_name, o.buyer_email, o.amount, o.status, o.created_at,
             p.name as product_name, p.emoji as product_emoji
      FROM orders o
      LEFT JOIN products p ON p.id = o.product_id
      ORDER BY o.created_at DESC
      LIMIT 8
    `),
    query(`
      SELECT p.id, p.name, p.emoji, p.price, p.sales_count,
             COUNT(o.id) as order_count,
             COALESCE(SUM(CASE WHEN o.status = 'paid' THEN o.amount ELSE 0 END), 0) as revenue
      FROM products p
      LEFT JOIN orders o ON o.product_id = p.id
      GROUP BY p.id, p.name, p.emoji, p.price, p.sales_count
      ORDER BY order_count DESC
      LIMIT 5
    `),
  ]);

  return NextResponse.json({
    stats: { totalProducts, totalUsers, totalOrders, paidOrders, revenue, revenueToday },
    recentOrders,
    topProducts,
  });
}
