import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { writeLog } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const token   = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;

  if (payload) {
    await writeLog({
      actor:  { id: payload.sub, email: payload.email, name: payload.name },
      action: "LOGOUT",
      detail: "Logout berhasil",
      req,
    });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return res;
}
