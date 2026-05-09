import Link from "next/link";
import Image from "next/image";
import { query, queryOne } from "@/lib/db";

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

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);
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

async function getSettings() {
  try {
    const rows = await query<{ key: string; value: string }>(
      "SELECT `key`, value FROM site_settings WHERE `key` LIKE 'catalog_%'"
    );
    const s: Record<string, string> = {};
    for (const r of rows) s[r.key] = r.value;
    return s;
  } catch { return {}; }
}

export default async function Products() {
  const [products, settings] = await Promise.all([
    query<Product>(
      `SELECT id, name, slug, description, images, price, tech_stack, badge, emoji, sales_count
       FROM products WHERE status = 'active'
       ORDER BY sales_count DESC, created_at DESC LIMIT 6`
    ).catch(() => [] as Product[]),
    getSettings(),
  ]);

  const title   = settings.catalog_title       ?? "Katalog Produk";
  const heading = settings.catalog_heading     ?? "Pilih Aplikasi Sesuai Kebutuhan";
  const desc    = settings.catalog_description ?? "Semua produk sudah production-ready, dilengkapi dokumentasi lengkap dan source code yang bersih.";

  return (
    <section id="produk" className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wider">
            {title}
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-gray-900">
            {heading}
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">{desc}</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📦</div>
            <p>Produk akan segera hadir. Pantau terus!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => {
              const href   = `/produk/${p.slug ?? p.id}`;
              const imgs   = (() => { try { return JSON.parse(p.images ?? "[]") as string[]; } catch { return []; } })();
              const firstImg = imgs[0] ?? null;
              const badgeCls = p.badge ? (BADGE_COLOR[p.badge.toUpperCase()] ?? "bg-gray-100 text-gray-700") : "";

              return (
                <article key={p.id}
                  className="group relative flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden">

                  {/* Gambar / emoji placeholder */}
                  <div className="relative aspect-[4/3] bg-indigo-50 overflow-hidden">
                    {firstImg ? (
                      <Image
                        src={firstImg} alt={p.name} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-6xl">{p.emoji}</div>
                    )}
                    {imgs.length > 1 && (
                      <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
                        +{imgs.length - 1} foto
                      </span>
                    )}
                    {p.badge && (
                      <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full ${badgeCls}`}>
                        {p.badge}
                      </span>
                    )}
                  </div>

                  {/* Konten */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-base font-bold text-gray-900 leading-snug">{p.name}</h3>
                    <p className="mt-1.5 text-sm text-gray-500 flex-1 leading-relaxed line-clamp-2">
                      {p.description ?? "Aplikasi siap pakai berkualitas tinggi."}
                    </p>

                    {p.tech_stack && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {p.tech_stack.split(",").map(t => t.trim()).filter(Boolean).slice(0, 3).map(t => (
                          <span key={t} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-lg font-bold text-indigo-600">{formatRupiah(p.price)}</span>
                      <Link href={href}
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors group-hover:translate-x-0.5 inline-block transition-transform">
                        Detail →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="text-center mt-12">
          <Link href="/produk"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border-2 border-indigo-600 text-indigo-600 font-semibold hover:bg-indigo-600 hover:text-white transition-all">
            Lihat Semua Produk →
          </Link>
        </div>
      </div>
    </section>
  );
}
