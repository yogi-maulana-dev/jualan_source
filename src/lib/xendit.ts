/**
 * Xendit Invoice API wrapper
 * Docs: https://developers.xendit.co/api-reference/#create-invoice
 *
 * ENV yang dibutuhkan:
 *   XENDIT_SECRET_KEY=xnd_development_xxx        (atau xnd_production_xxx)
 *   XENDIT_WEBHOOK_TOKEN=xxx                     (dari dashboard Xendit > Settings > Webhooks)
 *   APP_URL=https://aplikasijadi.com             (untuk callback success/failure URL)
 */

const BASE_URL = "https://api.xendit.co";

export interface CreateInvoiceInput {
  externalId:  string;            // unik per order, e.g. "ssl-order-123-1736..."
  amount:      number;
  payerEmail:  string;
  description: string;
  customerName?: string;
  customerPhone?: string;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
  /** menit, default 1440 (24 jam) */
  invoiceDuration?: number;
}

export interface XenditInvoice {
  id:           string;
  external_id:  string;
  status:       "PENDING" | "PAID" | "SETTLED" | "EXPIRED";
  amount:       number;
  invoice_url:  string;
  expiry_date:  string;
}

function getSecretKey(): string {
  const key = process.env.XENDIT_SECRET_KEY;
  if (!key) throw new Error("XENDIT_SECRET_KEY belum di-set di .env.local");
  return key;
}

function authHeader(): string {
  return "Basic " + Buffer.from(getSecretKey() + ":").toString("base64");
}

export async function createInvoice(input: CreateInvoiceInput): Promise<XenditInvoice> {
  const body: Record<string, unknown> = {
    external_id:      input.externalId,
    amount:           input.amount,
    payer_email:      input.payerEmail,
    description:      input.description,
    invoice_duration: input.invoiceDuration ?? 1440 * 60, // detik
  };
  if (input.customerName || input.customerPhone) {
    body.customer = {
      given_names:   input.customerName,
      mobile_number: input.customerPhone,
      email:         input.payerEmail,
    };
  }
  if (input.successRedirectUrl) body.success_redirect_url = input.successRedirectUrl;
  if (input.failureRedirectUrl) body.failure_redirect_url = input.failureRedirectUrl;

  const res = await fetch(`${BASE_URL}/v2/invoices`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": authHeader(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Xendit invoice gagal: ${res.status} ${errText}`);
  }
  return res.json();
}

export async function getInvoice(invoiceId: string): Promise<XenditInvoice> {
  const res = await fetch(`${BASE_URL}/v2/invoices/${invoiceId}`, {
    headers: { Authorization: authHeader() },
  });
  if (!res.ok) throw new Error(`Xendit get invoice gagal: ${res.status}`);
  return res.json();
}

/** Verifikasi callback Xendit pakai webhook token */
export function verifyWebhookToken(receivedToken: string | null): boolean {
  const expected = process.env.XENDIT_WEBHOOK_TOKEN;
  if (!expected) {
    console.warn("XENDIT_WEBHOOK_TOKEN belum di-set — webhook tidak terverifikasi");
    return false;
  }
  return receivedToken === expected;
}
