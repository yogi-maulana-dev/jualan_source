import Link from "next/link";
import type { Metadata } from "next";
import { query } from "@/lib/db";

export const metadata: Metadata = {
  title: "Sewa SSL Murah & Cepat — AplikasiJadi",
  description: "Sewa SSL DV, OV, EV, Wildcard untuk website Anda. Bayar sekali, aman 1 tahun. Issuance cepat dengan jaminan refund 30 hari.",
};

interface SslProduct {
  id: number;
  name: string;
  slug: string | null;
  brand: string | null;
  ssl_type: string;
  coverage: string;
  description: string | null;
  features: string | null;
  warranty_usd: number;
  validity_days: number;
  price: number;
  emoji: string;
  badge: string | null;
}

function rupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

const COVERAGE_LABEL: Record<string, string> = {
  single:   "1 domain",
  wildcard: "Wildcard (sub-domain unlimited)",
  multi:    "Multi-domain (SAN)",
};

export default async function SslCatalog() {
  const products = await query<SslProduct>(
    `SELECT id, name, slug, brand, ssl_type, coverage, description, features,
            warranty_usd, validity_days, price, emoji, badge
     FROM ssl_products WHERE status = 'active'
     ORDER BY price ASC`
  ).catch(() => [] as SslProduct[]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-3">
            🔒 SSL Certificate
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900">
            Sewa SSL Murah & Cepat
          </h1>
          <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
            Amankan website Anda dengan SSL resmi dari Sectigo, DigiCert, dan lainnya.
            Bayar via Xendit (VA, e-wallet, QRIS, kartu). Issuance manual cepat.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-3">🔒</div>
            <p>Paket SSL akan segera hadir.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => {
              const features = (() => { try { return JSON.parse(p.features ?? "[]") as string[]; } catch { return []; } })();
              const href = `/ssl/${p.slug ?? p.id}`;
              return (
                <article key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 p-6 flex flex-col">
                  {p.badge && (
                    <span className="self-start mb-3 text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                      {p.badge}
                    </span>
                  )}
                  <div className="flex items-start gap-3">
                    <span className="text-4xl">{p.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 leading-snug">{p.name}</h3>
                      <p className="text-xs text-gray-400">{p.brand} • {p.ssl_type}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-500 line-clamp-2">{p.description ?? ""}</p>

                  <ul className="mt-4 space-y-1.5 text-xs text-gray-600 flex-1">
                    <li className="flex items-center gap-2"><span className="text-green-500">✓</span> {COVERAGE_LABEL[p.coverage]}</li>
                    <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Berlaku {p.validity_days} hari</li>
                    {p.warranty_usd > 0 && <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Warranty ${p.warranty_usd.toLocaleString("en-US")}</li>}
                    {features.slice(0, 2).map((f, i) => (
                      <li key={i} className="flex items-center gap-2"><span className="text-green-500">✓</span> {f}</li>
                    ))}
                  </ul>

                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <div className="text-2xl font-extrabold text-indigo-600">{rupiah(p.price)}</div>
                    <div className="text-xs text-gray-400 mb-3">/ {p.validity_days} hari</div>
                    <Link href={href} className="block text-center py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors">
                      Pesan Sekarang →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Cara kerja */}
        <section className="mt-20">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Cara Kerja</h2>
          <div className="grid sm:grid-cols-4 gap-5">
            {[
              { n: 1, t: "Pilih paket", d: "Pilih SSL sesuai kebutuhan: DV, Wildcard, OV, atau EV." },
              { n: 2, t: "Isi data & CSR", d: "Submit domain, kontak, dan CSR (kami bisa bantu generate)." },
              { n: 3, t: "Bayar via Xendit", d: "VA, e-wallet, QRIS, atau kartu. Otomatis terkonfirmasi." },
              { n: 4, t: "Terima SSL", d: "Setelah issued, kami kirim file .crt + .ca-bundle via email." },
            ].map((s) => (
              <div key={s.n} className="bg-white rounded-xl p-5 border border-gray-100">
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center mb-3">{s.n}</div>
                <h3 className="font-bold text-gray-900 mb-1">{s.t}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cek pesanan */}
        <div className="mt-16 text-center text-sm text-gray-500">
          Sudah pesan tapi belum dapat email? <Link href="/ssl/cek" className="text-indigo-600 font-semibold hover:underline">Cek status pesanan →</Link>
        </div>
      </section>
    </main>
  );
}
