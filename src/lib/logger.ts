import { execute } from "./db";
import { NextRequest } from "next/server";

export type LogAction =
  | "LOGIN"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "VIEW_DASHBOARD"
  | "VIEW_ORDERS"
  | "VIEW_PRODUCTS"
  | "CREATE_PRODUCT"
  | "UPDATE_PRODUCT"
  | "DELETE_PRODUCT"
  | "UPDATE_ORDER_STATUS"
  | "CHANGE_PASSWORD"
  | "CHANGE_PASSWORD_FAILED"
  | "TOTP_ENABLED"
  | "TOTP_DISABLED"
  | "TOTP_VERIFY_SUCCESS"
  | "TOTP_VERIFY_FAILED"
  | "VIEW_LOGS";

export interface LogActor {
  id?:    number | string;
  name?:  string;
  email?: string;
}

export interface LogOptions {
  actor:   LogActor;
  action:  LogAction;
  detail?: string;
  req?:    NextRequest;
}

/** Tulis log ke tabel activity_logs. Fire-and-forget — tidak throw ke caller. */
export async function writeLog(opts: LogOptions): Promise<void> {
  try {
    const ip        = getIp(opts.req);
    const userAgent = opts.req?.headers.get("user-agent")?.slice(0, 500) ?? null;

    await execute(
      `INSERT INTO activity_logs
         (user_id, user_name, user_email, action, detail, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        opts.actor.id    ?? null,
        opts.actor.name  ?? null,
        opts.actor.email ?? null,
        opts.action,
        opts.detail      ?? null,
        ip,
        userAgent,
      ]
    );
  } catch (err) {
    // Jangan crash app jika log gagal ditulis
    console.error("[logger] gagal tulis log:", err);
  }
}

function getIp(req?: NextRequest): string | null {
  if (!req) return null;
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1"
  );
}
