"use client";
import { useState, useEffect, useCallback, FormEvent, ChangeEvent } from "react";
import Image from "next/image";
import AdminHeader from "@/components/admin/AdminHeader";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Product {
  id: number;
  name: string;
  slug: string | null;
  description: string | null;
  images: string | null;
  price: number;
  tech_stack: string | null;
  badge: string | null;
  emoji: string;
  status: "active" | "inactive" | "draft";
  youtube_url: string | null;
  sales_count: number;
  order_count: number;
  created_at: string;
}

type ProductForm = Omit<Product, "id" | "images" | "sales_count" | "order_count" | "created_at">;

const EMPTY_FORM: ProductForm = {
  name: "", slug: "", description: "", price: 0,
  tech_stack: "", badge: "", emoji: "📦",
  status: "active", youtube_url: "",
};

const EMOJI_LIST = ["📦","💻","🛒","🚀","🎯","⚡","🔥","💡","🎨","🛠️","📱","🌐","🔐","📊","🎮","🤖"];
const BADGE_LIST = ["", "NEW", "HOT", "SALE", "BEST SELLER", "LIMITED", "PROMO", "FEATURED"];
const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  active:   { label: "Aktif",    cls: "bg-green-100 text-green-700 border-green-200" },
  inactive: { label: "Nonaktif", cls: "bg-gray-100 text-gray-600 border-gray-200" },
  draft:    { label: "Draft",    cls: "bg-yellow-100 text-yellow-700 border-yellow-200" },
};

// ── YouTube helper ─────────────────────────────────────────────────────────────
function parseYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function slugify(str: string) {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatRp(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

// ── Modal Form ────────────────────────────────────────────────────────────────
function ProductModal({
  initial, onSave, onClose,
}: {
  initial: (ProductForm & { id?: number; images?: string | null }) | null;
  onSave: () => void;
  onClose: () => void;
}) {
  const isEdit = !!initial?.id;
  const [form, setForm]         = useState<ProductForm>(initial ? { ...initial } : { ...EMPTY_FORM });
  const [imgList, setImgList]   = useState<string[]>(() => {
    try { return JSON.parse(initial?.images ?? "[]") as string[]; } catch { return []; }
  });
  const [uploading, setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [error, setError]       = useState("");
  const [saving, setSaving]     = useState(false);
  const [slugAuto, setSlugAuto] = useState(!isEdit);

  const ytId = parseYouTubeId(form.youtube_url ?? "");

  // Image helpers
  function removeImage(i: number) {
    setImgList(list => list.filter((_, idx) => idx !== i));
  }
  function moveImage(i: number, dir: -1 | 1) {
    setImgList(list => {
      const next = [...list];
      const j = i + dir;
      if (j < 0 || j >= next.length) return next;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadError("");
    setUploading(true);
    let added = 0;
    try {
      for (const file of files) {
        if (imgList.length + added >= 6) { setUploadError("Maksimal 6 foto."); break; }
        const fd = new FormData();
        fd.append("file", file);
        const res  = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) { setUploadError(data.error || "Upload gagal."); break; }
        setImgList(list => [...list, data.url as string]);
        added++;
      }
    } catch { setUploadError("Koneksi gagal saat upload."); }
    finally { setUploading(false); e.target.value = ""; }
  }

  function set<K extends keyof ProductForm>(k: K, v: ProductForm[K]) {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === "name" && slugAuto) next.slug = slugify(v as string);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Nama produk wajib diisi."); return; }
    if (form.price < 0)    { setError("Harga tidak boleh negatif."); return; }
    setSaving(true);
    try {
      const url    = isEdit ? `/api/admin/products/${initial!.id}` : "/api/admin/products";
      const method = isEdit ? "PUT" : "POST";
      const res    = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price), images: JSON.stringify(imgList) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Gagal menyimpan."); }
      else { onSave(); }
    } catch { setError("Koneksi gagal."); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto z-10">
        {/* Header modal */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{isEdit ? "Edit Produk" : "Tambah Produk Baru"}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{isEdit ? `ID: ${initial!.id}` : "Isi detail produk aplikasi Anda"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Nama + Emoji */}
          <div className="flex gap-3">
            {/* Emoji picker */}
            <div className="shrink-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ikon</label>
              <div className="relative">
                <select
                  value={form.emoji}
                  onChange={e => set("emoji", e.target.value)}
                  className="w-16 h-[42px] text-xl text-center rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer bg-white"
                >
                  {EMOJI_LIST.map(em => <option key={em} value={em}>{em}</option>)}
                </select>
              </div>
            </div>
            {/* Nama */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk <span className="text-red-500">*</span></label>
              <input
                type="text" required value={form.name}
                onChange={e => set("name", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Contoh: Aplikasi Toko Online Next.js"
              />
            </div>
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug URL
              <span className="ml-2 text-xs font-normal text-gray-400">(auto dari nama)</span>
            </label>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-gray-400 shrink-0">/produk/</span>
              <input
                type="text" value={form.slug ?? ""}
                onChange={e => { setSlugAuto(false); set("slug", e.target.value); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="aplikasi-toko-online"
              />
              <button type="button" onClick={() => { setSlugAuto(true); set("slug", slugify(form.name)); }}
                className="shrink-0 px-3 py-2 text-xs rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
                🔄 Reset
              </button>
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea
              rows={4} value={form.description ?? ""}
              onChange={e => set("description", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              placeholder="Deskripsikan fitur utama aplikasi Anda..."
            />
          </div>

          {/* Harga + Badge + Status */}
          <div className="grid grid-cols-3 gap-3">
            {/* Harga */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp) <span className="text-red-500">*</span></label>
              <input
                type="number" required min={0} value={form.price}
                onChange={e => set("price", Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="0"
              />
            </div>
            {/* Badge */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Badge</label>
              <select value={form.badge ?? ""} onChange={e => set("badge", e.target.value || null)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                {BADGE_LIST.map(b => <option key={b} value={b}>{b || "— Tanpa badge"}</option>)}
              </select>
            </div>
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value as ProductForm["status"])}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                <option value="active">Aktif</option>
                <option value="draft">Draft</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tech Stack
              <span className="ml-2 text-xs font-normal text-gray-400">pisahkan dengan koma</span>
            </label>
            <input
              type="text" value={form.tech_stack ?? ""}
              onChange={e => set("tech_stack", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Next.js, React, MySQL, Tailwind CSS"
            />
            {form.tech_stack && (
              <div className="flex flex-wrap gap-1 mt-2">
                {form.tech_stack.split(",").map(t => t.trim()).filter(Boolean).map((t, i) => (
                  <span key={i} className="inline-block px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md">{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Foto Produk */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📷 Foto Produk
              <span className="ml-2 text-xs font-normal text-gray-400">maks. 6 foto · 3 MB/foto · JPG/PNG/WebP</span>
            </label>

            {/* Preview grid */}
            {imgList.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {imgList.map((url, i) => (
                  <div key={url + i} className="relative group aspect-[4/3] rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100">
                    <Image
                      src={url} alt={`foto ${i + 1}`} fill
                      className="object-cover"
                      sizes="160px"
                    />
                    {/* Cover badge */}
                    {i === 0 && (
                      <span className="absolute top-1 left-1 text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold leading-none">
                        Cover
                      </span>
                    )}
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" />
                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 leading-none"
                    >
                      ×
                    </button>
                    {/* Move buttons */}
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {i > 0 && (
                        <button type="button" onClick={() => moveImage(i, -1)}
                          className="w-5 h-5 bg-black/60 text-white rounded text-xs flex items-center justify-center hover:bg-black/80 leading-none">
                          ‹
                        </button>
                      )}
                      {i < imgList.length - 1 && (
                        <button type="button" onClick={() => moveImage(i, 1)}
                          className="w-5 h-5 bg-black/60 text-white rounded text-xs flex items-center justify-center hover:bg-black/80 leading-none">
                          ›
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            {imgList.length < 6 && (
              <label className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed transition-colors cursor-pointer
                ${uploading
                  ? "border-gray-200 text-gray-300 cursor-not-allowed"
                  : "border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-500"
                }`}>
                {uploading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    <span className="text-sm">Mengupload...</span>
                  </>
                ) : (
                  <>
                    <span>📁</span>
                    <span className="text-sm">Pilih foto{imgList.length > 0 ? " (tambah)" : ""}</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  disabled={uploading}
                  onChange={handleImageUpload}
                />
              </label>
            )}
            {uploadError && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">⚠️ {uploadError}</p>
            )}
            {imgList.length > 0 && (
              <p className="mt-1.5 text-xs text-gray-400">
                Foto pertama = cover. Klik ‹ › untuk mengubah urutan, × untuk hapus.
              </p>
            )}
          </div>

          {/* YouTube URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🎬 URL Video YouTube
              <span className="ml-2 text-xs font-normal text-gray-400">opsional — demo/preview produk</span>
            </label>
            <input
              type="url" value={form.youtube_url ?? ""}
              onChange={e => set("youtube_url", e.target.value || null)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            {/* Preview */}
            {ytId ? (
              <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <div className="bg-gray-100 px-3 py-1.5 flex items-center gap-2 text-xs text-gray-500 border-b border-gray-200">
                  <span>▶️</span> Preview video — ID: <code className="font-mono text-gray-700">{ytId}</code>
                </div>
                <div className="relative aspect-video">
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                    title="YouTube preview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : form.youtube_url ? (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">⚠️ URL YouTube tidak valid</p>
            ) : null}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              {saving
                ? (<><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Menyimpan...</>)
                : isEdit ? "💾 Simpan Perubahan" : "✅ Tambah Produk"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteModal({ product, onConfirm, onClose }: { product: Product; onConfirm: () => void; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  async function doDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      if (res.ok) onConfirm();
    } finally { setLoading(false); }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">🗑️</div>
          <h3 className="text-lg font-bold text-gray-900">Hapus Produk?</h3>
          <p className="text-sm text-gray-500 mt-1">
            Produk <strong className="text-gray-800">{product.emoji} {product.name}</strong> akan dihapus permanen.
            {Number(product.order_count) > 0 && (
              <span className="block mt-1 text-orange-600 text-xs">⚠️ Produk ini memiliki {product.order_count} pesanan yang akan terpengaruh.</span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
          <button onClick={doDelete} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60 transition-colors">
            {loading ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modalData, setModalData]   = useState<(ProductForm & { id?: number; images?: string | null }) | null>(null);
  const [modalOpen, setModalOpen]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/products");
      const data = await res.json();
      setProducts(data.products ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filter + search
  const filtered = products.filter(p => {
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.tech_stack ?? "").toLowerCase().includes(q) || (p.badge ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  function openCreate() {
    setModalData({ ...EMPTY_FORM });
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setModalData({
      id: p.id, name: p.name, slug: p.slug, description: p.description,
      images: p.images, price: p.price, tech_stack: p.tech_stack, badge: p.badge,
      emoji: p.emoji, status: p.status, youtube_url: p.youtube_url,
    });
    setModalOpen(true);
  }

  // Stats
  const totalActive   = products.filter(p => p.status === "active").length;
  const totalDraft    = products.filter(p => p.status === "draft").length;
  const totalInactive = products.filter(p => p.status === "inactive").length;

  return (
    <>
      <AdminHeader title="Manajemen Produk" />

      <div className="flex-1 p-6 space-y-6 overflow-auto">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Produk", value: products.length, icon: "📦", cls: "bg-indigo-50 text-indigo-700" },
            { label: "Aktif",        value: totalActive,     icon: "✅", cls: "bg-green-50 text-green-700" },
            { label: "Draft",        value: totalDraft,      icon: "📝", cls: "bg-yellow-50 text-yellow-700" },
            { label: "Nonaktif",     value: totalInactive,   icon: "⛔", cls: "bg-gray-50 text-gray-600" },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl p-4 border ${s.cls} border-current/10`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-sm font-medium opacity-80">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                type="text" value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama, tech stack..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            {/* Filter status */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="draft">Draft</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shrink-0"
          >
            ＋ Tambah Produk
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 flex items-center justify-center text-gray-400 gap-3">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
              Memuat produk...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <div className="text-5xl mb-3">📦</div>
              <p className="font-medium text-gray-500">{search || filterStatus !== "all" ? "Tidak ada produk yang cocok" : "Belum ada produk"}</p>
              {!search && filterStatus === "all" && (
                <button onClick={openCreate} className="mt-3 text-sm text-indigo-600 hover:underline">Tambah produk pertama →</button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Produk</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Harga</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Tech Stack</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Foto</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Video</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Pesanan</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(p => {
                    const ytId = parseYouTubeId(p.youtube_url ?? "");
                    const st   = STATUS_LABEL[p.status] ?? STATUS_LABEL.inactive;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/80 transition-colors group">
                        {/* Produk */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xl shrink-0 border border-indigo-100">
                              {p.emoji}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate max-w-[200px]">{p.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {p.badge && (
                                  <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-md border border-orange-200">
                                    {p.badge}
                                  </span>
                                )}
                                {p.slug && (
                                  <span className="text-[10px] text-gray-400 font-mono truncate max-w-[120px]">/{p.slug}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* Harga */}
                        <td className="px-4 py-4">
                          <span className="font-bold text-gray-800">{formatRp(p.price)}</span>
                        </td>
                        {/* Tech Stack */}
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {(p.tech_stack ?? "").split(",").map(t => t.trim()).filter(Boolean).slice(0, 3).map((t, i) => (
                              <span key={i} className="text-[10px] font-medium px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">{t}</span>
                            ))}
                            {(p.tech_stack ?? "").split(",").filter(Boolean).length > 3 && (
                              <span className="text-[10px] text-gray-400">+{(p.tech_stack ?? "").split(",").filter(Boolean).length - 3}</span>
                            )}
                          </div>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${st.cls}`}>
                            {st.label}
                          </span>
                        </td>
                        {/* Foto */}
                        <td className="px-4 py-4 text-center hidden md:table-cell">
                          {(() => {
                            const imgs = (() => { try { return JSON.parse(p.images ?? "[]") as string[]; } catch { return []; } })();
                            return imgs.length > 0 ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                🖼 {imgs.length}
                              </span>
                            ) : (
                              <span className="text-gray-200 text-xs">—</span>
                            );
                          })()}
                        </td>
                        {/* Video */}
                        <td className="px-4 py-4 text-center hidden md:table-cell">
                          {ytId ? (
                            <a href={`https://youtu.be/${ytId}`} target="_blank" rel="noopener noreferrer"
                              title="Lihat video" className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors text-base">
                              ▶
                            </a>
                          ) : (
                            <span className="text-gray-200 text-xs">—</span>
                          )}
                        </td>
                        {/* Pesanan */}
                        <td className="px-4 py-4 text-center hidden md:table-cell">
                          <span className={`font-bold ${Number(p.order_count) > 0 ? "text-indigo-600" : "text-gray-300"}`}>
                            {p.order_count}
                          </span>
                        </td>
                        {/* Aksi */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEdit(p)}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-100"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => setDeleteTarget(p)}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-100"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Footer */}
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 flex items-center justify-between">
                <span>Menampilkan <strong className="text-gray-600">{filtered.length}</strong> dari <strong className="text-gray-600">{products.length}</strong> produk</span>
                <button onClick={load} className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
                  🔄 Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <ProductModal
          initial={modalData}
          onSave={() => { setModalOpen(false); load(); }}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteModal
          product={deleteTarget}
          onConfirm={() => { setDeleteTarget(null); load(); }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
