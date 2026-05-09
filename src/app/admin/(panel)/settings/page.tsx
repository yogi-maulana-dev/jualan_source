"use client";
import { useState, useEffect, FormEvent } from "react";
import AdminHeader from "@/components/admin/AdminHeader";

// ── Types ──────────────────────────────────────────────────────────────────────
interface SettingField {
  key: string;
  value: string;
  label: string;
  multiline?: boolean;
  placeholder?: string;
}

// Urutan & metadata tampilan
const FIELD_META: Record<string, { label: string; multiline?: boolean; placeholder?: string; section?: string }> = {
  catalog_title: {
    label: "Label kecil di atas heading",
    placeholder: "Katalog Produk",
    section: "Halaman Utama — Section Produk",
  },
  catalog_heading: {
    label: "Judul utama section produk",
    placeholder: "Pilih Aplikasi Sesuai Kebutuhan",
  },
  catalog_description: {
    label: "Deskripsi section produk",
    multiline: true,
    placeholder: "Semua produk sudah production-ready...",
  },
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [fields,  setFields]  = useState<SettingField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");

  // Load settings dari API
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res  = await fetch("/api/admin/settings");
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? `Error ${res.status}: gagal memuat settings.`);
          return;
        }

        const settings = (data.settings ?? {}) as Record<string, string>;
        const meta     = (data.meta     ?? {}) as Record<string, string>;

        // Jika tabel kosong, tetap tampilkan field dari FIELD_META dengan value kosong
        const knownKeys = Object.keys(FIELD_META);
        const extraKeys = Object.keys(settings).filter(k => !knownKeys.includes(k));

        const list: SettingField[] = [
          ...knownKeys.map(k => ({
            key:         k,
            value:       settings[k] ?? "",
            label:       meta[k] ?? FIELD_META[k]?.label ?? k,
            multiline:   FIELD_META[k]?.multiline,
            placeholder: FIELD_META[k]?.placeholder,
          })),
          ...extraKeys.map(k => ({
            key:   k,
            value: settings[k] ?? "",
            label: meta[k] ?? k,
          })),
        ];
        setFields(list);
      } catch (err) {
        setError("Gagal memuat settings. Pastikan tabel site_settings sudah dibuat di database.");
        console.error("[settings load]", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function updateField(key: string, value: string) {
    setFields(prev => prev.map(f => f.key === key ? { ...f, value } : f));
    setSaved(false);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      for (const f of fields) body[f.key] = f.value;

      const res = await fetch("/api/admin/settings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Gagal menyimpan."); }
      else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch {
      setError("Koneksi gagal.");
    } finally {
      setSaving(false);
    }
  }

  // Kelompokkan berdasarkan prefix
  const sections = fields.reduce<Record<string, SettingField[]>>((acc, f) => {
    const rawSection = FIELD_META[f.key]?.section ?? getSectionLabel(f.key);
    if (!acc[rawSection]) acc[rawSection] = [];
    acc[rawSection].push(f);
    return acc;
  }, {});

  return (
    <>
      <AdminHeader title="Pengaturan Konten" />

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-2xl">

          {/* Info */}
          <div className="mb-6 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-3">
            <span className="text-xl mt-0.5">💡</span>
            <div className="text-sm text-indigo-800">
              <p className="font-semibold mb-1">Teks yang bisa diedit</p>
              <p className="text-indigo-600">Perubahan akan langsung tampil di halaman publik setelah disimpan.</p>
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex items-center justify-center text-gray-400 gap-3">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Memuat settings...
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">

              {Object.entries(sections).map(([sectionLabel, sectionFields]) => (
                <div key={sectionLabel} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Section header */}
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <span className="w-1.5 h-5 bg-indigo-500 rounded-full inline-block" />
                      {sectionLabel}
                    </h2>
                  </div>

                  <div className="p-6 space-y-5">
                    {sectionFields.map(f => (
                      <div key={f.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {f.label}
                          <span className="ml-2 text-xs font-normal text-gray-400 font-mono">{f.key}</span>
                        </label>
                        {f.multiline ? (
                          <textarea
                            rows={3}
                            value={f.value}
                            onChange={e => updateField(f.key, e.target.value)}
                            placeholder={f.placeholder}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                          />
                        ) : (
                          <input
                            type="text"
                            value={f.value}
                            onChange={e => updateField(f.key, e.target.value)}
                            placeholder={f.placeholder}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <span>⚠️</span> {error}
                </div>
              )}

              {/* Save button */}
              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Menyimpan...
                    </>
                  ) : "💾 Simpan Perubahan"}
                </button>

                {saved && (
                  <span className="text-sm text-green-600 font-medium flex items-center gap-1.5">
                    <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-xs">✓</span>
                    Tersimpan!
                  </span>
                )}
              </div>

            </form>
          )}
        </div>
      </div>
    </>
  );
}

function getSectionLabel(key: string): string {
  if (key.startsWith("catalog_")) return "Halaman Utama — Section Produk";
  if (key.startsWith("hero_"))    return "Halaman Utama — Hero Section";
  if (key.startsWith("footer_"))  return "Footer";
  if (key.startsWith("seo_"))     return "SEO & Meta";
  return "Pengaturan Lainnya";
}
