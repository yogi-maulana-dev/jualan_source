import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";
import { writeLog } from "@/lib/logger";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const token   = req.cookies.get(COOKIE_NAME)?.value;
    const payload = token ? await verifyToken(token) : null;

    if (!payload) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Password lama dan baru wajib diisi." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password baru minimal 6 karakter." }, { status: 400 });
    }

    // Ambil password hash dari DB
    const user = await queryOne<{ id: number; password: string }>(
      "SELECT id, password FROM users WHERE id = ?",
      [payload.sub]
    );

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });
    }

    // Verifikasi password lama
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      await writeLog({
        actor:  { id: payload.sub, email: payload.email, name: payload.name },
        action: "CHANGE_PASSWORD_FAILED",
        detail: "Gagal ganti password — password lama salah",
        req,
      });
      return NextResponse.json({ error: "Password lama tidak sesuai." }, { status: 400 });
    }

    // Hash & simpan password baru
    const hash = await bcrypt.hash(newPassword, 12);
    await execute("UPDATE users SET password = ? WHERE id = ?", [hash, user.id]);

    await writeLog({
      actor:  { id: payload.sub, email: payload.email, name: payload.name },
      action: "CHANGE_PASSWORD",
      detail: "Password berhasil diubah",
      req,
    });

    return NextResponse.json({ ok: true, message: "Password berhasil diubah." });
  } catch (err) {
    console.error("[change-password]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
