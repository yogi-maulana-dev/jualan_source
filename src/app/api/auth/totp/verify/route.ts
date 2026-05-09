/**
 * POST /api/auth/totp/verify
 * Step 2 login: verifikasi kode TOTP (6 digit) atau backup code (8 huruf/angka).
 * Body: { code }  — temp token dibaca dari cookie TEMP_COOKIE
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyTempToken, signToken, COOKIE_NAME, TEMP_COOKIE } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";
import { verifyCode, findBackupCodeIndex, BackupCodeStored } from "@/lib/totp";
import { writeLog } from "@/lib/logger";
import { checkRateLimit, recordAttempt, clearAttempts } from "@/lib/ratelimit";

export const runtime = "nodejs";

function getIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    ?? req.headers.get("x-real-ip")
    ?? "127.0.0.1";
}

export async function POST(req: NextRequest) {
  try {
    const ip          = getIp(req);
    const tempRaw     = req.cookies.get(TEMP_COOKIE)?.value;
    const tempPayload = tempRaw ? await verifyTempToken(tempRaw) : null;

    if (!tempPayload) {
      return NextResponse.json(
        { error: "Sesi TOTP tidak valid atau kedaluwarsa. Silakan login ulang." },
        { status: 401 }
      );
    }

    // Rate limit untuk TOTP juga (cegah brute-force)
    const limit = await checkRateLimit(ip, tempPayload.email);
    if (limit.blocked) {
      return NextResponse.json(
        { error: limit.reason, retryAfterMs: limit.retryAfterMs, blocked: true },
        { status: 429 }
      );
    }

    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: "Kode wajib diisi." }, { status: 400 });

    // Ambil data user dari DB
    const user = await queryOne<{
      id: number; name: string; email: string; role: string;
      totp_secret: string; totp_enabled: number; backup_codes: string | null;
    }>(
      "SELECT id, name, email, role, totp_secret, totp_enabled, backup_codes FROM users WHERE id = ?",
      [tempPayload.sub]
    );

    if (!user || !user.totp_enabled || !user.totp_secret) {
      return NextResponse.json({ error: "Konfigurasi 2FA tidak ditemukan." }, { status: 400 });
    }

    const normalized = String(code).replace(/[-\s]/g, "");

    // ── Coba TOTP (6 digit) ────────────────────────────────────────────────
    let loginOk      = false;
    let usedBackup   = false;
    let backupIdx    = -1;
    let backupCodes: BackupCodeStored[] = [];

    if (/^\d{6}$/.test(normalized)) {
      loginOk = await verifyCode(normalized, user.totp_secret);
    }

    // ── Coba backup code jika TOTP gagal atau bukan 6 digit ───────────────
    if (!loginOk && user.backup_codes) {
      try {
        backupCodes = JSON.parse(user.backup_codes) as BackupCodeStored[];
        backupIdx   = findBackupCodeIndex(normalized, backupCodes);
        if (backupIdx !== -1) {
          loginOk    = true;
          usedBackup = true;
        }
      } catch { /* JSON parse error, abaikan */ }
    }

    if (!loginOk) {
      await recordAttempt(ip, user.email, false);
      await writeLog({
        actor:  { id: user.id, email: user.email, name: user.name },
        action: "TOTP_VERIFY_FAILED",
        detail: `Kode TOTP/backup salah (IP: ${ip})`,
        req,
      });
      const left = Math.max(0, 5 - (limit.failCount ?? 0) - 1);
      return NextResponse.json({
        error: left > 0
          ? `Kode salah. Sisa percobaan: ${left}.`
          : "Kode salah. Akun akan dikunci sementara.",
      }, { status: 400 });
    }

    // ── Berhasil ─────────────────────────────────────────────────────────
    await clearAttempts(ip, user.email);

    // Jika pakai backup code: tandai sebagai terpakai
    if (usedBackup && backupIdx !== -1) {
      backupCodes[backupIdx].used = true;
      await execute(
        "UPDATE users SET backup_codes = ? WHERE id = ?",
        [JSON.stringify(backupCodes), user.id]
      );
    }

    const fullToken = await signToken({
      sub:   String(user.id),
      email: user.email,
      role:  user.role,
      name:  user.name,
    });

    const remainingBackup = usedBackup
      ? backupCodes.filter(c => !c.used).length
      : null;

    await writeLog({
      actor:  { id: user.id, email: user.email, name: user.name },
      action: "TOTP_VERIFY_SUCCESS",
      detail: usedBackup
        ? `Login dengan backup code (sisa ${remainingBackup}) (IP: ${ip})`
        : `Login 2FA berhasil (IP: ${ip})`,
      req,
    });

    const res = NextResponse.json({
      ok: true,
      usedBackup,
      remainingBackup,
    });

    res.cookies.set(COOKIE_NAME, fullToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge:   60 * 60 * 24 * 7,
      path:     "/",
    });
    res.cookies.set(TEMP_COOKIE, "", { maxAge: 0, path: "/" });

    return res;
  } catch (err) {
    console.error("[totp/verify]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
