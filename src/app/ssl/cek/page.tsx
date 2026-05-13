"use client";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import Link from "next/link";

export default function CekPesananPage() {
  const router = useRouter();
  const [code,  setCode]  = useState("");
  const [email, setEmail] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const c = code.trim();
    if (!c) return;
    const q = email.trim() ? `?email=${encodeURIComponent(email.trim())}` : "";
    router.push(`/ssl/pesanan/${c}${q}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white flex items-center">
      <section className="max-w-md mx-auto px-4 sm:px-6 py-16 w-full">
        <Link href="/ssl" className="text-sm text-indigo-600 hover:underline">← Katalog SSL</Link>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 mt-6">
          <h1 className="text-xl font-extrabold text-gray-900 mb-1">Cek Status Pesanan</h1>
          <p className="text-sm text-gray-500 mb-5">Masukkan kode pesanan untuk lihat status & download SSL.</p>
          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block">
              <span className="block text-xs font-semibold text-gray-700 mb-1">Kode pesanan *</span>
              <input
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="SSL-202611-XXXXXX"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-indigo-500 font-mono"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-gray-700">Email (opsional)</span>
              <span className="block text-[10px] text-gray-400 mb-1">Wajib kalau mau download file SSL</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@anda.com"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-indigo-500"
              />
            </label>
            <button type="submit" className="w-full py-3 rounded-lg bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700">
              Cek Pesanan →
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
