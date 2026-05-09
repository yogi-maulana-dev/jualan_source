const features = [
  {
    icon: "📦",
    title: "Source Code Lengkap",
    desc: "Dapatkan akses penuh ke seluruh source code. Tidak ada fitur terkunci atau enkripsi tersembunyi.",
  },
  {
    icon: "📚",
    title: "Dokumentasi Jelas",
    desc: "Setiap produk dilengkapi dokumentasi langkah-demi-langkah: instalasi, konfigurasi, hingga deploy.",
  },
  {
    icon: "🛠️",
    title: "Support Gratis 30 Hari",
    desc: "Punya pertanyaan teknis? Tim kami siap membantu via WhatsApp atau email dalam 24 jam.",
  },
  {
    icon: "🔄",
    title: "Update Seumur Hidup",
    desc: "Beli sekali, nikmati semua update di masa depan secara gratis. Kode selalu up-to-date.",
  },
  {
    icon: "⚡",
    title: "Production-Ready",
    desc: "Semua aplikasi sudah diuji secara menyeluruh dan siap langsung digunakan di lingkungan produksi.",
  },
  {
    icon: "🔒",
    title: "Lisensi Komersial",
    desc: "Gunakan untuk proyek klien Anda tanpa khawatir. Lisensi komersial sudah termasuk dalam harga.",
  },
];

export default function Features() {
  return (
    <section id="keunggulan" className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wider">
            Mengapa Kami?
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-gray-900">
            Yang Kamu Dapat di Setiap Produk
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">
            Kami memastikan setiap pembelian adalah investasi terbaik untuk produktivitas
            dan pertumbuhan bisnis Anda.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-base font-bold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Process steps */}
        <div className="mt-20">
          <h3 className="text-center text-2xl font-extrabold text-gray-900 mb-10">
            Cara Kerja – Semudah 3 Langkah
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Pilih Produk", desc: "Jelajahi katalog dan pilih aplikasi yang sesuai kebutuhan bisnis Anda." },
              { step: "02", title: "Bayar & Unduh", desc: "Proses pembayaran aman, source code langsung bisa diunduh setelah konfirmasi." },
              { step: "03", title: "Deploy & Jalan", desc: "Ikuti dokumentasi, deploy ke server Anda, dan aplikasi langsung online." },
            ].map((s) => (
              <div key={s.step} className="relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 text-white font-bold text-lg mb-4">
                  {s.step}
                </div>
                <h4 className="font-bold text-gray-900">{s.title}</h4>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
