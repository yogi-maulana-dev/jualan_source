import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { queryOne } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ user: null }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ user: null }, { status: 401 });

  // Sertakan totp_enabled agar frontend tahu status 2FA
  const row = await queryOne<{ totp_enabled: number }>(
    "SELECT totp_enabled FROM users WHERE id = ?",
    [payload.sub]
  );

  return NextResponse.json({
    user: {
      id:           payload.sub,
      name:         payload.name,
      email:        payload.email,
      role:         payload.role,
      totp_enabled: row?.totp_enabled === 1,
    },
  });
}
