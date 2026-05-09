"use client";
import { useState } from "react";

const faqs = [
  {
    q: "Apakah saya mendapatkan source code penuh?",
    a: "Ya, Anda mendapatkan 100% source code tanpa enkripsi atau obfuscation. Anda bebas memodifikasi sesuai kebutuhan proyek Anda.",
  },
  {
    q: "Bagaimana proses pengiriman setelah pembayaran?",
    a: "Setelah pembayaran dikonfirmasi (biasanya 1-5 menit untuk transfer bank, instan untuk e-wallet), link unduhan akan dikirim ke email Anda.",
  },
  {
    q: "Apakah ada dukungan teknis?",
    a: "Ya, setiap pembelian mendapat support gratis 30 hari via WhatsApp dan email. Kami merespons pertanyaan teknis dalam 24 jam.",
  },
  {
    q: "Bolehkah saya gunakan untuk proyek klien?",
    a: "Tentu! Lisensi komersial sudah termasuk. Anda bebas menggunakan untuk proyek klien tanpa biaya tambahan.",
  },
  {
    q: "Teknologi apa yang digunakan?",
    a: "Kami menggunakan teknologi modern seperti Next.js, React, TypeScript, Tailwind CSS, Prisma, Supabase, dan lainnya. Detail tercantum di halaman masing-masing produk.",
  },
  {
    q: "Apakah ada garansi uang kembali?",
    a: "Kami menawarkan garansi uang kembali 7 hari jika produk tidak sesuai deskripsi. Hubungi support kami untuk proses refund.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-900">{q}</span>
        <svg
          className={`w-4 h-4 text-gray-500 shrink-0 ml-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-4 bg-white">
          <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <section id="faq" className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wider">FAQ</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-gray-900">
            Pertanyaan yang Sering Ditanyakan
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          {faqs.map((f) => (
            <FAQItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </div>
    </section>
  );
}
