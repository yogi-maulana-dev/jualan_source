import crypto from "crypto";

const SECRET  = process.env.CAPTCHA_SECRET || "captcha-secret-ganti-di-production-32chars";
const TTL_MS  = 5 * 60 * 1000; // 5 menit
const W = 220, H = 72;

// ── Generate ──────────────────────────────────────────────────────────────────
export function generateCaptcha(): { token: string; svg: string } {
  const { problem, answer } = randomMath();

  const timestamp = Date.now().toString();
  const payload   = `${answer}:${timestamp}`;
  const sig       = sign(payload);
  const token     = `${payload}.${sig}`;

  return { token, svg: buildSvg(problem) };
}

// ── Verify ────────────────────────────────────────────────────────────────────
/** Kembalikan null jika OK, atau string pesan error jika gagal */
export function verifyCaptcha(token: string, userAnswer: string): string | null {
  try {
    const lastDot = token.lastIndexOf(".");
    if (lastDot === -1) return "CAPTCHA tidak valid.";

    const payload = token.slice(0, lastDot);
    const sig     = token.slice(lastDot + 1);

    // Constant-time compare → cegah timing attack
    const expected = sign(payload);
    if (!safeEqual(sig, expected)) return "CAPTCHA tidak valid.";

    const [answer, tsStr] = payload.split(":");
    if (Date.now() - Number(tsStr) > TTL_MS) return "CAPTCHA kedaluwarsa. Muat ulang.";
    if (userAnswer.trim() !== answer)        return "Jawaban CAPTCHA salah.";

    return null; // OK
  } catch {
    return "CAPTCHA tidak valid.";
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function randomMath() {
  const a  = rnd(2, 9);
  const b  = rnd(1, 9);
  const op = Math.random() < 0.5 ? "+" : "-";
  const answer = String(op === "+" ? a + b : a - b);
  // tampilkan tanda minus sebagai dash biasa
  const problem = `${a} ${op} ${b} = ?`;
  return { problem, answer };
}

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sign(data: string): string {
  return crypto.createHmac("sha256", SECRET).update(data).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

// ── SVG Builder ───────────────────────────────────────────────────────────────
function buildSvg(problem: string): string {
  const palette = ["#1e40af","#6d28d9","#065f46","#92400e","#be123c","#0e7490"];

  // noise lines
  let lines = "";
  for (let i = 0; i < 7; i++) {
    lines += `<line x1="${f(rnd(0,W))}" y1="${f(rnd(0,H))}" x2="${f(rnd(0,W))}" y2="${f(rnd(0,H))}" stroke="${rndColor()}" stroke-width="${(Math.random()+0.5).toFixed(1)}" opacity="0.35"/>`;
  }

  // noise dots
  let dots = "";
  for (let i = 0; i < 28; i++) {
    dots += `<circle cx="${f(Math.random()*W)}" cy="${f(Math.random()*H)}" r="${(Math.random()*2+0.5).toFixed(1)}" fill="${rndColor()}" opacity="0.35"/>`;
  }

  // characters
  const chars = problem.split("");
  const totalW = chars.length * 22;
  const startX = (W - totalW) / 2 + 4;
  let text = "";
  chars.forEach((ch, i) => {
    const x    = startX + i * 22;
    const y    = 44 + (Math.random() * 12 - 6);
    const rot  = (Math.random() * 24 - 12).toFixed(1);
    const size = (24 + Math.random() * 6).toFixed(1);
    const col  = palette[Math.floor(Math.random() * palette.length)];
    text += `<text x="${f(x)}" y="${f(y)}" transform="rotate(${rot},${f(x)},${f(y)})" font-size="${size}" font-weight="bold" fill="${col}" font-family="'Courier New',monospace" letter-spacing="1">${esc(ch)}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#f1f5f9" rx="10"/><rect width="${W}" height="${H}" fill="url(#g)" rx="10" opacity="0.4"/><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e0e7ff"/><stop offset="100%" stop-color="#fce7f3"/></linearGradient></defs>${lines}${dots}${text}</svg>`;
}

function f(n: number) { return n.toFixed(1); }
function esc(s: string) { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;"); }
function rndColor() { return `hsl(${rnd(0,360)},60%,60%)`; }
