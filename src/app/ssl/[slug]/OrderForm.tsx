"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Props {
  productId:   number;
  productName: string;
  price:       number;
}

export default function OrderForm({ productId, productName, price }: Props) {
  const router = useRouter();
  const [name,   setName]   = useState("");
  const [email,  setEmail]  = useState("");
  const [phone,  setPhone]  = useState("");
  const [domain, setDomain] = useState("");
  const [csr,    setCsr]    = useState("");
  const [agree,  setAgree]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!agree) { setError("Centang persetujuan dulu."); return; }

    setSubmitting(true);
    try {
      const r = await fetch("/api/ssl/orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          ssl_product_id: productId,
          buyer_name:     name.trim(),
          buyer_email:    email.trim(),
          buyer_phone:    phone.trim() || null,
          domain:         domain.trim(),
          csr:            csr.trim() || null,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Gagal membuat pesanan");

      // Redirect ke Xendit invoice URL
      if (j.invoice_url) {
        window.location.href = j.invoice_url;
      } else {
        router.push(`/ssl/pesanan/${j.order_code}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field label="Nama lengkap *">
        <input required value={name} onChange={(e) => setName(e.target.value)} className={inp} placeholder="John Doe" />
      </Field>
      <Field label="Email *" hint="SSL akan dikirim ke email ini">
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inp} placeholder="you@email.com" />
      </Field>
      <Field label="No. WhatsApp">
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inp} placeholder="08xxxxxxxxx" />
      </Field>
      <Field label="Domain *">
        <input required value={domain} onChange={(e) => setDomain(e.target.value)} className={inp} placeholder="example.com" />
      </Field>
      <Field label="CSR (opsional, bisa kirim nanti)" hint="-----BEGIN CERTIFICATE REQUEST-----">
        <textarea rows={3} value={csr} onChange={(e) => setCsr(e.target.value)} className={`${inp} font-mono text-xs`} placeholder="Paste CSR di sini, atau kosongkan untuk submit nanti via email." />
      </Field>

      <label className="flex items-start gap-2 text-xs text-gray-500 pt-1">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5" />
        <span>Saya setuju data domain & kontak digunakan untuk proses issuance SSL. Bayar dulu, SSL di-issue maksimal 1×24 jam.</span>
      </label>

      {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-lg bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-60"
      >
        {submitting ? "Membuat invoice..." : `Bayar Sekarang (${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(price)})`}
      </button>

      <p className="text-[10px] text-gray-400 text-center pt-1">
        🔒 Pembayaran aman via Xendit: Virtual Account, OVO, GoPay, Dana, QRIS, Kartu Kredit.
      </p>
      <p className="text-[10px] text-gray-400 text-center">Paket: {productName}</p>
    </form>
  );
}

const inp = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-indigo-500";
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-700">{label}</span>
      {hint && <span className="block text-[10px] text-gray-400 mb-1">{hint}</span>}
      {children}
    </label>
  );
}
