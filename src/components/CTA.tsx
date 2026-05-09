export default function CTA() {
  return (
    <section className="py-20 md:py-28 bg-indigo-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
          Siap Hemat Waktu dan Mulai Lebih Cepat?
        </h2>
        <p className="mt-5 text-indigo-200 text-lg max-w-2xl mx-auto">
          Lebih dari 1.200 developer dan pebisnis sudah mempercayai produk kami.
          Giliran Anda untuk merasakan manfaatnya.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#produk"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-indigo-700 font-bold text-base hover:bg-indigo-50 transition-all shadow-lg"
          >
            Mulai Jelajahi Produk →
          </a>
          <a
            href="https://wa.me/6281234567890"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 rounded-full border-2 border-white/40 text-white font-semibold text-base hover:border-white transition-all"
          >
            💬 Tanya via WhatsApp
          </a>
        </div>
        <p className="mt-6 text-indigo-300 text-sm">
          Garansi uang kembali 7 hari · Lisensi komersial · Support gratis 30 hari
        </p>
      </div>
    </section>
  );
}
