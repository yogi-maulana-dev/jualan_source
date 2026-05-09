import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { writeLog } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token   = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload || payload.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "";
  const search = searchParams.get("search") || "";
  const limit  = Math.min(Number(searchParams.get("limit")  || 50), 200);
  const offset = Number(searchParams.get("offset") || 0);

  const conditions: string[] = [];
  const params:     unknown[] = [];

  if (action) { conditions.push("action = ?");                params.push(action); }
  if (search) { conditions.push("(user_email LIKE ? OR user_name LIKE ? OR detail LIKE ?)"); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

  const [logs, countRow] = await Promise.all([
    query(`
      SELECT id, user_id, user_name, user_email, action, detail, ip_address, user_agent, created_at
      FROM activity_logs
      ${where}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]),
    queryOne<{ c: number }>(`SELECT COUNT(*) as c FROM activity_logs ${where}`, params),
  ]);

  await writeLog({ actor: { id: payload.sub, email: payload.email, name: payload.name }, action: "VIEW_LOGS", detail: `Melihat activity logs (total: ${countRow?.c ?? 0})`, req });

  return NextResponse.json({ logs, total: countRow?.c ?? 0 });
}
