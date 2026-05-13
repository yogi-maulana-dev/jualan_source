import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { queryOne } from "@/lib/db";
import OrderForm from "./OrderForm";

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
  single:   "Single domain",
  wildcard: "Wildcard (*.domain — sub-domain unlimited)",
  multi:    "Multi-domain (SAN)",
};
const TYPE_LABEL: Record<string, string> = {
  DV: "DV — Domain Validation",
  OV: "OV — Organization Validation",
  EV: "EV — Extended Validation",
};

async function load(slug: string): Promise<SslProduct | null> {
  const isNum = /^\d+$/.test(slug);
  const sql = isNum
    ? `SELECT id, name, slug, brand, ssl_type, coverage, description, features, warranty_usd, validity_days, price, emoji, badge FROM ssl_products WHERE id = ? AND status = 'active'`
    : `SELECT id, name, slug, brand, ssl_type, coverage, description, features, warranty_usd, validity_days, price, emoji, badge FROM ssl_products WHERE slug = ? AND status = 'active'`;
  return await queryOne<SslProduct>(sql, [slug]).catch(() => null) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await load(slug);
  if (!p) return { title: "SSL tidak ditemukan" };
  return {
    title: `${p.name} — Sewa SSL ${p.brand ?? ""}`.trim(),
    description: p.description ?? `Sewa ${p.name} mulai ${rupiah(p.price)} untuk ${p.validity_days} hari.`,
  };
}

export default async function SslDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await load(slug);
  if (!p) notFound();

  const features = (() => { try { return JSON.parse(p.features ?? "[]") as string[]; } catch { return []; } })();

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <a href="/ssl" className="text-sm text-indigo-600 hover:underline">← Semua paket SSL</a>

        <div className="grid lg:grid-cols-[1fr_420px] gap-10 mt-6">
          {/* Detail */}
          <article>
            <div className="flex items-start gap-4 mb-4">
              <span className="text-5xl">{p.emoji}</span>
              <div>
                {p.badge && <span className="inline-block text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold mb-2">{p.badge}</span>}
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">{p.name}</h1>
                <p className="text-sm text-gray-400 mt-1">{p.brand} • {TYPE_LABEL[p.ssl_type]}</p>
              </div>
            </div>

            <p className="text-gray-600 leading-relaxed mb-6">{p.description}</p>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-4">Spesifikasi</h3>
              <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <Spec k="Coverage"      v={COVERAGE_LABEL[p.coverage]} />
                <Spec k="Tipe Validasi" v={TYPE_LABEL[p.ssl_type]} />
                <Spec k="Validity"      v={`${p.validity_days} hari`} />
                <Spec k="Warranty"      v={p.warranty_usd > 0 ? `$${p.warranty_usd.toLocaleString("en-US")}` : "-"} />
              </dl>
            </div>

            {features.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Fitur</h3>
                <ul className="space-y-2">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-0.5">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>

          {/* Order form */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="text-3xl font-extrabold text-indigo-600">{rupiah(p.price)}</div>
              <div className="text-xs text-gray-400 mb-5">untuk {p.validity_days} hari</div>
              <OrderForm productId={p.id} productName={p.name} price={p.price} />
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Spec({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{k}</dt>
      <dd className="text-gray-900 font-medium">{v}</dd>
    </div>
  );
}
