"use client";
import { useState, useEffect, useCallback } from "react";
import AdminHeader from "@/components/admin/AdminHeader";

interface SslOrder {
  id: number;
  order_code: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  domain: string;
  amount: number;
  status: string;
  paid_at: string | null;
  issued_at: string | null;
  expires_at: string | null;
  ssl_product_name: string | null;
  validity_days: number | null;
  created_at: string;
}

interface OrderDetail extends SslOrder {
  csr: string | null;
  certificate: string | null;
  ca_bundle: string | null;
  admin_note: string | null;
  xendit_invoice_url: string | null;
}

const STATUS_FILTER = [
  { v: "",           label: "Semua" },
  { v: "pending",    label: "Pending" },
  { v: "paid",       label: "Paid" },
  { v: "processing", label: "Processing" },
  { v: "issued",     label: "Issued" },
  { v: "expired",    label: "Expired" },
  { v: "failed",     label: "Failed" },
];

const STATUS_STYLE: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-700",
  paid:       "bg-blue-100 text-blue-700",
  processing: "bg-blue-100 text-blue-700",
  issued:     "bg-green-100 text-green-700",
  expired:    "bg-gray-100 text-gray-600",
  failed:     "bg-red-100 text-red-700",
  refunded:   "bg-gray-100 text-gray-600",
};

function rupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default function AdminSslOrdersPage() {
  const [orders, setOrders] = useState<SslOrder[]>([]);
  const [total,  setTotal]  = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus]   = useState("");
  const [q,      setQ]        = useState("");
  const [detail, setDetail]   = useState<OrderDetail | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q)      params.set("q", q);
    const r = await fetch(`/api/admin/ssl-orders?${params}`);
    const j = await r.json();
    setOrders(j.orders ?? []);
    setTotal(j.total ?? 0);
    setLoading(false);
  }, [status, q]);

  useEffect(() => { load(); }, [load]);

  async function openDetail(id: number) {
    const r = await fetch(`/api/admin/ssl-orders/${id}`);
    if (!r.ok) return;
    const j = await r.json();
    setDetail(j.order);
  }

  return (
    <>
      <AdminHeader title="Pesanan SSL" subtitle="Kelola pesanan & issue sertifikat SSL" />
      <main className="flex-1 p-6 md:p-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-2 items-center">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
            {STATUS_FILTER.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari: kode / email / domain..."
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
          <span className="text-xs text-gray-400">{total} pesanan</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400">Memuat...</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <div className="text-5xl mb-3">📭</div>
              Belum ada pesanan SSL.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3">Kode / Tanggal</th>
                  <th className="text-left px-4 py-3">Buyer</th>
                  <th className="text-left px-4 py-3">Paket / Domain</th>
                  <th className="text-right px-4 py-3">Total</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs font-semibold">{o.order_code}</div>
                      <div className="text-[10px] text-gray-400">{new Date(o.created_at).toLocaleString("id-ID")}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{o.buyer_name}</div>
                      <div className="text-xs text-gray-500">{o.buyer_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900">{o.ssl_product_name ?? "-"}</div>
                      <div className="text-xs text-gray-500 font-mono">{o.domain}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{rupiah(o.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_STYLE[o.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {o.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openDetail(o.id)} className="text-xs font-semibold text-indigo-600 hover:underline">Detail →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {detail && <DetailModal order={detail} onClose={() => setDetail(null)} onUpdated={() => { load(); setDetail(null); }} />}
    </>
  );
}

function DetailModal({ order, onClose, onUpdated }: { order: OrderDetail; onClose: () => void; onUpdated: () => void }) {
  const [tab, setTab]               = useState<"info" | "issue">(order.status === "issued" ? "info" : "issue");
  const [certificate, setCert]      = useState(order.certificate ?? "");
  const [caBundle,    setCaBundle]  = useState(order.ca_bundle ?? "");
  const [note,        setNote]      = useState(order.admin_note ?? "");
  const [saving, setSaving] = useState(false);

  async function patch(payload: Record<string, unknown>) {
    setSaving(true);
    const r = await fetch(`/api/admin/ssl-orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (r.ok) onUpdated();
    else alert("Gagal menyimpan");
  }

  async function markPaid()       { await patch({ status: "paid" }); }
  async function markProcessing() { await patch({ status: "processing" }); }
  async function saveNote()       { await patch({ admin_note: note }); }
  async function issue() {
    if (!certificate.trim()) { alert("Certificate (.crt) wajib diisi."); return; }
    if (!confirm("Issue SSL ini? Buyer akan bisa download file.")) return;
    await patch({ certificate, ca_bundle: caBundle });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-lg">Pesanan {order.order_code}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{order.ssl_product_name} • {order.domain}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
        </div>

        <div className="px-6 pt-4 flex gap-2 border-b border-gray-100">
          {(["info","issue"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 ${tab === t ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500"}`}
            >
              {t === "info" ? "Info & Status" : "Issue SSL"}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {tab === "info" && (
            <>
              <dl className="grid sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                <Row k="Pembeli"  v={order.buyer_name} />
                <Row k="Email"    v={order.buyer_email} />
                <Row k="WhatsApp" v={order.buyer_phone ?? "-"} />
                <Row k="Domain"   v={order.domain} />
                <Row k="Total"    v={rupiah(order.amount)} />
                <Row k="Status"   v={order.status.toUpperCase()} />
                {order.paid_at    && <Row k="Dibayar"   v={new Date(order.paid_at).toLocaleString("id-ID")} />}
                {order.issued_at  && <Row k="Issued"    v={new Date(order.issued_at).toLocaleString("id-ID")} />}
                {order.expires_at && <Row k="Expires"   v={new Date(order.expires_at).toLocaleDateString("id-ID")} />}
              </dl>

              {order.csr && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">CSR dari buyer:</p>
                  <pre className="text-[10px] font-mono bg-gray-50 p-3 rounded-lg whitespace-pre-wrap break-all max-h-40 overflow-y-auto">{order.csr}</pre>
                </div>
              )}

              {order.xendit_invoice_url && (
                <a href={order.xendit_invoice_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">
                  → Lihat Invoice Xendit
                </a>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Catatan Admin (internal)</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                <button onClick={saveNote} disabled={saving} className="mt-2 px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-semibold hover:bg-gray-200">Simpan Catatan</button>
              </div>

              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                {order.status === "pending" && (
                  <button onClick={markPaid} disabled={saving} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">
                    Tandai Lunas (manual)
                  </button>
                )}
                {(order.status === "paid") && (
                  <button onClick={markProcessing} disabled={saving} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700">
                    Mulai Proses
                  </button>
                )}
              </div>
            </>
          )}

          {tab === "issue" && (
            <>
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-xs text-yellow-800">
                ⚠ Pastikan SSL sudah di-issue dari provider (Sectigo/DigiCert/dll), lalu paste isi file di bawah.
                Setelah disubmit, buyer otomatis bisa download dari halaman pesanannya.
              </div>
              <label className="block">
                <span className="block text-xs font-semibold text-gray-600 mb-1">Certificate (.crt) *</span>
                <textarea required value={certificate} onChange={(e) => setCert(e.target.value)} rows={6} placeholder="-----BEGIN CERTIFICATE-----..." className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-gray-600 mb-1">CA Bundle (.ca-bundle)</span>
                <textarea value={caBundle} onChange={(e) => setCaBundle(e.target.value)} rows={6} placeholder="Intermediate certificates..." className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono" />
              </label>
              <button onClick={issue} disabled={saving || !certificate.trim()} className="w-full py-3 rounded-lg bg-green-600 text-white font-bold text-sm hover:bg-green-700 disabled:opacity-60">
                {saving ? "Menyimpan..." : "Issue SSL & Notify Buyer"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase text-gray-400">{k}</dt>
      <dd className="text-gray-900 font-medium">{v}</dd>
    </div>
  );
}
