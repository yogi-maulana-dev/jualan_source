import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { seedIfEmpty } from "@/lib/seed";
import { signToken, signTempToken, COOKIE_NAME, TEMP_COOKIE } from "@/lib/auth";
import { writeLog } from "@/lib/logger";
import { verifyCaptcha } from "@/lib/captcha";
import { checkRateLimit, recordAttempt, clearAttempts } from "@/lib/ratelimit";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1"
  );
}

export async function POST(req: NextRequest) {
  try {
    await seedIfEmpty();

    const ip = getIp(req);
    const body = await req.json();
    const { email, password, captchaToken, captchaAnswer } = body;

    // ── 1. Validasi input dasar ────────────────────────────────────────────
    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi." }, { status: 400 });
    }

    // ── 2. Cek rate limit SEBELUM apapun (hemat resource DB) ───────────────
    const limit = await checkRateLimit(ip, email);
    if (limit.blocked) {
      return NextResponse.json(
        { error: limit.reason, retryAfterMs: limit.retryAfterMs, blocked: true },
        { status: 429 }
      );
    }

    // ── 3. Verifikasi CAPTCHA ──────────────────────────────────────────────
    if (!captchaToken || !captchaAnswer) {
      return NextResponse.json({ error: "Selesaikan CAPTCHA terlebih dahulu." }, { status: 400 });
    }
    const captchaErr = verifyCaptcha(captchaToken, captchaAnswer);
    if (captchaErr) {
      await recordAttempt(ip, email, false);
      await writeLog({ actor: { email }, action: "LOGIN_FAILED", detail: `CAPTCHA gagal: ${captchaErr}`, req });
      return NextResponse.json({ error: captchaErr, refreshCaptcha: true }, { status: 400 });
    }

    // ── 4. Cari user ──────────────────────────────────────────────────────
    const user = await queryOne<{
      id: number; name: string; email: string; password: string; role: string;
      totp_enabled: number;
    }>("SELECT id, name, email, password, role, totp_enabled FROM users WHERE email = ?", [email]);

    // ── 5. Verifikasi password (constant-time via bcrypt) ──────────────────
    // Selalu jalankan bcrypt meski user tidak ada → cegah user-enumeration timing
    const dummyHash = "$2b$12$invalidhashfortimingprotectiononly000000000000000000000";
    const passwordOk = user
      ? await bcrypt.compare(password, user.password)
      : (await bcrypt.compare(password, dummyHash), false);

    if (!user || !passwordOk) {
      await recordAttempt(ip, email, false);
      await writeLog({ actor: { email }, action: "LOGIN_FAILED", detail: `Kredensial salah (IP: ${ip})`, req });

      // Sisa percobaan
      const remaining = await checkRateLimit(ip, email);
      const left = Math.max(0, 5 - (remaining.failCount ?? 0) - 1);
      const msg  = left > 0
        ? `Email atau password salah. Sisa percobaan: ${left}.`
        : "Email atau password salah. Akun akan dikunci pada percobaan berikutnya.";

      return NextResponse.json({ error: msg, refreshCaptcha: true }, { status: 401 });
    }

    if (user.role !== "superadmin") {
      await recordAttempt(ip, email, false);
      await writeLog({ actor: { id: user.id, email: user.email, name: user.name }, action: "LOGIN_FAILED", detail: "Akses ditolak — bukan superadmin", req });
      return NextResponse.json({ error: "Akses ditolak.", refreshCaptcha: true }, { status: 403 });
    }

    // ── 6. Cek apakah 2FA aktif ──────────────────────────────────────────
    if (user.totp_enabled) {
      // Buat temp token — hanya berlaku 5 menit, tidak bisa akses admin
      const tempToken = await signTempToken({
        sub:   String(user.id),
        email: user.email,
        name:  user.name,
      });

      const res = NextResponse.json({ ok: true, requiresTotp: true });
      res.cookies.set(TEMP_COOKIE, tempToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge:   5 * 60,   // 5 menit
        path:     "/",
      });
      return res;
    }

    // ── 7. Login berhasil (tanpa 2FA) ─────────────────────────────────────
    await clearAttempts(ip, email);

    const token = await signToken({
      sub:   String(user.id),
      email: user.email,
      role:  user.role,
      name:  user.name,
    });

    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge:   60 * 60 * 24 * 7,
      path:     "/",
    });

    await recordAttempt(ip, email, true);
    await writeLog({ actor: { id: user.id, email: user.email, name: user.name }, action: "LOGIN", detail: `Login berhasil (IP: ${ip})`, req });

    return res;
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
