import Link from "next/link";

const footerLinks = {
  Produk: ["SaaS Starter Kit", "Toko Online", "Aplikasi Kasir", "Sistem Klinik", "Semua Produk"],
  Perusahaan: ["Tentang Kami", "Blog", "Karir", "Press Kit"],
  Dukungan: ["Dokumentasi", "FAQ", "Hubungi Kami", "Status Sistem"],
  Legal: ["Kebijakan Privasi", "Syarat & Ketentuan", "Kebijakan Refund"],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-bold text-xl text-white">
              AplikasiJadi<span className="text-indigo-400">.com</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed">
              Marketplace aplikasi web & mobile siap pakai terpercaya di Indonesia.
            </p>
            <div className="mt-5 flex gap-3">
              {[
                { href: "#", label: "Twitter", icon: "𝕏" },
                { href: "#", label: "Instagram", icon: "📸" },
                { href: "#", label: "WhatsApp", icon: "💬" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-indigo-600 transition-colors text-sm"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h3 className="text-white text-sm font-semibold mb-4">{group}</h3>
              <ul className="space-y-2">
                {links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm hover:text-white transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <p>© {new Date().getFullYear()} AplikasiJadi.com. Hak cipta dilindungi.</p>
          <p className="text-gray-600">Dibuat dengan ❤️ di Indonesia 🇮🇩</p>
        </div>
      </div>
    </footer>
  );
}
