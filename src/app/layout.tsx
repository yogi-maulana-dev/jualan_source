import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aplikasijadi.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AplikasiJadi.com – Beli Aplikasi Siap Pakai, Langsung Jalan",
    template: "%s | AplikasiJadi.com",
  },
  description:
    "Temukan aplikasi web & mobile siap pakai berkualitas tinggi. Hemat waktu pengembangan hingga 90%. Kode sumber lengkap, dokumentasi jelas, support gratis.",
  keywords: [
    "jual aplikasi jadi",
    "source code aplikasi",
    "aplikasi siap pakai",
    "beli aplikasi web",
    "jual source code",
    "aplikasi mobile siap pakai",
    "template aplikasi",
    "boilerplate nextjs",
  ],
  authors: [{ name: "AplikasiJadi.com", url: siteUrl }],
  creator: "AplikasiJadi.com",
  publisher: "AplikasiJadi.com",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: "AplikasiJadi.com",
    title: "AplikasiJadi.com – Beli Aplikasi Siap Pakai, Langsung Jalan",
    description:
      "Temukan aplikasi web & mobile siap pakai berkualitas tinggi. Hemat waktu pengembangan hingga 90%.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AplikasiJadi.com – Marketplace Aplikasi Siap Pakai",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AplikasiJadi.com – Beli Aplikasi Siap Pakai",
    description:
      "Hemat waktu pengembangan hingga 90% dengan aplikasi siap pakai berkualitas.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: siteUrl,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AplikasiJadi.com",
  url: siteUrl,
  description: "Marketplace aplikasi web dan mobile siap pakai di Indonesia",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: "Indonesian",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
