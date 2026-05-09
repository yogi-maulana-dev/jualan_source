"use client";
import { useState, FormEvent, useEffect, useCallback, useRef, KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

// ── Tipe ─────────────────────────────────────────────────────────────────────
interface CaptchaData { token: string; dataUrl: string }

// ── Countdown jam ─────────────────────────────────────────────────────────────
function Countdown({ ms, onDone }: { ms: number; onDone: () => void }) {
  const [left, setLeft] = useState(Math.ceil(ms / 1000));
  useEffect(() => {
    if (left <= 0) { onDone(); return; }
    const t = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, onDone]);
  const m = Math.floor(left / 60).toString().padStart(2, "0");
  const s = (left % 60).toString().padStart(2, "0");
  return <span className="font-mono font-bold text-red-600">{m}:{s}</span>;
}

// ── Step TOTP ─────────────────────────────────────────────────────────────────
function TotpStep({ onSuccess, redirect }: { onSuccess: (dest: string) => void; redirect: string }) {
  const [digits,     setDigits]     = useState(["","","","","",""]);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [blocked,    setBlocked]    = useState(false);
  const [retryMs,    setRetryMs]    = useState(0);
  const [useBackup,  setUseBackup]  = useState(false);
  const [backupCode, setBackupCode] = useState("");
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null)); // eslint-disable-line react-hooks/rules-of-hooks

  const totpCode = digits.join("");

  function handleDigit(i: number, val: string) {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...digits]; next[i] = v; setDigits(next);
    if (v && i < 5) refs[i + 1].current?.focus();
  }

  function handleKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs[i - 1].current?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setDigits(text.split(""));
      refs[5].current?.focus();
    }
    e.preventDefault();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const code = useBackup ? backupCode.replace(/[-\s]/g, "") : totpCode;
    if (!useBackup && code.length < 6) { setError("Masukkan 6 digit kode."); return; }
    if (useBackup && code.length < 8)  { setError("Masukkan 8 karakter backup code."); return; }
    setError(""); setLoading(true);
    try {
      const res  = await fetch("/api/auth/totp/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.blocked) { setBlocked(true); setRetryMs(data.retryAfterMs ?? 60_000); setError(data.error); }
        else {
          setError(data.error || "Kode salah.");
          if (!useBackup) { setDigits(["","","","","",""]); refs[0].current?.focus(); }
          else setBackupCode("");
        }
      } else {
        if (data.usedBackup && data.remainingBackup !== null) {
          // Tampilkan peringatan sisa backup code sebelum redirect
          if (data.remainingBackup <= 2) {
            setError(`⚠️ Backup code terpakai. Sisa: ${data.remainingBackup} kode. Segera atur ulang 2FA.`);
            setTimeout(() => onSuccess(redirect), 3000);
            return;
          }
        }
        onSuccess(redirect);
      }
    } catch { setError("Koneksi gagal."); }
    finally { setLoading(false); }
  }

  function switchMode(backup: boolean) {
    setUseBackup(backup);
    setError("");
    setDigits(["","","","","",""]);
    setBackupCode("");
  }

  useEffect(() => { refs[0].current?.focus(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
          {useBackup ? "🗝️" : "🔐"}
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          {useBackup ? "Gunakan Backup Code" : "Verifikasi 2FA"}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {useBackup
            ? "Masukkan salah satu backup code Anda (format: XXXX-XXXX)"
            : "Buka Google Authenticator dan masukkan kode 6 digit"}
        </p>
      </div>

      {error && (
        <div className={`mb-4 flex items-start gap-2 px-4 py-3 rounded-xl text-sm border ${blocked ? "bg-red-50 border-red-300 text-red-800" : "bg-red-50 border-red-200 text-red-700"}`}>
          <span className="shrink-0">{blocked ? "🔒" : "⚠️"}</span>
          <div>
            <p>{error}</p>
            {blocked && retryMs > 0 && (
              <p className="mt-1 text-xs">Coba lagi dalam: <Countdown ms={retryMs} onDone={() => { setBlocked(false); setError(""); }} /></p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {!useBackup ? (
          /* 6 kotak digit TOTP */
          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i} ref={refs[i]} type="text" inputMode="numeric"
                maxLength={1} value={d}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                disabled={blocked || loading}
                className={`w-11 h-14 text-center text-2xl font-bold rounded-xl border-2 focus:outline-none transition-colors
                  ${d ? "border-indigo-500 bg-indigo-50 text-indigo-800" : "border-gray-200 bg-gray-50 text-gray-800"}
                  ${blocked ? "opacity-40" : "focus:border-indigo-400"}`}
              />
            ))}
          </div>
        ) : (
          /* Input backup code */
          <div className="mb-6">
            <input
              type="text" autoFocus autoComplete="off" spellCheck={false}
              value={backupCode}
              onChange={e => setBackupCode(e.target.value.toUpperCase().slice(0, 9))}
              disabled={blocked || loading}
              placeholder="XXXX-XXXX"
              className="w-full px-4 py-3 text-center text-xl font-mono font-bold rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:outline-none tracking-widest uppercase disabled:opacity-40"
            />
            <p className="text-xs text-gray-400 text-center mt-2">Salin dari file backup code Anda</p>
          </div>
        )}

        <button type="submit"
          disabled={loading || blocked || (!useBackup && totpCode.length < 6) || (useBackup && backupCode.replace(/[-\s]/g,"").length < 8)}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
          {loading
            ? (<><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Memverifikasi...</>)
            : blocked ? "🔒 Diblokir"
            : "Verifikasi"}
        </button>
      </form>

      {/* Toggle mode */}
      <div className="mt-4 text-center">
        {!useBackup ? (
          <button onClick={() => switchMode(true)}
            className="text-xs text-gray-400 hover:text-indigo-600 transition-colors underline underline-offset-2">
            🗝️ Tidak punya akses HP? Gunakan backup code
          </button>
        ) : (
          <button onClick={() => switchMode(false)}
            className="text-xs text-gray-400 hover:text-indigo-600 transition-colors underline underline-offset-2">
            ← Kembali gunakan Google Authenticator
          </button>
        )}
      </div>
      {!useBackup && <p className="text-xs text-gray-400 text-center mt-2">Kode berubah setiap 30 detik</p>}
    </div>
  );
}

// ── Form utama ────────────────────────────────────────────────────────────────
function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirect     = searchParams.get("redirect") || "/admin/dashboard";

  const [step,          setStep]          = useState<"credentials"|"totp">("credentials");
  const [email,         setEmail]         = useState("admin@aplikasijadi.com");
  const [password,      setPassword]      = useState("");
  const [showPassword,  setShowPassword]  = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captcha,       setCaptcha]       = useState<CaptchaData | null>(null);
  const [captchaLoading,setCaptchaLoading]= useState(false);
  const [error,         setError]         = useState("");
  const [loading,       setLoading]       = useState(false);
  const [blocked,       setBlocked]       = useState(false);
  const [retryMs,       setRetryMs]       = useState(0);
  const answerRef = useRef<HTMLInputElement>(null);

  // ── Load CAPTCHA ────────────────────────────────────────────────────────
  const loadCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    setCaptchaAnswer("");
    try {
      const res  = await fetch("/api/auth/captcha");
      const data = await res.json();
      setCaptcha(data);
      setTimeout(() => answerRef.current?.focus(), 50);
    } catch {
      setError("Gagal memuat CAPTCHA.");
    } finally {
      setCaptchaLoading(false);
    }
  }, []);

  useEffect(() => { loadCaptcha(); }, [loadCaptcha]);

  // ── Submit ──────────────────────────────────────────────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (blocked) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          email,
          password,
          captchaToken:  captcha?.token  ?? "",
          captchaAnswer: captchaAnswer.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.blocked) {
          setBlocked(true);
          setRetryMs(data.retryAfterMs ?? 60_000);
          setError(data.error);
        } else {
          setError(data.error || "Login gagal.");
          if (data.refreshCaptcha) loadCaptcha();
        }
      } else if (data.requiresTotp) {
        // Lanjut ke step TOTP
        setStep("totp");
      } else {
        router.push(redirect);
        router.refresh();
      }
    } catch {
      setError("Koneksi gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "totp") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <span className="text-2xl font-bold text-white">AplikasiJadi<span className="text-indigo-300">.com</span></span>
            <p className="mt-1 text-indigo-300 text-sm">Verifikasi Dua Langkah</p>
          </div>
          <TotpStep redirect={redirect} onSuccess={(dest) => { router.push(dest); router.refresh(); }} />
          <button onClick={() => { setStep("credentials"); setError(""); loadCaptcha(); }}
            className="mt-4 w-full text-center text-sm text-indigo-300 hover:text-white transition-colors">
            ← Kembali ke login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold text-white">
            AplikasiJadi<span className="text-indigo-300">.com</span>
          </span>
          <p className="mt-1 text-indigo-300 text-sm">Super Admin Panel</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Masuk ke Dashboard</h1>
          <p className="text-sm text-gray-500 mb-6">Hanya untuk superadmin yang berwenang.</p>

          {/* Error / lockout */}
          {error && (
            <div className={`mb-4 flex items-start gap-2 px-4 py-3 rounded-xl text-sm border ${
              blocked
                ? "bg-red-50 border-red-300 text-red-800"
                : "bg-red-50 border-red-200 text-red-700"
            }`}>
              <span className="shrink-0 mt-0.5">{blocked ? "🔒" : "⚠️"}</span>
              <div>
                <p>{error}</p>
                {blocked && retryMs > 0 && (
                  <p className="mt-1 text-xs">
                    Bisa dicoba lagi dalam:{" "}
                    <Countdown ms={retryMs} onDone={() => { setBlocked(false); setError(""); loadCaptcha(); }} />
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                Email
              </label>
              <input
                id="email" type="email" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                disabled={blocked}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition"
                placeholder="admin@aplikasijadi.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  disabled={blocked}
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* CAPTCHA */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verifikasi Keamanan
              </label>

              {/* Gambar CAPTCHA */}
              <div className="flex items-center gap-3 mb-2">
                <div className={`flex-1 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center h-[72px] transition-opacity ${captchaLoading ? "opacity-40" : ""}`}>
                  {captcha ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={captcha.dataUrl} alt="CAPTCHA" width={220} height={72} draggable={false} className="select-none" />
                  ) : (
                    <span className="text-xs text-gray-400">Memuat...</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={loadCaptcha}
                  disabled={captchaLoading || blocked}
                  title="Ganti CAPTCHA"
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors text-lg shrink-0"
                >
                  {captchaLoading ? (
                    <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                  ) : "🔄"}
                </button>
              </div>

              {/* Input jawaban */}
              <input
                ref={answerRef}
                type="text"
                inputMode="numeric"
                required
                value={captchaAnswer}
                onChange={e => setCaptchaAnswer(e.target.value)}
                disabled={blocked || captchaLoading}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition"
                placeholder="Ketik jawaban angka di sini"
                autoComplete="off"
              />
              <p className="text-xs text-gray-400 mt-1">Selesaikan soal matematika di atas</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || blocked || !captcha}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Memverifikasi...
                </>
              ) : blocked ? "🔒 Akses Diblokir" : "Masuk"}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              Demo: <span className="font-mono text-gray-600">admin@aplikasijadi.com</span> /{" "}
              <span className="font-mono text-gray-600">admin123</span>
            </p>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-4 flex items-center justify-center gap-4 text-indigo-300 text-xs">
          <span>🔒 CAPTCHA aktif</span>
          <span>·</span>
          <span>🛡️ Rate limiting</span>
          <span>·</span>
          <span>🔐 Enkripsi bcrypt</span>
        </div>

        <p className="mt-4 text-center text-xs text-indigo-400">
          © {new Date().getFullYear()} AplikasiJadi.com
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
