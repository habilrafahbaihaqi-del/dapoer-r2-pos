import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";

// 1. Inisialisasi Plus Jakarta Sans untuk teks isi/body
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

// 2. Inisialisasi Inter untuk teks judul/headers
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dapoer R2 - POS System",
  description: "Sistem Aplikasi Kasir Berbasis PWA Modern",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 3. Suntikkan variabel font ke dalam class tag html
    <html lang="id" className={`${plusJakartaSans.variable} ${inter.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
