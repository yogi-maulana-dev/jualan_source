import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Izinkan akses dari IP jaringan lokal saat development
  // Next.js 16 memblokir request dari origin selain localhost secara default
  allowedDevOrigins: [
    "192.168.100.3",      // IP lokal Anda
    "192.168.100.*",      // seluruh subnet (opsional)
    "localhost",
    "127.0.0.1",
  ],
};

export default nextConfig;
