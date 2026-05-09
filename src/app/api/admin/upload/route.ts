/**
 * POST /api/admin/upload   — upload gambar produk
 * DELETE /api/admin/upload — hapus gambar produk
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");
const MAX_SIZE   = 3 * 1024 * 1024; // 3 MB
const ALLOWED    = ["image/jpeg", "image/png", "image/webp", "image/gif"];

async function guard(req: NextRequest) {
  const token   = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;
  return payload?.role === "superadmin" ? payload : null;
}

export async function POST(req: NextRequest) {
  const actor = await guard(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
    if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "Format file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF." }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "Ukuran file maksimal 3 MB." }, { status: 400 });

    // Nama unik
    const ext      = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Pastikan folder ada
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filepath, buffer);

    const url = `/uploads/products/${filename}`;
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json({ error: "Upload gagal." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const actor = await guard(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = await req.json();
  if (!url || !url.startsWith("/uploads/products/")) {
    return NextResponse.json({ error: "URL tidak valid." }, { status: 400 });
  }

  try {
    const filepath = path.join(process.cwd(), "public", url);
    await fs.unlink(filepath);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // File sudah tidak ada, anggap sukses
  }
}
