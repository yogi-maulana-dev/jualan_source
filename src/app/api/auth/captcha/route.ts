import { NextResponse } from "next/server";
import { generateCaptcha } from "@/lib/captcha";

export const runtime = "nodejs";
// Jangan cache — setiap request harus dapat CAPTCHA baru
export const dynamic = "force-dynamic";

export async function GET() {
  const { token, svg } = generateCaptcha();

  // Encode SVG sebagai data URL agar bisa langsung di-render di <img>
  const svgB64 = Buffer.from(svg).toString("base64");
  const dataUrl = `data:image/svg+xml;base64,${svgB64}`;

  return NextResponse.json({ token, dataUrl });
}
