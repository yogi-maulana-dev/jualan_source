import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { queryOne, execute } from "@/lib/db";
import { createInvoice } from "@/lib/xendit";

export const runtime = "nodejs";

interface Body {
  ssl_product_id: number;
  buyer_name:     string;
  buyer_email:    string;
  buyer_phone?:   string | null;
  domain:         string;
  csr?:           string | null;
}

function makeOrderCode(): string {
  const d = new Date();
  const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `SSL-${ym}-${rand}`;
}

function appUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}

export async function POST(req: NextRequest) {
  let body: Body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  // ── Validasi ──
  const errs: string[] = [];
  if (!body.ssl_product_id) errs.push("Paket SSL tidak dipilih.");
  if (!body.buyer_name?.trim())  errs.push("Nama wajib diisi.");
  if (!body.buyer_email?.trim()) errs.push("Email wajib diisi.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.buyer_email || "")) errs.push("Format email tidak valid.");
  if (!body.domain?.trim()) errs.push("Domain wajib diisi.");
  if (body.domain && !/^[a-zA-Z0-9*][a-zA-Z0-9.\-*]*\.[a-zA-Z]{2,}$/.test(body.domain.trim())) {
    errs.push("Format domain tidak valid (contoh: example.com atau *.example.com).");
  }
  if (errs.length) return NextResponse.json({ error: errs.join(" ") }, { status: 400 });

  // ── Pastikan produk SSL ada & aktif ──
  const product = await queryOne<{ id: number; name: string; price: number; validity_days: number }>(
    `SELECT id, name, price, validity_days FROM ssl_products WHERE id = ? AND status = 'active'`,
    [body.ssl_product_id]
  );
  if (!product) return NextResponse.json({ error: "Paket SSL tidak ditemukan / non-aktif." }, { status: 404 });

  // ── Buat order pending ──
  const orderCode  = makeOrderCode();
  const externalId = `${orderCode}-${Date.now()}`;
  const ins = await execute(
    `INSERT INTO ssl_orders
     (order_code, ssl_product_id, buyer_name, buyer_email, buyer_phone, domain, csr, amount, status, xendit_external_id)
     VALUES (?,?,?,?,?,?,?,?, 'pending', ?)`,
    [
      orderCode,
      product.id,
      body.buyer_name.trim(),
      body.buyer_email.trim().toLowerCase(),
      body.buyer_phone?.trim() || null,
      body.domain.trim().toLowerCase(),
      body.csr?.trim() || null,
      product.price,
      externalId,
    ]
  );

  // ── Buat invoice Xendit ──
  try {
    const invoice = await createInvoice({
      externalId,
      amount:      product.price,
      payerEmail:  body.buyer_email.trim(),
      description: `${product.name} — ${body.domain.trim()}`,
      customerName:  body.buyer_name,
      customerPhone: body.buyer_phone || undefined,
      successRedirectUrl: `${appUrl()}/ssl/pesanan/${orderCode}?from=xendit&status=success`,
      failureRedirectUrl: `${appUrl()}/ssl/pesanan/${orderCode}?from=xendit&status=failed`,
    });

    await execute(
      `UPDATE ssl_orders SET xendit_invoice_id = ?, xendit_invoice_url = ? WHERE id = ?`,
      [invoice.id, invoice.invoice_url, ins.insertId]
    );

    return NextResponse.json({
      order_id:    ins.insertId,
      order_code:  orderCode,
      invoice_url: invoice.invoice_url,
    }, { status: 201 });

  } catch (err) {
    // Order sudah masuk DB. User bisa cek status & coba bayar ulang.
    console.error("Xendit createInvoice error:", err);
    return NextResponse.json({
      order_id:   ins.insertId,
      order_code: orderCode,
      error:      "Gagal membuat invoice pembayaran. Hubungi admin atau coba lagi.",
    }, { status: 502 });
  }
}
