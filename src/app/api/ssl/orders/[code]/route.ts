import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Lookup pesanan by order_code (untuk buyer cek status tanpa login).
 * Untuk download cert, buyer wajib provide email yang cocok (?email=...).
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.toLowerCase().trim();

  const row = await queryOne<{
    id: number; order_code: string; buyer_name: string; buyer_email: string;
    domain: string; amount: number; status: string;
    xendit_invoice_url: string | null;
    paid_at: string | null; issued_at: string | null; expires_at: string | null;
    certificate: string | null; ca_bundle: string | null;
    ssl_product_name: string | null;
    created_at: string;
  }>(
    `SELECT o.id, o.order_code, o.buyer_name, o.buyer_email, o.domain, o.amount,
            o.status, o.xendit_invoice_url, o.paid_at, o.issued_at, o.expires_at,
            o.certificate, o.ca_bundle, o.created_at,
            p.name as ssl_product_name
     FROM ssl_orders o
     LEFT JOIN ssl_products p ON p.id = o.ssl_product_id
     WHERE o.order_code = ?`,
    [code]
  );

  if (!row) return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });

  // Default: jangan kirim isi sertifikat ke publik.
  const verified = email && email === row.buyer_email;
  const payload = {
    order_code:       row.order_code,
    buyer_name:       row.buyer_name,
    domain:           row.domain,
    amount:           row.amount,
    status:           row.status,
    xendit_invoice_url: row.xendit_invoice_url,
    paid_at:    row.paid_at,
    issued_at:  row.issued_at,
    expires_at: row.expires_at,
    ssl_product_name: row.ssl_product_name,
    created_at: row.created_at,
    certificate: verified ? row.certificate : null,
    ca_bundle:   verified ? row.ca_bundle   : null,
    verified:    !!verified,
  };
  return NextResponse.json(payload);
}
