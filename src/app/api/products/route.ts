/**
 * GET /api/products
 * Publik — kembalikan produk aktif untuk halaman frontend.
 */
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const search = searchParams.get("q") ?? "";
  const limit  = Math.min(Number(searchParams.get("limit") ?? 100), 100);

  let sql = `
    SELECT id, name, slug, description, price, tech_stack, badge, emoji, youtube_url, sales_count
    FROM products
    WHERE status = 'active'
  `;
  const params: (string | number)[] = [];

  if (search) {
    sql += ` AND (name LIKE ? OR description LIKE ? OR tech_stack LIKE ?)`;
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  sql += ` ORDER BY sales_count DESC, created_at DESC LIMIT ?`;
  params.push(limit);

  const products = await query(sql, params);
  return NextResponse.json({ products });
}
