"use client";
import { useEffect, useRef, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import TotpSetupModal from "./TotpSetupModal";

type User = { id: string; name: string; email: string; role: string };

interface Props {
  title: string;
  user?: User | null; // opsional — jika tidak dikirim, fetch sendiri
}

export default function AdminHeader({ title, user: userProp }: Props) {
  const router = useRouter();

  // ── State user ──────────────────────────────────────────
  const [user,        setUser]        = useState<User | null>(userProp ?? null);
  const [dropOpen,    setDropOpen]    = useState(false);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [totpOpen,    setTotpOpen]    = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Fetch user jika tidak dikirim via props
  useEffect(() => {
    if (userProp !== undefined) return;
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => setUser(d.user ?? null))
      .catch(() => {});
  }, [userProp]);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Logout ───────────────────────────────────────────────
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  // ── Modal ubah password ──────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdError,        setPwdError]        = useState("");
  const [pwdSuccess,      setPwdSuccess]      = useState("");
  const [pwdLoading,      setPwdLoading]      = useState(false);
  const [showCurrent,     setShowCurrent]     = useState(false);
  const [showNew,         setShowNew]         = useState(false);

  function openModal() {
    setDropOpen(false);
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    setPwdError(""); setPwdSuccess(""); setShowCurrent(false); setShowNew(false);
    setModalOpen(true);
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPwdError(""); setPwdSuccess("");

    if (newPassword !== confirmPassword) {
      setPwdError("Password baru dan konfirmasi tidak cocok.");
      return;
    }
    if (newPassword.length < 6) {
      setPwdError("Password baru minimal 6 karakter.");
      return;
    }

    setPwdLoading(true);
    try {
      const res  = await fetch("/api/auth/change-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwdError(data.error || "Gagal mengubah password.");
      } else {
        setPwdSuccess("✅ Password berhasil diubah!");
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
        setTimeout(() => setModalOpen(false), 1500);
      }
    } catch {
      setPwdError("Koneksi gagal. Coba lagi.");
    } finally {
      setPwdLoading(false);
    }
  }

  const avatar = user?.name?.charAt(0).toUpperCase() ?? "A";

  return (
    <>
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>

        {user && (
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setDropOpen(o => !o)}
              className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 leading-tight">{user.name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                {avatar}
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${dropOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {dropOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                {/* Info profil */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white text-base font-bold flex items-center justify-center shrink-0">
                      {avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      <span className="inline-block mt-0.5 text-[10px] font-semibold uppercase tracking-wide bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Menu */}
                <div className="py-1">
                  <button
                    onClick={openModal}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-base">🔑</span>
                    Ubah Password
                  </button>
                  <button
                    onClick={() => { setDropOpen(false); setTotpOpen(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-base">📱</span>
                    Google Authenticator
                  </button>
                </div>

                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <span className="text-base">🚪</span>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ── Modal Google Authenticator ───────────────────────── */}
      {totpOpen && <TotpSetupModal onClose={() => setTotpOpen(false)} />}

      {/* ── Modal Ubah Password ──────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />

          {/* Card */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
            {/* Header modal */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Ubah Password</h2>
                <p className="text-sm text-gray-500">Masukkan password lama lalu buat yang baru</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Alert */}
            {pwdError && (
              <div className="mb-4 flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <span className="shrink-0">⚠️</span> {pwdError}
              </div>
            )}
            {pwdSuccess && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
                {pwdSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Password lama */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password Lama</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowCurrent(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                    {showCurrent ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Password baru */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    placeholder="Min. 6 karakter"
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                    {showNew ? "🙈" : "👁️"}
                  </button>
                </div>
                {/* Strength indicator */}
                {newPassword.length > 0 && (
                  <div className="mt-1.5 flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                        newPassword.length >= (i + 1) * 3
                          ? newPassword.length >= 12 ? "bg-green-400"
                          : newPassword.length >= 8  ? "bg-yellow-400"
                          : "bg-red-400"
                          : "bg-gray-200"
                      }`} />
                    ))}
                    <span className="text-[10px] text-gray-400 ml-1 self-center">
                      {newPassword.length >= 12 ? "Kuat" : newPassword.length >= 8 ? "Sedang" : "Lemah"}
                    </span>
                  </div>
                )}
              </div>

              {/* Konfirmasi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors ${
                    confirmPassword && confirmPassword !== newPassword
                      ? "border-red-300 bg-red-50"
                      : confirmPassword && confirmPassword === newPassword
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300"
                  }`}
                  placeholder="Ulangi password baru"
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-500 mt-1">Password tidak cocok</p>
                )}
              </div>

              {/* Tombol */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading || (!!confirmPassword && confirmPassword !== newPassword)}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {pwdLoading ? "Menyimpan..." : "Simpan Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
