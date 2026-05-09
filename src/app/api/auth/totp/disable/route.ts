/**
 * POST /api/auth/totp/disable
 * Nonaktifkan 2FA. Perlu konfirmasi kode TOTP untuk keamanan.
 * Body: { code }
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";
import { verifyCode } from "@/lib/totp";
import { writeLog } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const token   = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: "Kode wajib diisi." }, { status: 400 });

  const user = await queryOne<{ totp_secret: string; totp_enabled: number }>(
    "SELECT totp_secret, totp_enabled FROM users WHERE id = ?",
    [payload.sub]
  );

  if (!user?.totp_enabled || !user.totp_secret) {
    return NextResponse.json({ error: "2FA tidak aktif." }, { status: 400 });
  }

  if (!(await verifyCode(String(code), user.totp_secret))) {
    return NextResponse.json({ error: "Kode tidak valid." }, { status: 400 });
  }

  await execute(
    "UPDATE users SET totp_secret = NULL, totp_enabled = 0 WHERE id = ?",
    [payload.sub]
  );

  await writeLog({
    actor:  { id: payload.sub, email: payload.email, name: payload.name },
    action: "TOTP_DISABLED",
    detail: "Google Authenticator 2FA dinonaktifkan",
    req,
  });

  return NextResponse.json({ ok: true, message: "2FA berhasil dinonaktifkan." });
}
