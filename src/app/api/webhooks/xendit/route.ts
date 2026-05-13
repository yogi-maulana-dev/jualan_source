import { NextRequest, NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db";
import { verifyWebhookToken } from "@/lib/xendit";

export const runtime = "nodejs";

/**
 * Xendit Invoice callback.
 * Setup di Xendit Dashboard:
 *   Settings → Webhooks → Invoice paid callback URL = https://yourdomain.com/api/webhooks/xendit
 *   Verification token: copy ke env XENDIT_WEBHOOK_TOKEN
 *
 * Payload (relevant fields):
 *   { id, external_id, status, paid_at, amount, ... }
 *   status: "PAID" | "SETTLED" | "EXPIRED"
 */
interface XenditCallback {
  id:           string;
  external_id?: string;
  status:       string;
  paid_at?:     string;
  amount?:      number;
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-callback-token");
  if (!verifyWebhookToken(token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  let body: XenditCallback;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.id || !body.external_id) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Cari order via external_id (lebih reliable daripada invoice id, kalau invoice di-recreate)
  const order = await queryOne<{ id: number; status: string; amount: number }>(
    `SELECT id, status, amount FROM ssl_orders WHERE xendit_external_id = ? LIMIT 1`,
    [body.external_id]
  );
  if (!order) {
    // Bisa juga belum ter-link, coba via invoice_id
    const byInv = await queryOne<{ id: number }>(
      `SELECT id FROM ssl_orders WHERE xendit_invoice_id = ? LIMIT 1`,
      [body.id]
    );
    if (!byInv) return NextResponse.json({ ok: true, note: "order not found" });
  }

  // Map Xendit status → internal
  const xs = String(body.status).toUpperCase();
  let next: string | null = null;
  if (xs === "PAID" || xs === "SETTLED")   next = "paid";
  else if (xs === "EXPIRED")               next = "expired";

  if (!next) return NextResponse.json({ ok: true, note: "ignored status: " + xs });

  // Sudah paid? jangan downgrade
  if (order?.status && ["paid", "processing", "issued"].includes(order.status) && next === "expired") {
    return NextResponse.json({ ok: true, note: "skip: already paid" });
  }

  await execute(
    `UPDATE ssl_orders
     SET status = ?, paid_at = ${next === "paid" ? "COALESCE(paid_at, NOW())" : "paid_at"}
     WHERE xendit_external_id = ? OR xendit_invoice_id = ?`,
    [next, body.external_id, body.id]
  );

  return NextResponse.json({ ok: true, status: next });
}
