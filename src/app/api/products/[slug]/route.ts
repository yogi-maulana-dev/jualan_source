/**
 * GET /api/products/[slug]
 * Publik — ambil satu produk aktif by slug atau id.
 */
import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Coba cari by slug dulu, lalu by id (fallback)
  const product = await queryOne(
    `SELECT id, name, slug, description, price, tech_stack, badge, emoji, youtube_url, sales_count
     FROM products
     WHERE status = 'active' AND (slug = ? OR id = ?)
     LIMIT 1`,
    [slug, isNaN(Number(slug)) ? -1 : Number(slug)]
  );

  if (!product) {
    return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
  }
  return NextResponse.json({ product });
}
