/**
 * GET /api/settings — publik, ambil settings untuk frontend
 */
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";

export async function GET() {
  try {
    const rows = await query<{ key: string; value: string }>(
      "SELECT `key`, value FROM site_settings"
    );
    const settings: Record<string, string> = {};
    for (const row of rows) settings[row.key] = row.value;
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ settings: {} });
  }
}
