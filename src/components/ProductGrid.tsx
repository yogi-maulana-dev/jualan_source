"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";

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
  sales_count: number;
}

const BADGE_COLOR: Record<string, string> = {
  "NEW":         "bg-green-100 text-green-700",
  "HOT":         "bg-red-100 text-red-700",
  "SALE":        "bg-orange-100 text-orange-700",
  "BEST SELLER": "bg-yellow-100 text-yellow-700",
  "LIMITED":     "bg-purple-100 text-purple-700",
  "PROMO":       "bg-pink-100 text-pink-700",
  "FEATURED":    "bg-indigo-100 text-indigo-700",
};

function badgeClass(badge: string) {
  return BADGE_COLOR[badge.toUpperCase()] ?? "bg-gray-100 text-gray-700";
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);
}

const SORT_OPTIONS = [
  { value: "popular",   label: "Terpopuler" },
  { value: "newest",    label: "Terbaru" },
  { value: "price_asc", label: "Harga Terendah" },
  { value: "price_desc","label": "Harga Tertinggi" },
];

export default function ProductGrid({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");
  const [sort,   setSort]   = useState("popular");
  const [tech,   setTech]   = useState("semua");

  // Kumpulkan semua tech stack unik
  const allTech = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      (p.tech_stack ?? "").split(",").map(t => t.trim()).filter(Boolean).forEach(t => set.add(t));
    });
    return ["semua", ...Array.from(set).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...products];

    // Filter search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.tech_stack ?? "").toLowerCase().includes(q)
      );
    }

    // Filter tech
    if (tech !== "semua") {
      list = list.filter(p =>
        (p.tech_stack ?? "").split(",").map(t => t.trim()).includes(tech)
      );
    }

    // Sort
    switch (sort) {
      case "popular":    list.sort((a, b) => b.sales_count - a.sales_count); break;
      case "price_asc":  list.sort((a, b) => a.price - b.price); break;
      case "price_desc": list.sort((a, b) => b.price - a.price); break;
      // "newest" — urutan dari server sudah benar
    }

    return list;
  }, [products, search, sort, tech]);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
            </svg>
          </span>
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama, tech stack, deskripsi..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
          />
        </div>

        {/* Sort */}
        <select
          value={sort} onChange={e => setSort(e.target.value)}
          className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm shrink-0"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Filter tech stack */}
      {allTech.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {allTech.map(t => (
            <button
              key={t}
              onClick={() => setTech(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                tech === t
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              {t === "semua" ? `🗂 Semua (${products.length})` : t}
            </button>
          ))}
        </div>
      )}

      {/* Result info */}
      <p className="text-sm text-gray-400 mb-6">
        Menampilkan <strong className="text-gray-700">{filtered.length}</strong> produk
        {(search || tech !== "semua") && (
          <button onClick={() => { setSearch(""); setTech("semua"); }}
            className="ml-3 text-indigo-500 hover:underline text-xs">
            Reset filter
          </button>
        )}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">🔍</div>
          <p className="font-medium">Tidak ada produk yang cocok.</p>
          <button onClick={() => { setSearch(""); setTech("semua"); }}
            className="mt-4 text-sm text-indigo-500 hover:underline">
            Lihat semua produk
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(p => {
            const href = `/produk/${p.slug ?? p.id}`;
            return (
              <Link key={p.id} href={href} className="group block">
                <article className="relative flex flex-col h-full rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                  {/* Gambar / emoji */}
                  {(() => {
                    const imgs = (() => { try { return JSON.parse(p.images ?? "[]") as string[]; } catch { return []; } })();
                    const first = imgs[0] ?? null;
                    return (
                      <div className="relative aspect-[4/3] bg-indigo-50 overflow-hidden">
                        {first ? (
                          <Image
                            src={first} alt={p.name} fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-5xl">{p.emoji}</div>
                        )}
                        {imgs.length > 1 && (
                          <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
                            +{imgs.length - 1} foto
                          </span>
                        )}
                        {p.badge && (
                          <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full ${badgeClass(p.badge)}`}>
                            {p.badge}
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  <div className="p-5 flex flex-col flex-1">
                  <h2 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {p.name}
                  </h2>
                  <p className="mt-2 text-sm text-gray-500 flex-1 leading-relaxed line-clamp-3">
                    {p.description ?? "Aplikasi siap pakai berkualitas tinggi."}
                  </p>

                  {p.tech_stack && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {p.tech_stack.split(",").map(t => t.trim()).filter(Boolean).slice(0, 4).map(t => (
                        <span key={t} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                      {p.tech_stack.split(",").filter(Boolean).length > 4 && (
                        <span className="text-[11px] text-gray-400">+{p.tech_stack.split(",").filter(Boolean).length - 4}</span>
                      )}
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-lg font-bold text-indigo-600">{formatRupiah(p.price)}</span>
                    <span className="text-xs font-semibold text-indigo-500 group-hover:translate-x-1 transition-transform inline-block">
                      Lihat Detail →
                    </span>
                  </div>

                  {p.sales_count > 0 && (
                    <p className="mt-2 text-xs text-gray-400">🛒 {p.sales_count} terjual</p>
                  )}
                  </div>{/* end p-5 */}
                </article>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
