const testimonials = [
  {
    name: "Andi Kurniawan",
    role: "Founder Startup Fintech",
    avatar: "AK",
    rating: 5,
    text: "Beli SaaS Starter Kit langsung hemat 3 bulan pengembangan. Kode bersih, dokumentasi lengkap, dan support cepat banget. Worth every rupiah!",
  },
  {
    name: "Siti Rahma",
    role: "Freelance Developer",
    avatar: "SR",
    rating: 5,
    text: "Saya pakai Aplikasi Kasir POS untuk klien UMKM. Klien puas, saya hemat waktu. Template-nya profesional banget dan mudah dikustomisasi.",
  },
  {
    name: "Budi Santoso",
    role: "CEO Agency Digital",
    avatar: "BS",
    rating: 5,
    text: "Sudah beli 4 produk di sini. Kualitas konsisten, harga fair, dan update terus diperbarui. Ini marketplace source code terbaik di Indonesia.",
  },
  {
    name: "Dewi Lestari",
    role: "Product Manager",
    avatar: "DL",
    rating: 5,
    text: "Tim saya pakai E-Commerce starter untuk MVP klien. Dalam 2 minggu sudah live! Kalau dari nol bisa 3 bulan. Recommended 100%.",
  },
  {
    name: "Reza Pratama",
    role: "Mobile Developer",
    avatar: "RP",
    rating: 5,
    text: "Aplikasi chat real-time-nya sudah saya integrasikan ke 3 proyek berbeda. Kode-nya modular dan mudah dipahami. Support juga ramah!",
  },
  {
    name: "Nita Wahyuni",
    role: "Pemilik Klinik Gigi",
    avatar: "NW",
    rating: 5,
    text: "Sistem manajemen kliniknya langsung saya pakai. Data pasien rapi, jadwal dokter teratur. Sangat membantu operasional klinik saya.",
  },
];

function StarRating({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: n }).map((_, i) => (
        <svg key={i} className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section id="testimoni" className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wider">
            Testimoni
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-gray-900">
            Dipercaya Ribuan Developer & Bisnis
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">
            Bergabunglah dengan 1.200+ pembeli yang sudah merasakan manfaatnya.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <blockquote
              key={t.name}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col gap-4"
            >
              <StarRating n={t.rating} />
              <p className="text-sm text-gray-700 leading-relaxed flex-1">
                &ldquo;{t.text}&rdquo;
              </p>
              <footer className="flex items-center gap-3 pt-2 border-t border-gray-200">
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
