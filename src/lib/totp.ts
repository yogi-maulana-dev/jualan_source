/**
 * TOTP helper menggunakan otplib v12+
 * API baru: semua fungsi menerima satu config object, bukan named export "authenticator"
 */
import { generate, verify, generateSecret as _generateSecret, NobleCryptoPlugin, ScureBase32Plugin, TOTP } from "otplib";
import QRCode from "qrcode";
import crypto from "crypto";

const APP_NAME  = "AplikasiJadi";
const cryptoPlugin = new NobleCryptoPlugin();
const base32       = new ScureBase32Plugin();

// Instance TOTP untuk toURI (URI builder tidak butuh crypto/base32)
const totp = new TOTP({ crypto: cryptoPlugin, base32 });

/** Generate secret baru (Base32, 20 byte) */
export function generateSecret(): string {
  return _generateSecret(20);
}

/** Buat URL otpauth:// untuk QR code */
export function buildOtpAuthUrl(email: string, secret: string): string {
  return totp.toURI({ label: email, issuer: APP_NAME, secret });
}

/** Render QR code sebagai data URL (PNG base64) */
export async function generateQrDataUrl(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl, {
    width:  240,
    margin: 2,
    color:  { dark: "#1e1b4b", light: "#ffffff" },
  });
}

/** Verifikasi kode 6-digit dari Google Authenticator */
export async function verifyCode(code: string, secret: string): Promise<boolean> {
  try {
    const result = await verify({ token: code.replace(/\s/g, ""), secret, crypto: cryptoPlugin, base32 });
    return result.valid;
  } catch {
    return false;
  }
}

// ── Backup / Recovery Codes ──────────────────────────────────────────────────

export interface BackupCodeStored { hash: string; used: boolean }

/** Generate 8 backup code sekali pakai. Kembalikan teks polos + hash untuk disimpan DB. */
export function generateBackupCodes(): { plain: string[]; stored: BackupCodeStored[] } {
  const plain = Array.from({ length: 8 }, () =>
    crypto.randomBytes(4).toString("hex").toUpperCase()   // 8 hex chars, e.g. "A3F9B2C1"
  );
  const stored = plain.map(code => ({
    hash: crypto.createHash("sha256").update(code).digest("hex"),
    used: false,
  }));
  return { plain, stored };
}

/**
 * Cek apakah `input` cocok dengan salah satu backup code yang belum terpakai.
 * Kembalikan index yang cocok, atau -1 jika tidak ada.
 */
export function findBackupCodeIndex(input: string, stored: BackupCodeStored[]): number {
  const normalized = input.replace(/[-\s]/g, "").toUpperCase();
  const hash = crypto.createHash("sha256").update(normalized).digest("hex");
  return stored.findIndex(s => !s.used && s.hash === hash);
}
