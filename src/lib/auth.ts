import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super-secret-key-change-in-production-min32chars"
);

export const COOKIE_NAME    = "aj_token";
export const TEMP_COOKIE    = "aj_totp_temp";   // cookie sementara untuk step TOTP
const TOKEN_TTL              = "7d";
const TEMP_TOKEN_TTL         = "5m";            // hanya 5 menit untuk selesaikan TOTP

// ── Payload token penuh ───────────────────────────────────────────────────────
export interface JWTPayload {
  sub:   string;  // user id
  email: string;
  role:  string;
  name:  string;
}

// ── Payload token sementara (setelah password OK, sebelum TOTP selesai) ───────
export interface TempTOTPPayload {
  sub:         string;
  email:       string;
  name:        string;
  pending_totp: true;
}

// ── Token penuh (akses admin) ─────────────────────────────────────────────────
export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(SECRET);
}

// ── Token sementara (hanya untuk verifikasi TOTP) ────────────────────────────
export async function signTempToken(payload: Omit<TempTOTPPayload, "pending_totp">): Promise<string> {
  return new SignJWT({ ...payload, pending_totp: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TEMP_TOKEN_TTL)
    .sign(SECRET);
}

// ── Verifikasi token penuh ────────────────────────────────────────────────────
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    // Tolak temp token yang masuk ke jalur ini
    if ((payload as Record<string, unknown>).pending_totp) return null;
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

// ── Verifikasi token sementara ────────────────────────────────────────────────
export async function verifyTempToken(token: string): Promise<TempTOTPPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (!(payload as Record<string, unknown>).pending_totp) return null;
    return payload as unknown as TempTOTPPayload;
  } catch {
    return null;
  }
}
