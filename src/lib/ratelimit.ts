import { query, queryOne, execute } from "./db";

// ── Konfigurasi ───────────────────────────────────────────────────────────────
const IP_WINDOW_MIN   = 15;   // menit
const IP_MAX_FAIL     = 5;    // maks gagal per IP sebelum diblokir
const EMAIL_WINDOW_MIN = 30;  // menit
const EMAIL_MAX_FAIL  = 8;    // maks gagal per email sebelum dikunci

export interface RateLimitResult {
  blocked:      boolean;
  reason?:      string;
  retryAfterMs?: number;   // ms hingga boleh coba lagi
  failCount?:   number;    // jumlah gagal sejauh ini
}

// ── Cek sebelum login ─────────────────────────────────────────────────────────
export async function checkRateLimit(ip: string, email: string): Promise<RateLimitResult> {
  const windowIp    = minsAgo(IP_WINDOW_MIN);
  const windowEmail = minsAgo(EMAIL_WINDOW_MIN);

  const [ipRow, emailRow] = await Promise.all([
    queryOne<{ c: number; oldest: string }>(
      `SELECT COUNT(*) as c, MIN(created_at) as oldest
       FROM login_attempts WHERE ip_address = ? AND success = 0 AND created_at > ?`,
      [ip, windowIp]
    ),
    email
      ? queryOne<{ c: number; oldest: string }>(
          `SELECT COUNT(*) as c, MIN(created_at) as oldest
           FROM login_attempts WHERE email = ? AND success = 0 AND created_at > ?`,
          [email, windowEmail]
        )
      : Promise.resolve(undefined),
  ]);

  // Blokir berdasarkan IP
  if ((ipRow?.c ?? 0) >= IP_MAX_FAIL) {
    const oldest       = new Date(ipRow!.oldest).getTime();
    const unblockAt    = oldest + IP_WINDOW_MIN * 60_000;
    const retryAfterMs = Math.max(0, unblockAt - Date.now());
    return {
      blocked: true,
      reason:  `Terlalu banyak percobaan dari IP ini. Coba lagi dalam ${Math.ceil(retryAfterMs / 60_000)} menit.`,
      retryAfterMs,
      failCount: ipRow!.c,
    };
  }

  // Blokir berdasarkan email
  if (email && (emailRow?.c ?? 0) >= EMAIL_MAX_FAIL) {
    const oldest       = new Date(emailRow!.oldest).getTime();
    const unblockAt    = oldest + EMAIL_WINDOW_MIN * 60_000;
    const retryAfterMs = Math.max(0, unblockAt - Date.now());
    return {
      blocked: true,
      reason:  `Akun sementara dikunci karena terlalu banyak percobaan gagal. Coba lagi dalam ${Math.ceil(retryAfterMs / 60_000)} menit.`,
      retryAfterMs,
      failCount: emailRow!.c,
    };
  }

  return { blocked: false, failCount: ipRow?.c ?? 0 };
}

// ── Catat percobaan ───────────────────────────────────────────────────────────
export async function recordAttempt(ip: string, email: string, success: boolean) {
  await execute(
    "INSERT INTO login_attempts (ip_address, email, success) VALUES (?, ?, ?)",
    [ip, email || null, success ? 1 : 0]
  );

  // Bersihkan entri lama (> 24 jam) agar tabel tidak membengkak
  await execute(
    "DELETE FROM login_attempts WHERE created_at < ?",
    [minsAgo(24 * 60)]
  );
}

// ── Hapus attempts setelah login berhasil ─────────────────────────────────────
export async function clearAttempts(ip: string, email: string) {
  await execute(
    "DELETE FROM login_attempts WHERE ip_address = ? OR email = ?",
    [ip, email]
  );
}

// ── Util ──────────────────────────────────────────────────────────────────────
function minsAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
}
