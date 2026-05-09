export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ImageSlider from "@/components/ImageSlider";
import { queryOne, query } from "@/lib/db";

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
  youtube_url: string | null;
  sales_count: number;
}

interface Props { params: Promise<{ slug: string }> }

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseYouTubeId(url: string): string | null {
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

async function getProduct(slug: string): Promise<Product | null> {
  const isId = !isNaN(Number(slug));
  return (await queryOne<Product>(
    `SELECT id, name, slug, description, images, price, tech_stack, badge, emoji, youtube_url, sales_count
     FROM products
     WHERE status = 'active' AND (slug = ? OR ${isId ? "id = ?" : "1=0"})
     LIMIT 1`,
    isId ? [slug, Number(slug)] : [slug]
  )) ?? null;
}

// ── generateMetadata ──────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product  = await getProduct(slug);
  if (!product) return { title: "Produk Tidak Ditemukan" };

  return {
    title: `${product.name} – AplikasiJadi.com`,
    description: product.description ?? `Beli ${product.name} source code siap pakai di AplikasiJadi.com`,
    openGraph: {
      title: product.name,
      description: product.description ?? "",
      type: "website",
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product  = await getProduct(slug);
  if (!product) notFound();

  const ytId    = product.youtube_url ? parseYouTubeId(product.youtube_url) : null;
  const techArr = (product.tech_stack ?? "").split(",").map(t => t.trim()).filter(Boolean);
  const imgArr  = (() => { try { return JSON.parse(product.images ?? "[]") as string[]; } catch { return []; } })();

  // Produk lainnya (rekomendasi)
  let related: Product[] = [];
  try {
    related = await query<Product>(
      `SELECT id, name, slug, price, emoji, badge, tech_stack
       FROM products
       WHERE status = 'active' AND id != ?
       ORDER BY sales_count DESC LIMIT 3`,
      [product.id]
    );
  } catch { related = []; }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-16">

        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-2">
          <nav className="flex items-center gap-2 text-xs text-gray-400">
            <Link href="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
            <span>/</span>
            <Link href="/produk" className="hover:text-indigo-600 transition-colors">Produk</Link>
            <span>/</span>
            <span className="text-gray-600 font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* ── Konten utama ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Foto slider */}
              {imgArr.length > 0 && (
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 p-4">
                  <ImageSlider images={imgArr} alt={product.name} emoji={product.emoji} aspectRatio="4/3" />
                </div>
              )}

              {/* Header produk */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-4xl shrink-0 border border-indigo-100">
                    {product.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {product.badge && (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${BADGE_COLOR[product.badge.toUpperCase()] ?? "bg-gray-100 text-gray-700"}`}>
                          {product.badge}
                        </span>
                      )}
                      {product.sales_count > 0 && (
                        <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                          🛒 {product.sales_count} terjual
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-900">{product.name}</h1>
                  </div>
                </div>
              </div>

              {/* Video YouTube */}
              {ytId && (
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                    <span className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center text-sm">▶</span>
                    <span className="text-sm font-semibold text-gray-700">Demo Video</span>
                  </div>
                  <div className="relative aspect-video bg-black">
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                      title={`Demo ${product.name}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Deskripsi */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-indigo-600 rounded-full inline-block" />
                  Tentang Produk Ini
                </h2>
                {product.description ? (
                  <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {product.description}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Deskripsi belum tersedia.</p>
                )}
              </div>

              {/* Tech Stack */}
              {techArr.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-indigo-600 rounded-full inline-block" />
                    Teknologi yang Digunakan
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {techArr.map(t => (
                      <span key={t} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-800 text-sm font-semibold border border-indigo-100">
                        <span className="text-indigo-400">⚡</span> {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Yang didapat */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-green-500 rounded-full inline-block" />
                  Yang Anda Dapatkan
                </h2>
                <ul className="space-y-2.5">
                  {[
                    "✅ Source code lengkap & bersih",
                    "✅ Dokumentasi instalasi & penggunaan",
                    "✅ Gratis update minor selamanya",
                    "✅ Support via WhatsApp / email",
                    "✅ Bebas dimodifikasi sesuai kebutuhan",
                  ].map(item => (
                    <li key={item} className="text-sm text-gray-700">{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ── Sidebar harga & CTA ── */}
            <div className="space-y-5">
              {/* Card harga */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-20">
                <div className="text-3xl font-extrabold text-indigo-600 mb-1">
                  {formatRupiah(product.price)}
                </div>
                <p className="text-xs text-gray-400 mb-6">Harga sudah termasuk source code & dokumentasi</p>

                {/* CTA Beli */}
                <a
                  href={`https://wa.me/6281234567890?text=${encodeURIComponent(`Halo, saya tertarik membeli ${product.name} (${formatRupiah(product.price)}). Apakah masih tersedia?`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 transition-colors shadow-sm shadow-green-200 mb-3"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Beli via WhatsApp
                </a>

                <a
                  href={`mailto:info@aplikasijadi.com?subject=Pembelian: ${encodeURIComponent(product.name)}&body=${encodeURIComponent(`Halo,\n\nSaya tertarik membeli ${product.name} seharga ${formatRupiah(product.price)}.\n\nMohon informasi cara pembeliannya.\n\nTerima kasih.`)}`}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-indigo-600 text-indigo-600 font-semibold text-sm hover:bg-indigo-50 transition-colors"
                >
                  📧 Hubungi via Email
                </a>

                <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
                  {[
                    { icon: "🔒", text: "Pembayaran aman" },
                    { icon: "⚡", text: "Akses instan setelah bayar" },
                    { icon: "🔄", text: "Refund jika tidak sesuai" },
                  ].map(item => (
                    <div key={item.text} className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{item.icon}</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bagikan */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Bagikan</p>
                <div className="flex gap-2">
                  <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Cek aplikasi ini: ${product.name} - ${formatRupiah(product.price)}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center py-2 rounded-xl bg-black text-white text-xs font-semibold hover:bg-gray-800 transition-colors">
                    𝕏 Twitter
                  </a>
                  <a href={`https://wa.me/?text=${encodeURIComponent(`Cek aplikasi ini: ${product.name} - ${formatRupiah(product.price)}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center py-2 rounded-xl bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-colors">
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ── Produk lainnya ── */}
          {related.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Produk Lainnya</h2>
              <div className="grid sm:grid-cols-3 gap-5">
                {related.map(r => (
                  <Link key={r.id} href={`/produk/${r.slug ?? r.id}`}
                    className="group flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl shrink-0 border border-indigo-100">
                      {r.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{r.name}</p>
                      <p className="text-sm font-bold text-indigo-600 mt-0.5">{formatRupiah(r.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back */}
          <div className="mt-10 text-center">
            <Link href="/produk" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-600 transition-colors">
              ← Kembali ke Katalog
            </Link>
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
