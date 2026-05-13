import Link from "next/link";
import { notFound } from "next/navigation";
import { queryOne } from "@/lib/db";
import OrderStatus from "./OrderStatus";

interface Order {
  id: number;
  order_code: string;
  buyer_name: string;
  buyer_email: string;
  domain: string;
  amount: number;
  status: string;
  xendit_invoice_url: string | null;
  paid_at: string | null;
  issued_at: string | null;
  expires_at: string | null;
  ssl_product_name: string | null;
  created_at: string;
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params:       Promise<{ code: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { code }  = await params;
  const { email } = await searchParams;

  const order = await queryOne<Order>(
    `SELECT o.id, o.order_code, o.buyer_name, o.buyer_email, o.domain, o.amount,
            o.status, o.xendit_invoice_url, o.paid_at, o.issued_at, o.expires_at,
            o.created_at, p.name as ssl_product_name
     FROM ssl_orders o
     LEFT JOIN ssl_products p ON p.id = o.ssl_product_id
     WHERE o.order_code = ?`,
    [code]
  );
  if (!order) notFound();

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white">
      <section className="max-w-2xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <Link href="/ssl" className="text-sm text-indigo-600 hover:underline">← Kembali ke katalog SSL</Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 mt-6">
          <h1 className="text-2xl font-extrabold text-gray-900">Pesanan SSL</h1>
          <p className="text-xs text-gray-400 mt-1">Kode pesanan: <strong>{order.order_code}</strong></p>

          <OrderStatus
            orderCode={order.order_code}
            initialStatus={order.status}
            xenditUrl={order.xendit_invoice_url}
            initialEmail={email ?? null}
          />

          <dl className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
            <Row k="Paket"   v={order.ssl_product_name ?? "-"} />
            <Row k="Domain"  v={order.domain} />
            <Row k="Pembeli" v={order.buyer_name} />
            <Row k="Email"   v={order.buyer_email} />
            <Row k="Total"   v={new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(order.amount)} />
            <Row k="Dibuat"  v={new Date(order.created_at).toLocaleString("id-ID")} />
            {order.paid_at   && <Row k="Dibayar"   v={new Date(order.paid_at).toLocaleString("id-ID")} />}
            {order.issued_at && <Row k="Terbit"    v={new Date(order.issued_at).toLocaleString("id-ID")} />}
            {order.expires_at && <Row k="Berlaku sampai" v={new Date(order.expires_at).toLocaleDateString("id-ID")} />}
          </dl>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Simpan kode pesanan ini. Setelah SSL di-issue admin, Anda bisa download file .crt & .ca-bundle dari halaman ini (verifikasi email).
        </p>
      </section>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-xs text-gray-400">{k}</dt>
      <dd className="text-gray-900 font-medium">{v}</dd>
    </>
  );
}
