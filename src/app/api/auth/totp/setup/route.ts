/**
 * GET /api/auth/totp/setup
 * Generate secret + QR code untuk setup 2FA (belum disimpan ke DB).
 * Hanya untuk user yang sudah login penuh.
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { generateSecret, buildOtpAuthUrl, generateQrDataUrl } from "@/lib/totp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token   = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secret     = generateSecret();
  const otpauthUrl = buildOtpAuthUrl(payload.email, secret);
  const qrDataUrl  = await generateQrDataUrl(otpauthUrl);

  return NextResponse.json({ secret, qrDataUrl, otpauthUrl });
}
