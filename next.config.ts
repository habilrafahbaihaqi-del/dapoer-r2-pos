import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const withPWA = withPWAInit({
  dest: "public", // Lokasi file service worker yang dihasilkan
  disable: process.env.NODE_ENV === "development", // Matikan PWA saat mode development
  register: true,
  // skipWaiting sudah dihapus karena otomatis ditangani oleh library
});

const nextConfig: NextConfig = {
  // Masukkan konfigurasi Next.js Anda yang sudah ada di sini jika ada
};

export default withPWA(nextConfig);
