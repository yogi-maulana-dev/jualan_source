/**
 * POST /api/auth/totp/enable
 * Simpan secret & aktifkan 2FA setelah user konfirmasi dengan kode pertama.
 * Body: { secret, code }
 * Response: { ok, backupCodes: string[] }
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { execute } from "@/lib/db";
import { verifyCode, generateBackupCodes } from "@/lib/totp";
import { writeLog } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const token   = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { secret, code } = await req.json();
  if (!secret || !code) {
    return NextResponse.json({ error: "Secret dan kode wajib diisi." }, { status: 400 });
  }

  // Verifikasi kode sebelum menyimpan
  if (!(await verifyCode(String(code), secret))) {
    return NextResponse.json({ error: "Kode tidak valid. Periksa waktu perangkat Anda." }, { status: 400 });
  }

  // Generate 8 backup codes
  const { plain, stored } = generateBackupCodes();

  await execute(
    "UPDATE users SET totp_secret = ?, totp_enabled = 1, backup_codes = ? WHERE id = ?",
    [secret, JSON.stringify(stored), payload.sub]
  );

  await writeLog({
    actor:  { id: payload.sub, email: payload.email, name: payload.name },
    action: "TOTP_ENABLED",
    detail: "Google Authenticator 2FA diaktifkan",
    req,
  });

  return NextResponse.json({ ok: true, backupCodes: plain });
}
