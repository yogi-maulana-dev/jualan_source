export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { query } from "@/lib/db";
import ProductGrid from "@/components/ProductGrid";

export const metadata: Metadata = {
  title: "Katalog Produk – Semua Aplikasi Siap Pakai",
  description:
    "Jelajahi semua aplikasi web dan mobile siap pakai. Filter berdasarkan teknologi, harga, atau kategori.",
};

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

export default async function ProdukPage() {
  let products: Product[] = [];
  try {
    products = await query<Product>(
      `SELECT id, name, slug, description, images, price, tech_stack, badge, emoji, sales_count
       FROM products
       WHERE status = 'active'
       ORDER BY sales_count DESC, created_at DESC`
    );
  } catch {
    products = [];
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-16">

        {/* Hero kecil */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-14 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-indigo-200 text-sm font-semibold uppercase tracking-widest mb-3">
              Katalog Lengkap
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
              Semua Aplikasi Siap Pakai
            </h1>
            <p className="text-indigo-200 max-w-xl mx-auto">
              {products.length} produk tersedia — source code lengkap, dokumentasi jelas, support gratis.
            </p>
          </div>
        </div>

        {/* Grid produk dengan search & filter (client component) */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <ProductGrid products={products} />
        </div>

      </main>
      <Footer />
    </>
  );
}
