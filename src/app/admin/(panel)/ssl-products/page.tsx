"use client";
import { useState, useEffect, useCallback, FormEvent } from "react";
import AdminHeader from "@/components/admin/AdminHeader";

interface SslProduct {
  id: number;
  name: string;
  slug: string | null;
  brand: string | null;
  ssl_type: "DV" | "OV" | "EV";
  coverage: "single" | "wildcard" | "multi";
  description: string | null;
  features: string | null;
  warranty_usd: number;
  validity_days: number;
  price: number;
  emoji: string;
  badge: string | null;
  status: "active" | "inactive" | "draft";
  sales_count: number;
  order_count: number;
  created_at: string;
}

type Form = Omit<SslProduct, "id" | "sales_count" | "order_count" | "created_at">;

const EMPTY: Form = {
  name: "", slug: "", brand: "", ssl_type: "DV", coverage: "single",
  description: "", features: "", warranty_usd: 10000, validity_days: 365,
  price: 0, emoji: "🔒", badge: "", status: "active",
};

const SSL_TYPES = [
  { v: "DV", label: "DV (Domain Validation)" },
  { v: "OV", label: "OV (Organization Validation)" },
  { v: "EV", label: "EV (Extended Validation)" },
];
const COVERAGES = [
  { v: "single",   label: "Single domain" },
  { v: "wildcard", label: "Wildcard (*.domain)" },
  { v: "multi",    label: "Multi-domain (SAN)" },
];

function rupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default function AdminSslProductsPage() {
  const [list,    setList]    = useState<SslProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(false);
  const [form,    setForm]    = useState<Form>(EMPTY);
  const [editId,  setEditId]  = useState<number | null>(null);
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/ssl-products");
    const j = await r.json();
    setList(j.products ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm(EMPTY); setEditId(null); setOpen(true);
  }
  function openEdit(p: SslProduct) {
    setForm({
      name: p.name, slug: p.slug ?? "", brand: p.brand ?? "",
      ssl_type: p.ssl_type, coverage: p.coverage,
      description: p.description ?? "", features: p.features ?? "",
      warranty_usd: p.warranty_usd, validity_days: p.validity_days,
      price: p.price, emoji: p.emoji, badge: p.badge ?? "", status: p.status,
    });
    setEditId(p.id); setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url    = editId ? `/api/admin/ssl-products/${editId}` : "/api/admin/ssl-products";
    const method = editId ? "PUT" : "POST";
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      alert(j.error || "Gagal menyimpan");
      return;
    }
    setOpen(false); await load();
  }

  async function onDelete(id: number) {
    if (!confirm("Hapus paket SSL ini?")) return;
    const r = await fetch(`/api/admin/ssl-products/${id}`, { method: "DELETE" });
    if (r.ok) await load();
  }

  return (
    <>
      <AdminHeader title="Paket SSL" subtitle="Kelola paket SSL yang dijual" />
      <main className="flex-1 p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-500">{list.length} paket terdaftar</p>
          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
          >+ Tambah Paket SSL</button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Memuat...</div>
        ) : list.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
            <div className="text-5xl mb-3">🔒</div>
            <p>Belum ada paket SSL. Klik <strong>Tambah Paket SSL</strong> untuk mulai.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((p) => (
              <article key={p.id} className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl">{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{p.name}</h3>
                    <p className="text-xs text-gray-400">{p.brand} • {p.ssl_type} • {p.coverage}</p>
                  </div>
                  {p.badge && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">{p.badge}</span>}
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">{p.description ?? "-"}</p>
                <div className="text-lg font-bold text-indigo-600 mb-2">{rupiah(p.price)} <span className="text-xs text-gray-400 font-normal">/ {p.validity_days} hari</span></div>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                  <span>{p.order_count} order • {p.sales_count} terjual</span>
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${
                    p.status === "active" ? "bg-green-100 text-green-700"
                    : p.status === "draft" ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-600"
                  }`}>{p.status}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(p)} className="flex-1 px-3 py-1.5 text-xs rounded-md border border-gray-200 hover:bg-gray-50">Edit</button>
                  <button onClick={() => onDelete(p.id)} className="px-3 py-1.5 text-xs rounded-md border border-red-200 text-red-600 hover:bg-red-50">Hapus</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-lg">{editId ? "Edit" : "Tambah"} Paket SSL</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={onSubmit} className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Nama Paket *">
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
                </Field>
                <Field label="Slug (opsional, auto)">
                  <input value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inp} />
                </Field>
                <Field label="Brand">
                  <input value={form.brand ?? ""} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Sectigo / DigiCert / Let's Encrypt" className={inp} />
                </Field>
                <Field label="Emoji">
                  <input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} className={inp} />
                </Field>
                <Field label="Tipe SSL">
                  <select value={form.ssl_type} onChange={(e) => setForm({ ...form, ssl_type: e.target.value as Form["ssl_type"] })} className={inp}>
                    {SSL_TYPES.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
                  </select>
                </Field>
                <Field label="Coverage">
                  <select value={form.coverage} onChange={(e) => setForm({ ...form, coverage: e.target.value as Form["coverage"] })} className={inp}>
                    {COVERAGES.map(c => <option key={c.v} value={c.v}>{c.label}</option>)}
                  </select>
                </Field>
                <Field label="Harga (IDR) *">
                  <input type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className={inp} />
                </Field>
                <Field label="Validity (hari)">
                  <input type="number" value={form.validity_days} onChange={(e) => setForm({ ...form, validity_days: Number(e.target.value) })} className={inp} />
                </Field>
                <Field label="Warranty (USD)">
                  <input type="number" value={form.warranty_usd} onChange={(e) => setForm({ ...form, warranty_usd: Number(e.target.value) })} className={inp} />
                </Field>
                <Field label="Badge (opsional)">
                  <input value={form.badge ?? ""} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="Termurah / Best Value" className={inp} />
                </Field>
              </div>
              <Field label="Deskripsi">
                <textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inp} />
              </Field>
              <Field label='Features (JSON array, ex: ["Refund 30 hari","Unlimited reissue"])'>
                <textarea rows={3} value={form.features ?? ""} onChange={(e) => setForm({ ...form, features: e.target.value })} className={`${inp} font-mono text-xs`} />
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Form["status"] })} className={inp}>
                  <option value="active">Aktif</option>
                  <option value="draft">Draft</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm">Batal</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const inp = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-indigo-500";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
