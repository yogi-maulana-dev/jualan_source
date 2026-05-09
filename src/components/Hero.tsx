export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 md:pt-40 md:pb-32 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Background blobs */}
      <div
        aria-hidden
        className="absolute -top-40 -right-32 w-[600px] h-[600px] rounded-full bg-indigo-100 opacity-40 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -left-32 w-[500px] h-[500px] rounded-full bg-purple-100 opacity-40 blur-3xl"
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
          </span>
          100+ pembeli puas minggu ini
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
          Aplikasi Siap Pakai,{" "}
          <span className="text-indigo-600">Langsung Jalan</span>
        </h1>

        <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-gray-600 leading-relaxed">
          Hemat hingga <strong>90% waktu pengembangan</strong>. Beli source code
          berkualitas tinggi, lengkap dengan dokumentasi dan support gratis.
          Cocok untuk startup, freelancer, dan bisnis.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#produk"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5"
          >
            Jelajahi Semua Produk →
          </a>
          <a
            href="#keunggulan"
            className="w-full sm:w-auto px-8 py-4 rounded-full border border-gray-300 text-gray-700 font-semibold text-base hover:border-indigo-400 hover:text-indigo-600 transition-all"
          >
            Kenapa Pilih Kami?
          </a>
        </div>

        {/* Social proof stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {[
            { value: "50+", label: "Produk Tersedia" },
            { value: "1.200+", label: "Pembeli Aktif" },
            { value: "4.9★", label: "Rating Rata-rata" },
            { value: "24 Jam", label: "Support Respons" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl py-5 px-4 shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-indigo-600">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
