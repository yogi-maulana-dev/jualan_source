"use client";
import { useState, useEffect, useCallback } from "react";

interface Props {
  orderCode:     string;
  initialStatus: string;
  xenditUrl:     string | null;
  initialEmail:  string | null;
}

const STATUS_VIEW: Record<string, { label: string; cls: string; emoji: string; help: string }> = {
  pending:    { label: "Menunggu Pembayaran", cls: "bg-yellow-50 border-yellow-200 text-yellow-800", emoji: "⏳", help: "Klik tombol di bawah untuk membayar via Xendit." },
  paid:       { label: "Pembayaran Berhasil",  cls: "bg-blue-50 border-blue-200 text-blue-800",       emoji: "💰", help: "Pembayaran terkonfirmasi. Tim kami akan memproses SSL maksimal 1×24 jam." },
  processing: { label: "Sedang Diproses",      cls: "bg-blue-50 border-blue-200 text-blue-800",       emoji: "⚙️", help: "Admin sedang issue SSL Anda. Mohon tunggu." },
  issued:     { label: "SSL Sudah Terbit",     cls: "bg-green-50 border-green-200 text-green-800",    emoji: "✅", help: "SSL berhasil di-issue. Download file .crt dan .ca-bundle di bawah." },
  expired:    { label: "Pembayaran Kedaluwarsa", cls: "bg-gray-100 border-gray-200 text-gray-700",    emoji: "⌛", help: "Invoice expired. Silakan buat pesanan baru." },
  failed:     { label: "Pembayaran Gagal",     cls: "bg-red-50 border-red-200 text-red-800",          emoji: "❌", help: "Pembayaran tidak berhasil. Coba metode lain." },
  refunded:   { label: "Dana Dikembalikan",    cls: "bg-gray-100 border-gray-200 text-gray-700",      emoji: "↩️", help: "Pesanan di-refund." },
};

export default function OrderStatus({ orderCode, initialStatus, xenditUrl, initialEmail }: Props) {
  const [status,   setStatus]   = useState(initialStatus);
  const [email,    setEmail]    = useState(initialEmail ?? "");
  const [cert,     setCert]     = useState<string | null>(null);
  const [caBundle, setCaBundle] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const refresh = useCallback(async (withEmail?: string) => {
    setLoading(true);
    const q = withEmail ? `?email=${encodeURIComponent(withEmail)}` : "";
    const r = await fetch(`/api/ssl/orders/${orderCode}${q}`);
    if (r.ok) {
      const j = await r.json();
      setStatus(j.status);
      setVerified(!!j.verified);
      setCert(j.certificate ?? null);
      setCaBundle(j.ca_bundle ?? null);
    }
    setLoading(false);
  }, [orderCode]);

  // Auto-refresh setiap 15 detik kalau status masih pending/processing
  useEffect(() => {
    if (status === "pending" || status === "paid" || status === "processing") {
      const t = setInterval(() => refresh(email || undefined), 15000);
      return () => clearInterval(t);
    }
  }, [status, email, refresh]);

  // Verifikasi email pertama kali kalau ada di URL
  useEffect(() => {
    if (initialEmail) refresh(initialEmail);
  }, [initialEmail, refresh]);

  const view = STATUS_VIEW[status] ?? STATUS_VIEW.pending;

  function download(filename: string, content: string) {
    const blob = new Blob([content], { type: "application/x-pem-file" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="mt-6">
      <div className={`p-4 rounded-xl border ${view.cls}`}>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">{view.emoji}</span>
          <strong className="font-bold">{view.label}</strong>
        </div>
        <p className="text-sm">{view.help}</p>
      </div>

      {status === "pending" && xenditUrl && (
        <a
          href={xenditUrl}
          className="mt-4 block text-center py-3 rounded-lg bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700"
        >
          Bayar Sekarang →
        </a>
      )}

      {status === "issued" && !verified && (
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-700 mb-2 font-semibold">Verifikasi email untuk download SSL:</p>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email saat order"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => refresh(email)}
              disabled={!email || loading}
              className="px-4 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? "..." : "Cek"}
            </button>
          </div>
        </div>
      )}

      {status === "issued" && verified && (cert || caBundle) && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-800 mb-3 font-semibold">📥 Download file SSL Anda:</p>
          <div className="flex flex-col gap-2">
            {cert && (
              <button onClick={() => download(`${orderCode}.crt`, cert)} className="text-left px-3 py-2 rounded-lg bg-white border border-green-300 text-sm hover:bg-green-100">
                📄 Certificate (.crt)
              </button>
            )}
            {caBundle && (
              <button onClick={() => download(`${orderCode}.ca-bundle`, caBundle)} className="text-left px-3 py-2 rounded-lg bg-white border border-green-300 text-sm hover:bg-green-100">
                📦 CA Bundle (.ca-bundle)
              </button>
            )}
          </div>
          <p className="mt-3 text-[10px] text-green-700">
            Catatan: Private key (.key) tetap di server Anda — tidak pernah kami simpan.
          </p>
        </div>
      )}

      {(status === "pending" || status === "paid" || status === "processing") && (
        <p className="mt-3 text-xs text-gray-400 text-center">
          Status di-refresh otomatis setiap 15 detik.
        </p>
      )}
    </div>
  );
}
