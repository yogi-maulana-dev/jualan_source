"use client";
import { useState, useEffect, FormEvent } from "react";

interface Props { onClose: () => void }

type Phase = "loading" | "setup" | "confirm" | "backup" | "done" | "disable" | "disabled";

export default function TotpSetupModal({ onClose }: Props) {
  const [phase,       setPhase]       = useState<Phase>("loading");
  const [qrDataUrl,   setQrDataUrl]   = useState("");
  const [secret,      setSecret]      = useState("");
  const [code,        setCode]        = useState("");
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied,      setCopied]      = useState(false);
  const [confirmed,   setConfirmed]   = useState(false);

  // Cek status 2FA saat ini
  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        if (d.user?.totp_enabled) setPhase("disable");
        else loadSetup();
      })
      .catch(() => setPhase("setup"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadSetup() {
    setPhase("loading");
    try {
      const res  = await fetch("/api/auth/totp/setup");
      const data = await res.json();
      setQrDataUrl(data.qrDataUrl);
      setSecret(data.secret);
      setPhase("setup");
    } catch { setError("Gagal memuat setup. Coba lagi."); setPhase("setup"); }
  }

  async function handleEnable(e: FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res  = await fetch("/api/auth/totp/enable", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); }
      else {
        setBackupCodes(data.backupCodes ?? []);
        setConfirmed(false);
        setPhase("backup");
      }
    } catch { setError("Koneksi gagal."); }
    finally { setLoading(false); }
  }

  async function handleDisable(e: FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res  = await fetch("/api/auth/totp/disable", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); }
      else { setPhase("disabled"); }
    } catch { setError("Koneksi gagal."); }
    finally { setLoading(false); }
  }

  // Format kode: XXXXXXXX → XXXX-XXXX
  function fmt(c: string) {
    return c.length === 8 ? `${c.slice(0,4)}-${c.slice(4)}` : c;
  }

  function copyAll() {
    const text = backupCodes.map((c, i) => `${i+1}. ${fmt(c)}`).join("\n");
    navigator.clipboard.writeText(
      `AplikasiJadi — Backup Recovery Codes\n${"=".repeat(36)}\n${text}\n\nSimpan kode ini di tempat aman. Setiap kode hanya bisa dipakai sekali.`
    ).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  function downloadTxt() {
    const text = [
      "AplikasiJadi — Backup Recovery Codes",
      "=" .repeat(36),
      "",
      ...backupCodes.map((c, i) => `${i+1}. ${fmt(c)}`),
      "",
      "Simpan kode ini di tempat aman.",
      "Setiap kode hanya bisa dipakai sekali.",
      `Dibuat: ${new Date().toLocaleString("id-ID")}`,
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "aplikasijadi-backup-codes.txt"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={phase !== "backup" ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Google Authenticator</h2>
            <p className="text-sm text-gray-500">Autentikasi dua faktor (2FA)</p>
          </div>
          {phase !== "backup" && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">✕</button>
          )}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* ── Loading ── */}
        {phase === "loading" && (
          <div className="py-12 flex items-center justify-center text-gray-400">
            <svg className="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
            Memuat...
          </div>
        )}

        {/* ── Setup: scan QR ── */}
        {phase === "setup" && (
          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800">
              <p className="font-semibold mb-1">📱 Cara setup:</p>
              <ol className="list-decimal list-inside space-y-1 text-indigo-700">
                <li>Install <strong>Google Authenticator</strong> di HP Anda</li>
                <li>Buka app → ketuk <strong>+</strong> → <strong>Scan QR Code</strong></li>
                <li>Scan QR di bawah ini</li>
                <li>Masukkan kode 6 digit yang muncul</li>
              </ol>
            </div>

            {qrDataUrl && (
              <div className="flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="QR Code 2FA" width={200} height={200} className="rounded-xl border border-gray-200 p-2" />
                <details className="w-full">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 text-center">Tidak bisa scan? Masukkan kode manual</summary>
                  <div className="mt-2 bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Kode secret:</p>
                    <code className="text-sm font-mono font-bold text-gray-800 tracking-widest break-all">{secret}</code>
                  </div>
                </details>
              </div>
            )}

            <button onClick={() => { setCode(""); setError(""); setPhase("confirm"); }}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors">
              Sudah Scan → Verifikasi Kode
            </button>
          </div>
        )}

        {/* ── Konfirmasi kode ── */}
        {phase === "confirm" && (
          <form onSubmit={handleEnable} className="space-y-4">
            <p className="text-sm text-gray-600">Masukkan kode 6 digit dari Google Authenticator untuk mengaktifkan 2FA:</p>
            <input
              type="text" inputMode="numeric" maxLength={6} autoFocus
              value={code} onChange={e => setCode(e.target.value.replace(/\D/g,"").slice(0,6))}
              className="w-full px-4 py-3 text-center text-2xl font-mono font-bold rounded-xl border-2 border-gray-200 focus:border-indigo-400 focus:outline-none tracking-widest"
              placeholder="000000"
            />
            <div className="flex gap-3">
              <button type="button" onClick={() => setPhase("setup")}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                ← Kembali
              </button>
              <button type="submit" disabled={loading || code.length < 6}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                {loading ? "Memverifikasi..." : "Aktifkan 2FA"}
              </button>
            </div>
          </form>
        )}

        {/* ── Backup Codes ── */}
        {phase === "backup" && (
          <div className="space-y-4">
            {/* Banner peringatan */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-bold text-amber-800 flex items-center gap-1.5 mb-1">
                <span>⚠️</span> Simpan Kode Backup Ini Sekarang!
              </p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Jika HP Anda hilang atau Google Authenticator tidak bisa diakses, gunakan salah satu kode ini untuk masuk.
                <strong> Setiap kode hanya bisa dipakai sekali.</strong>
              </p>
            </div>

            {/* Grid kode */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
                    <span className="text-xs text-gray-400 w-4 shrink-0">{i+1}.</span>
                    <code className="text-sm font-mono font-bold text-gray-800 tracking-wider">{fmt(c)}</code>
                  </div>
                ))}
              </div>
            </div>

            {/* Tombol copy / download */}
            <div className="flex gap-2">
              <button
                onClick={copyAll}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {copied ? "✅ Tersalin!" : "📋 Salin Semua"}
              </button>
              <button
                onClick={downloadTxt}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                💾 Unduh .txt
              </button>
            </div>

            {/* Checkbox konfirmasi */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-indigo-600 shrink-0"
              />
              <span className="text-sm text-gray-700">
                Saya sudah menyimpan kode-kode ini di tempat yang aman.
              </span>
            </label>

            <button
              onClick={() => setPhase("done")}
              disabled={!confirmed}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Selesai →
            </button>
          </div>
        )}

        {/* ── Sukses aktifkan ── */}
        {phase === "done" && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-3xl">✅</div>
            <h3 className="text-lg font-bold text-gray-900">2FA Berhasil Diaktifkan!</h3>
            <p className="text-sm text-gray-500">Mulai sekarang, setiap login akan meminta kode dari Google Authenticator.</p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 text-left">
              💡 Anda memiliki <strong>8 backup code</strong> untuk akses darurat jika kehilangan HP.
            </div>
            <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors">
              Tutup
            </button>
          </div>
        )}

        {/* ── Nonaktifkan 2FA ── */}
        {phase === "disable" && (
          <form onSubmit={handleDisable} className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex gap-2">
              <span>🔐</span>
              <div>
                <p className="font-semibold">2FA sedang aktif</p>
                <p className="text-amber-700 mt-0.5">Masukkan kode dari Google Authenticator untuk menonaktifkan.</p>
              </div>
            </div>
            <input
              type="text" inputMode="numeric" maxLength={6} autoFocus
              value={code} onChange={e => setCode(e.target.value.replace(/\D/g,"").slice(0,6))}
              className="w-full px-4 py-3 text-center text-2xl font-mono font-bold rounded-xl border-2 border-gray-200 focus:border-red-400 focus:outline-none tracking-widest"
              placeholder="000000"
            />
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">
                Batal
              </button>
              <button type="submit" disabled={loading || code.length < 6}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60 transition-colors">
                {loading ? "Memproses..." : "Nonaktifkan 2FA"}
              </button>
            </div>
          </form>
        )}

        {/* ── Sukses nonaktifkan ── */}
        {phase === "disabled" && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-3xl">🔓</div>
            <h3 className="text-lg font-bold text-gray-900">2FA Dinonaktifkan</h3>
            <p className="text-sm text-gray-500">Login akan menggunakan password saja. Anda bisa mengaktifkan kembali kapan saja.</p>
            <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-gray-700 text-white text-sm font-semibold hover:bg-gray-800 transition-colors">
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
